from typing import Any

from services.game_service.data_access import data_access as level_repo
from services.game_service.data_access import module_quiz_repo as quiz_repo


def _apply_module_unlock_rules(modules: dict[int, dict[str, Any]]) -> None:
    sorted_modules = sorted(modules.keys())
    previous_exit_completed = True

    for module in sorted_modules:
        module_entry = modules[module]
        levels = module_entry.get("levels", [])
        pre_quiz = module_entry.get("pre-quiz", {})
        post_quiz = module_entry.get("post-quiz", {})

        has_pre_quiz = bool(pre_quiz.get("quiz_id"))
        has_post_quiz = bool(post_quiz.get("quiz_id"))

        pre_quiz_unlocked = previous_exit_completed if has_pre_quiz else True
        pre_quiz["available"] = pre_quiz_unlocked
        pre_quiz_completed = bool(pre_quiz.get("completed")) if has_pre_quiz else True

        for level in levels:
            level["available"] = bool(level.get("available")) and pre_quiz_completed

        all_levels_completed = len(levels) > 0 and all(
            bool(level.get("completed")) for level in levels
        )
        post_quiz_unlocked = (
            has_post_quiz and pre_quiz_completed and all_levels_completed
        )
        post_quiz["available"] = post_quiz_unlocked

        if has_post_quiz:
            previous_exit_completed = bool(post_quiz.get("completed"))
        else:
            previous_exit_completed = all_levels_completed


def _is_quiz_available_for_user(user_id: str, quiz_id: str) -> bool:
    modules = get_game_modules_overview(user_id)
    for module_entry in modules.values():
        for quiz_key in ("pre-quiz", "post-quiz"):
            quiz_payload = module_entry.get(quiz_key, {})
            if quiz_payload.get("quiz_id") == quiz_id:
                return bool(quiz_payload.get("available"))
    return False


def get_game_modules_overview(user_id: str) -> dict[int, dict[str, Any]]:
    levels = level_repo.get_available_levels(user_id)
    levels_by_module: dict[int, list[dict[str, Any]]] = {}
    for level in levels:
        module = int(level.get("module", 0))
        levels_by_module.setdefault(module, []).append(level)

    modules: dict[int, dict[str, Any]] = {}
    for module, module_levels in levels_by_module.items():
        modules[module] = {
            "levels": module_levels,
            "pre-quiz": {
                "quiz_id": None,
                "available": False,
                "completed": None,
                "best_score": None,
                "module": module,
            },
            "post-quiz": {
                "quiz_id": None,
                "available": False,
                "completed": None,
                "best_score": None,
                "module": module,
            },
        }

    quizzes = quiz_repo.get_module_quizzes_with_progress(user_id)
    for quiz in quizzes:
        module = int(quiz.get("module", 0))
        module_entry = modules.setdefault(
            module,
            {
                "levels": [],
                "pre-quiz": {
                    "quiz_id": None,
                    "available": False,
                    "completed": None,
                    "best_score": None,
                    "module": module,
                },
                "post-quiz": {
                    "quiz_id": None,
                    "available": False,
                    "completed": None,
                    "best_score": None,
                    "module": module,
                },
            },
        )
        quiz_type = quiz.get("quiz_type", "").strip().lower()
        quiz_key = f"{quiz_type}-quiz" if quiz_type else "quiz"

        quiz_payload: dict[str, Any] = {
            "quiz_id": quiz.get("quiz_id"),
            "available": False,
            "completed": bool(quiz.get("completed")),
            "best_score": int(quiz.get("best_score") or 0),
            "module": module,
        }

        module_entry[quiz_key] = quiz_payload

    _apply_module_unlock_rules(modules)
    return modules


def grade_quiz_attempt(
    user_id: str, quiz_id: str, answers: dict[str, int]
) -> dict[str, Any]:
    if not _is_quiz_available_for_user(user_id, quiz_id):
        raise PermissionError("Quiz is locked.")

    quiz = quiz_repo.get_module_quiz(quiz_id)
    if quiz is None:
        raise ValueError(f"Unknown quiz_id: {quiz_id}")

    existing_progress = quiz_repo.get_user_module_quiz_progress(user_id, quiz_id)
    if existing_progress and int(existing_progress.get("attempts") or 0) >= 1:
        raise PermissionError("Quiz can only be attempted once.")

    questions = quiz_repo.get_module_quiz_questions(quiz_id)
    total_questions = len(questions)
    correct_count = 0
    question_results: list[dict[str, Any]] = []

    for question in questions:
        question_id = question["question_id"]
        selected_index = answers.get(question_id)
        correct_index_value = question.get("correct_option_index")
        if correct_index_value is None:
            raise ValueError(
                f"Quiz question {question_id} is missing correct_option_index"
            )
        correct_index = int(correct_index_value)
        is_correct = False
        if selected_index is not None:
            is_correct = int(selected_index) == correct_index
            if is_correct:
                correct_count += 1

        question_results.append(
            {
                "question_id": question_id,
                "prompt": question["prompt"],
                "options": question["options"],
                "selected_option_index": selected_index,
                "correct_option_index": correct_index,
                "explanation": question.get("explanation"),
                "is_correct": is_correct,
            }
        )

    score = correct_count
    passing_score = int(quiz.get("passing_score") or 0)
    completed = score >= passing_score

    quiz_repo.upsert_user_module_quiz_progress(
        user_id=user_id,
        quiz_id=quiz_id,
        score=score,
        completed=completed,
        last_answers=answers,
    )

    return {
        "quiz_id": quiz_id,
        "score": score,
        "total_questions": total_questions,
        "passing_score": passing_score,
        "completed": completed,
        "questions": question_results,
    }


def get_quiz_details(quiz_id: str, user_id: str | None = None) -> dict[str, Any]:
    quiz = quiz_repo.get_module_quiz(quiz_id)
    if quiz is None:
        raise ValueError(f"Unknown quiz_id: {quiz_id}")

    if user_id and not _is_quiz_available_for_user(user_id, quiz_id):
        raise PermissionError("Quiz is locked.")

    questions = quiz_repo.get_module_quiz_questions(quiz_id)
    sanitized_questions: list[dict[str, Any]] = [
        {
            "question_id": question["question_id"],
            "quiz_id": question["quiz_id"],
            "question_order": question["question_order"],
            "prompt": question["prompt"],
            "options": question["options"],
            "metadata": question.get("metadata", {}),
        }
        for question in questions
    ]

    attempted = False
    metadata: dict[str, Any] | None = None
    if user_id:
        progress = quiz_repo.get_user_module_quiz_progress(user_id, quiz_id)
        if progress:
            attempted = True
            answers = progress.get("last_answers") or {}
            correct_count = 0
            question_results: list[dict[str, Any]] = []
            for question in questions:
                question_id = question["question_id"]
                selected_index = answers.get(question_id)
                correct_index = int(question["correct_option_index"])
                is_correct = (
                    selected_index is not None
                    and int(selected_index) == correct_index
                )
                if is_correct:
                    correct_count += 1
                question_results.append(
                    {
                        "question_id": question_id,
                        "selected_option_index": selected_index,
                        "correct_option_index": correct_index,
                        "explanation": question.get("explanation"),
                        "is_correct": is_correct,
                    }
                )

            passing_score = int(quiz.get("passing_score") or 0)
            total_questions = len(questions)
            score = correct_count
            metadata = {
                "attempt": {
                    "attempts": int(progress.get("attempts") or 0),
                    "last_attempted": progress.get("last_attempted"),
                    "last_answers": answers,
                },
                "score": score,
                "total_questions": total_questions,
                "passing_score": passing_score,
                "completed": score >= passing_score,
                "question_results": question_results,
            }

    return {
        **quiz,
        "questions": sanitized_questions,
        "attempted": attempted,
        "metadata": metadata,
    }

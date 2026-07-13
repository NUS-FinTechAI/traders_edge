import pytest

from services.game_service.service import quiz_service


def test_get_quiz_details_returns_sanitized_questions(monkeypatch):
    monkeypatch.setattr(
        quiz_service.quiz_repo,
        "get_module_quiz",
        lambda quiz_id: {
            "quiz_id": quiz_id,
            "module": 2,
            "quiz_type": "post",
            "title": "Module 2 Post-Quiz",
            "description": "Module 2 concepts",
            "passing_score": 0,
            "metadata": {},
        },
    )
    monkeypatch.setattr(
        quiz_service.quiz_repo,
        "get_module_quiz_questions",
        lambda quiz_id: [
            {
                "question_id": "m2-post-1",
                "quiz_id": quiz_id,
                "question_order": 1,
                "prompt": "Q1",
                "options": ["A", "B", "C"],
                "correct_option_index": 1,
                "explanation": "E1",
                "metadata": {},
            }
        ],
    )

    payload = quiz_service.get_quiz_details("MOD2_POST", user_id=None)

    assert payload["quiz_id"] == "MOD2_POST"
    assert payload["attempted"] is False
    assert len(payload["questions"]) == 1
    question = payload["questions"][0]
    assert question["question_id"] == "m2-post-1"
    assert "correct_option_index" not in question
    assert "explanation" not in question


def test_grade_quiz_attempt_scores_and_persists(monkeypatch):
    monkeypatch.setattr(
        quiz_service,
        "_is_quiz_available_for_user",
        lambda user_id, quiz_id: True,
    )
    monkeypatch.setattr(
        quiz_service.quiz_repo,
        "get_module_quiz",
        lambda quiz_id: {
            "quiz_id": quiz_id,
            "module": 2,
            "quiz_type": "post",
            "title": "Module 2 Post-Quiz",
            "description": "Module 2 concepts",
            "passing_score": 4,
            "metadata": {},
        },
    )
    monkeypatch.setattr(
        quiz_service.quiz_repo,
        "get_user_module_quiz_progress",
        lambda user_id, quiz_id: None,
    )
    monkeypatch.setattr(
        quiz_service.quiz_repo,
        "get_module_quiz_questions",
        lambda quiz_id: [
            {
                "question_id": "q1",
                "prompt": "Q1",
                "options": ["A", "B", "C"],
                "correct_option_index": 1,
                "explanation": "E1",
            },
            {
                "question_id": "q2",
                "prompt": "Q2",
                "options": ["A", "B", "C"],
                "correct_option_index": 0,
                "explanation": "E2",
            },
            {
                "question_id": "q3",
                "prompt": "Q3",
                "options": ["A", "B", "C"],
                "correct_option_index": 2,
                "explanation": "E3",
            },
            {
                "question_id": "q4",
                "prompt": "Q4",
                "options": ["A", "B", "C"],
                "correct_option_index": 1,
                "explanation": "E4",
            },
            {
                "question_id": "q5",
                "prompt": "Q5",
                "options": ["A", "B", "C"],
                "correct_option_index": 0,
                "explanation": "E5",
            },
        ],
    )

    captured_upsert: dict[str, object] = {}

    def _capture_upsert(user_id, quiz_id, score, completed, last_answers):
        captured_upsert["user_id"] = user_id
        captured_upsert["quiz_id"] = quiz_id
        captured_upsert["score"] = score
        captured_upsert["completed"] = completed
        captured_upsert["last_answers"] = last_answers

    monkeypatch.setattr(
        quiz_service.quiz_repo,
        "upsert_user_module_quiz_progress",
        _capture_upsert,
    )

    answers = {
        "q1": 1,
        "q2": 0,
        "q3": 2,
        "q4": 1,
        "q5": 2,  # one incorrect answer
    }
    result = quiz_service.grade_quiz_attempt("user-1", "MOD2_POST", answers)

    assert result["quiz_id"] == "MOD2_POST"
    assert result["score"] == 4
    assert result["total_questions"] == 5
    assert result["passing_score"] == 4
    assert result["completed"] is True
    assert len(result["questions"]) == 5

    assert captured_upsert == {
        "user_id": "user-1",
        "quiz_id": "MOD2_POST",
        "score": 4,
        "completed": True,
        "last_answers": answers,
    }


def test_grade_pre_quiz_completion_enrolls_current_module_first_level(monkeypatch):
    monkeypatch.setattr(
        quiz_service,
        "_is_quiz_available_for_user",
        lambda user_id, quiz_id: True,
    )
    monkeypatch.setattr(
        quiz_service.quiz_repo,
        "get_module_quiz",
        lambda quiz_id: {
            "quiz_id": quiz_id,
            "module": 2,
            "quiz_type": "pre",
            "title": "Module 2 Pre-Quiz",
            "description": "Module 2 concepts",
            "passing_score": 1,
            "metadata": {},
        },
    )
    monkeypatch.setattr(
        quiz_service.quiz_repo,
        "get_user_module_quiz_progress",
        lambda user_id, quiz_id: None,
    )
    monkeypatch.setattr(
        quiz_service.quiz_repo,
        "get_module_quiz_questions",
        lambda quiz_id: [
            {
                "question_id": "q1",
                "prompt": "Q1",
                "options": ["A", "B"],
                "correct_option_index": 0,
                "explanation": "E1",
            },
        ],
    )
    monkeypatch.setattr(
        quiz_service.quiz_repo,
        "upsert_user_module_quiz_progress",
        lambda **kwargs: None,
    )
    enrolled: dict[str, object] = {}

    def _capture_enroll(user_id, module):
        enrolled["user_id"] = user_id
        enrolled["module"] = module

    monkeypatch.setattr(
        quiz_service.level_repo,
        "enroll_first_tutorial_level_for_module",
        _capture_enroll,
    )

    result = quiz_service.grade_quiz_attempt("user-1", "MOD2_PRE", {"q1": 0})

    assert result["completed"] is True
    assert enrolled == {"user_id": "user-1", "module": 2}


def test_grade_quiz_attempt_rejects_second_attempt(monkeypatch):
    monkeypatch.setattr(
        quiz_service,
        "_is_quiz_available_for_user",
        lambda user_id, quiz_id: True,
    )
    monkeypatch.setattr(
        quiz_service.quiz_repo,
        "get_module_quiz",
        lambda quiz_id: {
            "quiz_id": quiz_id,
            "module": 2,
            "quiz_type": "post",
            "title": "Module 2 Post-Quiz",
            "description": "Module 2 concepts",
            "passing_score": 0,
            "metadata": {},
        },
    )
    monkeypatch.setattr(
        quiz_service.quiz_repo,
        "get_user_module_quiz_progress",
        lambda user_id, quiz_id: {
            "user_id": user_id,
            "quiz_id": quiz_id,
            "attempts": 1,
            "best_score": 5,
            "completed": True,
        },
    )

    with pytest.raises(PermissionError, match="only be attempted once"):
        quiz_service.grade_quiz_attempt("user-1", "MOD2_POST", {})


def test_module_overview_unlock_flow_with_module4_appended(monkeypatch):
    monkeypatch.setattr(
        quiz_service.level_repo,
        "get_available_levels",
        lambda user_id: [
            {
                "level_id": "module-1.1",
                "module": 1,
                "level_order": 1,
                "available": True,
                "completed": True,
            },
            {
                "level_id": "module-2.1",
                "module": 2,
                "level_order": 1,
                "available": True,
                "completed": True,
            },
            {
                "level_id": "module-3.1",
                "module": 3,
                "level_order": 1,
                "available": True,
                "completed": True,
            },
            {
                "level_id": "module-4.1",
                "module": 4,
                "level_order": 1,
                "available": True,
                "completed": False,
            },
        ],
    )
    monkeypatch.setattr(
        quiz_service.quiz_repo,
        "get_module_quizzes_with_progress",
        lambda user_id: [
            {"quiz_id": "MOD1_PRE", "module": 1, "quiz_type": "pre", "completed": True, "best_score": 4},
            {"quiz_id": "MOD1_POST", "module": 1, "quiz_type": "post", "completed": True, "best_score": 4},
            {"quiz_id": "MOD2_PRE", "module": 2, "quiz_type": "pre", "completed": True, "best_score": 4},
            {"quiz_id": "MOD2_POST", "module": 2, "quiz_type": "post", "completed": True, "best_score": 4},
            {"quiz_id": "MOD3_PRE", "module": 3, "quiz_type": "pre", "completed": True, "best_score": 4},
            {"quiz_id": "MOD3_POST", "module": 3, "quiz_type": "post", "completed": True, "best_score": 4},
            {"quiz_id": "MOD4_PRE", "module": 4, "quiz_type": "pre", "completed": False, "best_score": 0},
            {"quiz_id": "MOD4_POST", "module": 4, "quiz_type": "post", "completed": False, "best_score": 0},
        ],
    )

    overview = quiz_service.get_game_modules_overview("user-1")

    assert overview[4]["pre-quiz"]["quiz_id"] == "MOD4_PRE"
    assert overview[4]["pre-quiz"]["available"] is True
    assert overview[4]["post-quiz"]["quiz_id"] == "MOD4_POST"
    # module-4.1 is incomplete, so post quiz stays locked.
    assert overview[4]["post-quiz"]["available"] is False


def test_module5_pre_quiz_unlocks_after_module4_post_completion(monkeypatch):
    monkeypatch.setattr(
        quiz_service.level_repo,
        "get_available_levels",
        lambda user_id: [
            {
                "level_id": "module-4.1",
                "module": 4,
                "level_order": 1,
                "available": True,
                "completed": True,
            },
            {
                "level_id": "module-5.1",
                "module": 5,
                "level_order": 1,
                "available": True,
                "completed": False,
            },
        ],
    )
    monkeypatch.setattr(
        quiz_service.quiz_repo,
        "get_module_quizzes_with_progress",
        lambda user_id: [
            {"quiz_id": "MOD4_PRE", "module": 4, "quiz_type": "pre", "completed": True, "best_score": 5},
            {"quiz_id": "MOD4_POST", "module": 4, "quiz_type": "post", "completed": True, "best_score": 5},
            {"quiz_id": "MOD5_PRE", "module": 5, "quiz_type": "pre", "completed": False, "best_score": 0},
            {"quiz_id": "MOD5_POST", "module": 5, "quiz_type": "post", "completed": False, "best_score": 0},
        ],
    )

    overview = quiz_service.get_game_modules_overview("user-1")

    assert overview[5]["pre-quiz"]["quiz_id"] == "MOD5_PRE"
    assert overview[5]["pre-quiz"]["available"] is True
    assert overview[5]["post-quiz"]["quiz_id"] == "MOD5_POST"
    assert overview[5]["post-quiz"]["available"] is False

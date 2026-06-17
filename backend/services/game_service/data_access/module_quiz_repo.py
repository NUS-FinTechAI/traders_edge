from typing import Any

from config.database.postgres import get_db_cursor
from psycopg2.extras import Json


def get_module_quiz(quiz_id: str) -> dict[str, Any] | None:
    with get_db_cursor() as cursor:
        cursor.execute(
            """
            SELECT quiz_id,
                   module,
                   quiz_type,
                   title,
                   description,
                   passing_score,
                   metadata
            FROM module_quizzes
            WHERE quiz_id = %s
            """,
            (quiz_id,),
        )
        row = cursor.fetchone()
        if row is None:
            return None

        columns = [desc[0] for desc in cursor.description]
        return dict(zip(columns, row))


def get_module_quizzes_with_progress(user_id: str) -> list[dict[str, Any]]:
    with get_db_cursor() as cursor:
        cursor.execute(
            """
            SELECT mq.quiz_id,
                   mq.module,
                   mq.quiz_type,
                   mq.title,
                   mq.description,
                   mq.passing_score,
                   mq.metadata,
                   umqp.best_score,
                   umqp.attempts,
                   umqp.completed,
                   umqp.last_attempted,
                   umqp.last_answers,
                   (umqp.user_id IS NOT NULL) AS has_progress
            FROM module_quizzes mq
            LEFT JOIN user_module_quiz_progress umqp
                ON mq.quiz_id = umqp.quiz_id AND umqp.user_id = %s
            ORDER BY mq.module, mq.quiz_type
            """,
            (user_id,),
        )
        rows = cursor.fetchall()
        if not rows:
            return []

        columns = [desc[0] for desc in cursor.description]
        return [dict(zip(columns, row)) for row in rows]


def get_module_quiz_questions(quiz_id: str) -> list[dict[str, Any]]:
    with get_db_cursor() as cursor:
        cursor.execute(
            """
            SELECT question_id,
                   quiz_id,
                   question_order,
                   prompt,
                   options,
                   correct_option_index,
                   explanation,
                   metadata
            FROM module_quiz_questions
            WHERE quiz_id = %s
            ORDER BY question_order
            """,
            (quiz_id,),
        )
        rows = cursor.fetchall()
        if not rows:
            return []

        columns = [desc[0] for desc in cursor.description]
        return [dict(zip(columns, row)) for row in rows]


def get_user_module_quiz_progress(
    user_id: str, quiz_id: str
) -> dict[str, Any] | None:
    with get_db_cursor() as cursor:
        cursor.execute(
            """
            SELECT user_id,
                   quiz_id,
                   best_score,
                   attempts,
                   completed,
                   last_attempted,
                   last_answers
            FROM user_module_quiz_progress
            WHERE user_id = %s AND quiz_id = %s
            """,
            (user_id, quiz_id),
        )
        row = cursor.fetchone()
        if row is None:
            return None

        columns = [desc[0] for desc in cursor.description]
        return dict(zip(columns, row))


def upsert_user_module_quiz_progress(
    user_id: str,
    quiz_id: str,
    score: int,
    completed: bool,
    last_answers: dict[str, int],
) -> None:
    if last_answers is None:
        last_answers = {}
    with get_db_cursor(commit=True) as cursor:
        cursor.execute(
            """
            INSERT INTO user_module_quiz_progress (
                user_id,
                quiz_id,
                best_score,
                attempts,
                completed,
                last_attempted,
                last_answers
            )
            VALUES (%s, %s, %s, 1, %s, CURRENT_TIMESTAMP, %s)
            ON CONFLICT (user_id, quiz_id) DO UPDATE SET
                best_score = GREATEST(user_module_quiz_progress.best_score, EXCLUDED.best_score),
                attempts = user_module_quiz_progress.attempts + 1,
                completed = user_module_quiz_progress.completed OR EXCLUDED.completed,
                last_attempted = CURRENT_TIMESTAMP,
                last_answers = EXCLUDED.last_answers
            """,
            (user_id, quiz_id, score, completed, Json(last_answers)),
        )

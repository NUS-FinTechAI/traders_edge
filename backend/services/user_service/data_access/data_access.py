from typing import Any

import psycopg2
from psycopg2 import errors as pg_errors

from config.database.postgres import get_db_cursor


class UsernameTakenError(Exception):
    """Raised when a username uniqueness check (LOWER(user_name)) fails."""


USERNAME_INDEX_NAME = "users_user_name_lower_idx"


def _row_to_dict(cursor, row) -> dict[str, Any]:
    cols = [desc[0] for desc in cursor.description]
    return dict(zip(cols, row))


def get_user_by_username(user_name: str) -> dict[str, Any] | None:
    with get_db_cursor() as cursor:
        cursor.execute(
            "SELECT * FROM users WHERE LOWER(user_name) = LOWER(%s)",
            (user_name,),
        )
        row = cursor.fetchone()
        return _row_to_dict(cursor, row) if row else None


def get_user_by_userid(user_id: str) -> dict[str, Any] | None:
    with get_db_cursor() as cursor:
        cursor.execute("SELECT * FROM users WHERE user_id = %s", (user_id,))
        row = cursor.fetchone()
        return _row_to_dict(cursor, row) if row else None


def create_user(user_id: str, user_name: str, user_email: str) -> dict[str, Any]:
    """Idempotent first-signup insert.

    On UID race (two browser tabs of the same first-time user), both calls
    return the existing row. On a username conflict (case-insensitive),
    raises :class:`UsernameTakenError` so the router can translate to HTTP 409.
    """
    try:
        with get_db_cursor(commit=True) as cursor:
            cursor.execute(
                """
                INSERT INTO users (user_id, user_name, user_email)
                VALUES (%s, %s, %s)
                ON CONFLICT (user_id) DO NOTHING
                RETURNING *
                """,
                (user_id, user_name, user_email),
            )
            row = cursor.fetchone()
            if row is None:
                cursor.execute("SELECT * FROM users WHERE user_id = %s", (user_id,))
                row = cursor.fetchone()
            user = _row_to_dict(cursor, row)

            cursor.execute(
                """
                INSERT INTO user_level_progress (user_id, level_id)
                VALUES (%s, 'module-1.1')
                ON CONFLICT (user_id, level_id) DO NOTHING
                """,
                (user_id,),
            )
            return user
    except pg_errors.UniqueViolation as e:
        if e.diag.constraint_name == USERNAME_INDEX_NAME:
            raise UsernameTakenError() from e
        raise


def update_user_name(user_id: str, new_user_name: str) -> dict[str, Any] | None:
    try:
        with get_db_cursor(commit=True) as cursor:
            cursor.execute(
                """
                UPDATE users
                SET user_name = %s
                WHERE user_id = %s
                RETURNING *
                """,
                (new_user_name, user_id),
            )
            row = cursor.fetchone()
            return _row_to_dict(cursor, row) if row else None
    except pg_errors.UniqueViolation as e:
        if e.diag.constraint_name == USERNAME_INDEX_NAME:
            raise UsernameTakenError() from e
        raise


def get_user_total_points(user_id: str) -> int:
    with get_db_cursor() as cursor:
        cursor.execute(
            """
            SELECT COALESCE(SUM(best_points), 0)
            FROM user_level_progress
            WHERE user_id = %s
            """,
            (user_id,),
        )
        row = cursor.fetchone()
        return int(row[0]) if row and row[0] is not None else 0

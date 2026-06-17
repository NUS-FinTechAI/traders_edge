from typing import Any

from config.database.postgres import get_db_cursor


def get_achievements_for_user(user_id: str) -> list[dict[str, Any]]:
    with get_db_cursor() as cursor:
        cursor.execute(
            """
            SELECT a.achievement_id,
                   a.title,
                   a.hint,
                   a.description,
                   a.icon_key,
                   CASE WHEN ua.user_id IS NULL THEN false ELSE true END AS achieved
            FROM achievements a
            LEFT JOIN user_achievements ua
                   ON a.achievement_id = ua.achievement_id
                  AND ua.user_id = %s
            ORDER BY a.achievement_id
            """,
            (user_id,),
        )
        rows = cursor.fetchall()
        if not rows:
            return []

        columns = [desc[0] for desc in cursor.description]
        return [dict(zip(columns, row)) for row in rows]

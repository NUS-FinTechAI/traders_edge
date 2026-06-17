from datetime import date
from typing import Any, Literal

from config.database.postgres import get_db_cursor
from psycopg2.extras import Json

ActivityEventType = Literal["level_completed"]
_ALLOWED_EVENT_TYPES: set[str] = {"level_completed"}


def _validate_event_type(event_type: str) -> None:
    if event_type not in _ALLOWED_EVENT_TYPES:
        raise ValueError(f"Unsupported event_type: {event_type}")


def insert_activity_event(
    user_id: str,
    event_type: ActivityEventType,
    event_date: date,
    metadata: dict[str, Any],
) -> None:
    _validate_event_type(event_type)
    if metadata is None:
        metadata = {}
    with get_db_cursor(commit=True) as cursor:
        cursor.execute(
            """
            INSERT INTO user_activity_events (
                user_id,
                event_type,
                event_date,
                metadata
            )
            VALUES (%s, %s, %s, %s)
            ON CONFLICT DO NOTHING
            """,
            (user_id, event_type, event_date, Json(metadata)),
        )


def get_activity_events_in_range(
    user_id: str,
    start_date: date,
    end_date: date,
) -> list[dict[str, Any]]:
    with get_db_cursor() as cursor:
        cursor.execute(
            """
            SELECT event_date,
                   event_type,
                   metadata
            FROM user_activity_events
            WHERE user_id = %s
              AND event_date BETWEEN %s AND %s
            ORDER BY event_date ASC
            """,
            (user_id, start_date, end_date),
        )
        rows = cursor.fetchall()
        if not rows:
            return []

        columns = [desc[0] for desc in cursor.description]
        return [dict(zip(columns, row)) for row in rows]


def get_activity_counts_in_range(
    user_id: str,
    start_date: date,
    end_date: date,
) -> list[dict[str, Any]]:
    with get_db_cursor() as cursor:
        cursor.execute(
            """
            SELECT event_date,
                   COUNT(*) AS activity_count
            FROM user_activity_events
            WHERE user_id = %s
              AND event_date BETWEEN %s AND %s
            GROUP BY event_date
            ORDER BY event_date ASC
            """,
            (user_id, start_date, end_date),
        )
        rows = cursor.fetchall()
        if not rows:
            return []

        columns = [desc[0] for desc in cursor.description]
        return [dict(zip(columns, row)) for row in rows]

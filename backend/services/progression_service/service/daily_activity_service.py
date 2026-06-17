from __future__ import annotations

from datetime import date, timedelta
from typing import Any

from ..data_access import daily_activity_repo as repo
from ..models.daily_activity import (
    ActivityCountDay,
    ActivityDay,
    Last365DaysActivityCounts,
    Last7DaysActivity,
    StreakStats,
)

_EVENT_TYPE_LEVEL_COMPLETED = "level_completed"


def record_level_completed(user_id: str, metadata: dict[str, Any] | None) -> None:
    if metadata is None:
        metadata = {}

    repo.insert_activity_event(user_id, _EVENT_TYPE_LEVEL_COMPLETED, date.today(), metadata)


def get_streak_stats(user_id: str) -> StreakStats:
    today = date.today()
    start_date = date(1970, 1, 1)
    events = repo.get_activity_events_in_range(user_id, start_date, today)
    if not events:
        return StreakStats(current_streak=0, last_active_date=None)

    event_dates = {row["event_date"] for row in events}
    last_active_date = max(event_dates)
    if last_active_date not in {today, today - timedelta(days=1)}:
        return StreakStats(current_streak=0, last_active_date=last_active_date)

    streak = 0
    cursor_date = last_active_date
    while cursor_date in event_dates:
        streak += 1
        cursor_date -= timedelta(days=1)

    return StreakStats(current_streak=streak, last_active_date=last_active_date)


def get_last_7_days_activity(user_id: str) -> Last7DaysActivity:
    today = date.today()
    start_date = today - timedelta(days=6)
    events = repo.get_activity_events_in_range(user_id, start_date, today)
    event_dates = {row["event_date"] for row in events}

    days: list[ActivityDay] = []
    for offset in range(7):
        day = start_date + timedelta(days=offset)
        days.append(ActivityDay(date=day, has_activity=day in event_dates))

    return Last7DaysActivity(days=days)


def get_last_365_days_activity_counts(user_id: str) -> Last365DaysActivityCounts:
    today = date.today()
    start_date = today - timedelta(days=364)
    rows = repo.get_activity_counts_in_range(user_id, start_date, today)

    days = [
        ActivityCountDay(
            date=row["event_date"], activity_count=int(row["activity_count"])
        )
        for row in rows
    ]

    return Last365DaysActivityCounts(days=days)

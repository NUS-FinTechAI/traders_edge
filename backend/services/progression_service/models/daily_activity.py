from __future__ import annotations

from datetime import date

from pydantic import BaseModel


class StreakStats(BaseModel):
    current_streak: int
    last_active_date: date | None


class ActivityDay(BaseModel):
    date: date
    has_activity: bool


class Last7DaysActivity(BaseModel):
    days: list[ActivityDay]


class ActivityCountDay(BaseModel):
    date: date
    activity_count: int


class Last365DaysActivityCounts(BaseModel):
    days: list[ActivityCountDay]

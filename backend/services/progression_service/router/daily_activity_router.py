from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from ..models.daily_activity import Last365DaysActivityCounts, Last7DaysActivity, StreakStats
from ..service import daily_activity_service as sl

router = APIRouter()


class LevelCompletedRequest(BaseModel):
    metadata: dict[str, Any] | None = None


@router.get("/activity/{user_id}/streak", response_model=StreakStats)
def get_streak_stats(user_id: str) -> StreakStats:
    return sl.get_streak_stats(user_id)


@router.get("/activity/{user_id}/last-7-days", response_model=Last7DaysActivity)
def get_last_7_days_activity(user_id: str) -> Last7DaysActivity:
    return sl.get_last_7_days_activity(user_id)


@router.get(
    "/activity/{user_id}/last-365-days",
    response_model=Last365DaysActivityCounts,
)
def get_last_365_days_activity_counts(user_id: str) -> Last365DaysActivityCounts:
    return sl.get_last_365_days_activity_counts(user_id)

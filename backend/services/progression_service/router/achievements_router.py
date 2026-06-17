from fastapi import APIRouter

from ..models.achievements import AchievementStatus
from .daily_activity_router import router as daily_activity_router
from ..service import achievements_service as sl

router = APIRouter()

@router.get("/achievements/{user_id}", response_model=list[AchievementStatus])
def get_user_achievements(user_id: str):
    return sl.get_achievements_for_user(user_id)
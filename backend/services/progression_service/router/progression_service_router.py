from fastapi import APIRouter

from ..models.achievements import AchievementStatus
from .daily_activity_router import router as daily_activity_router
from .achievements_router import router as achievements_router
from ..service import achievements_service as sl

router = APIRouter(
    prefix="/progression",
    tags=["progression"],
)
router.include_router(daily_activity_router)
router.include_router(achievements_router)


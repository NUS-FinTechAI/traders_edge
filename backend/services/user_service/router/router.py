from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from common.auth import TokenClaims, require_existing_user, require_user

from ..service import service as sl

router = APIRouter(
    prefix="/user",
    tags=["user"],
)


class UsernameBody(BaseModel):
    user_name: str = Field(min_length=1, max_length=40)


@router.get("/me")
async def get_me(
    ctx: tuple[TokenClaims, dict[str, Any]] = Depends(require_existing_user),
) -> dict[str, Any]:
    _claims, user = ctx
    return user


@router.post("/")
async def create_user(
    body: UsernameBody,
    claims: TokenClaims = Depends(require_user),
) -> dict[str, Any]:
    return sl.create_user(claims.uid, body.user_name, claims.email)


@router.put("/me")
async def update_me(
    body: UsernameBody,
    ctx: tuple[TokenClaims, dict[str, Any]] = Depends(require_existing_user),
) -> dict[str, Any]:
    claims, _user = ctx
    return sl.update_user_name(claims.uid, body.user_name)


@router.get("/{user_id}/total_points")
async def get_user_total_points(user_id: str) -> int:
    """Public profile view: any caller may query any user's total points
    (matches the leaderboard model — names and aggregate scores are public)."""
    return sl.get_user_total_points(user_id)

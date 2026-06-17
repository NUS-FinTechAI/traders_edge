from fastapi import HTTPException, status

from ..data_access import data_access as da
from ..data_access.data_access import UsernameTakenError


def get_user_by_userid(user_id: str) -> dict:
    user = da.get_user_by_userid(user_id)
    if user is None:
        raise HTTPException(404, "User not found")
    return user


def get_user_total_points(user_id: str) -> int:
    if da.get_user_by_userid(user_id) is None:
        raise HTTPException(404, "User not found")
    return da.get_user_total_points(user_id)


def create_user(user_id: str, user_name: str, user_email: str) -> dict:
    try:
        return da.create_user(user_id, user_name, user_email)
    except UsernameTakenError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken",
        )


def update_user_name(user_id: str, new_user_name: str) -> dict:
    try:
        row = da.update_user_name(user_id, new_user_name)
    except UsernameTakenError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken",
        )
    if row is None:
        raise HTTPException(404, "User not found")
    return row

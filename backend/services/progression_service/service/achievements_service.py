from ..data_access import achievements_repo as repo


def get_achievements_for_user(user_id: str) -> list[dict[str, str]]:
    return repo.get_achievements_for_user(user_id)

from pydantic import BaseModel


class Achievement(BaseModel):
    achievement_id: str
    title: str
    hint: str
    description: str
    icon_key: str


class AchievementStatus(Achievement):
    achieved: bool

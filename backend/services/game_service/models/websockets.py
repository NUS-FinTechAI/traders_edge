from typing import Any, Literal

from fastapi import WebSocket, WebSocketDisconnect
from pydantic import BaseModel, ConfigDict, Field
from utils.constants import OrderAction, OrderType


class WSMessage(BaseModel):
    event: str
    data: Any = None


class AuthMessage(BaseModel):
    """First message sent on every WS connection. Token is verified against
    Firebase and the resulting UID is bound to the connection — clients
    cannot supply a `user_id` for any subsequent message."""

    model_config = ConfigDict(extra="ignore")

    token: str


class StartLevelMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")

    level_id: str
    mode: Literal["Tutorial", "Puzzle", "Multiplayer"] = "Tutorial"


class RegisterOrder(BaseModel):
    """Order shape from the client. `user_id` is intentionally omitted —
    the handler stamps it from the connection's verified UID."""

    model_config = ConfigDict(extra="ignore")

    order_id: str | None = None
    action: OrderAction
    order_type: OrderType
    ticker: str
    qty: int
    price: float | None = None
    stop_price: float | None = None


class CancelOrder(BaseModel):
    model_config = ConfigDict(extra="ignore")

    order_id: str


class PlayerToPlayerMessage(BaseModel):
    """`sender_id` is intentionally omitted — the handler stamps it from the
    connection's verified UID."""

    model_config = ConfigDict(extra="ignore")

    recipient_id: str
    content: str


class FakeNewsMessage(BaseModel):
    """`sender_id` is intentionally omitted — the handler stamps it from the
    connection's verified UID."""

    model_config = ConfigDict(extra="ignore")

    ticker: str
    content: str
    delay: int = Field(default=2, ge=1)


class ServerMessage(BaseModel):
    pass

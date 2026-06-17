import asyncio
import secrets
from pathlib import Path
from typing import Any, TypedDict

from camel_converter import dict_to_snake
from common import Order
from common.auth import TokenClaims, WsAuthError, require_existing_user, verify_ws_token
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field, ValidationError
from services.game_service.data_access import data_access
from services.game_service.models.game import LevelAvailableToolsModel
from services.game_service.models.websockets import *
from services.game_service.router.connection_manager import ConnectionManager
from services.game_service.service.multiplayer_engine import MultiplayerGameEngine
from services.game_service.service.quiz_service import (
    get_game_modules_overview,
    get_quiz_details,
    grade_quiz_attempt,
)
from services.game_service.service.single_player_engine import SinglePlayerGameEngine
from utils.constants import Direction, OrderAction, OrderType

router = APIRouter(
    prefix="/game",
    tags=["game"],
)

ROOM_CODE_LENGTH = 6


class RoomFeaturesPayload(TypedDict):
    has_npc_orders: bool
    available_tools: dict[str, bool]


class RoomStatePayload(TypedDict):
    features: RoomFeaturesPayload


class CreateMultiplayerRoomPayload(BaseModel):
    has_npc_orders: bool = True
    available_tools: dict[str, bool] = Field(default_factory=dict)


MULTIPLAYER_EXTRA_TOOL_KEYS: tuple[str, ...] = ("fake_news", "private_chat")
MULTIPLAYER_TOOL_KEYS: tuple[str, ...] = tuple(
    dict.fromkeys(
        [*LevelAvailableToolsModel.model_fields.keys(), *MULTIPLAYER_EXTRA_TOOL_KEYS]
    )
)
MULTIPLAYER_ALWAYS_ENABLED_TOOLS = {"bid_ask_spread"}


ACTIVE_ROOMS_LOCK = asyncio.Lock()
ACTIVE_ROOMS: dict[str, tuple[ConnectionManager, MultiplayerGameEngine]] = (
    {}
)  # room_id to ConnectionManager
ROOM_REGISTRY_LOCK = asyncio.Lock()
# room_code -> room state payload.
# Shape:
# {
#   "<ROOM_CODE>": {
#     "features": {
#       "has_npc_orders": bool,
#       "available_tools": { "<tool_key>": bool, ... }
#     }
#   }
# }
# This registry is the source of truth for lobby-level room configuration.
ROOM_REGISTRY: dict[str, RoomStatePayload] = {}

current_dir = Path(__file__).parent
with open(current_dir / "single_player.html", "r") as f:
    SINGLE_PLAYER_DEBUG_HTML = f.read()

with open(current_dir / "multiplayer.html", "r") as f:
    MULTIPLAYER_DEBUG_HTML = f.read()


def normalize_room_id(room_id: str) -> str:
    return (room_id or "").strip().upper()


def _direction_from_action(action: OrderAction) -> Direction:
    if action in (OrderAction.BUY, OrderAction.BUY_TO_COVER):
        return Direction.BUY
    return Direction.SELL


def _validate_order_payload(order: Order) -> None:
    if order.qty <= 0:
        raise ValueError("order quantity must be positive")

    match order.order_type:
        case OrderType.MARKET:
            order.price = None
            order.stop_price = None
        case OrderType.LIMIT:
            if order.price is None:
                raise ValueError("limit orders must have a price")
            if float(order.price) <= 0:
                raise ValueError("limit order price must be positive")
            order.stop_price = None
        case OrderType.STOP:
            trigger = order.stop_price if order.stop_price is not None else order.price
            if trigger is None:
                raise ValueError("stop orders must have a stop_price")
            if float(trigger) <= 0:
                raise ValueError("stop order stop_price must be positive")
            order.stop_price = float(trigger)
            # Stop-market orders do not define a limit price.
            order.price = None
        case OrderType.STOP_LIMIT:
            if order.stop_price is None:
                raise ValueError("stop-limit orders must have a stop_price")
            if order.price is None:
                raise ValueError("stop-limit orders must have a price")
            if float(order.stop_price) <= 0:
                raise ValueError("stop-limit order stop_price must be positive")
            if float(order.price) <= 0:
                raise ValueError("stop-limit order price must be positive")
        case _:
            raise ValueError("unsupported order type")


def build_room_features(
    *,
    has_npc_orders: bool = True,
    available_tools: dict[str, bool] | None = None,
) -> RoomFeaturesPayload:
    """Normalize requested room features into the effective room config.

    This function is used both when creating rooms and when reading features
    from registry so enforcement rules are applied consistently.
    """
    # Init feature map with defaults of all tools enabled
    resolved_tools = {tool_key: True for tool_key in MULTIPLAYER_TOOL_KEYS}
    raw_tools = available_tools or {}
    for tool_key, enabled in raw_tools.items():
        # Ignore attempts to disable always-on tools
        if tool_key in MULTIPLAYER_ALWAYS_ENABLED_TOOLS:
            continue
        resolved_tools[tool_key] = bool(enabled)

    return {
        "has_npc_orders": bool(has_npc_orders),
        "available_tools": resolved_tools,
    }


def get_room_features_payload(room_id: str) -> RoomFeaturesPayload:
    """Return normalized room features for a room id.

    Falls back to default multiplayer room settings when a room is missing.
    """
    room = ROOM_REGISTRY.get(room_id)
    if not room:
        return build_room_features()
    features = room.get("features", {})
    return build_room_features(
        has_npc_orders=features.get("has_npc_orders", True),
        available_tools=features.get("available_tools", {}),
    )


def build_active_players_payload(
    manager: ConnectionManager,
    room_id: str,
    engine: MultiplayerGameEngine | None = None,
) -> dict[str, Any]:
    user_ids = sorted(manager.active_connections.keys())
    user_names = engine.get_user_names() if engine is not None else {}
    host_uid = manager.host_user_id
    return {
        # `active_players` stays as a list of UIDs for back-compat. UI consumers
        # should prefer `active_player_names` for display (Firebase UIDs are
        # 28-char opaque strings — useless as a label).
        "active_players": user_ids,
        "active_player_names": {uid: user_names.get(uid, uid) for uid in user_ids},
        "host": host_uid,
        "host_name": user_names.get(host_uid) if host_uid else None,
        "room_features": get_room_features_payload(room_id),
    }


async def create_room_code() -> str:
    async with ROOM_REGISTRY_LOCK:
        for _ in range(1000):
            candidate = f"{secrets.randbelow(10 ** ROOM_CODE_LENGTH):0{ROOM_CODE_LENGTH}d}"
            if candidate in ROOM_REGISTRY:
                continue
            ROOM_REGISTRY[candidate] = {
                "features": build_room_features(),
            }
            return candidate
    raise HTTPException(status_code=503, detail="Unable to allocate room code")


@router.get("/debug/single-player", response_class=HTMLResponse)
async def get_debug_single_player_webpage():
    return HTMLResponse(content=SINGLE_PLAYER_DEBUG_HTML)


@router.get("/debug/multiplayer", response_class=HTMLResponse)
async def get_debug_multiplayer_webpage():
    return HTMLResponse(content=MULTIPLAYER_DEBUG_HTML)


@router.get("/details/{level_id}")
async def get_level_details(level_id: str):
    ret = data_access.get_tutorial_level(level_id)
    return ret


@router.get("/me")
async def get_all_levels(
    ctx: tuple[TokenClaims, dict[str, Any]] = Depends(require_existing_user),
):
    claims, _user = ctx
    return get_game_modules_overview(claims.uid)


@router.get("/quiz/{quiz_id}")
async def get_quiz(
    quiz_id: str,
    ctx: tuple[TokenClaims, dict[str, Any]] = Depends(require_existing_user),
):
    claims, _user = ctx
    try:
        return get_quiz_details(quiz_id, user_id=claims.uid)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


class QuizAttemptBody(BaseModel):
    answers: dict[str, int]


@router.post("/quiz/{quiz_id}/attempt")
async def submit_quiz_attempt(
    quiz_id: str,
    body: QuizAttemptBody,
    ctx: tuple[TokenClaims, dict[str, Any]] = Depends(require_existing_user),
):
    claims, _user = ctx
    try:
        return grade_quiz_attempt(claims.uid, quiz_id, body.answers)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/puzzle/me")
async def get_all_puzzle_levels(
    ctx: tuple[TokenClaims, dict[str, Any]] = Depends(require_existing_user),
):
    claims, _user = ctx
    return data_access.get_available_puzzle_levels(claims.uid)


@router.get("/leaderboard/{level_id}")
async def get_leaderboard(level_id: str):
    ret = data_access.get_leaderboard(level_id)
    return ret


@router.post("/multiplayer/rooms")
async def create_multiplayer_room(payload: CreateMultiplayerRoomPayload):
    room_code = await create_room_code()
    # Room tool configuration behavior:
    # - We normalize requested toggles into a full room feature map via
    #   `build_room_features` (including no-NPC invariants).
    # - Backend enforces only a subset of tools at runtime:
    #     * order-type constraints via MultiplayerGameEngine:
    #       `_validate_room_order_constraints` and `_validate_order_tool_access`
    #     * multiplayer actions via router event guards:
    #       `private_chat` and `fake_news`
    # - Other UI tools (for example moving_average / exponential_moving_average
    #   and analytics panels) are currently treated as presentation toggles and
    #   are not independently validated by backend business logic.
    features = build_room_features(
        has_npc_orders=payload.has_npc_orders,
        available_tools=payload.available_tools,
    )
    async with ROOM_REGISTRY_LOCK:
        ROOM_REGISTRY[room_code] = {"features": features}
    return {"room_code": room_code, "room_features": features}


async def _ws_authenticate(websocket: WebSocket) -> tuple[TokenClaims, dict[str, Any]] | None:
    """Perform the first-message auth handshake.

    Expects ``{"event": "auth", "data": {"token": "..."}}`` as the very first
    message on the socket. Returns ``(claims, user_row)`` on success, or
    ``None`` after closing the socket with code 4401 / 4404.

    Why not a query param? A token in the URL leaks into access logs,
    CDN caches, and `Referer` headers. The handshake keeps it in the body.
    Why post-accept? You can only `receive_json` *after* `accept()` on
    Starlette; rejecting earlier means returning an HTTP status, which the
    JS WebSocket API surfaces only as an opaque `close` event.
    """
    try:
        msg_json = await websocket.receive_json()
        msg = WSMessage.model_validate(msg_json)
    except (ValidationError, Exception):
        await websocket.close(code=4401)
        return None

    if msg.event != "auth":
        await websocket.close(code=4401)
        return None

    try:
        auth_payload = AuthMessage.model_validate(dict_to_snake(msg.data or {}))
        claims = await verify_ws_token(auth_payload.token)
    except (WsAuthError, ValidationError):
        # Bad/expired token or malformed AuthMessage. Other exceptions (DB
        # outage, bugs) are intentionally allowed to propagate so they're
        # not silently misreported as auth failures.
        await websocket.close(code=4401)
        return None

    # Lazy import — avoids the services/__init__.py circular load.
    from services.user_service.data_access import data_access as user_da

    user = user_da.get_user_by_userid(claims.uid)
    if user is None:
        # Firebase user exists but app-side row hasn't been created yet —
        # frontend should send them through /setup-username before opening WS.
        await websocket.close(code=4404)
        return None

    await websocket.send_json({"event": "auth_ok", "data": {"uid": claims.uid}})
    return claims, user


async def wait_for_start(websocket: WebSocket) -> StartLevelMessage:
    while True:
        msg_json = await websocket.receive_json()
        msg = WSMessage(**msg_json)
        if msg.event == "start":
            return StartLevelMessage.model_validate(dict_to_snake(msg.data))


@router.websocket("/single-player/ws")
async def single_player_websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    auth_result = await _ws_authenticate(websocket)
    if auth_result is None:
        return
    claims, _user = auth_result
    uid = claims.uid

    level_info = await wait_for_start(websocket)

    # Gate access at the WS boundary so a forged client (e.g. someone who
    # typed `/adventureMode/1/4` into the address bar without that level
    # being unlocked) cannot trick the engine into running anyway.
    # `is_level_available_for_user` is the single source of truth — it
    # covers tutorial row-existence and the puzzle gate from PR 5.
    if not data_access.is_level_available_for_user(uid, level_info.level_id):
        await websocket.send_json({
            "event": "levelLocked",
            "data": {
                "level_id": level_info.level_id,
                "error": "Level is locked. Complete prior levels first.",
            },
        })
        await websocket.close(code=4403)
        return

    engine = SinglePlayerGameEngine(uid, level_info.level_id, level_info.mode)

    manager = ConnectionManager()
    manager.register_connection(websocket, uid)
    engine.register_emit_handler(
        lambda event, _, data: manager.server_send(event, uid, data)
    )

    await engine.start()

    try:
        while True:
            msg_json = await websocket.receive_json()
            msg = WSMessage(**msg_json)
            resp: dict[str, Any] = {}
            try:
                match msg.event:
                    case "registerOrder":
                        data = RegisterOrder.model_validate(dict_to_snake(msg.data))
                        order = Order(
                            user_id=uid,
                            **data.model_dump(),
                            direction=_direction_from_action(data.action),
                        )
                        order.order_id = None
                        _validate_order_payload(order)
                        resp = await engine.register_order(order)
                    case "nextTick":
                        await engine.next_tick()
                    case "startTicking":
                        resp = await engine.start_ticking()

                    case "cancelOrder":
                        data = CancelOrder.model_validate(dict_to_snake(msg.data))
                        resp = await engine.cancel_order(data.order_id)
                    case _:
                        resp = {"msg": f"unknown event {msg.event}"}
                if resp:
                    await websocket.send_json(resp)
            except Exception as e:
                print(f"Exception type: {type(e).__name__}")
                print(f"Exception message: {e}")
                await websocket.send_json({"error": str(e)})
    except WebSocketDisconnect:
        await engine.on_disconnect()


@router.websocket("/multiplayer/ws/{room_id}")
async def multiplayer_websocket_endpoint(websocket: WebSocket, room_id: str):
    await websocket.accept()

    auth_result = await _ws_authenticate(websocket)
    if auth_result is None:
        return
    claims, user_row = auth_result
    uid = claims.uid
    user_name = user_row.get("user_name") or uid

    normalized_room_id = normalize_room_id(room_id)
    level_info = await wait_for_start(websocket)

    async with ROOM_REGISTRY_LOCK:
        room_exists = normalized_room_id in ROOM_REGISTRY
    if not room_exists:
        await websocket.send_json(
            {
                "from": "server",
                "event": "roomError",
                "data": {"error": "Room not found. Ask the host to create a room first."},
            }
        )
        await websocket.close(code=1008)
        return

    async with ACTIVE_ROOMS_LOCK:
        if normalized_room_id not in ACTIVE_ROOMS:
            manager = ConnectionManager()
            # First authenticated joiner becomes the host.
            manager.set_host(uid)

            engine = MultiplayerGameEngine(level_info.level_id)
            room_features = get_room_features_payload(normalized_room_id)
            engine.configure_room_features(
                has_npc_orders=room_features["has_npc_orders"],
                available_tools=room_features["available_tools"],
            )
            engine.register_emit_handler(
                lambda event, user_id, data: manager.server_send(event, user_id, data)
            )
            ACTIVE_ROOMS[normalized_room_id] = (manager, engine)

    manager, engine = ACTIVE_ROOMS[normalized_room_id]
    manager.register_connection(websocket, uid)

    # Look up the host's display name (may be self, if we just became host).
    host_uid = manager.host_user_id
    host_user_name = (
        user_name
        if host_uid == uid
        else (engine.get_user_names().get(host_uid) if host_uid else None)
    )

    await engine.register_user(
        uid,
        host_user_id=host_uid,
        user_name=user_name,
        host_user_name=host_user_name,
    )
    manager.server_broadcast(
        "activePlayersResponse",
        build_active_players_payload(manager, normalized_room_id, engine),
    )

    try:
        while True:
            msg_json = await websocket.receive_json()
            msg = WSMessage(**msg_json)
            resp: dict[str, Any] = {}
            try:
                match msg.event:
                    case "start":
                        # The connected UID is bound; we no longer trust any
                        # `user_id` in the payload. Host check is identity vs
                        # connection UID.
                        if uid != manager.host_user_id:
                            resp = {
                                "msg": "only host can start the game",
                                "host": manager.host_user_id,
                                "host_name": engine.get_user_names().get(manager.host_user_id),
                            }
                        else:
                            await engine.start()
                    case "registerOrder":
                        if engine._running is False:
                            raise Exception("game has not started yet")

                        data = RegisterOrder.model_validate(dict_to_snake(msg.data))
                        order = Order(
                            user_id=uid,
                            **data.model_dump(),
                            direction=_direction_from_action(data.action),
                        )
                        order.order_id = None
                        _validate_order_payload(order)

                        resp = await engine.register_order(order)
                    case "cancelOrder":
                        if engine._running is False:
                            raise Exception("game has not started yet")

                        data = CancelOrder.model_validate(dict_to_snake(msg.data))
                        resp = await engine.cancel_order(data.order_id)
                    case "privateMessage":
                        room_features = get_room_features_payload(normalized_room_id)
                        if not room_features["available_tools"].get("private_chat", True):
                            raise PermissionError(
                                "Private chat is disabled for this room"
                            )
                        data = PlayerToPlayerMessage.model_validate(
                            dict_to_snake(msg.data)
                        )
                        # `sender_id` is stamped from the connection UID — the
                        # client can't impersonate someone else.
                        manager.send_message(
                            uid, data.recipient_id, {"content": data.content}
                        )
                        resp = {"msg": "private message sent"}
                    case "activePlayers":
                        resp = build_active_players_payload(
                            manager, normalized_room_id, engine
                        )
                    case "fakeNews":
                        room_features = get_room_features_payload(normalized_room_id)
                        if not room_features["available_tools"].get("fake_news", True):
                            raise PermissionError(
                                "Fake news is disabled for this room"
                            )
                        data = FakeNewsMessage.model_validate(dict_to_snake(msg.data))
                        await engine.add_fake_news(
                            data.ticker, data.content, data.delay
                        )
                        resp = {
                            "msg": f"fake news added to {data.ticker} with delay {data.delay} seconds",
                            "room_features": room_features,
                        }
                    case _:
                        resp = {"msg": f"unknown event {msg.event}"}
                if resp:
                    manager.server_send(f"{msg.event}Response", uid, resp)
            except Exception as e:
                print(f"Exception type: {type(e).__name__}")
                print(f"Exception message: {e}")
                manager.server_send(f"{msg.event}Error", uid, {"error": str(e)})
    except WebSocketDisconnect:
        manager.remove_connection(uid)
        if len(manager.active_connections) > 0:
            manager.server_broadcast(
                "activePlayersResponse",
                build_active_players_payload(manager, normalized_room_id, engine),
            )
        if len(manager.active_connections) == 0:
            async with ACTIVE_ROOMS_LOCK:
                entry = ACTIVE_ROOMS.pop(normalized_room_id, None)
            if entry:
                _, engine = entry
                await engine.on_disconnect()
            async with ROOM_REGISTRY_LOCK:
                ROOM_REGISTRY.pop(normalized_room_id, None)

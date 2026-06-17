import asyncio
import re
from pathlib import Path

import pytest
from fastapi import WebSocketDisconnect
from starlette.websockets import WebSocketState

import services.game_service.router.router as multiplayer_router_module
from common.auth import TokenClaims

DISCONNECT = object()


@pytest.fixture(autouse=True)
def patch_ws_auth(monkeypatch):
    """Bypass real Firebase verification in WS tests.

    Token convention used by `connect_as` below: ``"fake:<uid>"``. Whatever
    UID the test wants to drive becomes the bound connection identity.
    """

    async def fake_verify_ws_token(token: str) -> TokenClaims:
        if not token or ":" not in token:
            from common.auth import WsAuthError
            raise WsAuthError("invalid test token")
        uid = token.split(":", 1)[1]
        return TokenClaims(
            uid=uid,
            email=f"{uid}@example.com",
            email_verified=True,
            name=f"User {uid}",
        )

    def fake_get_user(uid: str):
        return {
            "user_id": uid,
            "user_name": f"User {uid}",
            "user_email": f"{uid}@example.com",
        }

    monkeypatch.setattr(multiplayer_router_module, "verify_ws_token", fake_verify_ws_token)
    monkeypatch.setattr(
        "services.user_service.data_access.data_access.get_user_by_userid",
        fake_get_user,
    )


def auth_payload(user_id: str) -> dict:
    return {"event": "auth", "data": {"token": f"fake:{user_id}"}}


class FakeWebSocket:
    def __init__(self):
        self._incoming: asyncio.Queue = asyncio.Queue()
        self.sent: list[dict] = []
        self.accepted = False
        self.closed = False
        self.client_state = WebSocketState.CONNECTING

    async def accept(self):
        self.accepted = True
        self.client_state = WebSocketState.CONNECTED

    async def receive_json(self):
        item = await self._incoming.get()
        if item is DISCONNECT:
            self.client_state = WebSocketState.DISCONNECTED
            raise WebSocketDisconnect(code=1000)
        return item

    async def send_json(self, payload):
        self.sent.append(payload)

    async def close(self, code: int = 1000):
        self.closed = True
        self.client_state = WebSocketState.DISCONNECTED

    def push(self, payload: dict):
        self._incoming.put_nowait(payload)

    def disconnect(self):
        self._incoming.put_nowait(DISCONNECT)


async def wait_for_sent(
    websocket: FakeWebSocket,
    predicate,
    *,
    timeout_seconds: float = 1.0,
):
    deadline = asyncio.get_running_loop().time() + timeout_seconds
    while asyncio.get_running_loop().time() < deadline:
        for payload in websocket.sent:
            if predicate(payload):
                return payload
        await asyncio.sleep(0.01)
    raise AssertionError("Expected websocket payload was not received")


def start_payload(user_id: str | None = None) -> dict:
    """`user_id` is accepted for back-compat with existing test call sites but
    intentionally ignored — post-PR4 the bound UID comes from the auth handshake."""
    _ = user_id
    return {
        "event": "start",
        "data": {
            "levelId": "multiplayer-1",
            "mode": "Multiplayer",
        },
    }


def connect_as(ws, user_id: str) -> None:
    """Push the auth handshake + start payload onto a FakeWebSocket as the
    named user. Callers should still `wait_for_sent(...register_user...)` to
    confirm the join landed."""
    ws.push(auth_payload(user_id))
    ws.push(start_payload(user_id))


@pytest.fixture(autouse=True)
def reset_router_globals():
    multiplayer_router_module.ACTIVE_ROOMS.clear()
    multiplayer_router_module.ROOM_REGISTRY.clear()


@pytest.mark.asyncio
async def test_create_room_api_returns_unique_room_codes_and_enabled_defaults():
    first = await multiplayer_router_module.create_multiplayer_room(
        multiplayer_router_module.CreateMultiplayerRoomPayload()
    )
    second = await multiplayer_router_module.create_multiplayer_room(
        multiplayer_router_module.CreateMultiplayerRoomPayload()
    )

    assert re.fullmatch(r"\d{6}", first["room_code"])
    assert re.fullmatch(r"\d{6}", second["room_code"])
    assert first["room_code"] != second["room_code"]
    assert first["room_features"] == {
        "has_npc_orders": True,
        "available_tools": {
            tool_key: True for tool_key in multiplayer_router_module.MULTIPLAYER_TOOL_KEYS
        },
    }


@pytest.mark.asyncio
async def test_create_room_api_respects_toggle_payload():
    room = await multiplayer_router_module.create_multiplayer_room(
        multiplayer_router_module.CreateMultiplayerRoomPayload(
            has_npc_orders=False,
            available_tools={
                "fake_news": False,
                "private_chat": True,
                "drawdown_panel": False,
                "bid_ask_spread": False,
            },
        )
    )

    expected_tools = {
        tool_key: True for tool_key in multiplayer_router_module.MULTIPLAYER_TOOL_KEYS
    }
    expected_tools["fake_news"] = False
    expected_tools["private_chat"] = True
    expected_tools["drawdown_panel"] = False
    expected_tools["limit_order"] = True
    expected_tools["bid_ask_spread"] = True

    assert room["room_features"] == {
        "has_npc_orders": False,
        "available_tools": expected_tools,
    }


@pytest.mark.asyncio
async def test_active_players_tracks_join_and_leave():
    room = await multiplayer_router_module.create_multiplayer_room(
        multiplayer_router_module.CreateMultiplayerRoomPayload()
    )
    room_code = room["room_code"]

    ws1 = FakeWebSocket()
    ws2 = FakeWebSocket()

    task1 = asyncio.create_task(
        multiplayer_router_module.multiplayer_websocket_endpoint(ws1, room_code)
    )
    connect_as(ws1, "player-1")
    first_register = await wait_for_sent(
        ws1, lambda payload: payload.get("event") == "register_user"
    )
    assert first_register["data"]["host"] == "player-1"
    assert isinstance(first_register["data"].get("starting_net_worth"), (int, float))
    assert "is_manual_tick" not in first_register["data"]

    task2 = asyncio.create_task(
        multiplayer_router_module.multiplayer_websocket_endpoint(ws2, room_code)
    )
    connect_as(ws2, "player-2")
    second_register = await wait_for_sent(
        ws2, lambda payload: payload.get("event") == "register_user"
    )
    assert second_register["data"]["host"] == "player-1"
    assert isinstance(second_register["data"].get("starting_net_worth"), (int, float))
    assert "is_manual_tick" not in second_register["data"]

    ws1.push({"event": "activePlayers", "data": {}})
    active_payload = await wait_for_sent(
        ws1,
        lambda payload: payload.get("event") == "activePlayersResponse"
        and sorted((payload.get("data") or {}).get("active_players", []))
        == ["player-1", "player-2"],
    )
    assert active_payload["data"]["room_features"] == {
        "has_npc_orders": True,
        "available_tools": {
            tool_key: True for tool_key in multiplayer_router_module.MULTIPLAYER_TOOL_KEYS
        },
    }
    assert active_payload["data"]["host"] == "player-1"

    ws2.disconnect()
    await asyncio.wait_for(task2, timeout=2)

    ws1.push({"event": "activePlayers", "data": {}})
    await wait_for_sent(
        ws1,
        lambda payload: payload.get("event") == "activePlayersResponse"
        and (payload.get("data") or {}).get("active_players") == ["player-1"],
    )

    ws1.disconnect()
    await asyncio.wait_for(task1, timeout=2)


@pytest.mark.asyncio
async def test_room_features_flow_to_register_user_payload_and_active_players():
    room = await multiplayer_router_module.create_multiplayer_room(
        multiplayer_router_module.CreateMultiplayerRoomPayload(
            has_npc_orders=False,
        )
    )
    room_code = room["room_code"]

    ws = FakeWebSocket()
    task = asyncio.create_task(
        multiplayer_router_module.multiplayer_websocket_endpoint(ws, room_code)
    )
    connect_as(ws, "player-1")

    register_payload = await wait_for_sent(
        ws, lambda payload: payload.get("event") == "register_user"
    )
    assert register_payload["data"]["has_npc_orders"] is False
    assert register_payload["data"]["available_tools"]["market_order"] is False
    assert register_payload["data"]["available_tools"]["bid_ask_spread"] is True

    ws.push({"event": "activePlayers", "data": {}})
    active_payload = await wait_for_sent(
        ws, lambda payload: payload.get("event") == "activePlayersResponse"
    )
    assert active_payload["data"]["room_features"]["has_npc_orders"] is False
    assert active_payload["data"]["room_features"]["available_tools"]["market_order"] is (
        True
    )
    assert active_payload["data"]["room_features"]["available_tools"]["limit_order"] is True

    ws.disconnect()
    await asyncio.wait_for(task, timeout=2)


@pytest.mark.asyncio
async def test_private_message_delivery_when_enabled():
    room = await multiplayer_router_module.create_multiplayer_room(
        multiplayer_router_module.CreateMultiplayerRoomPayload()
    )
    room_code = room["room_code"]

    ws1 = FakeWebSocket()
    ws2 = FakeWebSocket()

    task1 = asyncio.create_task(
        multiplayer_router_module.multiplayer_websocket_endpoint(ws1, room_code)
    )
    connect_as(ws1, "player-1")
    await wait_for_sent(ws1, lambda payload: payload.get("event") == "register_user")

    task2 = asyncio.create_task(
        multiplayer_router_module.multiplayer_websocket_endpoint(ws2, room_code)
    )
    connect_as(ws2, "player-2")
    await wait_for_sent(ws2, lambda payload: payload.get("event") == "register_user")

    ws2.push(
        {
            "event": "privateMessage",
            "data": {
                "senderId": "player-2",
                "recipientId": "player-1",
                "content": "hello player 1",
            },
        }
    )

    incoming = await wait_for_sent(
        ws1,
        lambda payload: payload.get("from") == "player-2"
        and (payload.get("data") or {}).get("content") == "hello player 1",
    )
    assert incoming["data"]["content"] == "hello player 1"

    ws2.disconnect()
    ws1.disconnect()
    await asyncio.wait_for(task2, timeout=2)
    await asyncio.wait_for(task1, timeout=2)


@pytest.mark.asyncio
async def test_active_players_updates_host_when_current_host_disconnects():
    room = await multiplayer_router_module.create_multiplayer_room(
        multiplayer_router_module.CreateMultiplayerRoomPayload()
    )
    room_code = room["room_code"]

    ws_host = FakeWebSocket()
    ws_other = FakeWebSocket()

    task_host = asyncio.create_task(
        multiplayer_router_module.multiplayer_websocket_endpoint(ws_host, room_code)
    )
    connect_as(ws_host, "player-1")
    await wait_for_sent(
        ws_host, lambda payload: payload.get("event") == "register_user"
    )

    task_other = asyncio.create_task(
        multiplayer_router_module.multiplayer_websocket_endpoint(ws_other, room_code)
    )
    connect_as(ws_other, "player-2")
    await wait_for_sent(
        ws_other, lambda payload: payload.get("event") == "register_user"
    )

    ws_host.disconnect()
    await asyncio.wait_for(task_host, timeout=2)

    ws_other.push({"event": "activePlayers", "data": {}})
    active_payload = await wait_for_sent(
        ws_other,
        lambda payload: payload.get("event") == "activePlayersResponse"
        and (payload.get("data") or {}).get("active_players") == ["player-2"],
    )
    assert active_payload["data"]["host"] == "player-2"

    ws_other.disconnect()
    await asyncio.wait_for(task_other, timeout=2)


@pytest.mark.asyncio
async def test_private_message_rejected_when_feature_disabled():
    room = await multiplayer_router_module.create_multiplayer_room(
        multiplayer_router_module.CreateMultiplayerRoomPayload(
            available_tools={
                "private_chat": False,
                "fake_news": True,
            },
        )
    )

    ws = FakeWebSocket()
    task = asyncio.create_task(
        multiplayer_router_module.multiplayer_websocket_endpoint(ws, room["room_code"])
    )
    connect_as(ws, "player-1")
    await wait_for_sent(ws, lambda payload: payload.get("event") == "register_user")

    ws.push(
        {
            "event": "privateMessage",
            "data": {
                "senderId": "player-1",
                "recipientId": "player-2",
                "content": "blocked",
            },
        }
    )

    error_payload = await wait_for_sent(
        ws, lambda payload: payload.get("event") == "privateMessageError"
    )
    assert "disabled" in error_payload["data"]["error"].lower()

    ws.disconnect()
    await asyncio.wait_for(task, timeout=2)


@pytest.mark.asyncio
async def test_fake_news_respects_room_feature_toggle():
    disabled_room = await multiplayer_router_module.create_multiplayer_room(
        multiplayer_router_module.CreateMultiplayerRoomPayload(
            available_tools={
                "fake_news": False,
                "private_chat": True,
            },
        )
    )

    ws_disabled = FakeWebSocket()
    task_disabled = asyncio.create_task(
        multiplayer_router_module.multiplayer_websocket_endpoint(
            ws_disabled, disabled_room["room_code"]
        )
    )
    connect_as(ws_disabled, "player-1")
    await wait_for_sent(
        ws_disabled, lambda payload: payload.get("event") == "register_user"
    )

    ws_disabled.push(
        {
            "event": "fakeNews",
            "data": {
                "ticker": "AAPL",
                "senderId": "player-1",
                "content": "this should fail",
                "delay": 2,
            },
        }
    )

    disabled_error = await wait_for_sent(
        ws_disabled, lambda payload: payload.get("event") == "fakeNewsError"
    )
    assert "disabled" in disabled_error["data"]["error"].lower()

    ws_disabled.disconnect()
    await asyncio.wait_for(task_disabled, timeout=2)

    enabled_room = await multiplayer_router_module.create_multiplayer_room(
        multiplayer_router_module.CreateMultiplayerRoomPayload()
    )

    ws_enabled = FakeWebSocket()
    task_enabled = asyncio.create_task(
        multiplayer_router_module.multiplayer_websocket_endpoint(
            ws_enabled, enabled_room["room_code"]
        )
    )
    connect_as(ws_enabled, "player-1")
    await wait_for_sent(
        ws_enabled, lambda payload: payload.get("event") == "register_user"
    )

    ws_enabled.push(
        {
            "event": "fakeNews",
            "data": {
                "ticker": "AAPL",
                "senderId": "player-1",
                "content": "this should pass",
                "delay": 2,
            },
        }
    )

    fake_news_response = await wait_for_sent(
        ws_enabled, lambda payload: payload.get("event") == "fakeNewsResponse"
    )
    assert "fake news added" in fake_news_response["data"]["msg"].lower()

    ws_enabled.disconnect()
    await asyncio.wait_for(task_enabled, timeout=2)


@pytest.mark.asyncio
async def test_fake_news_rejects_zero_or_negative_delay():
    room = await multiplayer_router_module.create_multiplayer_room(
        multiplayer_router_module.CreateMultiplayerRoomPayload()
    )

    ws = FakeWebSocket()
    task = asyncio.create_task(
        multiplayer_router_module.multiplayer_websocket_endpoint(ws, room["room_code"])
    )
    connect_as(ws, "player-1")
    await wait_for_sent(ws, lambda payload: payload.get("event") == "register_user")

    ws.push(
        {
            "event": "fakeNews",
            "data": {
                "ticker": "AAPL",
                "senderId": "player-1",
                "content": "invalid delay",
                "delay": 0,
            },
        }
    )

    error_payload = await wait_for_sent(
        ws, lambda payload: payload.get("event") == "fakeNewsError"
    )
    assert "greater than or equal to 1" in error_payload["data"]["error"].lower()

    ws.disconnect()
    await asyncio.wait_for(task, timeout=2)

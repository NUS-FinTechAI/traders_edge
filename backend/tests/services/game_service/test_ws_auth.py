"""WebSocket auth-handshake tests for both `/single-player/ws` and
`/multiplayer/ws/{room_id}`.

Verifies:
- Missing/invalid token → socket closed with code 4401.
- Authenticated user without a `users` row → closed with code 4404.
- Connection UID is taken from the token; an attacker-supplied `user_id` /
  `sender_id` in subsequent messages is ignored.
- Multiplayer `activePlayersResponse` carries `active_player_names` and
  `host_name` (post-PR4 the raw `active_players` are Firebase UIDs and useless
  for display).
"""
import asyncio

import pytest
from fastapi import WebSocketDisconnect
from starlette.websockets import WebSocketState

import services.game_service.router.router as router_module
from common.auth import TokenClaims, WsAuthError

DISCONNECT = object()


class FakeWebSocket:
    def __init__(self):
        self._incoming: asyncio.Queue = asyncio.Queue()
        self.sent: list[dict] = []
        self.accepted = False
        self.close_code: int | None = None
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
        self.close_code = code
        self.client_state = WebSocketState.DISCONNECTED

    def push(self, payload):
        self._incoming.put_nowait(payload)

    def disconnect(self):
        self._incoming.put_nowait(DISCONNECT)


async def wait_for_sent(ws, predicate, *, timeout_seconds: float = 1.0):
    deadline = asyncio.get_running_loop().time() + timeout_seconds
    while asyncio.get_running_loop().time() < deadline:
        for payload in ws.sent:
            if predicate(payload):
                return payload
        await asyncio.sleep(0.01)
    raise AssertionError("expected payload not received")


@pytest.fixture(autouse=True)
def reset_router_globals():
    router_module.ACTIVE_ROOMS.clear()
    router_module.ROOM_REGISTRY.clear()


@pytest.fixture
def patch_verify_factory(monkeypatch):
    """Returns a function that patches verify_ws_token + user lookup."""

    def _patch(
        *,
        token_to_uid: dict[str, str] | None = None,
        invalid_tokens: set[str] | None = None,
        missing_user_uids: set[str] | None = None,
    ):
        token_to_uid = token_to_uid or {}
        invalid_tokens = invalid_tokens or set()
        missing_user_uids = missing_user_uids or set()

        async def fake_verify(token):
            if token in invalid_tokens or token not in token_to_uid:
                raise WsAuthError("invalid token (test)")
            uid = token_to_uid[token]
            return TokenClaims(
                uid=uid,
                email=f"{uid}@example.com",
                email_verified=True,
                name=f"User {uid}",
            )

        def fake_get_user(uid):
            if uid in missing_user_uids:
                return None
            return {
                "user_id": uid,
                "user_name": f"User {uid}",
                "user_email": f"{uid}@example.com",
            }

        monkeypatch.setattr(router_module, "verify_ws_token", fake_verify)
        monkeypatch.setattr(
            "services.user_service.data_access.data_access.get_user_by_userid",
            fake_get_user,
        )

    return _patch


# ---------- single-player WS ----------


@pytest.mark.asyncio
async def test_single_player_closes_4401_when_first_message_is_not_auth(patch_verify_factory):
    patch_verify_factory(token_to_uid={"good": "uid-1"})
    ws = FakeWebSocket()
    task = asyncio.create_task(router_module.single_player_websocket_endpoint(ws))
    # Skip the auth handshake and send `start` directly.
    ws.push({"event": "start", "data": {"levelId": "module-1.1"}})
    await asyncio.wait_for(task, timeout=2)
    assert ws.close_code == 4401


@pytest.mark.asyncio
async def test_single_player_closes_4401_when_first_message_has_no_event_field(patch_verify_factory):
    """Client sends valid JSON but missing the required `event` field.
    `WSMessage.model_validate` raises ValidationError — handler must catch
    it and close cleanly with 4401 instead of letting the exception propagate.
    """
    patch_verify_factory(token_to_uid={"good": "uid-1"})
    ws = FakeWebSocket()
    task = asyncio.create_task(router_module.single_player_websocket_endpoint(ws))
    ws.push({"foo": "bar"})
    await asyncio.wait_for(task, timeout=2)
    assert ws.close_code == 4401


@pytest.mark.asyncio
async def test_single_player_closes_4401_when_auth_payload_has_no_token(patch_verify_factory):
    """`event: auth` but `data` is missing the required `token` field —
    AuthMessage validation should fail and the handler should close 4401."""
    patch_verify_factory(token_to_uid={"good": "uid-1"})
    ws = FakeWebSocket()
    task = asyncio.create_task(router_module.single_player_websocket_endpoint(ws))
    ws.push({"event": "auth", "data": {}})
    await asyncio.wait_for(task, timeout=2)
    assert ws.close_code == 4401


@pytest.mark.asyncio
async def test_single_player_closes_4401_on_invalid_token(patch_verify_factory):
    patch_verify_factory(invalid_tokens={"bad"})
    ws = FakeWebSocket()
    task = asyncio.create_task(router_module.single_player_websocket_endpoint(ws))
    ws.push({"event": "auth", "data": {"token": "bad"}})
    await asyncio.wait_for(task, timeout=2)
    assert ws.close_code == 4401


@pytest.mark.asyncio
async def test_single_player_closes_4404_when_user_not_onboarded(patch_verify_factory):
    patch_verify_factory(
        token_to_uid={"good": "uid-no-row"},
        missing_user_uids={"uid-no-row"},
    )
    ws = FakeWebSocket()
    task = asyncio.create_task(router_module.single_player_websocket_endpoint(ws))
    ws.push({"event": "auth", "data": {"token": "good"}})
    await asyncio.wait_for(task, timeout=2)
    assert ws.close_code == 4404


# ---------- multiplayer WS ----------


@pytest.mark.asyncio
async def test_multiplayer_closes_4401_on_invalid_token(patch_verify_factory):
    patch_verify_factory(invalid_tokens={"bad"})
    room = await router_module.create_multiplayer_room(
        router_module.CreateMultiplayerRoomPayload()
    )
    ws = FakeWebSocket()
    task = asyncio.create_task(
        router_module.multiplayer_websocket_endpoint(ws, room["room_code"])
    )
    ws.push({"event": "auth", "data": {"token": "bad"}})
    await asyncio.wait_for(task, timeout=2)
    assert ws.close_code == 4401


@pytest.mark.asyncio
async def test_multiplayer_active_players_response_includes_names(patch_verify_factory):
    patch_verify_factory(token_to_uid={"t1": "fb-uid-1", "t2": "fb-uid-2"})
    room = await router_module.create_multiplayer_room(
        router_module.CreateMultiplayerRoomPayload()
    )
    room_code = room["room_code"]

    ws_host = FakeWebSocket()
    task_host = asyncio.create_task(
        router_module.multiplayer_websocket_endpoint(ws_host, room_code)
    )
    ws_host.push({"event": "auth", "data": {"token": "t1"}})
    ws_host.push({"event": "start", "data": {"levelId": "multiplayer-1"}})
    await wait_for_sent(ws_host, lambda p: p.get("event") == "register_user")

    ws_other = FakeWebSocket()
    task_other = asyncio.create_task(
        router_module.multiplayer_websocket_endpoint(ws_other, room_code)
    )
    ws_other.push({"event": "auth", "data": {"token": "t2"}})
    ws_other.push({"event": "start", "data": {"levelId": "multiplayer-1"}})
    await wait_for_sent(ws_other, lambda p: p.get("event") == "register_user")

    ws_other.push({"event": "activePlayers", "data": {}})
    payload = await wait_for_sent(
        ws_other,
        lambda p: p.get("event") == "activePlayersResponse"
        and sorted((p.get("data") or {}).get("active_players", [])) == ["fb-uid-1", "fb-uid-2"],
    )
    data = payload["data"]
    assert data["host"] == "fb-uid-1"
    assert data["host_name"] == "User fb-uid-1"
    assert data["active_player_names"] == {
        "fb-uid-1": "User fb-uid-1",
        "fb-uid-2": "User fb-uid-2",
    }

    ws_host.disconnect()
    ws_other.disconnect()
    await asyncio.wait_for(task_host, timeout=2)
    await asyncio.wait_for(task_other, timeout=2)


@pytest.mark.asyncio
async def test_multiplayer_start_payload_user_id_is_ignored(patch_verify_factory):
    """An attacker that sends `userId: 'somebody-else'` in the start data
    must NOT take over identity. The bound UID is what the token said."""
    patch_verify_factory(token_to_uid={"t": "real-uid"})
    room = await router_module.create_multiplayer_room(
        router_module.CreateMultiplayerRoomPayload()
    )
    ws = FakeWebSocket()
    task = asyncio.create_task(
        router_module.multiplayer_websocket_endpoint(ws, room["room_code"])
    )
    ws.push({"event": "auth", "data": {"token": "t"}})
    ws.push({
        "event": "start",
        "data": {"levelId": "multiplayer-1", "userId": "attacker-uid"},
    })
    register = await wait_for_sent(ws, lambda p: p.get("event") == "register_user")
    # The connection's bound UID is whom register_user fires for. The
    # attacker-supplied "userId" in the start payload is stripped by
    # StartLevelMessage's `extra="ignore"`.
    assert register["data"]["host"] == "real-uid"
    ws.disconnect()
    await asyncio.wait_for(task, timeout=2)


@pytest.mark.asyncio
async def test_multiplayer_private_message_sender_is_stamped(patch_verify_factory):
    """Even if the privateMessage payload includes a forged `senderId`, the
    server stamps the bound UID as the from-field."""
    patch_verify_factory(token_to_uid={"t1": "uid-1", "t2": "uid-2"})
    room = await router_module.create_multiplayer_room(
        router_module.CreateMultiplayerRoomPayload()
    )
    room_code = room["room_code"]

    ws1 = FakeWebSocket()
    task1 = asyncio.create_task(
        router_module.multiplayer_websocket_endpoint(ws1, room_code)
    )
    ws1.push({"event": "auth", "data": {"token": "t1"}})
    ws1.push({"event": "start", "data": {"levelId": "multiplayer-1"}})
    await wait_for_sent(ws1, lambda p: p.get("event") == "register_user")

    ws2 = FakeWebSocket()
    task2 = asyncio.create_task(
        router_module.multiplayer_websocket_endpoint(ws2, room_code)
    )
    ws2.push({"event": "auth", "data": {"token": "t2"}})
    ws2.push({"event": "start", "data": {"levelId": "multiplayer-1"}})
    await wait_for_sent(ws2, lambda p: p.get("event") == "register_user")

    ws2.push({
        "event": "privateMessage",
        "data": {
            "senderId": "attacker-uid",  # forged; should be ignored
            "recipientId": "uid-1",
            "content": "hi from uid-2",
        },
    })

    incoming = await wait_for_sent(
        ws1,
        lambda p: p.get("from") == "uid-2"
        and (p.get("data") or {}).get("content") == "hi from uid-2",
    )
    # Sanity: there is NO incoming message with from == "attacker-uid".
    assert not any(payload.get("from") == "attacker-uid" for payload in ws1.sent)
    assert incoming["data"]["content"] == "hi from uid-2"

    ws1.disconnect()
    ws2.disconnect()
    await asyncio.wait_for(task1, timeout=2)
    await asyncio.wait_for(task2, timeout=2)

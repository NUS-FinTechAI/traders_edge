"""Integration tests for the single-player WS handler's level gate.

Verifies the bug-fix path: a client that passes a level_id the user has
not unlocked must be rejected with WS close code 4403 and a structured
``levelLocked`` event. Mirrors the patching style of ``test_ws_auth.py``.
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
def patch_auth_passes(monkeypatch):
    """Authenticated user (uid='uid-1') with an existing app-side row.
    Tests can then layer their own `is_level_available_for_user` patch."""

    async def fake_verify(_token):
        return TokenClaims(
            uid="uid-1",
            email="alice@example.com",
            email_verified=True,
            name="Alice",
        )

    def fake_get_user(uid):
        return {"user_id": uid, "user_name": "Alice", "user_email": "alice@example.com"}

    monkeypatch.setattr(router_module, "verify_ws_token", fake_verify)
    monkeypatch.setattr(
        "services.user_service.data_access.data_access.get_user_by_userid",
        fake_get_user,
    )


def _push_handshake(ws, level_id: str):
    ws.push({"event": "auth", "data": {"token": "ok"}})
    ws.push({"event": "start", "data": {"levelId": level_id}})


# ---------- Locked levels close 4403 ----------


@pytest.mark.asyncio
async def test_locked_tutorial_closes_4403_and_emits_event(
    monkeypatch, patch_auth_passes
):
    monkeypatch.setattr(
        router_module.data_access,
        "is_level_available_for_user",
        lambda uid, level_id: False,
    )

    ws = FakeWebSocket()
    task = asyncio.create_task(router_module.single_player_websocket_endpoint(ws))
    _push_handshake(ws, "module-1.4")
    await asyncio.wait_for(task, timeout=2)

    assert ws.close_code == 4403, "expected 4403 forbidden close"
    # Find the levelLocked event among the sent payloads (auth_ok is also there).
    locked = next(p for p in ws.sent if p.get("event") == "levelLocked")
    assert locked["data"]["level_id"] == "module-1.4"
    assert "locked" in locked["data"]["error"].lower()


@pytest.mark.asyncio
async def test_locked_puzzle_closes_4403(monkeypatch, patch_auth_passes):
    monkeypatch.setattr(
        router_module.data_access,
        "is_level_available_for_user",
        lambda uid, level_id: False,
    )

    ws = FakeWebSocket()
    task = asyncio.create_task(router_module.single_player_websocket_endpoint(ws))
    _push_handshake(ws, "puzzle-1.1")
    await asyncio.wait_for(task, timeout=2)

    assert ws.close_code == 4403


@pytest.mark.asyncio
async def test_unknown_level_closes_4403(monkeypatch, patch_auth_passes):
    """An obviously-fake level_id from a forged client lands in the same
    rejection path (the gate function returns False for unknown ids)."""
    monkeypatch.setattr(
        router_module.data_access,
        "is_level_available_for_user",
        lambda uid, level_id: False,
    )

    ws = FakeWebSocket()
    task = asyncio.create_task(router_module.single_player_websocket_endpoint(ws))
    _push_handshake(ws, "module-9.99")
    await asyncio.wait_for(task, timeout=2)

    assert ws.close_code == 4403


# ---------- Available levels proceed past the gate ----------


@pytest.mark.asyncio
async def test_available_level_passes_gate(monkeypatch, patch_auth_passes):
    """Sanity check that the gate doesn't accidentally reject the happy
    path. We stub `SinglePlayerGameEngine` because we don't want to spin
    up the real engine (DB-backed) inside a unit test — we just need to
    confirm the handler proceeded past the gate."""
    engine_constructed = {"called": False}

    class _FakeEngine:
        def __init__(self, *args, **kwargs):
            engine_constructed["called"] = True

        def register_emit_handler(self, *_a, **_kw):
            pass

        async def start(self):
            pass

        async def on_disconnect(self):
            pass

    monkeypatch.setattr(
        router_module.data_access,
        "is_level_available_for_user",
        lambda uid, level_id: True,
    )
    monkeypatch.setattr(router_module, "SinglePlayerGameEngine", _FakeEngine)

    ws = FakeWebSocket()
    task = asyncio.create_task(router_module.single_player_websocket_endpoint(ws))
    _push_handshake(ws, "module-1.1")
    # Let the handler get past the gate and into the receive loop.
    await asyncio.sleep(0.05)
    ws.disconnect()
    await asyncio.wait_for(task, timeout=2)

    assert engine_constructed["called"], "engine should be instantiated when gate passes"
    assert ws.close_code != 4403, "happy path must not close with forbidden code"
    # No levelLocked event in the happy path.
    assert not any(p.get("event") == "levelLocked" for p in ws.sent)

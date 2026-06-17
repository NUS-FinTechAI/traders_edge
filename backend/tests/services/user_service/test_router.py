"""Integration tests for user_service.router.

Strategy: mount the user router on a fresh FastAPI app, override the auth
deps to inject canned TokenClaims, and mock the data-access layer. Verifies
the HTTP contract end-to-end including 409 translation.
"""
from typing import Any

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from common.auth import TokenClaims, require_existing_user, require_user
from services.user_service.data_access.data_access import UsernameTakenError
from services.user_service.router.router import router


VALID_CLAIMS = TokenClaims(
    uid="uid-1",
    email="alice@example.com",
    email_verified=True,
    name="Alice From Google",
)


DB_ROW = {
    "user_id": "uid-1",
    "user_name": "Alice",
    "user_email": "alice@example.com",
}


@pytest.fixture
def app_with_existing_user():
    app = FastAPI()
    app.include_router(router)
    app.dependency_overrides[require_user] = lambda: VALID_CLAIMS
    app.dependency_overrides[require_existing_user] = lambda: (VALID_CLAIMS, DB_ROW)
    return app


@pytest.fixture
def app_without_user():
    """Auth succeeds but no DB row exists yet (pre-username-setup state)."""
    app = FastAPI()
    app.include_router(router)
    app.dependency_overrides[require_user] = lambda: VALID_CLAIMS
    return app


# ---------- GET /user/me ----------


def test_get_me_returns_db_row(app_with_existing_user):
    client = TestClient(app_with_existing_user)
    r = client.get("/user/me")
    assert r.status_code == 200
    assert r.json() == DB_ROW


# ---------- POST /user/ ----------


def test_post_user_creates_with_token_uid_and_email(monkeypatch, app_without_user):
    captured: dict[str, Any] = {}

    def _fake_create(user_id, user_name, user_email):
        captured["uid"] = user_id
        captured["name"] = user_name
        captured["email"] = user_email
        return {
            "user_id": user_id,
            "user_name": user_name,
            "user_email": user_email,
        }

    monkeypatch.setattr(
        "services.user_service.service.service.da.create_user", _fake_create
    )

    client = TestClient(app_without_user)
    r = client.post("/user/", json={"user_name": "Alice"})

    assert r.status_code == 200
    body = r.json()
    assert body["user_id"] == "uid-1"
    assert body["user_email"] == "alice@example.com"
    assert body["user_name"] == "Alice"
    # Caller-supplied user_id / email are NOT honored — they come from the token.
    assert captured == {"uid": "uid-1", "name": "Alice", "email": "alice@example.com"}


def test_post_user_returns_409_on_username_collision(monkeypatch, app_without_user):
    def _fake_create(*_args, **_kwargs):
        raise UsernameTakenError()

    monkeypatch.setattr(
        "services.user_service.service.service.da.create_user", _fake_create
    )

    client = TestClient(app_without_user)
    r = client.post("/user/", json={"user_name": "Alice"})
    assert r.status_code == 409
    assert "Username" in r.json()["detail"]


def test_post_user_validates_body(app_without_user):
    client = TestClient(app_without_user)
    # Missing body
    r = client.post("/user/", json={})
    assert r.status_code == 422
    # Empty username
    r = client.post("/user/", json={"user_name": ""})
    assert r.status_code == 422
    # Too long
    r = client.post("/user/", json={"user_name": "x" * 41})
    assert r.status_code == 422


def test_post_user_ignores_body_user_id_and_email(monkeypatch, app_without_user):
    """Even if a client passes user_id/user_email in the body, the server
    derives them from the token. Pydantic strips unknown fields by default."""
    captured = {}

    def _fake_create(user_id, user_name, user_email):
        captured.update({"uid": user_id, "email": user_email})
        return {"user_id": user_id, "user_name": user_name, "user_email": user_email}

    monkeypatch.setattr(
        "services.user_service.service.service.da.create_user", _fake_create
    )

    client = TestClient(app_without_user)
    r = client.post(
        "/user/",
        json={
            "user_name": "Alice",
            "user_id": "attacker-uid",
            "user_email": "attacker@example.com",
        },
    )
    assert r.status_code == 200
    assert captured["uid"] == "uid-1"
    assert captured["email"] == "alice@example.com"


# ---------- PUT /user/me ----------


def test_put_me_updates_username(monkeypatch, app_with_existing_user):
    def _fake_update(user_id, new_name):
        return {**DB_ROW, "user_name": new_name}

    monkeypatch.setattr(
        "services.user_service.service.service.da.update_user_name", _fake_update
    )

    client = TestClient(app_with_existing_user)
    r = client.put("/user/me", json={"user_name": "Alice2"})
    assert r.status_code == 200
    assert r.json()["user_name"] == "Alice2"


def test_put_me_returns_409_on_collision(monkeypatch, app_with_existing_user):
    def _fake_update(*_args, **_kwargs):
        raise UsernameTakenError()

    monkeypatch.setattr(
        "services.user_service.service.service.da.update_user_name", _fake_update
    )

    client = TestClient(app_with_existing_user)
    r = client.put("/user/me", json={"user_name": "Taken"})
    assert r.status_code == 409


# ---------- GET /user/{id}/total_points (public profile view) ----------


def test_get_total_points_is_public(monkeypatch):
    """No auth required — public profile view used by leaderboards."""
    app = FastAPI()
    app.include_router(router)

    monkeypatch.setattr(
        "services.user_service.service.service.da.get_user_by_userid",
        lambda uid: {"user_id": uid},
    )
    monkeypatch.setattr(
        "services.user_service.service.service.da.get_user_total_points",
        lambda uid: 1234,
    )

    client = TestClient(app)
    r = client.get("/user/some-uid/total_points")
    assert r.status_code == 200
    assert r.json() == 1234

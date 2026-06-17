"""Integration tests for the game-service REST routes' auth contract.

Verifies that user-scoped endpoints (`/game/me`, `/game/puzzle/me`,
`/game/quiz/{quiz_id}`, `/game/quiz/{quiz_id}/attempt`) require an
authenticated, onboarded user and derive `user_id` from the token — never
from a path/body/query parameter. Public endpoints
(`/game/leaderboard/{level_id}`, `/game/details/{level_id}`) remain
callable without a token.
"""
from typing import Any

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from common.auth import TokenClaims, require_existing_user
from services.game_service.router.router import router


TOKEN_UID = "firebase-uid-abc"
VALID_CLAIMS = TokenClaims(
    uid=TOKEN_UID,
    email="alice@example.com",
    email_verified=True,
    name="Alice",
)
DB_ROW = {"user_id": TOKEN_UID, "user_name": "Alice", "user_email": "alice@example.com"}


@pytest.fixture
def app_authed():
    app = FastAPI()
    app.include_router(router)
    app.dependency_overrides[require_existing_user] = lambda: (VALID_CLAIMS, DB_ROW)
    return app


@pytest.fixture
def app_unauthed():
    """No dependency override — the real `require_existing_user` runs and 401s
    on the missing header."""
    app = FastAPI()
    app.include_router(router)
    return app


# ---------- GET /game/me ----------


def test_get_me_uses_token_uid_not_path(monkeypatch, app_authed):
    """The handler must call get_game_modules_overview with the token UID,
    regardless of whatever uid (or no uid) appears in the request URL."""
    captured: dict[str, Any] = {}

    def _fake_overview(user_id):
        captured["uid"] = user_id
        return {1: {"levels": []}}

    monkeypatch.setattr(
        "services.game_service.router.router.get_game_modules_overview",
        _fake_overview,
    )

    client = TestClient(app_authed)
    r = client.get("/game/me")
    assert r.status_code == 200
    assert captured["uid"] == TOKEN_UID


def test_get_me_401_without_token(app_unauthed):
    client = TestClient(app_unauthed)
    r = client.get("/game/me")
    assert r.status_code == 401


def test_legacy_user_id_path_is_gone(app_authed):
    """The pre-PR3 shape `/game/user/{user_id}` must no longer route."""
    client = TestClient(app_authed)
    r = client.get("/game/user/some-uid")
    assert r.status_code == 404


# ---------- GET /game/puzzle/me ----------


def test_get_puzzle_me_uses_token_uid(monkeypatch, app_authed):
    captured: dict[str, Any] = {}

    def _fake(user_id):
        captured["uid"] = user_id
        return []

    monkeypatch.setattr(
        "services.game_service.router.router.data_access.get_available_puzzle_levels",
        _fake,
    )

    client = TestClient(app_authed)
    r = client.get("/game/puzzle/me")
    assert r.status_code == 200
    assert captured["uid"] == TOKEN_UID


def test_get_puzzle_me_401_without_token(app_unauthed):
    client = TestClient(app_unauthed)
    r = client.get("/game/puzzle/me")
    assert r.status_code == 401


def test_legacy_puzzle_user_id_path_is_gone(app_authed):
    client = TestClient(app_authed)
    r = client.get("/game/puzzle/some-uid")
    # Either 404 (no route match) or — if router matches because `some-uid`
    # could collide with `me` — the response should not look like a real
    # puzzle list. We assert 404 here because the only valid path is /me.
    assert r.status_code == 404


# ---------- GET /game/quiz/{quiz_id} ----------


def test_get_quiz_uses_token_uid_ignoring_query(monkeypatch, app_authed):
    """Even if a client appends ?user_id=attacker-uid, the handler must use
    the token UID."""
    captured: dict[str, Any] = {}

    def _fake(quiz_id, user_id=None):
        captured["quiz_id"] = quiz_id
        captured["uid"] = user_id
        return {"quiz_id": quiz_id, "questions": [], "attempted": False, "metadata": None}

    monkeypatch.setattr(
        "services.game_service.router.router.get_quiz_details", _fake
    )

    client = TestClient(app_authed)
    r = client.get("/game/quiz/MOD1_PRE?user_id=attacker-uid")
    assert r.status_code == 200
    assert captured["uid"] == TOKEN_UID
    assert captured["quiz_id"] == "MOD1_PRE"


def test_get_quiz_401_without_token(app_unauthed):
    client = TestClient(app_unauthed)
    r = client.get("/game/quiz/MOD1_PRE")
    assert r.status_code == 401


def test_get_quiz_404_on_unknown(monkeypatch, app_authed):
    def _fake(quiz_id, user_id=None):
        raise ValueError(f"Unknown quiz_id: {quiz_id}")

    monkeypatch.setattr(
        "services.game_service.router.router.get_quiz_details", _fake
    )

    client = TestClient(app_authed)
    r = client.get("/game/quiz/NOPE")
    assert r.status_code == 404


def test_get_quiz_403_when_locked(monkeypatch, app_authed):
    def _fake(quiz_id, user_id=None):
        raise PermissionError("Quiz is locked.")

    monkeypatch.setattr(
        "services.game_service.router.router.get_quiz_details", _fake
    )

    client = TestClient(app_authed)
    r = client.get("/game/quiz/MOD2_POST")
    assert r.status_code == 403


# ---------- POST /game/quiz/{quiz_id}/attempt ----------


def test_submit_quiz_uses_token_uid_not_body(monkeypatch, app_authed):
    """Body should be `{answers: {qid: idx}}`. Even if a client also sends
    `user_id`, Pydantic strips it and the handler uses the token UID."""
    captured: dict[str, Any] = {}

    def _fake(user_id, quiz_id, answers):
        captured["uid"] = user_id
        captured["quiz_id"] = quiz_id
        captured["answers"] = answers
        return {"quiz_id": quiz_id, "score": 1, "total_questions": 1,
                "passing_score": 0, "completed": True, "questions": []}

    monkeypatch.setattr(
        "services.game_service.router.router.grade_quiz_attempt", _fake
    )

    client = TestClient(app_authed)
    r = client.post(
        "/game/quiz/MOD1_PRE/attempt",
        json={"answers": {"q1": 0}, "user_id": "attacker-uid"},
    )
    assert r.status_code == 200
    assert captured == {
        "uid": TOKEN_UID,
        "quiz_id": "MOD1_PRE",
        "answers": {"q1": 0},
    }


def test_submit_quiz_401_without_token(app_unauthed):
    client = TestClient(app_unauthed)
    r = client.post("/game/quiz/MOD1_PRE/attempt", json={"answers": {"q1": 0}})
    assert r.status_code == 401


def test_submit_quiz_422_when_answers_missing(app_authed):
    client = TestClient(app_authed)
    r = client.post("/game/quiz/MOD1_PRE/attempt", json={})
    assert r.status_code == 422


def test_submit_quiz_403_when_locked(monkeypatch, app_authed):
    def _fake(*_args, **_kwargs):
        raise PermissionError("Quiz is locked.")

    monkeypatch.setattr(
        "services.game_service.router.router.grade_quiz_attempt", _fake
    )

    client = TestClient(app_authed)
    r = client.post("/game/quiz/MOD2_POST/attempt", json={"answers": {"q1": 0}})
    assert r.status_code == 403


# ---------- Public endpoints (no token required) ----------


def test_leaderboard_remains_public(monkeypatch, app_unauthed):
    monkeypatch.setattr(
        "services.game_service.router.router.data_access.get_leaderboard",
        lambda level_id: [{"user_id": "u", "user_name": "U", "best_points": 100}],
    )
    client = TestClient(app_unauthed)
    r = client.get("/game/leaderboard/module-1.1")
    assert r.status_code == 200
    assert r.json()[0]["user_name"] == "U"


def test_level_details_remains_public(monkeypatch, app_unauthed):
    monkeypatch.setattr(
        "services.game_service.router.router.data_access.get_tutorial_level",
        lambda lid: {"level_id": lid, "title": "x"},
    )
    client = TestClient(app_unauthed)
    r = client.get("/game/details/module-1.1")
    assert r.status_code == 200

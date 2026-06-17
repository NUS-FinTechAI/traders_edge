"""Unit tests for backend/common/auth.py.

Strategy: stand up a tiny FastAPI app with two protected routes (one using
``require_user``, one using ``require_existing_user``) and exercise the deps
via a TestClient. ``firebase_admin.auth.verify_id_token`` is patched at the
import site, and the users data-access lookup is patched for the
``require_existing_user`` branch.
"""
from unittest.mock import patch

import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient
from firebase_admin import auth as fb_auth

from common.auth import TokenClaims, require_existing_user, require_user


@pytest.fixture
def app():
    app = FastAPI()

    @app.get("/whoami")
    async def whoami(claims: TokenClaims = Depends(require_user)):
        return claims.model_dump()

    @app.get("/me")
    async def me(ctx=Depends(require_existing_user)):
        claims, user = ctx
        return {"uid": claims.uid, "row": user}

    return app


@pytest.fixture
def client(app):
    return TestClient(app)


VALID_DECODED = {
    "uid": "firebase-uid-123",
    "email": "test@example.com",
    "email_verified": True,
    "name": "Test User",
}


# ---------- require_user ----------


def test_missing_header_returns_401(client):
    r = client.get("/whoami")
    assert r.status_code == 401
    assert "Missing" in r.json()["detail"]


def test_valid_token_returns_claims(client):
    with patch("common.auth.fb_auth.verify_id_token", return_value=VALID_DECODED):
        r = client.get("/whoami", headers={"Authorization": "Bearer good-token"})
    assert r.status_code == 200
    body = r.json()
    assert body["uid"] == "firebase-uid-123"
    assert body["email"] == "test@example.com"
    assert body["email_verified"] is True
    assert body["name"] == "Test User"


def test_expired_token_returns_401(client):
    with patch(
        "common.auth.fb_auth.verify_id_token",
        side_effect=fb_auth.ExpiredIdTokenError("expired", cause=Exception()),
    ):
        r = client.get("/whoami", headers={"Authorization": "Bearer expired"})
    assert r.status_code == 401
    assert "expired" in r.json()["detail"].lower()


def test_invalid_token_returns_401(client):
    with patch(
        "common.auth.fb_auth.verify_id_token",
        side_effect=fb_auth.InvalidIdTokenError("bad"),
    ):
        r = client.get("/whoami", headers={"Authorization": "Bearer garbage"})
    assert r.status_code == 401
    assert "Invalid" in r.json()["detail"]


def test_revoked_token_returns_401(client):
    with patch(
        "common.auth.fb_auth.verify_id_token",
        side_effect=fb_auth.RevokedIdTokenError("revoked"),
    ):
        r = client.get("/whoami", headers={"Authorization": "Bearer revoked"})
    assert r.status_code == 401


def test_value_error_returns_401(client):
    # firebase_admin sometimes raises plain ValueError on malformed tokens.
    with patch(
        "common.auth.fb_auth.verify_id_token", side_effect=ValueError("malformed")
    ):
        r = client.get("/whoami", headers={"Authorization": "Bearer malformed"})
    assert r.status_code == 401


def test_unverified_email_returns_401(client):
    decoded = {**VALID_DECODED, "email_verified": False}
    with patch("common.auth.fb_auth.verify_id_token", return_value=decoded):
        r = client.get("/whoami", headers={"Authorization": "Bearer x"})
    assert r.status_code == 401
    assert "verified" in r.json()["detail"].lower()


def test_missing_email_returns_401(client):
    decoded = {**VALID_DECODED, "email": None}
    with patch("common.auth.fb_auth.verify_id_token", return_value=decoded):
        r = client.get("/whoami", headers={"Authorization": "Bearer x"})
    assert r.status_code == 401


# ---------- require_existing_user ----------


def test_require_existing_user_returns_404_when_not_onboarded(client):
    with patch(
        "common.auth.fb_auth.verify_id_token", return_value=VALID_DECODED
    ), patch("services.user_service.data_access.data_access.get_user_by_userid", return_value=None):
        r = client.get("/me", headers={"Authorization": "Bearer ok"})
    assert r.status_code == 404
    assert "POST /user" in r.json()["detail"]


def test_require_existing_user_returns_row_when_present(client):
    db_row = {
        "user_id": "firebase-uid-123",
        "user_name": "Tester",
        "user_email": "test@example.com",
    }
    with patch(
        "common.auth.fb_auth.verify_id_token", return_value=VALID_DECODED
    ), patch("services.user_service.data_access.data_access.get_user_by_userid", return_value=db_row):
        r = client.get("/me", headers={"Authorization": "Bearer ok"})
    assert r.status_code == 200
    body = r.json()
    assert body["uid"] == "firebase-uid-123"
    assert body["row"] == db_row

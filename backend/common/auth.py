"""FastAPI dependencies for Firebase ID-token authentication.

REST deps:

- ``require_user``: parses the ``Authorization: Bearer <token>`` header, verifies
  the token via ``firebase_admin.auth.verify_id_token`` (run in a worker thread so
  we do not block the event loop on Google's pubkey fetch), and returns a
  :class:`TokenClaims`. Raises 401 on missing/invalid/expired token, or if
  ``email_verified`` is false.

- ``require_existing_user``: chains ``require_user``, then looks up the matching
  row in ``users``. Returns ``(claims, user_row)``. Raises 404 if the Firebase
  user has no app-side ``users`` row yet (i.e. they need to hit ``POST /user/``
  with a username first).

WebSocket helper:

- ``verify_ws_token``: same token verification logic, but raises
  :class:`WsAuthError` instead of HTTPException so the WS handler can ``close``
  the socket with code 4401. WS endpoints use a first-message handshake — token
  travels in the message body, never in the URL (which would otherwise leak into
  access logs).
"""

import asyncio
from typing import Any, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth as fb_auth
from pydantic import BaseModel


class TokenClaims(BaseModel):
    uid: str
    email: str
    email_verified: bool
    name: Optional[str] = None


bearer_scheme = HTTPBearer(auto_error=False)


async def require_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> TokenClaims:
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        decoded = await asyncio.to_thread(
            fb_auth.verify_id_token, credentials.credentials
        )
    except fb_auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": 'Bearer error="invalid_token"'},
        )
    except (fb_auth.InvalidIdTokenError, fb_auth.RevokedIdTokenError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": 'Bearer error="invalid_token"'},
        )

    email = decoded.get("email")
    if not email or not decoded.get("email_verified", False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email not verified by identity provider",
        )

    return TokenClaims(
        uid=decoded["uid"],
        email=email,
        email_verified=True,
        name=decoded.get("name"),
    )


async def require_existing_user(
    claims: TokenClaims = Depends(require_user),
) -> tuple[TokenClaims, dict[str, Any]]:
    # Lazy import to avoid a circular load with services/__init__.py.
    from services.user_service.data_access import data_access as user_da

    user = user_da.get_user_by_userid(claims.uid)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not onboarded; call POST /user/ to set a username.",
        )
    return claims, user


class WsAuthError(Exception):
    """Signals a WebSocket auth handshake failure. The caller is expected to
    close the socket with code 4401."""


async def verify_ws_token(token: str) -> TokenClaims:
    """Verify a Firebase ID token from a WS auth handshake message. Same
    logic as :func:`require_user` but exception-based — the WS handler closes
    the socket on failure rather than returning an HTTP status."""
    if not token:
        raise WsAuthError("missing token")
    try:
        decoded = await asyncio.to_thread(fb_auth.verify_id_token, token)
    except fb_auth.ExpiredIdTokenError as e:
        raise WsAuthError("token expired") from e
    except (fb_auth.InvalidIdTokenError, fb_auth.RevokedIdTokenError, ValueError) as e:
        raise WsAuthError("invalid token") from e

    email = decoded.get("email")
    if not email or not decoded.get("email_verified", False):
        raise WsAuthError("email not verified")

    return TokenClaims(
        uid=decoded["uid"],
        email=email,
        email_verified=True,
        name=decoded.get("name"),
    )

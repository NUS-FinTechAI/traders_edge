"""Firebase Admin SDK initialization.

Two supported configurations, picked from env vars:

1. Real project (production / staging / personal dev):
   - GOOGLE_APPLICATION_CREDENTIALS: filesystem path to a service-account JSON, OR
   - FIREBASE_CREDENTIALS_JSON: the service-account JSON inline (single line).
   - FIREBASE_PROJECT_ID: optional override; otherwise read from the credentials.

2. Emulator (local automated tests / dev without a real project):
   - FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 (the firebase-admin SDK respects
     this env var automatically; verify_id_token will hit the emulator instead
     of Google's pubkey endpoint).
   - FIREBASE_PROJECT_ID required (any string the emulator was started with).
   - No credentials JSON needed.
"""
import json
import os

import firebase_admin
from firebase_admin import credentials


def init() -> None:
    """Initialize the default firebase_admin app. Idempotent."""
    if firebase_admin._apps:
        return

    project_id = os.getenv("FIREBASE_PROJECT_ID")
    inline_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
    cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    using_emulator = bool(os.getenv("FIREBASE_AUTH_EMULATOR_HOST"))

    if inline_json:
        cred = credentials.Certificate(json.loads(inline_json))
        firebase_admin.initialize_app(cred, {"projectId": project_id} if project_id else None)
        return

    if cred_path:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred, {"projectId": project_id} if project_id else None)
        return

    if using_emulator:
        if not project_id:
            raise RuntimeError(
                "FIREBASE_AUTH_EMULATOR_HOST set but FIREBASE_PROJECT_ID missing; "
                "the emulator needs a project ID to verify tokens against."
            )
        firebase_admin.initialize_app(options={"projectId": project_id})
        return

    raise RuntimeError(
        "Firebase Admin SDK not configured. Set one of:\n"
        "  - FIREBASE_CREDENTIALS_JSON (inline service-account JSON), or\n"
        "  - GOOGLE_APPLICATION_CREDENTIALS (path to service-account JSON), or\n"
        "  - FIREBASE_AUTH_EMULATOR_HOST + FIREBASE_PROJECT_ID (emulator mode)."
    )

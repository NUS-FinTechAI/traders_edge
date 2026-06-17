"""Unit tests for user_service.data_access.

Strategy: mock the cursor returned by ``get_db_cursor`` to simulate Postgres
semantics. The race-condition scenarios (R1: concurrent first-signup, R2:
concurrent username pick) are verified at the behavior level — what happens
when ``ON CONFLICT DO NOTHING`` returns no row, and what happens when the
``users_user_name_lower_idx`` unique index raises ``UniqueViolation``.
"""
from contextlib import contextmanager
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest
from psycopg2 import errors as pg_errors

from services.user_service.data_access import data_access as da
from services.user_service.data_access.data_access import (
    USERNAME_INDEX_NAME,
    UsernameTakenError,
)


class _FakeUniqueViolation(pg_errors.UniqueViolation):
    """Test double whose ``diag.constraint_name`` is controllable.

    The real ``psycopg2.Error.diag`` is read-only at the C level, so we
    side-step by overriding ``__init__`` (skipping the C parent's lock-down)
    and exposing ``diag`` as a property."""

    def __init__(self, constraint_name: str):
        Exception.__init__(self, "duplicate key")
        self._fake_diag = SimpleNamespace(constraint_name=constraint_name)

    @property
    def diag(self):  # type: ignore[override]
        return self._fake_diag


def _make_cursor(rows_per_execute, descriptions_per_execute):
    """Build a mock cursor that returns the given row + description sequence
    across successive (execute, fetchone) calls."""
    cursor = MagicMock()
    rows = iter(rows_per_execute)
    descs = iter(descriptions_per_execute)

    def _on_execute(*_args, **_kwargs):
        cursor._next_row = next(rows)
        desc = next(descs)
        cursor.description = (
            [MagicMock(**{"__getitem__": lambda self, i, name=name: name}) for name in desc]
            if desc
            else None
        )
        # Easier description simulation: directly set as a list of (name,) tuples.
        cursor.description = [(name,) for name in desc] if desc else None

    cursor.execute.side_effect = _on_execute
    cursor.fetchone.side_effect = lambda: cursor._next_row
    return cursor


@contextmanager
def _patched_db_cursor(cursor):
    @contextmanager
    def fake_cursor_cm(commit=False):
        yield cursor

    with patch(
        "services.user_service.data_access.data_access.get_db_cursor",
        fake_cursor_cm,
    ):
        yield


# ---------- create_user happy path ----------


def test_create_user_inserts_and_enrolls_module_1_1():
    cursor = _make_cursor(
        rows_per_execute=[
            ("uid-1", "Alice", "alice@example.com", "2026-01-01"),  # INSERT users
            None,  # INSERT user_level_progress
        ],
        descriptions_per_execute=[
            ["user_id", "user_name", "user_email", "created_at"],
            [],
        ],
    )
    with _patched_db_cursor(cursor):
        user = da.create_user("uid-1", "Alice", "alice@example.com")

    assert user["user_id"] == "uid-1"
    assert user["user_name"] == "Alice"
    # Two execute calls: users INSERT + user_level_progress INSERT.
    assert cursor.execute.call_count == 2
    enroll_sql = cursor.execute.call_args_list[1].args[0]
    assert "user_level_progress" in enroll_sql
    assert "module-1.1" in enroll_sql
    assert "ON CONFLICT" in enroll_sql


# ---------- R1: UID race (two tabs, same UID) ----------


def test_create_user_handles_uid_race_falls_back_to_select():
    """ON CONFLICT (user_id) DO NOTHING RETURNING returns no row; we then
    SELECT the row that the other tab inserted."""
    cursor = _make_cursor(
        rows_per_execute=[
            None,  # INSERT users — conflict, no row returned
            ("uid-1", "Alice", "alice@example.com", "2026-01-01"),  # SELECT existing
            None,  # INSERT user_level_progress
        ],
        descriptions_per_execute=[
            ["user_id", "user_name", "user_email", "created_at"],
            ["user_id", "user_name", "user_email", "created_at"],
            [],
        ],
    )
    with _patched_db_cursor(cursor):
        user = da.create_user("uid-1", "Alice (later tab)", "alice@example.com")

    # Returned row reflects the *existing* DB row, not the request body.
    assert user["user_name"] == "Alice"
    # Verify the second execute is a SELECT, third is the enrollment INSERT.
    assert cursor.execute.call_count == 3
    assert "SELECT" in cursor.execute.call_args_list[1].args[0].upper()


# ---------- R2: username collision raises UsernameTakenError ----------


def test_create_user_translates_username_unique_violation():
    cursor = MagicMock()
    cursor.execute.side_effect = lambda *a, **kw: (_ for _ in ()).throw(
        _FakeUniqueViolation(USERNAME_INDEX_NAME)
    )

    with _patched_db_cursor(cursor), pytest.raises(UsernameTakenError):
        da.create_user("uid-1", "Alice", "alice@example.com")


def test_create_user_reraises_other_unique_violations():
    """A non-username UniqueViolation (e.g. on user_email) must NOT be
    translated to UsernameTakenError — it indicates a different bug."""
    cursor = MagicMock()
    cursor.execute.side_effect = lambda *a, **kw: (_ for _ in ()).throw(
        _FakeUniqueViolation("users_user_email_key")
    )

    with _patched_db_cursor(cursor), pytest.raises(pg_errors.UniqueViolation):
        da.create_user("uid-1", "Alice", "alice@example.com")


# ---------- update_user_name ----------


def test_update_user_name_returns_updated_row():
    cursor = _make_cursor(
        rows_per_execute=[
            ("uid-1", "NewName", "alice@example.com", "2026-01-01"),
        ],
        descriptions_per_execute=[
            ["user_id", "user_name", "user_email", "created_at"],
        ],
    )
    with _patched_db_cursor(cursor):
        row = da.update_user_name("uid-1", "NewName")
    assert row["user_name"] == "NewName"


def test_update_user_name_returns_none_when_user_missing():
    cursor = _make_cursor(
        rows_per_execute=[None],
        descriptions_per_execute=[["user_id"]],
    )
    with _patched_db_cursor(cursor):
        row = da.update_user_name("uid-nope", "X")
    assert row is None


def test_update_user_name_translates_unique_violation():
    cursor = MagicMock()
    cursor.execute.side_effect = lambda *a, **kw: (_ for _ in ()).throw(
        _FakeUniqueViolation(USERNAME_INDEX_NAME)
    )

    with _patched_db_cursor(cursor), pytest.raises(UsernameTakenError):
        da.update_user_name("uid-1", "Taken")

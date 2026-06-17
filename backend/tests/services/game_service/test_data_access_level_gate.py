"""Unit tests for ``is_level_available_for_user``.

The function is a 1-row SELECT with two LEFT JOINs — mock the cursor to
simulate the joined row set Postgres would produce in each scenario, then
assert the bool. Same pattern as ``test_puzzle_unlock.py``.
"""
from contextlib import contextmanager
from unittest.mock import MagicMock, patch

from services.game_service.data_access.data_access import (
    is_level_available_for_user,
)


@contextmanager
def _mock_cursor_returning(row):
    cursor = MagicMock()
    cursor.fetchone.return_value = row

    @contextmanager
    def fake_cm(commit=False):
        yield cursor

    with patch(
        "services.game_service.data_access.data_access.get_db_cursor", fake_cm
    ):
        yield cursor


# ---------- Tutorial ----------


def test_tutorial_level_with_progress_row_is_available():
    """Postgres returns (level_type='tutorial', has_progress_row=True, *).
    The user has been auto-enrolled by completing the prior level."""
    with _mock_cursor_returning(("tutorial", True, False)):
        assert is_level_available_for_user("uid-1", "module-1.4") is True


def test_tutorial_level_without_progress_row_is_locked():
    """The url-manipulation case: fresh user (no row for module-1.4)
    types `/adventureMode/1/4` — should be denied."""
    with _mock_cursor_returning(("tutorial", False, False)):
        assert is_level_available_for_user("uid-1", "module-1.4") is False


def test_tutorial_ignores_puzzle_gate_state():
    """Tutorial availability MUST NOT depend on the puzzle gate, even if
    the user happens to have completed module-1.4. (Defense in depth: a
    future refactor that confuses the columns shouldn't accidentally
    grant tutorial access.)"""
    with _mock_cursor_returning(("tutorial", False, True)):
        # has_progress_row=False overrides puzzle_unlocked=True.
        assert is_level_available_for_user("uid-1", "module-1.4") is False


# ---------- Puzzle ----------


def test_puzzle_level_locked_when_gate_not_completed():
    """Fresh user (no module-1.4 completion) tries `puzzle-1.1` — locked."""
    with _mock_cursor_returning(("puzzle", False, False)):
        assert is_level_available_for_user("uid-1", "puzzle-1.1") is False


def test_puzzle_level_unlocked_when_gate_completed():
    """Once module-1.4 is completed, every puzzle is reachable (PR 5
    semantics: gate unlocks the mode globally, not per-puzzle)."""
    with _mock_cursor_returning(("puzzle", False, True)):
        assert is_level_available_for_user("uid-1", "puzzle-1.7") is True


def test_puzzle_ignores_per_puzzle_progress_row():
    """Per PR 5: a stale puzzle progress row (e.g. legacy data) must NOT
    unlock puzzle mode if the user hasn't passed module-1.4."""
    with _mock_cursor_returning(("puzzle", True, False)):
        assert is_level_available_for_user("uid-1", "puzzle-1.1") is False


# ---------- Unknown / defensive ----------


def test_unknown_level_id_returns_false():
    """A forged client passing a typo / non-existent level must NOT
    trigger engine instantiation. SELECT returns no row."""
    with _mock_cursor_returning(None):
        assert is_level_available_for_user("uid-1", "module-9.99") is False


def test_unknown_level_type_returns_false():
    """Schema change paranoia: if the levels table grows a new
    `level_type` value, treat it as locked by default until the gate
    function is updated to handle it."""
    with _mock_cursor_returning(("endless", True, True)):
        assert is_level_available_for_user("uid-1", "endless-1") is False

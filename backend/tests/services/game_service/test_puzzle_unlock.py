"""Tests for the puzzle-mode unlock rule.

Product rule (set in the design doc): puzzle levels unlock when the user has
``completed = true`` on ``module-1.4``. Until then, all puzzle levels surface
as ``available = false``. The check is enforced server-side in
``get_available_puzzle_levels`` via a LEFT JOIN to the gate row.

These tests mock the DB cursor to simulate Postgres returning the joined row
set for each scenario, then assert the Python-shaped output dict.
"""
from contextlib import contextmanager
from unittest.mock import MagicMock, patch

import pytest

from services.game_service.data_access import data_access as da
from services.game_service.data_access.data_access import (
    PUZZLE_UNLOCK_GATE_LEVEL_ID,
    get_available_puzzle_levels,
)


@contextmanager
def _mock_cursor_returning(rows, columns):
    cursor = MagicMock()
    cursor.description = [(c,) for c in columns]
    cursor.fetchall.return_value = rows

    @contextmanager
    def fake_cm(commit=False):
        yield cursor

    with patch(
        "services.game_service.data_access.data_access.get_db_cursor", fake_cm
    ):
        yield cursor


PUZZLE_COLUMNS = [
    "level_id",
    "title",
    "level_order",
    "best_points",
    "attempted",
    "puzzle_unlocked",
]


def test_gate_level_id_is_module_1_4():
    """If someone renames the gate constant we want the tests to flag it —
    the rule is the documented user-facing behavior."""
    assert PUZZLE_UNLOCK_GATE_LEVEL_ID == "module-1.4"


def test_no_module_1_4_row_locks_all_puzzles():
    """A fresh user has no `user_level_progress` row for module-1.4. The
    LEFT JOIN returns NULL for gate.completed → COALESCE produces false → all
    puzzles surface as available=false."""
    rows = [
        ("puzzle-1.1", "First Puzzle", 1, None, None, False),
        ("puzzle-1.2", "Second Puzzle", 2, None, None, False),
    ]
    with _mock_cursor_returning(rows, PUZZLE_COLUMNS):
        levels = get_available_puzzle_levels("uid-fresh-user")

    assert len(levels) == 2
    assert all(not lvl["available"] for lvl in levels)
    # Compatibility keys preserved.
    assert levels[0]["puzzle_id"] == "puzzle-1.1"


def test_module_1_4_attempted_but_not_completed_locks_all_puzzles():
    """User has started module-1.4 but never passed it. Postgres returns
    `gate.completed = false`; the Python layer must respect that, not
    confuse `attempted=true` with completion."""
    rows = [
        ("puzzle-1.1", "First Puzzle", 1, None, None, False),
        ("puzzle-1.2", "Second Puzzle", 2, None, None, False),
    ]
    with _mock_cursor_returning(rows, PUZZLE_COLUMNS):
        levels = get_available_puzzle_levels("uid-in-progress")

    assert all(not lvl["available"] for lvl in levels)


def test_module_1_4_completed_unlocks_all_puzzles():
    """Once the gate passes, every puzzle level surfaces as available even
    if the user has never opened them before — this matches the product rule
    ('puzzle mode unlocks fully when the user finishes the last level in
    module 1')."""
    rows = [
        ("puzzle-1.1", "First Puzzle", 1, None, None, True),
        ("puzzle-1.2", "Second Puzzle", 2, None, None, True),
        ("puzzle-1.3", "Third Puzzle", 3, None, None, True),
    ]
    with _mock_cursor_returning(rows, PUZZLE_COLUMNS):
        levels = get_available_puzzle_levels("uid-grad")

    assert len(levels) == 3
    assert all(lvl["available"] for lvl in levels)


def test_gate_trumps_pre_existing_puzzle_row():
    """If a user somehow has a puzzle_level_progress row (e.g. legacy data,
    admin seed) but hasn't passed module-1.4, the gate still locks the
    puzzle. The pre-PR5 behavior was the inverse — guard against regression."""
    rows = [
        # attempted=True on this puzzle, but gate is false.
        ("puzzle-1.1", "First Puzzle", 1, 0, False, False),
    ]
    with _mock_cursor_returning(rows, PUZZLE_COLUMNS):
        levels = get_available_puzzle_levels("uid-with-orphan-row")

    assert len(levels) == 1
    assert levels[0]["available"] is False
    assert levels[0]["attempted"] is False  # falsy/None coerced


def test_sql_uses_module_1_4_as_gate_target(monkeypatch):
    """Smoke check that the SQL still binds the gate constant — guards
    against a refactor accidentally hardcoding a different level id."""
    captured = {}
    cursor = MagicMock()
    cursor.description = [(c,) for c in PUZZLE_COLUMNS]
    cursor.fetchall.return_value = []

    def _on_execute(query, params):
        captured["query"] = query
        captured["params"] = params

    cursor.execute.side_effect = _on_execute

    @contextmanager
    def fake_cm(commit=False):
        yield cursor

    with patch(
        "services.game_service.data_access.data_access.get_db_cursor", fake_cm
    ):
        get_available_puzzle_levels("any-uid")

    assert "gate.level_id" in captured["query"]
    assert PUZZLE_UNLOCK_GATE_LEVEL_ID in captured["params"]
    assert captured["params"] == ("any-uid", PUZZLE_UNLOCK_GATE_LEVEL_ID, "any-uid")

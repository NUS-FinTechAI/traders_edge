from contextlib import contextmanager

from services.game_service.data_access import data_access


class _ScriptedCursor:
    def __init__(self, script: list[dict[str, object]]):
        self._script = list(script)
        self._current: dict[str, object] = {}

    def execute(self, *_args, **_kwargs):
        if not self._script:
            raise AssertionError("Unexpected execute call")
        self._current = self._script.pop(0)

    def fetchall(self):
        return self._current.get("fetchall", [])


def _scripted_cursor_ctx(script: list[dict[str, object]]):
    @contextmanager
    def _ctx():
        yield _ScriptedCursor(script)

    return _ctx()


def test_build_level_macro_data_returns_display_and_effect_schedule(monkeypatch):
    script = [
        {
            "fetchall": [
                (1, "interest_rate", "Policy Rate", 5.25, 5.0, 25, "Restrictive", 1),
                (2, "inflation", "CPI YoY", 3.8, 3.2, 60, "Surprise hot", 2),
            ]
        },
        {
            "fetchall": [
                ("AAPL", -0.01, 10, 12, "Hot CPI Repricing", "Rates higher", "inflation")
            ]
        },
    ]

    monkeypatch.setattr(
        data_access,
        "get_db_cursor",
        lambda: _scripted_cursor_ctx(script),
    )

    factors, effects = data_access._build_level_macro_data("module-4.2", tick_mode="auto")

    assert factors == [
        {
            "factor_key": "interest_rate",
            "title": "Policy Rate",
            "current_value": 5.25,
            "previous_value": 5.0,
            "last_change_bps": 25,
            "market_stance_note": "Restrictive",
            "display_order": 1,
        },
        {
            "factor_key": "inflation",
            "title": "CPI YoY",
            "current_value": 3.8,
            "previous_value": 3.2,
            "last_change_bps": 60,
            "market_stance_note": "Surprise hot",
            "display_order": 2,
        },
    ]
    assert effects == {
        10: {
            "AAPL": [(-0.01, 3, "Hot CPI Repricing", "Rates higher", "inflation")]
        }
    }


def test_build_level_macro_data_skips_effect_query_for_manual_levels(monkeypatch):
    script = [
        {
            "fetchall": [
                (1, "interest_rate", "Policy Rate", 4.75, 5.0, -25, "Easing bias", 1),
            ]
        }
    ]

    monkeypatch.setattr(
        data_access,
        "get_db_cursor",
        lambda: _scripted_cursor_ctx(script),
    )

    factors, effects = data_access._build_level_macro_data("module-1.1", tick_mode="manual")

    assert len(factors) == 1
    assert factors[0]["factor_key"] == "interest_rate"
    assert effects == {}


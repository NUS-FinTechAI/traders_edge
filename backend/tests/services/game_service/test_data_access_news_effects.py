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

    def fetchone(self):
        return self._current.get("fetchone", None)


def _scripted_cursor_ctx(script: list[dict[str, object]]):
    @contextmanager
    def _ctx():
        yield _ScriptedCursor(script)

    return _ctx()


def test_build_level_news_supports_multi_phase_effects_from_single_event(monkeypatch):
    script = [
        {
            "fetchall": [
                (
                    101,
                    "AAPL",
                    "Policy Update",
                    "Central bank guidance shifts.",
                    5,
                )
            ]
        },
        {
            "fetchall": [
                (101, "AAPL", -0.02, 5, 7),
                (101, "AAPL", 0.01, 8, 10),
                (101, "AAPL", -0.015, 11, 13),
            ]
        },
    ]

    monkeypatch.setattr(
        data_access,
        "get_db_cursor",
        lambda: _scripted_cursor_ctx(script),
    )

    news, news_effects = data_access._build_level_news("module-3.2", tick_mode="auto")

    assert news[5]["AAPL"][0][:2] == ("Policy Update", "Central bank guidance shifts.")
    assert news_effects[5]["AAPL"] == [(-0.02, 3)]
    assert news_effects[8]["AAPL"] == [(0.01, 3)]
    assert news_effects[11]["AAPL"] == [(-0.015, 3)]


def test_build_level_news_uses_effect_rows_only(monkeypatch):
    script = [
        {
            "fetchall": [
                (202, "NVDA", "Event", "Payload", 2),
            ]
        },
        {"fetchall": []},
    ]

    monkeypatch.setattr(
        data_access,
        "get_db_cursor",
        lambda: _scripted_cursor_ctx(script),
    )

    news, news_effects = data_access._build_level_news("module-3.3", tick_mode="auto")

    assert news[2]["NVDA"][0][:2] == ("Event", "Payload")
    assert news_effects == {}

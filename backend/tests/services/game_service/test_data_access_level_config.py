from contextlib import contextmanager

from services.game_service.data_access import data_access


class _ScriptedCursor:
    def __init__(self, script: list[dict[str, object]]):
        self._script = script
        self._current: dict[str, object] = {}

    def execute(self, *_args, **_kwargs):
        if not self._script:
            raise AssertionError("Unexpected execute call")
        self._current = self._script.pop(0)

    def fetchone(self):
        return self._current.get("fetchone", None)

    def fetchall(self):
        return self._current.get("fetchall", [])


def _scripted_cursor_ctx(script: list[dict[str, object]]):
    @contextmanager
    def _ctx():
        yield _ScriptedCursor(script)

    return _ctx()


def test_get_tutorial_level_includes_seeded_starting_positions(monkeypatch):
    script: list[dict[str, object]] = [
        {
            "fetchone": (
                "module-4.1",
                "tutorial",
                "Interest Rates and Risk Appetite",
                4,
                1,
                "Context",
                "auto",
                True,
                None,
                112,
                0,
                2,
                56000.0,
                0.13,
                "all_of",
            )
        },
        {
            "fetchall": [
                (
                    10,
                    "AAPL",
                    "orderbook",
                    None,
                    None,
                    None,
                    198.0,
                    14,
                    10.0,
                    True,
                    4101,
                    220,
                    198.0,
                ),
                (
                    11,
                    "MSFT",
                    "orderbook",
                    None,
                    None,
                    None,
                    421.0,
                    10,
                    15.0,
                    True,
                    4103,
                    0,
                    None,
                ),
            ]
        },
        {
            "fetchall": [
                (
                    "AAPL",
                    "Apple Inc.",
                    "Consumer hardware and services platform with recurring ecosystem revenue and premium margins.",
                    "technology",
                    30.1,
                    48.0,
                    1.7,
                    1.2,
                    0.018,
                    ["core", "quality"],
                ),
                (
                    "MSFT",
                    "Microsoft Corporation",
                    "Enterprise software and cloud platform leader with diversified recurring cash-flow streams.",
                    "technology",
                    34.2,
                    39.1,
                    0.4,
                    1.0,
                    0.014,
                    ["core"],
                ),
            ]
        },
        {"fetchall": []},
        {"fetchall": []},
        {"fetchall": []},
        {"fetchall": []},
        {"fetchall": []},
        {
            "fetchall": [
                (
                    "profit_350",
                    "passing",
                    "pnl_at_end",
                    "Finish with $350 profit",
                    "Desc",
                    125,
                    {"min_pnl": 350.0},
                ),
                (
                    "max_six_orders",
                    "passing",
                    "max_total_orders",
                    "Use at most 6 orders",
                    "Desc",
                    75,
                    {"max_total_orders": 6},
                ),
            ]
        },
        {"fetchall": []},
        {"fetchall": []},
    ]

    monkeypatch.setattr(
        data_access,
        "get_db_cursor",
        lambda *args, **kwargs: _scripted_cursor_ctx(script),
    )

    payload = data_access.get_tutorial_level("module-4.1")

    assert payload is not None
    assert payload["starting_tickers"] == ["AAPL", "MSFT"]
    assert payload["starting_positions"] == {
        "AAPL": {"qty": 220, "cost_basis": 198.0}
    }
    assert payload["passing_criteria"]["missions"][0]["type"] == "pnl_at_end"
    assert payload["passing_criteria"]["missions"][0]["mission_params"] == {"min_pnl": 350.0}
    assert payload["ticker_configs"][0]["initial_fair_price"] == 198.0
    assert payload["ticker_metadata"]["AAPL"]["sector_key"] == "technology"
    assert payload["ticker_metadata"]["AAPL"]["company_description"] != ""
    assert payload["reference_portfolios"] == []


def test_get_tutorial_level_loads_reference_portfolios(monkeypatch):
    script: list[dict[str, object]] = [
        {
            "fetchone": (
                "module-5.2",
                "tutorial",
                "Fundamentals",
                5,
                2,
                "Context",
                "auto",
                True,
                None,
                100,
                0,
                2,
                80000.0,
                0.10,
                "all_of",
            )
        },
        {
            "fetchall": [
                (
                    1,
                    "MSFT",
                    "orderbook",
                    None,
                    None,
                    None,
                    420.0,
                    10,
                    10.0,
                    True,
                    1,
                    0,
                    None,
                ),
                (
                    2,
                    "PG",
                    "orderbook",
                    None,
                    None,
                    None,
                    160.0,
                    9,
                    8.0,
                    True,
                    2,
                    0,
                    None,
                ),
            ]
        },
        {
            "fetchall": [
                ("MSFT", "Microsoft Corporation", "Enterprise software and cloud platform leader with diversified recurring cash-flow streams.", "technology", None, None, None, 0.98, 0.014, ["quality"]),
                ("PG", "Procter & Gamble", "Consumer staples leader with defensive demand profile and strong brand pricing power.", "consumer_defensive", None, None, None, 0.54, 0.009, ["defensive"]),
            ]
        },
        {
            "fetchall": [
                (
                    "core_equal_weight",
                    "benchmark",
                    "Core Equal Weight Benchmark",
                    "",
                    1,
                    "MSFT",
                    0.5,
                    1,
                ),
                (
                    "core_equal_weight",
                    "benchmark",
                    "Core Equal Weight Benchmark",
                    "",
                    1,
                    "PG",
                    0.5,
                    2,
                ),
            ]
        },
        {"fetchall": []},
        {"fetchall": []},
        {"fetchall": []},
        {"fetchall": []},
        {
            "fetchall": [
                (
                    "beat_benchmark",
                    "passing",
                    "min_excess_return_vs_benchmark",
                    "Beat benchmark",
                    "Desc",
                    100,
                    {"benchmark_key": "core_equal_weight", "min_excess_return": 0.01},
                )
            ]
        },
        {"fetchall": []},
        {"fetchall": []},
    ]

    monkeypatch.setattr(
        data_access,
        "get_db_cursor",
        lambda *args, **kwargs: _scripted_cursor_ctx(script),
    )

    payload = data_access.get_tutorial_level("module-5.2")

    assert payload is not None
    assert payload["reference_portfolios"][0]["reference_key"] == "core_equal_weight"
    assert payload["reference_portfolios"][0]["components"][0]["ticker"] == "MSFT"
    assert payload["passing_criteria"]["missions"][0]["mission_params"]["benchmark_key"] == "core_equal_weight"

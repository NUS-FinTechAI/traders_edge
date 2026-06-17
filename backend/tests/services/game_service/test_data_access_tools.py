from contextlib import contextmanager

from services.game_service.data_access import data_access


class _FakeCursor:
    def __init__(self, rows):
        self._rows = rows

    def execute(self, *_args, **_kwargs):
        return None

    def fetchall(self):
        return self._rows


def _fake_cursor_ctx(rows):
    @contextmanager
    def _ctx():
        yield _FakeCursor(rows)

    return _ctx()


def test_build_available_tools_defaults_indicator_keys(monkeypatch):
    rows = [
        ("news", True),
        ("market_order", True),
        ("moving_average", True),
        ("custom_future_tool", True),
    ]
    monkeypatch.setattr(
        data_access,
        "get_db_cursor",
        lambda: _fake_cursor_ctx(rows),
    )

    tools = data_access._build_available_tools("module-2.4")

    assert tools["news"] is True
    assert tools["market_order"] is True
    assert tools["moving_average"] is True
    assert tools["short_selling"] is False
    assert tools["limit_order"] is False
    assert tools["stop_order"] is False
    assert tools["stop_limit_order"] is False
    assert tools["bid_ask_spread"] is False
    assert tools["exponential_moving_average"] is False
    assert tools["interest_rate_panel"] is False
    assert tools["inflation_panel"] is False
    assert tools["drawdown_panel"] is False
    assert tools["portfolio_allocation_panel"] is False
    assert tools["sector_exposure_panel"] is False
    assert tools["fundamentals_panel"] is False
    assert tools["correlation_panel"] is False
    assert tools["beta_volatility_panel"] is False
    assert tools["benchmark_panel"] is False
    assert tools["rebalancing_prompt"] is False
    assert tools["custom_future_tool"] is True


def test_build_available_tools_includes_short_selling_when_seeded(monkeypatch):
    rows = [("short_selling", True)]
    monkeypatch.setattr(
        data_access,
        "get_db_cursor",
        lambda: _fake_cursor_ctx(rows),
    )

    tools = data_access._build_available_tools("module-3.5")

    assert tools["short_selling"] is True


def test_build_unlocks_preserves_short_selling_tutorial_id(monkeypatch):
    rows = [
        ("short_selling", "Short Selling Unlocked", "Desc", "short-selling-basics"),
        ("limit_order", "Limit Orders Unlocked", "Desc", "limit-order-basics"),
    ]
    monkeypatch.setattr(
        data_access,
        "get_db_cursor",
        lambda: _fake_cursor_ctx(rows),
    )

    unlocks = data_access._build_unlocks("module-3.4")

    assert unlocks[0]["feature"] == "short_selling"
    assert unlocks[0]["tool_tutorial_id"] == "short-selling-basics"
    assert unlocks[1]["feature"] == "limit_order"
    assert unlocks[1]["tool_tutorial_id"] == "limit-order-basics"

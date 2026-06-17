from datetime import date, timedelta

import pandas as pd
import pytest
from common import Order
from market_simulators.yfinance.yfinance_simulator import YFinanceSimulator
from utils.constants import Direction, OrderType, OrderAction


class DummyTicker:
    def __init__(self, df: pd.DataFrame):
        self._df = df

    def history(self, *args, **kwargs):
        return self._df


def _make_df(start: date, days: int = 3) -> pd.DataFrame:
    idx = pd.date_range(start=start, periods=days, freq="B")
    return pd.DataFrame(
        {
            "Open": [100.0, 101.0, 102.0],
            "High": [110.0, 111.0, 112.0],
            "Low": [90.0, 91.0, 92.0],
            "Close": [105.0, 106.0, 107.0],
        },
        index=idx,
    )


def _make_simulator(monkeypatch, start: date, end: date) -> YFinanceSimulator:
    df = _make_df(start)
    monkeypatch.setattr(
        "market_simulators.yfinance.yfinance_simulator.yf.Ticker",
        lambda *_args, **_kwargs: DummyTicker(df),
    )
    return YFinanceSimulator("AAPL", start=start, end=end, interval="1d")


def test_invalid_interval(monkeypatch):
    start = date.today() - timedelta(days=1)
    end = date.today()
    df = _make_df(start)
    monkeypatch.setattr(
        "market_simulators.yfinance.yfinance_simulator.yf.Ticker",
        lambda *_args, **_kwargs: DummyTicker(df),
    )
    with pytest.raises(ValueError):
        YFinanceSimulator("AAPL", start=start, end=end, interval="2d")


def test_start_after_end(monkeypatch):
    start = date.today()
    end = date.today() - timedelta(days=1)
    df = _make_df(end)
    monkeypatch.setattr(
        "market_simulators.yfinance.yfinance_simulator.yf.Ticker",
        lambda *_args, **_kwargs: DummyTicker(df),
    )
    with pytest.raises(ValueError):
        YFinanceSimulator("AAPL", start=start, end=end, interval="1d")


@pytest.mark.asyncio
async def test_register_market_order_fills_at_close(monkeypatch):
    start = date.today() - timedelta(days=3)
    end = date.today() - timedelta(days=1)
    sim = _make_simulator(monkeypatch, start, end)

    # move to first tick so close is available
    sim.next_tick()

    order = Order(
        order_id="m1",
        user_id="u1",
        action=OrderAction.BUY,
        direction=Direction.BUY,
        order_type=OrderType.MARKET,
        ticker="AAPL",
        qty=10,
        price=None,
    )
    sim.register_order(order)

    assert order.qty_left == 0
    assert (await sim.fill_queue.get()) == {
        "order_id": "m1",
        "price": 105.0,
        "qty": 10,
        "qty_left": 0,
    }


@pytest.mark.asyncio
async def test_limit_buy_fills_when_low_crosses(monkeypatch):
    start = date.today() - timedelta(days=3)
    end = date.today() - timedelta(days=1)
    sim = _make_simulator(monkeypatch, start, end)

    order = Order(
        order_id="l1",
        user_id="u1",
        action=OrderAction.BUY,
        direction=Direction.BUY,
        order_type=OrderType.LIMIT,
        ticker="AAPL",
        qty=10,
        price=100.0,
    )
    sim.register_order(order)

    sim.next_tick()

    assert order.qty_left == 0
    assert await sim.fill_queue.get() == {
        "order_id": "l1",
        "price": 100.0,
        "qty": 10,
        "qty_left": 0,
    }


@pytest.mark.asyncio
async def test_limit_sell_fills_when_high_crosses(monkeypatch):
    start = date.today() - timedelta(days=3)
    end = date.today() - timedelta(days=1)
    sim = _make_simulator(monkeypatch, start, end)

    order = Order(
        order_id="s1",
        user_id="u1",
        action=OrderAction.SELL,
        direction=Direction.SELL,
        order_type=OrderType.LIMIT,
        ticker="AAPL",
        qty=5,
        price=108.0,
    )
    sim.register_order(order)

    sim.next_tick()

    assert order.qty_left == 0
    assert await sim.fill_queue.get() == {
        "order_id": "s1",
        "price": 108.0,
        "qty": 5,
        "qty_left": 0,
    }


def test_limit_order_stays_pending(monkeypatch):
    start = date.today() - timedelta(days=3)
    end = date.today() - timedelta(days=1)
    sim = _make_simulator(monkeypatch, start, end)

    order = Order(
        order_id="p1",
        user_id="u1",
        action=OrderAction.BUY,
        direction=Direction.BUY,
        order_type=OrderType.LIMIT,
        ticker="AAPL",
        qty=10,
        price=80.0,
    )
    sim.register_order(order)

    sim.next_tick()

    assert order.qty_left == 10


def test_cancel_order(monkeypatch):
    start = date.today() - timedelta(days=3)
    end = date.today() - timedelta(days=1)
    sim = _make_simulator(monkeypatch, start, end)

    order = Order(
        order_id="c1",
        user_id="u1",
        action=OrderAction.BUY,
        direction=Direction.BUY,
        order_type=OrderType.LIMIT,
        ticker="AAPL",
        qty=10,
        price=100.0,
    )
    sim.register_order(order)

    canceled = sim.cancel_order("c1")
    assert canceled.order_id == "c1"

    assert sim.cancel_order("c1") == None


def test_best_bid_ask_close(monkeypatch):
    start = date.today() - timedelta(days=3)
    end = date.today() - timedelta(days=1)
    sim = _make_simulator(monkeypatch, start, end)

    sim.next_tick()

    assert sim.best_bid() == 105.0
    assert sim.best_ask() == 105.0


def test_get_market_ochl_before_tick_raises(monkeypatch):
    start = date.today() - timedelta(days=3)
    end = date.today() - timedelta(days=1)
    sim = _make_simulator(monkeypatch, start, end)

    with pytest.raises(Exception):
        sim.best_bid()


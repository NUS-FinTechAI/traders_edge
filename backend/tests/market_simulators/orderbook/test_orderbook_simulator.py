import asyncio

from common import Order
from market_simulators.orderbook.orderbook_simulator import OrderbookSimulator
from utils.constants import Direction, OrderAction, OrderType


def test_next_tick_no_npc_returns_zero_ohlc_without_trades():
    simulator = OrderbookSimulator(
        fill_queue=asyncio.Queue(),
        ticker="AAPL",
        has_npc_orders=False,
    )

    tick_snapshot = simulator.next_tick([])

    assert tick_snapshot["open"] == 0.0
    assert tick_snapshot["high"] == 0.0
    assert tick_snapshot["low"] == 0.0
    assert tick_snapshot["close"] == 0.0
    assert tick_snapshot["volume"] == 0


def test_next_tick_no_npc_uses_real_trade_ohlc_when_trades_happen():
    simulator = OrderbookSimulator(
        fill_queue=asyncio.Queue(),
        ticker="AAPL",
        has_npc_orders=False,
    )

    simulator.register_order(
        Order(
            order_id="buy_limit_1",
            user_id="u1",
            action=OrderAction.BUY,
            direction=Direction.BUY,
            order_type=OrderType.LIMIT,
            ticker="AAPL",
            qty=10,
            price=100.0,
        )
    )
    simulator.register_order(
        Order(
            order_id="sell_limit_1",
            user_id="u2",
            action=OrderAction.SELL,
            direction=Direction.SELL,
            order_type=OrderType.LIMIT,
            ticker="AAPL",
            qty=10,
            price=100.0,
        )
    )

    tick_snapshot = simulator.next_tick([])

    assert tick_snapshot["open"] == 100.0
    assert tick_snapshot["high"] == 100.0
    assert tick_snapshot["low"] == 100.0
    assert tick_snapshot["close"] == 100.0
    assert tick_snapshot["volume"] == 20

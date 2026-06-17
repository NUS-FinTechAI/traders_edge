import pytest
from common import Order
from market_simulators.orderbook.orderbook import OrderLadder
from utils.constants import Direction, OrderType, OrderAction


class TestOrderLadder:
    """Tests for OrderLadder class"""

    def test_add_limit_order_to_bids(self):
        """Test adding a limit buy order to bid ladder"""
        ladder = OrderLadder(Direction.BUY)
        order = Order(
            order_id="1",
            user_id="user1",
            action=OrderAction.BUY,
            direction=Direction.BUY,
            order_type=OrderType.LIMIT,
            ticker="AAPL",
            qty=100,
            price=150.0,
        )
        ladder.add_order(order)
        assert not ladder.is_empty()
        assert ladder.volume == 100
        assert ladder.best_price() == 150.0

    def test_add_limit_order_to_asks(self):
        """Test adding a limit sell order to ask ladder"""
        ladder = OrderLadder(Direction.SELL)
        order = Order(
            order_id="1",
            user_id="user1",
            action=OrderAction.SELL,
            direction=Direction.SELL,
            order_type=OrderType.LIMIT,
            ticker="AAPL",
            qty=100,
            price=155.0,
        )
        ladder.add_order(order)
        assert not ladder.is_empty()
        assert ladder.volume == 100
        assert ladder.best_price() == 155.0

    def test_best_price_multiple_levels(self):
        """Test best price with multiple price levels"""
        ladder = OrderLadder(Direction.BUY)

        # Add orders at different bid prices
        order1 = Order(
            order_id="1",
            user_id="user1",
            action=OrderAction.BUY,
            direction=Direction.BUY,
            order_type=OrderType.LIMIT,
            ticker="AAPL",
            qty=100,
            price=150.0,
        )
        order2 = Order(
            order_id="2",
            user_id="user1",
            action=OrderAction.BUY,
            direction=Direction.BUY,
            order_type=OrderType.LIMIT,
            ticker="AAPL",
            qty=50,
            price=152.0,
        )

        ladder.add_order(order1)
        ladder.add_order(order2)

        # Best bid should be highest price
        assert ladder.best_price() == 152.0

    def test_delete_order(self):
        """Test deleting an order from ladder"""
        ladder = OrderLadder(Direction.BUY)
        order = Order(
            order_id="1",
            user_id="user1",
            action=OrderAction.BUY,
            direction=Direction.BUY,
            order_type=OrderType.LIMIT,
            ticker="AAPL",
            qty=100,
            price=150.0,
        )
        ladder.add_order(order)
        assert ladder.volume == 100

        ladder.del_order("1")
        assert ladder.is_empty()
        assert ladder.volume == 0

    def test_invalid_order_type(self):
        """Test that market orders cannot be added to ladder"""
        ladder = OrderLadder(Direction.BUY)
        order = Order(
            order_id="1",
            user_id="user1",
            action=OrderAction.BUY,
            direction=Direction.BUY,
            order_type=OrderType.MARKET,
            ticker="AAPL",
            qty=100,
            price=None,
        )
        with pytest.raises(Exception):
            ladder.add_order(order)


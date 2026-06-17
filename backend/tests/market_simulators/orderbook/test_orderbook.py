import pytest
from common import Order
from market_simulators.orderbook.orderbook import OrderBook
from utils.constants import Direction, OrderType, OrderAction


class TestOrderBook:
    """Tests for OrderBook class"""

    def test_limit_order_matching(self):
        """Test matching between buy and sell limit orders"""
        fills = []

        def on_fill(order_id: str, price: float, qty: int, qty_left: int):
            fills.append((order_id, price, qty))

        book = OrderBook(on_fill=on_fill)

        # Add sell order
        sell_order = Order(
            order_id="sell1",
            user_id="user1",
            action=OrderAction.SELL,
            direction=Direction.SELL,
            order_type=OrderType.LIMIT,
            ticker="AAPL",
            qty=100,
            price=150.0,
        )
        book.register_order(sell_order)

        # Add matching buy order
        buy_order = Order(
            order_id="buy1",
            user_id="user2",
            action=OrderAction.BUY,
            direction=Direction.BUY,
            order_type=OrderType.LIMIT,
            ticker="AAPL",
            qty=100,
            price=150.0,
        )
        book.register_order(buy_order)

        # Should have filled both orders
        assert len(fills) == 2
        assert ("sell1", 150.0, 100) in fills and ("buy1", 150.0, 100) in fills
        assert buy_order.qty_left == 0
        assert sell_order.qty_left == 0

    def test_partial_fill(self):
        """Test partial order matching"""
        fills = []

        def on_fill(order_id: str, price: float, qty: int, qty_left: int):
            fills.append((order_id, price, qty))

        book = OrderBook(on_fill=on_fill)

        # Add large sell order
        sell_order = Order(
            order_id="sell1",
            user_id="user1",
            action=OrderAction.SELL,
            direction=Direction.SELL,
            order_type=OrderType.LIMIT,
            ticker="AAPL",
            qty=200,
            price=150.0,
        )
        book.register_order(sell_order)

        # Add smaller buy order
        buy_order = Order(
            order_id="buy1",
            user_id="user2",
            action=OrderAction.BUY,
            direction=Direction.BUY,
            order_type=OrderType.LIMIT,
            ticker="AAPL",
            qty=100,
            price=150.0,
        )
        book.register_order(buy_order)

        # Buy should be fully filled, sell partially filled
        assert len(fills) == 2
        assert ("sell1", 150.0, 100) in fills and ("buy1", 150.0, 100) in fills
        assert book.asks.volume == 100
        assert buy_order.qty_left == 0
        assert sell_order.qty_left == 100

    def test_market_order_multiple_levels(self):
        """Test market order execution"""
        fills = []

        def on_fill(order_id: str, price: float, qty: int, qty_left: int):
            fills.append((order_id, price, qty))

        book = OrderBook(on_fill=on_fill)

        # Add sell limit order
        sell_order1 = Order(
            order_id="sell1",
            user_id="user1",
            action=OrderAction.SELL,
            direction=Direction.SELL,
            order_type=OrderType.LIMIT,
            ticker="AAPL",
            qty=50,
            price=150.0,
        )
        book.register_order(sell_order1)

        sell_order2 = Order(
            order_id="sell2",
            user_id="user1",
            action=OrderAction.SELL,
            direction=Direction.SELL,
            order_type=OrderType.LIMIT,
            ticker="AAPL",
            qty=50,
            price=125.0,
        )
        book.register_order(sell_order2)

        sell_order3 = Order(
            order_id="sell3",
            user_id="user1",
            action=OrderAction.SELL,
            direction=Direction.SELL,
            order_type=OrderType.LIMIT,
            ticker="AAPL",
            qty=50,
            price=100.0,
        )
        book.register_order(sell_order3)

        # Add market buy order
        buy_order = Order(
            order_id="buy1",
            user_id="user2",
            action=OrderAction.BUY,
            direction=Direction.BUY,
            order_type=OrderType.MARKET,
            ticker="AAPL",
            qty=150,
            price=None,
        )
        book.register_order(buy_order)

        # Both should be filled
        assert len(fills) == 6
        assert ("sell1", 150.0, 50) in fills and ("buy1", 150.0, 50) in fills
        assert ("sell2", 125.0, 50) in fills and ("buy1", 125.0, 50) in fills
        assert ("sell3", 100.0, 50) in fills and ("buy1", 100.0, 50) in fills
        assert buy_order.qty_left == 0
        assert sell_order1.qty_left == 0
        assert sell_order2.qty_left == 0
        assert sell_order3.qty_left == 0

    def test_market_order(self):
        """Test market order execution"""
        fills = []

        def on_fill(order_id: str, price: float, qty: int, qty_left: int):
            fills.append((order_id, price, qty))

        book = OrderBook(on_fill=on_fill)

        # Add sell limit order
        sell_order = Order(
            order_id="sell1",
            user_id="user1",
            action=OrderAction.SELL,
            direction=Direction.SELL,
            order_type=OrderType.LIMIT,
            ticker="AAPL",
            qty=100,
            price=150.0,
        )
        book.register_order(sell_order)

        # Add market buy order
        buy_order = Order(
            order_id="buy1",
            user_id="user2",
            action=OrderAction.BUY,
            direction=Direction.BUY,
            order_type=OrderType.MARKET,
            ticker="AAPL",
            qty=100,
            price=None,
        )
        book.register_order(buy_order)

        # Both should be filled
        assert len(fills) == 2
        assert ("sell1", 150.0, 100) in fills and ("buy1", 150.0, 100) in fills
        assert buy_order.qty_left == 0
        assert sell_order.qty_left == 0

    def test_stop_order_activation(self):
        """Test stop order activation on price trigger"""
        fills = []

        def on_fill(order_id: str, price: float, qty: int, qty_left: int):
            fills.append((order_id, price, qty))

        book = OrderBook(on_fill=on_fill)

        # Add stop sell order (sell if price drops to 145)
        higher_stop = Order(
            order_id="higherStop",
            user_id="user1",
            action=OrderAction.SELL,
            direction=Direction.SELL,
            order_type=OrderType.STOP,
            ticker="AAPL",
            qty=50,
            price=145.0,
        )
        book.register_order(higher_stop)

        # Add stop sell order (sell if price drops to 140)
        lower_stop = Order(
            order_id="lowerStop",
            user_id="user1",
            action=OrderAction.SELL,
            direction=Direction.SELL,
            order_type=OrderType.STOP,
            ticker="AAPL",
            qty=100,
            price=140.0,
        )
        book.register_order(lower_stop)

        # Add sell limit order at lower price
        sell_order = Order(
            order_id="sell1",
            user_id="user2",
            action=OrderAction.SELL,
            direction=Direction.SELL,
            order_type=OrderType.LIMIT,
            ticker="AAPL",
            qty=100,
            price=140.0,
        )
        book.register_order(sell_order)

        # Add Buy limit order at higher price
        buy_order = Order(
            order_id="buy1",
            user_id="user2",
            action=OrderAction.BUY,
            direction=Direction.BUY,
            order_type=OrderType.LIMIT,
            ticker="AAPL",
            qty=50,
            price=69.0,
        )
        book.register_order(buy_order)

        # Add Buy limit order at higher price
        buy_order = Order(
            order_id="buy2",
            user_id="user2",
            action=OrderAction.BUY,
            direction=Direction.BUY,
            order_type=OrderType.LIMIT,
            ticker="AAPL",
            qty=50,
            price=67.0,
        )
        book.register_order(buy_order)

        # Add buy order that will trigger stop
        buy_market_order = Order(
            order_id="buy3",
            user_id="user3",
            action=OrderAction.BUY,
            direction=Direction.BUY,
            order_type=OrderType.MARKET,
            ticker="AAPL",
            qty=100,
            price=None,
        )
        book.register_order(buy_market_order)

        # Stop order should be activated as market order
        assert len(fills) == 6
        # market buy that will trigger stop orders
        assert ("sell1", 140.0, 100) in fills
        assert ("buy3", 140.0, 100) in fills

        # the higher stop should be triggered first
        assert ("buy1", 69.0, 50) in fills
        assert ("higherStop", 69.0, 50) in fills

        # the lower stop should be triggered next
        assert ("buy2", 67.0, 50) in fills
        assert ("lowerStop", 67.0, 50) in fills

        # Lower stop should be partially filled
        assert higher_stop.qty_left == 0
        assert lower_stop.qty_left == 50

    def test_stop_limit_order_triggers_then_posts_limit(self):
        """Stop-limit should trigger on stop price, then rest as a limit order."""
        fills = []

        def on_fill(order_id: str, price: float, qty: int, qty_left: int):
            fills.append((order_id, price, qty))

        book = OrderBook(on_fill=on_fill)

        stop_limit_buy = Order(
            order_id="stopLimitBuy",
            user_id="user1",
            action=OrderAction.BUY,
            direction=Direction.BUY,
            order_type=OrderType.STOP_LIMIT,
            ticker="AAPL",
            qty=50,
            price=99.0,  # limit price after trigger
            stop_price=100.0,  # trigger price
        )
        book.register_order(stop_limit_buy)

        resting_sell = Order(
            order_id="sell101",
            user_id="user2",
            action=OrderAction.SELL,
            direction=Direction.SELL,
            order_type=OrderType.LIMIT,
            ticker="AAPL",
            qty=100,
            price=101.0,
        )
        book.register_order(resting_sell)

        # Trade at 101 triggers the stop-limit buy (stop=100).
        trigger_trade = Order(
            order_id="triggerBuy",
            user_id="user3",
            action=OrderAction.BUY,
            direction=Direction.BUY,
            order_type=OrderType.MARKET,
            ticker="AAPL",
            qty=100,
            price=None,
        )
        book.register_order(trigger_trade)

        # After triggering, stop-limit becomes a resting bid at 99.
        assert stop_limit_buy.qty_left == 50
        assert book.get_best_bid() == 99.0

        # Now provide matching liquidity at 99 to fill it.
        sell_at_limit = Order(
            order_id="sell99",
            user_id="user4",
            action=OrderAction.SELL,
            direction=Direction.SELL,
            order_type=OrderType.LIMIT,
            ticker="AAPL",
            qty=50,
            price=99.0,
        )
        book.register_order(sell_at_limit)

        assert stop_limit_buy.qty_left == 0
        assert ("stopLimitBuy", 99.0, 50) in fills

    def test_cancel_order(self):
        """Test order cancellation"""
        book = OrderBook()

        # Add limit order
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
        book.register_order(order)
        assert book.bids.volume == 100

        # Cancel order
        book.cancel_order("1")
        assert book.bids.is_empty()

    def test_get_best_bid(self):
        """Test getting best bid price"""
        book = OrderBook()

        # Add multiple bid orders
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
            user_id="user2",
            action=OrderAction.BUY,
            direction=Direction.BUY,
            order_type=OrderType.LIMIT,
            ticker="AAPL",
            qty=100,
            price=152.0,
        )

        book.register_order(order1)
        book.register_order(order2)

        # Best bid should be highest price
        assert book.get_best_bid() == 152.0

        # With price filter
        assert book.get_best_bid(price=151.0) == 150.0

    def test_get_best_ask(self):
        """Test getting best ask price"""
        book = OrderBook()

        # Add multiple ask orders
        order1 = Order(
            order_id="1",
            user_id="user1",
            action=OrderAction.SELL,
            direction=Direction.SELL,
            order_type=OrderType.LIMIT,
            ticker="AAPL",
            qty=100,
            price=150.0,
        )
        order2 = Order(
            order_id="2",
            user_id="user2",
            action=OrderAction.SELL,
            direction=Direction.SELL,
            order_type=OrderType.LIMIT,
            ticker="AAPL",
            qty=100,
            price=152.0,
        )

        book.register_order(order1)
        book.register_order(order2)

        # Best ask should be lowest price
        assert book.get_best_ask() == 150.0

        # With price filter
        assert book.get_best_ask(price=151.0) == 152.0


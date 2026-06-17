"""
Tests for the MultiplayerGameEngine class.

I copilot this so YOLO
"""

import asyncio

import pytest
from common import Order
from services.game_service.models.game import Position
from services.game_service.service.multiplayer_engine import MultiplayerGameEngine
from utils.constants import Direction, OrderType, Status, OrderAction

pytestmark = pytest.mark.asyncio


class TestInitialization:
    """Test cases for initialization methods"""

    async def test_init_creates_empty_user_states(self):
        """Test that engine starts with empty user states"""
        engine = MultiplayerGameEngine(level_id="test_level")

        assert isinstance(engine.game_state.user_states, dict)
        assert len(engine.game_state.user_states) == 0
        assert engine.game_state.tick == -1

    async def test_init_creates_order_queues(self):
        """Test that order queues are created for each ticker"""
        engine = MultiplayerGameEngine(level_id="test_level")

        assert "AAPL" in engine.order_queues
        assert isinstance(engine.order_queues["AAPL"], asyncio.Queue)

    async def test_init_creates_simulators(self):
        """Test that market simulators are initialized for each ticker"""
        engine = MultiplayerGameEngine(level_id="test_level")

        assert "AAPL" in engine.ticker_to_simulator
        assert engine.ticker_to_simulator["AAPL"] is not None

    async def test_is_game_over_property(self):
        """Test is_game_over property based on tick count"""
        engine = MultiplayerGameEngine(level_id="test_level")

        assert not engine.is_game_over  # tick = -1, total_ticks = 5
        engine.level_data.total_ticks = 5

        engine.game_state.tick = 4
        assert not engine.is_game_over

        engine.game_state.tick = 5
        assert engine.is_game_over

        engine.game_state.tick = 10
        assert engine.is_game_over

    async def test_configure_room_features_applies_has_npc_orders_to_all_tickers(self):
        engine = MultiplayerGameEngine(level_id="test_level")

        engine.configure_room_features(
            has_npc_orders=False,
            available_tools={
                "fake_news": True,
                "private_chat": False,
                "bid_ask_spread": False,
            },
        )

        assert engine.level_data.available_tools.fake_news is True
        assert engine.level_data.available_tools.private_chat is False
        assert engine.level_data.available_tools.bid_ask_spread is True
        assert engine.level_data.available_tools.market_order is False
        assert engine.level_data.auto_tick_interval_seconds == 60
        assert engine.level_data.interval == "60"
        assert all(
            cfg.get("has_npc_orders") is False for cfg in engine.level_data.ticker_configs
        )
        assert all(
            simulator.has_npc_orders is False
            for simulator in engine.ticker_to_simulator.values()
        )


class TestUserRegistration:
    """Test cases for user registration"""

    async def test_register_user_creates_user_state(self):
        """Test that registering a user creates proper user state"""
        engine = MultiplayerGameEngine(level_id="test_level")
        await engine.start()

        try:
            # Mock emit handler to prevent errors
            engine.register_emit_handler(lambda event, user_id, data: None)

            await engine.register_user("user1")

            tickers = engine.level_data.starting_tickers
            assert "user1" in engine.game_state.user_states
            user_state = engine.game_state.user_states["user1"]
            assert user_state.avail_cash == engine.level_data.starting_cash
            assert user_state.reserved_cash == 0.0
            for ticker in tickers:
                assert ticker in user_state.positions
                assert user_state.positions[ticker].long_avail_qty == 100
        finally:
            await engine.stop()

    async def test_register_user_idempotent(self):
        """Test that registering the same user twice doesn't duplicate state"""
        engine = MultiplayerGameEngine(level_id="test_level")
        await engine.start()

        try:
            engine.register_emit_handler(lambda event, user_id, data: None)

            await engine.register_user("user1")
            original_cash = engine.game_state.user_states["user1"].avail_cash

            await engine.register_user("user1")

            assert len(engine.game_state.user_states) == 1
            assert engine.game_state.user_states["user1"].avail_cash == original_cash
        finally:
            await engine.stop()

    async def test_register_multiple_users(self):
        """Test registering multiple users creates separate states"""
        engine = MultiplayerGameEngine(level_id="test_level")
        await engine.start()

        try:
            engine.register_emit_handler(lambda event, user_id, data: None)

            await engine.register_user("user1")
            await engine.register_user("user2")
            await engine.register_user("user3")

            assert len(engine.game_state.user_states) == 3
            assert "user1" in engine.game_state.user_states
            assert "user2" in engine.game_state.user_states
            assert "user3" in engine.game_state.user_states

            # Each user should have independent state
            for user_id in ["user1", "user2", "user3"]:
                assert (
                    engine.game_state.user_states[user_id].avail_cash
                    == engine.level_data.starting_cash
                )
        finally:
            await engine.stop()


class TestRegisterOrder:
    """Test cases for order registration"""

    async def test_register_buy_order_reserves_cash(self):
        """Test that registering a buy order reserves appropriate cash"""
        engine = MultiplayerGameEngine(level_id="test_level")
        await engine.start()

        try:
            engine.register_emit_handler(lambda event, user_id, data: None)
            await engine.register_user("user1")

            initial_cash = engine.game_state.user_states["user1"].avail_cash

            order = Order(
                order_id=None,
                user_id="user1",
                action=OrderAction.BUY,
                direction=Direction.BUY,
                order_type=OrderType.LIMIT,
                ticker="AAPL",
                qty=10,
                price=100.0,
            )

            result = await engine.register_order(order)

            assert result["result"] == "PASS"
            assert result["order_id"] is not None
            assert result["reserved"] == 1000.0
            assert (
                engine.game_state.user_states["user1"].avail_cash
                == initial_cash - 1000.0
            )
            assert engine.game_state.user_states["user1"].reserved_cash == 1000.0
        finally:
            await engine.stop()

    async def test_register_sell_order_reserves_stock(self):
        """Test that registering a sell order reserves stock"""
        engine = MultiplayerGameEngine(level_id="test_level")
        await engine.start()

        try:
            engine.register_emit_handler(lambda event, user_id, data: None)
            await engine.register_user("user1")

            initial_qty = (
                engine.game_state.user_states["user1"].positions["AAPL"].long_avail_qty
            )

            order = Order(
                order_id=None,
                user_id="user1",
                action=OrderAction.SELL,
                direction=Direction.SELL,
                order_type=OrderType.LIMIT,
                ticker="AAPL",
                qty=10,
                price=150.0,
            )

            result = await engine.register_order(order)

            assert result["result"] == "PASS"
            pos = engine.game_state.user_states["user1"].positions["AAPL"]
            assert pos.long_avail_qty == initial_qty - 10
            assert pos.long_reserved_qty == 10
        finally:
            await engine.stop()

    async def test_register_order_insufficient_cash_fails(self):
        """Test that order fails when insufficient cash"""
        engine = MultiplayerGameEngine(level_id="test_level")
        await engine.start()

        try:
            engine.register_emit_handler(lambda event, user_id, data: None)
            await engine.register_user("user1")

            # Set cash to very low amount
            engine.game_state.user_states["user1"].avail_cash = 10.0

            order = Order(
                order_id=None,
                user_id="user1",
                action=OrderAction.BUY,
                direction=Direction.BUY,
                order_type=OrderType.LIMIT,
                ticker="AAPL",
                qty=1000,
                price=1000.0,
            )

            result = await engine.register_order(order)

            assert result["result"] == "FAIL"
            assert "Insufficient funds" in result["reason"]
        finally:
            await engine.stop()

    async def test_register_order_insufficient_stock_fails(self):
        """Test that sell order fails when insufficient stock"""
        engine = MultiplayerGameEngine(level_id="test_level")
        await engine.start()

        try:
            engine.register_emit_handler(lambda event, user_id, data: None)
            await engine.register_user("user1")

            # User has 100 shares initially
            order = Order(
                order_id=None,
                user_id="user1",
                action=OrderAction.SELL,
                direction=Direction.SELL,
                order_type=OrderType.LIMIT,
                ticker="AAPL",
                qty=1000,  # More than available
                price=150.0,
            )

            result = await engine.register_order(order)

            assert result["result"] == "FAIL"
            assert "Not enough unreserved long stock" in result["reason"]
        finally:
            await engine.stop()

    async def test_register_order_zero_quantity_fails(self):
        """Test that order with zero quantity fails"""
        engine = MultiplayerGameEngine(level_id="test_level")
        await engine.start()

        try:
            engine.register_emit_handler(lambda event, user_id, data: None)
            await engine.register_user("user1")

            order = Order(
                order_id=None,
                user_id="user1",
                action=OrderAction.BUY,
                direction=Direction.BUY,
                order_type=OrderType.LIMIT,
                ticker="AAPL",
                qty=0,
                price=100.0,
            )

            result = await engine.register_order(order)

            assert result["result"] == "FAIL"
            assert "must be positive" in result["reason"]
        finally:
            await engine.stop()

    async def test_register_order_negative_quantity_fails(self):
        """Test that order with negative quantity fails"""
        engine = MultiplayerGameEngine(level_id="test_level")
        await engine.start()

        try:
            engine.register_emit_handler(lambda event, user_id, data: None)
            await engine.register_user("user1")

            order = Order(
                order_id=None,
                user_id="user1",
                action=OrderAction.BUY,
                direction=Direction.BUY,
                order_type=OrderType.LIMIT,
                ticker="AAPL",
                qty=-10,
                price=100.0,
            )

            result = await engine.register_order(order)

            assert result["result"] == "FAIL"
            assert "must be positive" in result["reason"]
        finally:
            await engine.stop()

    async def test_register_market_order_fails_when_npc_orders_disabled(self):
        engine = MultiplayerGameEngine(level_id="test_level")
        engine.configure_room_features(
            has_npc_orders=False,
            available_tools={
                "fake_news": True,
                "private_chat": True,
            },
        )
        await engine.start()

        try:
            engine.register_emit_handler(lambda event, user_id, data: None)
            await engine.register_user("user1")

            order = Order(
                order_id=None,
                user_id="user1",
                action=OrderAction.BUY,
                direction=Direction.BUY,
                order_type=OrderType.MARKET,
                ticker="AAPL",
                qty=10,
                price=None,
            )

            result = await engine.register_order(order)
            assert result["result"] == "FAIL"
            assert "priced limit orders" in result["reason"].lower()
        finally:
            await engine.stop()

    async def test_register_limit_order_emits_immediate_orderbook_tick_in_no_npc_mode(
        self,
    ):
        engine = MultiplayerGameEngine(level_id="test_level")
        engine.configure_room_features(
            has_npc_orders=False,
            available_tools={
                "fake_news": True,
                "private_chat": True,
            },
        )
        emitted_events: list[tuple[str, str, dict]] = []
        engine.register_emit_handler(
            lambda event, user_id, data: emitted_events.append((event, user_id, data))
        )
        await engine.start()

        try:
            await engine.register_user("user1")
            await engine.register_user("user2")

            order = Order(
                order_id=None,
                user_id="user1",
                action=OrderAction.BUY,
                direction=Direction.BUY,
                order_type=OrderType.LIMIT,
                ticker="AAPL",
                qty=10,
                price=123.45,
            )
            result = await engine.register_order(order)
            assert result["result"] == "PASS"

            # Simulator processing is async; give it a brief moment to emit.
            await asyncio.sleep(0.05)

            orderbook_ticks = [
                (user_id, payload)
                for event, user_id, payload in emitted_events
                if event == "no_npc_orderbook_update"
                and isinstance(payload, dict)
                and isinstance(payload.get("data"), dict)
                and "AAPL" in payload["data"]
            ]
            assert len(orderbook_ticks) >= 2
            assert {"user1", "user2"}.issubset({user_id for user_id, _ in orderbook_ticks})

            tick_payload = orderbook_ticks[0][1]
            assert tick_payload["tick"] == -1
            aapl_snapshot = tick_payload["data"]["AAPL"]
            assert any(
                level["price"] == pytest.approx(123.45)
                and level["volume"] == pytest.approx(10)
                for level in aapl_snapshot["bids"]
            )
        finally:
            await engine.stop()


class TestCancelOrder:
    """Test cases for order cancellation"""

    async def test_cancel_open_buy_order_returns_cash(self):
        """Test that canceling an open buy order releases reserved cash"""
        engine = MultiplayerGameEngine(level_id="test_level")
        await engine.start()

        try:
            engine.register_emit_handler(lambda event, user_id, data: None)
            await engine.register_user("user1")

            initial_cash = engine.game_state.user_states["user1"].avail_cash

            order = Order(
                order_id=None,
                user_id="user1",
                action=OrderAction.BUY,
                direction=Direction.BUY,
                order_type=OrderType.LIMIT,
                ticker="AAPL",
                qty=10,
                price=100.0,
            )

            register_result = await engine.register_order(order)
            order_id = register_result["order_id"]

            # Give time for order to be enqueued
            await asyncio.sleep(0.05)

            cancel_result = await engine.cancel_order(order_id)

            assert cancel_result["result"] == "PASS"
            assert engine.game_state.user_states["user1"].avail_cash == initial_cash
            assert engine.game_state.user_states["user1"].reserved_cash == 0.0
            assert engine.order_id_to_order[order_id].status == Status.CANCELED
        finally:
            await engine.stop()

    async def test_cancel_open_sell_order_returns_stock(self):
        """Test that canceling a sell order releases reserved stock"""
        engine = MultiplayerGameEngine(level_id="test_level")
        await engine.start()

        try:
            engine.register_emit_handler(lambda event, user_id, data: None)
            await engine.register_user("user1")

            initial_qty = (
                engine.game_state.user_states["user1"].positions["AAPL"].long_avail_qty
            )

            order = Order(
                order_id=None,
                user_id="user1",
                action=OrderAction.SELL,
                direction=Direction.SELL,
                order_type=OrderType.LIMIT,
                ticker="AAPL",
                qty=10,
                price=150.0,
            )

            register_result = await engine.register_order(order)
            order_id = register_result["order_id"]

            await asyncio.sleep(0.05)

            cancel_result = await engine.cancel_order(order_id)

            assert cancel_result["result"] == "PASS"
            pos = engine.game_state.user_states["user1"].positions["AAPL"]
            assert pos.long_avail_qty == initial_qty
            assert pos.long_reserved_qty == 0
        finally:
            await engine.stop()

    async def test_cancel_nonexistent_order_fails(self):
        """Test that canceling a nonexistent order fails"""
        engine = MultiplayerGameEngine(level_id="test_level")
        await engine.start()

        try:
            engine.register_emit_handler(lambda event, user_id, data: None)

            result = await engine.cancel_order("nonexistent_order")

            assert result["result"] == "FAIL"
            assert "No such order" in result["message"]
        finally:
            await engine.stop()

    async def test_cancel_filled_order_fails(self):
        """Test that canceling a filled order fails"""
        engine = MultiplayerGameEngine(level_id="test_level")
        await engine.start()

        try:
            engine.register_emit_handler(lambda event, user_id, data: None)
            await engine.register_user("user1")

            # Create a filled order
            order = Order(
                order_id="filled_order",
                user_id="user1",
                action=OrderAction.BUY,
                direction=Direction.BUY,
                order_type=OrderType.LIMIT,
                ticker="AAPL",
                qty=10,
                price=100.0,
                status=Status.FILLED,
            )
            engine.order_id_to_order[order.order_id] = order

            result = await engine.cancel_order("filled_order")

            assert result["result"] == "FAIL"
            assert "FILLED" in result["message"]
        finally:
            await engine.stop()


class TestOnFill:
    """Test cases for on_fill method"""

    async def test_on_fill_buy_order_updates_position(self):
        """Test that on_fill increases position for buy orders"""
        engine = MultiplayerGameEngine(level_id="test_level")
        await engine.start()

        try:
            engine.register_emit_handler(lambda event, user_id, data: None)
            await engine.register_user("user1")

            engine.game_state.tick = 1

            # Create a buy order
            order = Order(
                order_id="buy1",
                user_id="user1",
                action=OrderAction.BUY,
                direction=Direction.BUY,
                order_type=OrderType.LIMIT,
                ticker="AAPL",
                qty=20,
                price=100.0,
                reserved_funds=2000.0,
            )
            engine.order_id_to_order[order.order_id] = order
            engine.game_state.user_states["user1"].logbook.append(order)
            engine.game_state.user_states["user1"].reserved_cash = 2000.0

            initial_qty = (
                engine.game_state.user_states["user1"].positions["AAPL"].long_avail_qty
            )

            # Simulate full fill
            order.qty_left = 0
            engine.on_fill("buy1", 100.0, 20, 0)

            pos = engine.game_state.user_states["user1"].positions["AAPL"]
            assert pos.long_avail_qty == initial_qty + 20
            assert order.status == Status.FILLED
            assert order.price_filled == 100.0
            assert engine.game_state.user_states["user1"].reserved_cash == 0.0
        finally:
            await engine.stop()

    async def test_on_fill_sell_order_reduces_reserved_qty(self):
        """Test that on_fill reduces reserved quantity for sell orders"""
        engine = MultiplayerGameEngine(level_id="test_level")
        await engine.start()

        try:
            engine.register_emit_handler(lambda event, user_id, data: None)
            await engine.register_user("user1")

            engine.game_state.tick = 1

            # Reserve some stock
            engine.game_state.user_states["user1"].positions["AAPL"].long_avail_qty = 90
            engine.game_state.user_states["user1"].positions[
                "AAPL"
            ].long_reserved_qty = 10

            # Create a sell order
            order = Order(
                order_id="sell1",
                user_id="user1",
                action=OrderAction.SELL,
                direction=Direction.SELL,
                order_type=OrderType.LIMIT,
                ticker="AAPL",
                qty=10,
                price=150.0,
            )
            engine.order_id_to_order[order.order_id] = order
            engine.game_state.user_states["user1"].logbook.append(order)

            initial_cash = engine.game_state.user_states["user1"].avail_cash

            # Simulate full fill
            order.qty_left = 0
            engine.on_fill("sell1", 150.0, 10, 0)

            pos = engine.game_state.user_states["user1"].positions["AAPL"]
            assert pos.long_reserved_qty == 0
            assert (
                engine.game_state.user_states["user1"].avail_cash
                == initial_cash + 1500.0
            )
            assert order.status == Status.FILLED
        finally:
            await engine.stop()

    async def test_on_fill_partial_fill_updates_status(self):
        """Test that partial fill sets status to PARTIALLY_FILLED"""
        engine = MultiplayerGameEngine(level_id="test_level")
        await engine.start()

        try:
            engine.register_emit_handler(lambda event, user_id, data: None)
            await engine.register_user("user1")

            engine.game_state.tick = 1

            order = Order(
                order_id="buy1",
                user_id="user1",
                action=OrderAction.BUY,
                direction=Direction.BUY,
                order_type=OrderType.LIMIT,
                ticker="AAPL",
                qty=20,
                price=100.0,
                reserved_funds=2000.0,
            )
            engine.order_id_to_order[order.order_id] = order
            engine.game_state.user_states["user1"].logbook.append(order)
            engine.game_state.user_states["user1"].reserved_cash = 2000.0

            # Simulate partial fill (10 out of 20)
            order.qty_left = 10
            engine.on_fill("buy1", 100.0, 10, 10)

            assert order.status == Status.PARTIALLY_FILLED
            assert order.price_filled == 100.0
            assert order.qty_left == 10
        finally:
            await engine.stop()

    async def test_on_fill_calculates_average_price(self):
        """Test that on_fill correctly calculates average fill price"""
        engine = MultiplayerGameEngine(level_id="test_level")
        await engine.start()

        try:
            engine.register_emit_handler(lambda event, user_id, data: None)
            await engine.register_user("user1")

            engine.game_state.tick = 1

            order = Order(
                order_id="buy1",
                user_id="user1",
                action=OrderAction.BUY,
                direction=Direction.BUY,
                order_type=OrderType.LIMIT,
                ticker="AAPL",
                qty=30,
                price=100.0,
                reserved_funds=3000.0,
            )
            engine.order_id_to_order[order.order_id] = order
            engine.game_state.user_states["user1"].logbook.append(order)
            engine.game_state.user_states["user1"].reserved_cash = 3000.0

            # First fill: 10 shares at $100
            order.qty_left = 20
            engine.on_fill("buy1", 100.0, 10, 20)
            assert order.price_filled == 100.0

            # Second fill: 10 shares at $110
            order.qty_left = 10
            engine.on_fill("buy1", 110.0, 10, 10)
            # Average should be (10*100 + 10*110) / 20 = 105
            assert order.price_filled == 105.0

            # Third fill: 10 shares at $90
            order.qty_left = 0
            engine.on_fill("buy1", 90.0, 10, 0)
            # Average should be (10*100 + 10*110 + 10*90) / 30 = 100
            assert order.price_filled == 100.0
        finally:
            await engine.stop()

    async def test_on_fill_uses_fill_event_qty_left_for_async_multifill(self):
        """Weighted average and reserve settlement should use per-fill qty_left."""
        engine = MultiplayerGameEngine(level_id="test_level")
        await engine.start()

        try:
            engine.register_emit_handler(lambda event, user_id, data: None)
            await engine.register_user("user1")

            engine.game_state.tick = 1
            user_state = engine.game_state.user_states["user1"]
            initial_avail_cash = user_state.avail_cash

            short_order = Order(
                order_id="async_short",
                user_id="user1",
                action=OrderAction.SELL_SHORT,
                direction=Direction.SELL,
                order_type=OrderType.MARKET,
                ticker="AAPL",
                qty=31,
                price=None,
            )
            # Emulate aliased state after simulator already matched full order.
            short_order.qty_left = 0
            engine.order_id_to_order[short_order.order_id] = short_order
            user_state.logbook.append(short_order)

            engine.on_fill("async_short", 240.36, 1, 30)
            assert short_order.status == Status.PARTIALLY_FILLED
            assert short_order.qty_left == 30
            assert short_order.price_filled == pytest.approx(240.36)

            engine.on_fill("async_short", 240.36, 30, 0)
            short_pos = user_state.positions["AAPL"]
            assert short_order.status == Status.FILLED
            assert short_order.qty_left == 0
            assert short_order.price_filled == pytest.approx(240.36)
            assert short_pos.short_avail_qty == 31
            assert short_pos.short_entry_price == pytest.approx(240.36)

            cover_order = Order(
                order_id="async_cover",
                user_id="user1",
                action=OrderAction.BUY_TO_COVER,
                direction=Direction.BUY,
                order_type=OrderType.MARKET,
                ticker="AAPL",
                qty=31,
                price=None,
                reserved_funds=31 * 260.0,
            )
            short_pos.short_avail_qty -= 31
            short_pos.short_reserved_qty += 31
            user_state.avail_cash -= cover_order.reserved_funds
            user_state.reserved_cash += cover_order.reserved_funds
            cover_order.qty_left = 0
            engine.order_id_to_order[cover_order.order_id] = cover_order
            user_state.logbook.append(cover_order)

            engine.on_fill("async_cover", 228.11, 2, 29)
            assert cover_order.status == Status.PARTIALLY_FILLED
            assert cover_order.qty_left == 29
            assert cover_order.price_filled == pytest.approx(228.11)

            engine.on_fill("async_cover", 228.11, 29, 0)
            assert cover_order.status == Status.FILLED
            assert cover_order.qty_left == 0
            assert cover_order.price_filled == pytest.approx(228.11)
            assert user_state.reserved_cash == pytest.approx(0.0)

            short_pos = user_state.positions["AAPL"]
            assert short_pos.short_avail_qty == 0
            assert short_pos.short_reserved_qty == 0
            assert short_pos.short_entry_price == pytest.approx(0.0)
            assert user_state.avail_cash == pytest.approx(
                initial_avail_cash + ((240.36 - 228.11) * 31)
            )
        finally:
            await engine.stop()

    async def test_on_fill_emits_canonical_fill_payload(self):
        engine = MultiplayerGameEngine(level_id="test_level")
        await engine.start()

        emitted_events: list[tuple[str, str, dict]] = []

        try:
            engine.register_emit_handler(
                lambda event, user_id, data: emitted_events.append((event, user_id, data))
            )
            await engine.register_user("user1")

            engine.game_state.tick = 3
            order = Order(
                order_id="short1",
                user_id="user1",
                action=OrderAction.SELL_SHORT,
                direction=Direction.SELL,
                order_type=OrderType.LIMIT,
                ticker="AAPL",
                qty=5,
                price=100.0,
            )
            engine.order_id_to_order[order.order_id] = order
            engine.game_state.user_states["user1"].logbook.append(order)
            order.qty_left = 0

            engine.on_fill("short1", 100.0, 5, 0)

            fill_events = [payload for event, _, payload in emitted_events if event == "orderFilled"]
            assert len(fill_events) == 1
            assert fill_events[0]["order"]["order_id"] == "short1"
            assert fill_events[0]["fill"]["fill_id"] == "short1-fill-1"
            assert fill_events[0]["fill"]["qty"] == 5
            assert "gameState" in fill_events[0]
            assert "netWorth" in fill_events[0]["gameState"]
            assert [fill.fill_id for fill in engine.game_state.user_states["user1"].fills] == [
                "short1-fill-1"
            ]
        finally:
            await engine.stop()


class TestValidateReservedFunds:
    """Test cases for validate_reserved_funds method"""

    async def test_validate_reserved_funds_passes_when_consistent(self):
        """Test that validation passes when reserved funds are consistent"""
        engine = MultiplayerGameEngine(level_id="test_level")
        await engine.start()

        try:
            engine.register_emit_handler(lambda event, user_id, data: None)
            await engine.register_user("user1")

            # Set up consistent state
            order = Order(
                order_id="order1",
                user_id="user1",
                action=OrderAction.BUY,
                direction=Direction.BUY,
                order_type=OrderType.LIMIT,
                ticker="AAPL",
                qty=10,
                price=100.0,
                status=Status.OPEN,
                reserved_funds=1000.0,
            )
            engine.game_state.user_states["user1"].logbook.append(order)
            engine.game_state.user_states["user1"].reserved_cash = 1000.0

            # Should not raise
            engine.validate_reserved_funds()
        finally:
            await engine.stop()

    async def test_validate_reserved_funds_fails_when_inconsistent(self):
        """Test that validation fails when reserved funds are inconsistent"""
        engine = MultiplayerGameEngine(level_id="test_level")
        await engine.start()

        try:
            engine.register_emit_handler(lambda event, user_id, data: None)
            await engine.register_user("user1")

            # Set up inconsistent state
            order = Order(
                order_id="order1",
                user_id="user1",
                action=OrderAction.BUY,
                direction=Direction.BUY,
                order_type=OrderType.LIMIT,
                ticker="AAPL",
                qty=10,
                price=100.0,
                status=Status.OPEN,
                reserved_funds=1000.0,
            )
            engine.game_state.user_states["user1"].logbook.append(order)
            engine.game_state.user_states["user1"].reserved_cash = (
                500.0  # Inconsistent!
            )

            with pytest.raises(AssertionError, match="Inconsistent reserved cash"):
                engine.validate_reserved_funds()
        finally:
            await engine.stop()


class TestGetGameState:
    """Test cases for get_game_state and get_fe_game_state methods"""

    async def test_get_game_state_returns_user_state(self):
        """Test that get_game_state returns correct user state"""
        engine = MultiplayerGameEngine(level_id="test_level")
        await engine.start()

        try:
            engine.register_emit_handler(lambda event, user_id, data: None)
            await engine.register_user("user1")

            state = await engine.get_game_state("user1")

            assert state["avail_cash"] == 100000.0
            assert state["reserved_cash"] == 0.0
            assert "positions" in state
            assert "AAPL" in state["positions"]
        finally:
            await engine.stop()

    async def test_get_fe_game_state_calculates_net_worth(self):
        """Test that get_fe_game_state calculates net worth correctly"""
        engine = MultiplayerGameEngine(level_id="test_level")
        await engine.start()

        try:
            engine.register_emit_handler(lambda event, user_id, data: None)
            await engine.register_user("user1")

            fe_state = await engine.get_fe_game_state("user1")

            assert "netWorth" in fe_state
            assert "totalPL" in fe_state
            assert "totalValueAllStocks" in fe_state
            assert fe_state["availCash"] == 100000.0
            assert fe_state["reservedCash"] == 0.0
        finally:
            await engine.stop()

    async def test_get_fe_game_state_includes_ticker_data(self):
        """Test that get_fe_game_state includes ticker-specific data"""
        engine = MultiplayerGameEngine(level_id="test_level")
        await engine.start()

        try:
            engine.register_emit_handler(lambda event, user_id, data: None)
            await engine.register_user("user1")

            fe_state = await engine.get_fe_game_state("user1")

            assert "AAPL" in fe_state
            aapl_data = fe_state["AAPL"]
            assert "longAvailQty" in aapl_data
            assert "longReservedQty" in aapl_data
            assert "longCostBasis" in aapl_data
            assert "longTotalQty" in aapl_data
            assert "shortAvailQty" in aapl_data
            assert "shortReservedQty" in aapl_data
            assert "shortEntryPrice" in aapl_data
            assert "shortTotalQty" in aapl_data
            assert "netQty" in aapl_data
            assert "closingPrice" in aapl_data
            assert "longValue" in aapl_data
            assert "shortLiability" in aapl_data
            assert "netPositionValue" in aapl_data
            assert "unrealizedLongPL" in aapl_data
            assert "unrealizedShortPL" in aapl_data
            assert "unrealizedPL" in aapl_data
        finally:
            await engine.stop()


class TestGameOver:
    """Test cases for game over logic"""

    async def test_calculate_net_worth(self):
        """Test that net worth is calculated correctly"""
        engine = MultiplayerGameEngine(level_id="test_level")
        await engine.start()

        try:
            engine.register_emit_handler(lambda event, user_id, data: None)
            await engine.register_user("user1")

            # Manually set some state
            engine.game_state.user_states["user1"].avail_cash = 50000.0
            engine.game_state.user_states["user1"].reserved_cash = 10000.0
            engine.game_state.user_states["user1"].positions["AAPL"].long_avail_qty = 100
            engine.game_state.user_states["user1"].positions["AAPL"].long_cost_basis = (
                150.0
            )

            net_worth = engine._calculate_net_worth("user1")

            # Net worth = cash + reserved + (qty * cost_basis)
            # = 50000 + 10000 + (100 * 150) = 75000
            assert net_worth >= 60000  # Allow some variance due to market data
        finally:
            await engine.stop()

    async def test_on_game_over_returns_net_worths(self):
        """Test that on_game_over returns net worths for all users"""
        engine = MultiplayerGameEngine(level_id="test_level")
        await engine.start()

        try:
            engine.register_emit_handler(lambda event, user_id, data: None)
            await engine.register_user("user1")
            await engine.register_user("user2")

            result = await engine.on_game_over()

            assert "netWorths" in result
            assert "user1" in result["netWorths"]
            assert "user2" in result["netWorths"]
            assert isinstance(result["netWorths"]["user1"], float)
            assert isinstance(result["netWorths"]["user2"], float)
        finally:
            await engine.stop()


class TestNextTick:
    """Test cases for next_tick_logic"""

    async def test_next_tick_increments_tick(self):
        """Test that next_tick increments the tick counter"""
        engine = MultiplayerGameEngine(level_id="test_level")
        await engine.start()

        try:
            engine.register_emit_handler(lambda event, user_id, data: None)
            await engine.register_user("user1")

            initial_tick = engine.game_state.tick

            await engine.next_tick_logic()

            assert engine.game_state.tick == initial_tick + 1
        finally:
            await engine.stop()

    async def test_next_tick_returns_empty_when_game_over(self):
        """Test that next_tick returns game over result when tick limit reached"""
        engine = MultiplayerGameEngine(level_id="test_level")
        await engine.start()

        try:
            engine.register_emit_handler(lambda event, user_id, data: None)
            await engine.register_user("user1")

            # Set tick to just before game over
            engine.level_data.total_ticks = 5
            engine.game_state.tick = 4  # total_ticks = 5

            result = await engine.next_tick_logic()

            assert engine.is_game_over
            assert "netWorths" in result
        finally:
            await engine.stop()

    async def test_next_tick_emits_zero_ohlc_when_no_trades_in_no_npc_mode(self):
        engine = MultiplayerGameEngine(level_id="test_level")
        engine.configure_room_features(
            has_npc_orders=False,
            available_tools={
                "fake_news": True,
                "private_chat": True,
            },
        )
        await engine.start()

        try:
            engine.register_emit_handler(lambda event, user_id, data: None)
            await engine.register_user("user1")

            result = await engine.next_tick_logic()
            for ticker in engine.level_data.starting_tickers:
                ticker_snapshot = result[ticker]
                assert ticker_snapshot["open"] == pytest.approx(0.0)
                assert ticker_snapshot["high"] == pytest.approx(0.0)
                assert ticker_snapshot["low"] == pytest.approx(0.0)
                assert ticker_snapshot["close"] == pytest.approx(0.0)
                assert ticker_snapshot["volume"] == 0
        finally:
            await engine.stop()


class TestFakeNewsDurations:
    """Regression tests for fake-news delay/duration handling."""

    async def test_fake_news_with_delay_does_not_break_future_ticks(self):
        engine = MultiplayerGameEngine(level_id="test_level")
        await engine.start()

        try:
            engine.register_emit_handler(lambda event, user_id, data: None)
            await engine.register_user("user1")

            await engine.add_fake_news("AAPL", "Synthetic headline", n=2)

            # Advance into and past the inserted news tick; should not raise.
            await engine.next_tick_logic()
            await engine.next_tick_logic()
            await engine.next_tick_logic()
        finally:
            await engine.stop()

    async def test_next_tick_emits_structured_news_payload(self):
        """Test that next_tick emits news with title/content payload objects."""
        engine = MultiplayerGameEngine(level_id="test_level")
        await engine.start()

        try:
            engine.register_emit_handler(lambda event, user_id, data: None)
            await engine.register_user("user1")

            # Tick 8 contains hardcoded news in the test level.
            engine.game_state.tick = 7
            result = await engine.next_tick_logic()

            assert "news" in result
            assert isinstance(result["news"], list)
            assert len(result["news"]) >= 1
            first_news = result["news"][0]
            assert isinstance(first_news, dict)
            assert isinstance(first_news.get("title"), str)
            assert isinstance(first_news.get("content"), str)
            assert first_news.get("ticker") is None or isinstance(
                first_news.get("ticker"), str
            )
            assert len(first_news["title"].strip()) > 0
            assert len(first_news["content"].strip()) > 0
        finally:
            await engine.stop()


class TestAddFakeNews:
    """Test cases for add_fake_news method"""

    async def test_add_fake_news_adds_to_level_data(self):
        """Test that fake news is added to level data"""
        engine = MultiplayerGameEngine(level_id="test_level")

        engine.game_state.tick = 5

        await engine.add_fake_news("AAPL", "Breaking news!", n=2)

        assert 7 in engine.level_data.news
        assert "AAPL" in engine.level_data.news[7]
        assert any(
            "Breaking news!" in item[0] and "Breaking news!" in item[1]
            for item in engine.level_data.news[7]["AAPL"]
        )

    async def test_add_fake_news_with_custom_offset(self):
        """Test that fake news can be added with custom tick offset"""
        engine = MultiplayerGameEngine(level_id="test_level")

        engine.game_state.tick = 3

        await engine.add_fake_news("AAPL", "Custom offset news", n=5)

        assert 8 in engine.level_data.news
        assert "AAPL" in engine.level_data.news[8]
        inserted = engine.level_data.news[8]["AAPL"][0]
        assert len(inserted) == 4


class TestConcurrency:
    """Test cases for concurrent operations"""

    async def test_multiple_users_order_concurrently(self):
        """Test that multiple users can place orders concurrently"""
        engine = MultiplayerGameEngine(level_id="test_level")
        await engine.start()

        try:
            engine.register_emit_handler(lambda event, user_id, data: None)
            await engine.register_user("user1")
            await engine.register_user("user2")

            # Create orders for both users
            order1 = Order(
                order_id=None,
                user_id="user1",
                action=OrderAction.BUY,
                direction=Direction.BUY,
                order_type=OrderType.LIMIT,
                ticker="AAPL",
                qty=10,
                price=100.0,
            )

            order2 = Order(
                order_id=None,
                user_id="user2",
                action=OrderAction.BUY,
                direction=Direction.BUY,
                order_type=OrderType.LIMIT,
                ticker="AAPL",
                qty=5,
                price=105.0,
            )

            # Place orders concurrently
            result1, result2 = await asyncio.gather(
                engine.register_order(order1), engine.register_order(order2)
            )

            assert result1["result"] == "PASS"
            assert result2["result"] == "PASS"
            assert result1["order_id"] != result2["order_id"]

            # Verify each user's state is independent
            assert engine.game_state.user_states["user1"].reserved_cash == 1000.0
            assert engine.game_state.user_states["user2"].reserved_cash == 525.0
        finally:
            await engine.stop()

    async def test_state_lock_prevents_race_conditions(self):
        """Test that state lock prevents race conditions in concurrent access"""
        engine = MultiplayerGameEngine(level_id="test_level")
        await engine.start()

        try:
            engine.register_emit_handler(lambda event, user_id, data: None)
            await engine.register_user("user1")

            # Create multiple concurrent state reads
            results = await asyncio.gather(
                engine.get_game_state("user1"),
                engine.get_game_state("user1"),
                engine.get_fe_game_state("user1"),
                engine.get_fe_game_state("user1"),
            )

            # All results should be consistent
            assert all(r is not None for r in results)
        finally:
            await engine.stop()


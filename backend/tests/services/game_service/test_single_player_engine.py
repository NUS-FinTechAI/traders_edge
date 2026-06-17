from datetime import date, timedelta

import pytest
from common import Order
from services.game_service.models.game import (
    Position,
    TutorialMissionCriteriaModel,
    TutorialMissionModel,
)
from services.game_service.service.single_player_engine import SinglePlayerGameEngine
from utils.constants import Direction, OrderType, Status, OrderAction

pytestmark = pytest.mark.asyncio


class _RecordingSimulator:
    """Deterministic simulator stub for asserting per-tick news changes."""

    def __init__(self):
        self.changes_by_tick: list[list[tuple[float, int]]] = []

    def next_tick(self, changes: list[tuple[float, int]]):
        self.changes_by_tick.append(list(changes))
        return {"open": 100.0, "high": 100.0, "low": 100.0, "close": 100.0}

    def best_bid(self) -> float:
        return 100.0

    def best_ask(self) -> float:
        return 100.0


@pytest.fixture
def mock_data_access(monkeypatch):
    """Mock the data access layer to avoid database calls"""

    def mock_get_tutorial_level(level_id):
        return {
            "level_id": level_id,
            "level_type": "tutorial",
            "tick_mode": "auto",
            "auto_tick_interval_seconds": 60,
            "starting_cash": 10000.0,
            "passing_cash": 10500.0,
            "one_star_cash": 10500.0,
            "two_star_cash": 11000.0,
            "three_star_cash": 12000.0,
            "start_date": (date.today() - timedelta(days=9)).isoformat(),
            "end_date": date.today().isoformat(),
            "starting_tickers": ["AAPL"],
            "is_manual_tick": False,
            "news": {},
            "available_tools": {
                "market_order": True,
                "limit_order": True,
                "stop_order": True,
                "stop_limit_order": True,
            },
            "ticker_configs": [
                {
                    "ticker": "AAPL",
                    "simulator_type": "orderbook",
                    "initial_fair_price": 100.0,
                    "base_volume": 10,
                    "volatility": 10,
                    "has_npc_orders": True,
                    "rng_seed": 42,
                }
            ],
        }

    def mock_update_tutorial_status(*args, **kwargs):
        pass

    monkeypatch.setattr(
        "services.game_service.service.single_player_engine.da.get_tutorial_level",
        mock_get_tutorial_level,
    )
    monkeypatch.setattr(
        "services.game_service.service.single_player_engine.da.update_tutorial_status",
        mock_update_tutorial_status,
    )


class TestCancelOrder:
    """Test cases for cancel_order method"""

    async def test_cancel_open_buy_order_returns_reserved_cash(self, mock_data_access):
        """Test canceling an open buy order releases reserved funds"""
        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="level1", manual_tick_override=False
        )
        await engine.start()

        try:
            initial_avail_cash = engine.game_state.avail_cash

            # Create and register a buy order
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

            initial_reserved_cash = engine.game_state.reserved_cash
            order_id = result["order_id"]

            # Cancel the order
            cancel_result = await engine.cancel_order(order_id)

            assert cancel_result["result"] == "PASS"
            assert cancel_result["order_id"] == order_id
            assert initial_reserved_cash == 10 * 100.0
            assert engine.game_state.avail_cash == initial_avail_cash

            assert engine.game_state.reserved_cash == 0.0
            assert engine.order_id_to_order[order_id].status == Status.CANCELED
        finally:
            await engine.stop()

    async def test_cancel_open_sell_order_returns_reserved_qty(self, mock_data_access):
        """Test canceling an open sell order releases reserved stock"""
        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="level1", manual_tick_override=False
        )
        await engine.start()

        try:
            # Set up position with available stock
            engine.game_state.positions["AAPL"] = Position(
                long_avail_qty=100, long_reserved_qty=0
            )

            # Create and register a sell order
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

            pos = engine.game_state.positions["AAPL"]
            assert pos.long_avail_qty == 90
            assert pos.long_reserved_qty == 10

            # Cancel the order
            cancel_result = await engine.cancel_order(result["order_id"])

            assert cancel_result["result"] == "PASS"
            assert pos.long_avail_qty == 100
            assert pos.long_reserved_qty == 0
            assert (
                engine.order_id_to_order[result["order_id"]].status == Status.CANCELED
            )
        finally:
            await engine.stop()

    async def test_cancel_nonexistent_order_fails(self, mock_data_access):
        """Test canceling an order that doesn't exist"""
        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="level1", manual_tick_override=False
        )
        await engine.start()

        try:
            result = await engine.cancel_order("nonexistent_order_id")

            assert result["result"] == "FAIL"
            assert "No such order" in result["message"]
        finally:
            await engine.stop()

    async def test_cancel_filled_order_fails(self, mock_data_access):
        """Test canceling an already filled order fails"""
        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="level1", manual_tick_override=False
        )
        await engine.start()

        try:
            # Create an order and manually mark it as filled
            order = Order(
                order_id="test_order",
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

            result = await engine.cancel_order("test_order")

            assert result["result"] == "FAIL"
            assert "FILLED" in result["message"]
        finally:
            await engine.stop()

    async def test_cancel_partially_filled_order_returns_reserved_cash(
        self, mock_data_access
    ):
        """Test canceling a partially filled order"""
        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="level1", manual_tick_override=False
        )
        await engine.start()

        try:
            initial_avail_cash = engine.game_state.avail_cash

            # Create and register a buy order
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

            import asyncio

            await asyncio.sleep(0.05)

            engine.on_fill(result["order_id"], 100.0, 5, 5)  # Partially fill 5 shares

            order_id = result["order_id"]

            # Cancel the order
            cancel_result = await engine.cancel_order(order_id)

            assert cancel_result["result"] == "PASS"
            assert cancel_result["order_id"] == order_id
            assert (
                engine.game_state.avail_cash == initial_avail_cash - 500.0
            )  # 5 shares filled
            assert engine.game_state.reserved_cash == 0.0
            assert engine.order_id_to_order[order_id].status == Status.CANCELED
        finally:
            await engine.stop()


class TestOnFill:
    """Test cases for on_fill method"""

    async def test_on_fill_buy_order_updates_position(self, mock_data_access):
        """Test on_fill increases position quantity for buy orders"""
        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="level1", manual_tick_override=False
        )
        await engine.start()

        try:
            engine.game_state.tick = 1

            # Create buy order
            order = Order(
                order_id="buy1",
                user_id="user1",
                action=OrderAction.BUY,
                direction=Direction.BUY,
                order_type=OrderType.LIMIT,
                ticker="AAPL",
                qty=10,
                price=100.0,
                reserved_funds=1000.0,
            )
            engine.order_id_to_order[order.order_id] = order
            engine.game_state.logbook.append(order)
            engine.game_state.reserved_cash = 1000.0

            initial_avail_qty = engine.game_state.positions["AAPL"].long_avail_qty

            # Trigger on_fill
            order.qty_left = 0  # Simulate full fill
            engine.on_fill("buy1", 100.0, 10, 0)

            pos = engine.game_state.positions["AAPL"]
            assert pos.long_avail_qty == initial_avail_qty + 10
            assert order.status == Status.FILLED
            assert order.price_filled == 100.0
            assert order.qty_left == 0
            assert engine.game_state.reserved_cash == 0.0
        finally:
            await engine.stop()


    async def test_on_fill_sell_order_reduces_reserved_qty(self, mock_data_access):
        """Test on_fill reduces reserved quantity for sell orders"""
        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="level1", manual_tick_override=False
        )
        await engine.start()

        try:
            engine.game_state.tick = 1

            # Set up position
            engine.game_state.positions["AAPL"] = Position(
                long_avail_qty=90, long_reserved_qty=10, long_cost_basis=100.0
            )

            # Create sell order
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
            engine.game_state.logbook.append(order)

            initial_cash = engine.game_state.avail_cash

            # Trigger on_fill
            order.qty_left = 0  # Simulate partial fill
            engine.on_fill("sell1", 150.0, 10, 0)

            pos = engine.game_state.positions["AAPL"]
            assert pos.long_reserved_qty == 0
            assert order.status == Status.FILLED
            assert order.price_filled == 150.0
            assert engine.game_state.avail_cash == initial_cash + 1500.0
        finally:
            await engine.stop()

    async def test_on_fill_partial_fill_updates_status(self, mock_data_access):
        """Test partial fill updates order status correctly"""
        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="level1", manual_tick_override=False
        )
        await engine.start()

        try:
            engine.game_state.tick = 1
            engine.game_state.reserved_cash = 1000.0
            order = Order(
                order_id="partial1",
                user_id="user1",
                action=OrderAction.BUY,
                direction=Direction.BUY,
                order_type=OrderType.LIMIT,
                ticker="AAPL",
                qty=10,
                price=100.0,
                reserved_funds=1000.0,
            )
            order.qty_left = 5
            engine.order_id_to_order[order.order_id] = order
            engine.game_state.logbook.append(order)

            # Fill 5 out of 10
            engine.on_fill("partial1", 100.0, 5, 5)

            assert order.status == Status.PARTIALLY_FILLED
            assert order.qty_left == 5
            assert order.price_filled == 100.0
            # Reserved cash should still be held
            # 500 as 5 shares filled, 100*5=500
            assert engine.game_state.reserved_cash == 500.0
        finally:
            await engine.stop()

    async def test_on_fill_weighted_average_price(self, mock_data_access):
        """Test on_fill calculates weighted average price correctly"""
        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="level1", manual_tick_override=False
        )
        await engine.start()

        try:
            engine.game_state.tick = 1

            order = Order(
                order_id="avg1",
                user_id="user1",
                action=OrderAction.BUY,
                direction=Direction.BUY,
                order_type=OrderType.LIMIT,
                ticker="AAPL",
                qty=20,
                price=100.0,
                reserved_funds=2000.0,
            )
            order.qty_left = 20
            engine.order_id_to_order[order.order_id] = order
            engine.game_state.logbook.append(order)
            engine.game_state.reserved_cash = 2000.0

            # First fill: 10 shares at $100
            order.qty_left = 10
            engine.on_fill("avg1", 100.0, 10, 10)
            assert order.price_filled == 100.0
            assert order.qty_left == 10

            # Second fill: 10 shares at $110
            order.qty_left = 0
            engine.on_fill("avg1", 110.0, 10, 0)
            assert order.price_filled == 105.0  # (100*10 + 110*10) / 20
            assert order.qty_left == 0
            assert order.status == Status.FILLED
        finally:
            await engine.stop()

    async def test_on_fill_uses_fill_event_qty_left_for_async_multifill(
        self, mock_data_access
    ):
        """Fill math must use per-fill qty_left from the event, not mutable order state."""
        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="level1", manual_tick_override=False
        )
        await engine.start()

        try:
            engine.game_state.tick = 1
            initial_avail_cash = engine.game_state.avail_cash

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
            engine.game_state.logbook.append(short_order)

            engine.on_fill("async_short", 240.36, 1, 30)
            assert short_order.qty_left == 30
            assert short_order.status == Status.PARTIALLY_FILLED
            assert short_order.price_filled == pytest.approx(240.36)

            engine.on_fill("async_short", 240.36, 30, 0)
            short_pos = engine.game_state.positions["AAPL"]
            assert short_order.qty_left == 0
            assert short_order.status == Status.FILLED
            assert short_order.price_filled == pytest.approx(240.36)
            assert short_pos.short_avail_qty == 31
            assert short_pos.short_entry_price == pytest.approx(240.36)
            assert engine.game_state.avail_cash == pytest.approx(
                initial_avail_cash + (31 * 240.36)
            )

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
            # Match register_order reservation behavior.
            short_pos.short_avail_qty -= 31
            short_pos.short_reserved_qty += 31
            engine.game_state.avail_cash -= cover_order.reserved_funds
            engine.game_state.reserved_cash += cover_order.reserved_funds
            cover_order.qty_left = 0
            engine.order_id_to_order[cover_order.order_id] = cover_order
            engine.game_state.logbook.append(cover_order)

            engine.on_fill("async_cover", 228.11, 2, 29)
            assert cover_order.price_filled == pytest.approx(228.11)
            assert cover_order.status == Status.PARTIALLY_FILLED
            assert cover_order.qty_left == 29

            engine.on_fill("async_cover", 228.11, 29, 0)
            assert cover_order.price_filled == pytest.approx(228.11)
            assert cover_order.status == Status.FILLED
            assert cover_order.qty_left == 0
            assert engine.game_state.reserved_cash == pytest.approx(0.0)

            short_pos = engine.game_state.positions["AAPL"]
            assert short_pos.short_avail_qty == 0
            assert short_pos.short_reserved_qty == 0
            assert short_pos.short_entry_price == pytest.approx(0.0)
            assert engine.game_state.avail_cash == pytest.approx(
                initial_avail_cash + ((240.36 - 228.11) * 31)
            )
        finally:
            await engine.stop()

    async def test_on_fill_updates_cost_basis(self, mock_data_access):
        """Test on_fill updates position cost basis correctly"""
        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="level1", manual_tick_override=False
        )
        await engine.start()

        try:
            engine.game_state.tick = 1

            # Set initial position
            engine.game_state.positions["AAPL"] = Position(
                long_avail_qty=10, long_cost_basis=90.0
            )

            order = Order(
                order_id="cost1",
                user_id="user1",
                action=OrderAction.BUY,
                direction=Direction.BUY,
                order_type=OrderType.LIMIT,
                ticker="AAPL",
                qty=10,
                price=110.0,
                reserved_funds=1100.0,
            )
            engine.order_id_to_order[order.order_id] = order
            engine.game_state.logbook.append(order)
            engine.game_state.reserved_cash = 1100.0

            # Fill order
            engine.on_fill("cost1", 110.0, 10, 0)

            pos = engine.game_state.positions["AAPL"]
            # Cost basis should be (90*10 + 110*10) / 20 = 100
            assert pos.long_cost_basis == 100.0
            assert pos.long_avail_qty == 20
        finally:
            await engine.stop()

    async def test_on_fill_returns_excess_funds(self, mock_data_access):
        """Test on_fill returns excess reserved funds for buy orders"""
        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="level1", manual_tick_override=False
        )
        await engine.start()

        try:
            engine.game_state.tick = 1

            # Reserve more than needed
            order = Order(
                order_id="excess1",
                user_id="user1",
                action=OrderAction.BUY,
                direction=Direction.BUY,
                order_type=OrderType.LIMIT,
                ticker="AAPL",
                qty=10,
                price=100.0,
                reserved_funds=1200.0,  # Reserved $120 per share
            )
            engine.order_id_to_order[order.order_id] = order
            engine.game_state.logbook.append(order)
            engine.game_state.reserved_cash = 1200.0
            initial_avail_cash = engine.game_state.avail_cash

            # Fill at lower price
            order.qty_left = 0
            engine.on_fill("excess1", 100.0, 10, 0)

            # Should return 1200 - 1000 = 200
            assert engine.game_state.avail_cash == initial_avail_cash + 200.0
            assert engine.game_state.reserved_cash == 0.0
            assert order.reserved_funds == 0.0
        finally:
            await engine.stop()

    async def test_on_fill_sets_filled_tick(self, mock_data_access):
        """Test on_fill sets filled_tick when order is fully filled"""
        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="level1", manual_tick_override=False
        )
        await engine.start()

        try:
            engine.game_state.tick = 5

            order = Order(
                order_id="tick1",
                user_id="user1",
                action=OrderAction.BUY,
                direction=Direction.BUY,
                order_type=OrderType.LIMIT,
                ticker="AAPL",
                qty=10,
                price=100.0,
                reserved_funds=1000.0,
                tick=3,
            )
            engine.order_id_to_order[order.order_id] = order
            engine.game_state.logbook.append(order)
            engine.game_state.reserved_cash = 1000.0
            order.qty_left = 0
            engine.on_fill("tick1", 100.0, 10, 0)

            assert order.filled_tick == 5
        finally:
            await engine.stop()


class TestNewsPayload:
    """Test cases for news payload shape."""

    async def test_next_tick_emits_structured_news(self, mock_data_access):
        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="level1", manual_tick_override=False
        )
        await engine.start()

        try:
            engine.level_data.news = {
                0: {
                    "AAPL": [
                        (
                            "Fed Pauses Again",
                            "The central bank held rates steady in the latest meeting.\n"
                            "Treasury yields eased as traders priced lower hike odds.\n"
                            "Large-cap tech saw broad bid support into the close.",
                            0.0,
                            0,
                        )
                    ]
                }
            }

            result = await engine.next_tick_logic()

            assert "news" in result
            assert isinstance(result["news"], list)
            assert len(result["news"]) == 1
            first_news = result["news"][0]
            assert isinstance(first_news, dict)
            assert first_news["title"] == "Fed Pauses Again"
            assert "central bank held rates steady" in first_news["content"]
            assert first_news["ticker"] == "AAPL"
        finally:
            await engine.stop()


class TestNewsEffectsScheduling:
    async def test_single_article_with_single_effect_window(self, mock_data_access):
        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="level1", manual_tick_override=False
        )
        simulator = _RecordingSimulator()
        engine.ticker_to_simulator["AAPL"] = simulator

        engine.level_data.news = {
            0: {"AAPL": [("Supplier shock", "Suppliers report delays", 0.0, 0)]}
        }
        engine.level_data.news_effects = {0: {"AAPL": [(-0.02, 3)]}}

        result = await engine.next_tick_logic(emit_event=False)

        assert simulator.changes_by_tick == [[(-0.02, 3)]]
        assert len(result["news"]) == 1
        assert result["news"][0]["title"] == "Supplier shock"

    async def test_single_article_with_multiple_effect_windows(self, mock_data_access):
        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="level1", manual_tick_override=False
        )
        simulator = _RecordingSimulator()
        engine.ticker_to_simulator["AAPL"] = simulator

        engine.level_data.news = {
            0: {"AAPL": [("Policy surprise", "Market digests policy headline", 0.0, 0)]}
        }
        engine.level_data.news_effects = {
            0: {"AAPL": [(-0.03, 2)]},
            2: {"AAPL": [(0.01, 4)]},
        }

        tick0 = await engine.next_tick_logic(emit_event=False)
        tick1 = await engine.next_tick_logic(emit_event=False)
        tick2 = await engine.next_tick_logic(emit_event=False)

        assert simulator.changes_by_tick == [[(-0.03, 2)], [], [(0.01, 4)]]
        assert len(tick0["news"]) == 1
        assert tick1["news"] == []
        assert tick2["news"] == []

    async def test_embedded_multiplier_in_news_payload_is_ignored(
        self, mock_data_access
    ):
        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="level1", manual_tick_override=False
        )
        simulator = _RecordingSimulator()
        engine.ticker_to_simulator["AAPL"] = simulator

        # Embedded multiplier/duration in display payload must not affect price.
        engine.level_data.news = {
            0: {"AAPL": [("Legacy event", "Legacy payload path", -0.015, 4)]}
        }
        engine.level_data.news_effects = {}

        await engine.next_tick_logic(emit_event=False)

        assert simulator.changes_by_tick == [[]]


class TestPreloadedTicks:
    """Test cases for preloaded tick initialization at game start."""

    async def test_start_emits_preloaded_tick_data(self, monkeypatch):
        emitted: list[tuple[str, str, dict]] = []

        def mock_get_tutorial_level(level_id):
            return {
                "level_id": level_id,
                "level_type": "tutorial",
                "tick_mode": "manual",
                "auto_tick_interval_seconds": None,
                "starting_cash": 10000.0,
                "start_date": "2025-01-01",
                "end_date": "2025-01-10",
                "starting_tickers": ["AAPL"],
                "is_manual_tick": True,
                "total_ticks": 6,
                "preloaded_ticks": 3,
                "news": {},
                "ticker_configs": [
                    {
                        "ticker": "AAPL",
                        "simulator_type": "orderbook",
                        "initial_fair_price": 100.0,
                        "base_volume": 10,
                        "volatility": 10,
                        "has_npc_orders": False,
                        "rng_seed": 42,
                    }
                ],
            }

        def mock_update_tutorial_status(*args, **kwargs):
            pass

        monkeypatch.setattr(
            "services.game_service.service.single_player_engine.da.get_tutorial_level",
            mock_get_tutorial_level,
        )
        monkeypatch.setattr(
            "services.game_service.service.single_player_engine.da.update_tutorial_status",
            mock_update_tutorial_status,
        )

        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="level-preload", manual_tick_override=False
        )
        engine.register_emit_handler(
            lambda event, user, data: emitted.append((event, user, data))
        )
        await engine.start()

        try:
            start_events = [item for item in emitted if item[0] == "game_start"]
            assert len(start_events) == 1
            payload = start_events[0][2]
            assert payload["preloaded_ticks"] == 3
            assert payload["preloaded_until_tick"] == 2
            assert payload["tick"] == 2
            assert "is_manual_tick" not in payload
            assert isinstance(payload["preloaded_tick_data"], list)
            assert len(payload["preloaded_tick_data"]) == 3

            first_preload = payload["preloaded_tick_data"][0]
            assert first_preload["tick"] == 0
            assert "AAPL" in first_preload["data"]

            await engine.next_tick()
            assert engine.game_state.tick == 3
        finally:
            await engine.stop()


class TestManualStartAutoTick:
    async def test_auto_tick_level_can_delay_runner_until_start_ticking(
        self, monkeypatch
    ):
        emitted: list[tuple[str, str, dict]] = []

        def mock_get_tutorial_level(level_id):
            return {
                "level_id": level_id,
                "level_type": "tutorial",
                "tick_mode": "auto",
                "manual_start": True,
                "auto_tick_interval_seconds": 60,
                "starting_cash": 10000.0,
                "start_date": "2025-01-01",
                "end_date": "2025-01-10",
                "starting_tickers": ["AAPL"],
                "is_manual_tick": False,
                "total_ticks": 10,
                "preloaded_ticks": 0,
                "news": {},
                "ticker_configs": [
                    {
                        "ticker": "AAPL",
                        "simulator_type": "orderbook",
                        "initial_fair_price": 100.0,
                        "base_volume": 10,
                        "volatility": 10,
                        "has_npc_orders": False,
                        "rng_seed": 42,
                    }
                ],
            }

        monkeypatch.setattr(
            "services.game_service.service.single_player_engine.da.get_tutorial_level",
            mock_get_tutorial_level,
        )
        monkeypatch.setattr(
            "services.game_service.service.single_player_engine.da.update_tutorial_status",
            lambda *args, **kwargs: None,
        )

        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="level-auto-delayed", manual_tick_override=False
        )
        engine.register_emit_handler(
            lambda event, user, data: emitted.append((event, user, data))
        )
        await engine.start()

        try:
            assert engine.next_tick_task is None
            assert engine.auto_tick_requires_manual_start is True
            assert any(event == "game_start" for event, _, _ in emitted)

            start_resp = await engine.start_ticking()
            assert start_resp["result"] == "PASS"
            assert start_resp["started"] is True
            assert engine.auto_tick_requires_manual_start is False
            assert engine.next_tick_task is not None
        finally:
            await engine.stop()

    async def test_start_ticking_rejected_for_manual_tick_level(self, monkeypatch):
        def mock_get_tutorial_level(level_id):
            return {
                "level_id": level_id,
                "level_type": "tutorial",
                "tick_mode": "manual",
                "manual_start": False,
                "auto_tick_interval_seconds": None,
                "starting_cash": 10000.0,
                "start_date": "2025-01-01",
                "end_date": "2025-01-10",
                "starting_tickers": ["AAPL"],
                "is_manual_tick": True,
                "total_ticks": 10,
                "preloaded_ticks": 0,
                "news": {},
                "ticker_configs": [
                    {
                        "ticker": "AAPL",
                        "simulator_type": "orderbook",
                        "initial_fair_price": 100.0,
                        "base_volume": 10,
                        "volatility": 10,
                        "has_npc_orders": False,
                        "rng_seed": 42,
                    }
                ],
            }

        monkeypatch.setattr(
            "services.game_service.service.single_player_engine.da.get_tutorial_level",
            mock_get_tutorial_level,
        )
        monkeypatch.setattr(
            "services.game_service.service.single_player_engine.da.update_tutorial_status",
            lambda *args, **kwargs: None,
        )

        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="level-manual", manual_tick_override=False
        )
        await engine.start()
        try:
            result = await engine.start_ticking()
            assert result["result"] == "FAIL"
            assert "auto-tick levels" in result["reason"]
        finally:
            await engine.stop()


class TestMissionDirection:
    """Test cases for direction-filtered order-count missions."""

    async def test_use_order_type_with_order_direction(self, mock_data_access):
        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="level1", manual_tick_override=False
        )
        await engine.start()

        try:
            buy_market = Order(
                order_id="buy_market_1",
                user_id="user1",
                action=OrderAction.BUY,
                direction=Direction.BUY,
                order_type=OrderType.MARKET,
                ticker="AAPL",
                qty=1,
                price=None,
            )
            sell_market = Order(
                order_id="sell_market_1",
                user_id="user1",
                action=OrderAction.SELL,
                direction=Direction.SELL,
                order_type=OrderType.MARKET,
                ticker="AAPL",
                qty=1,
                price=None,
            )
            engine.game_state.logbook.extend([buy_market, sell_market])

            engine.level_data.passing_criteria = TutorialMissionCriteriaModel(
                type="all_of",
                missions=[
                    TutorialMissionModel(
                        id="market_buy_once",
                        type="use_order_type",
                        mission_params={
                            "order_type": "market",
                            "order_direction": "buy",
                            "min_count": 1,
                        },
                    ),
                    TutorialMissionModel(
                        id="market_sell_once",
                        type="use_order_type",
                        mission_params={
                            "order_type": "market",
                            "order_direction": "sell",
                            "min_count": 1,
                        },
                    ),
                ],
            )
            engine.level_data.bonus_missions = []

            progress = engine._build_mission_progress(
                force_final=True, net_worth=engine.level_data.starting_cash
            )
            missions = progress["missions"]

            assert missions["market_buy_once"]["completed"] is True
            assert missions["market_sell_once"]["completed"] is True
            assert missions["market_buy_once"]["value"] == 1
            assert missions["market_sell_once"]["value"] == 1
        finally:
            await engine.stop()


class TestModule3OrderTypes:
    async def test_use_order_type_counts_include_stop_and_stop_limit(
        self, mock_data_access
    ):
        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="level1", manual_tick_override=False
        )
        await engine.start()

        try:
            stop_order = Order(
                order_id="stop_1",
                user_id="user1",
                action=OrderAction.SELL,
                direction=Direction.SELL,
                order_type=OrderType.STOP,
                ticker="AAPL",
                qty=1,
                price=None,
                stop_price=95.0,
            )
            stop_limit_order = Order(
                order_id="stop_limit_1",
                user_id="user1",
                action=OrderAction.BUY,
                direction=Direction.BUY,
                order_type=OrderType.STOP_LIMIT,
                ticker="AAPL",
                qty=1,
                price=101.0,
                stop_price=100.0,
            )
            engine.game_state.logbook.extend([stop_order, stop_limit_order])

            engine.level_data.passing_criteria = TutorialMissionCriteriaModel(
                type="all_of",
                missions=[
                    TutorialMissionModel(
                        id="stop_once",
                        type="use_order_type",
                        mission_params={"order_type": "stop", "min_count": 1},
                    ),
                    TutorialMissionModel(
                        id="stop_limit_once",
                        type="use_order_type",
                        mission_params={"order_type": "stop_limit", "min_count": 1},
                    ),
                ],
            )
            engine.level_data.bonus_missions = []

            progress = engine._build_mission_progress(
                force_final=True, net_worth=engine.level_data.starting_cash
            )

            assert progress["missions"]["stop_once"]["completed"] is True
            assert progress["missions"]["stop_limit_once"]["completed"] is True
            assert progress["missions"]["stop_once"]["value"] == 1
            assert progress["missions"]["stop_limit_once"]["value"] == 1
        finally:
            await engine.stop()

    async def test_register_order_rejects_locked_order_type(self, mock_data_access):
        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="level1", manual_tick_override=False
        )
        await engine.start()

        try:
            # Turn on tool-gating by enabling at least one tool.
            engine.level_data.available_tools.market_order = True
            engine.level_data.available_tools.limit_order = False

            limit_order = Order(
                order_id=None,
                user_id="user1",
                action=OrderAction.BUY,
                direction=Direction.BUY,
                order_type=OrderType.LIMIT,
                ticker="AAPL",
                qty=1,
                price=100.0,
            )
            result = await engine.register_order(limit_order)

            assert result["result"] == "FAIL"
            assert "not unlocked" in result["reason"].lower()
        finally:
            await engine.stop()


class TestShortSelling:
    async def test_register_order_rejects_short_actions_before_unlock(
        self, mock_data_access
    ):
        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="level1", manual_tick_override=False
        )
        await engine.start()

        try:
            order = Order(
                order_id=None,
                user_id="user1",
                action=OrderAction.SELL_SHORT,
                direction=Direction.SELL,
                order_type=OrderType.LIMIT,
                ticker="AAPL",
                qty=1,
                price=100.0,
            )
            result = await engine.register_order(order)
            assert result["result"] == "FAIL"
            assert "short selling is not unlocked" in result["reason"].lower()
        finally:
            await engine.stop()

    async def test_short_open_and_cover_updates_cash_positions_and_pnl(
        self, mock_data_access
    ):
        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="level1", manual_tick_override=False
        )
        await engine.start()

        try:
            engine.level_data.available_tools.short_selling = True
            engine.game_state.tick = 2
            engine.ticker_to_simulator["AAPL"].best_bid = lambda: 100.0

            sell_short = Order(
                order_id=None,
                user_id="user1",
                action=OrderAction.SELL_SHORT,
                direction=Direction.SELL,
                order_type=OrderType.LIMIT,
                ticker="AAPL",
                qty=10,
                price=100.0,
            )
            open_result = await engine.register_order(sell_short)
            assert open_result["result"] == "PASS"
            open_order = engine.order_id_to_order[open_result["order_id"]]
            open_order.qty_left = 0
            engine.on_fill(open_result["order_id"], 100.0, 10, 0)

            pos_after_open = engine.game_state.positions["AAPL"]
            assert pos_after_open.short_avail_qty == 10
            assert pos_after_open.short_reserved_qty == 0
            assert pos_after_open.short_entry_price == pytest.approx(100.0)
            assert engine.game_state.avail_cash == pytest.approx(11000.0)

            buy_to_cover = Order(
                order_id=None,
                user_id="user1",
                action=OrderAction.BUY_TO_COVER,
                direction=Direction.BUY,
                order_type=OrderType.LIMIT,
                ticker="AAPL",
                qty=10,
                price=90.0,
            )
            cover_result = await engine.register_order(buy_to_cover)
            assert cover_result["result"] == "PASS"
            cover_order = engine.order_id_to_order[cover_result["order_id"]]
            assert engine.game_state.reserved_cash == pytest.approx(900.0)
            assert engine.game_state.avail_cash == pytest.approx(10100.0)
            cover_order.qty_left = 0
            engine.on_fill(cover_result["order_id"], 90.0, 10, 0)

            pos_after_cover = engine.game_state.positions["AAPL"]
            assert pos_after_cover.short_avail_qty == 0
            assert pos_after_cover.short_reserved_qty == 0
            assert pos_after_cover.short_entry_price == pytest.approx(0.0)
            assert engine.game_state.avail_cash == pytest.approx(10100.0)
            assert engine.game_state.reserved_cash == pytest.approx(0.0)
            assert engine._calculate_net_worth() == pytest.approx(10100.0)
        finally:
            await engine.stop()

    async def test_register_order_enforces_short_exposure_cap(self, mock_data_access):
        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="level1", manual_tick_override=False
        )
        await engine.start()

        try:
            engine.level_data.available_tools.short_selling = True

            order = Order(
                order_id=None,
                user_id="user1",
                action=OrderAction.SELL_SHORT,
                direction=Direction.SELL,
                order_type=OrderType.LIMIT,
                ticker="AAPL",
                qty=200,
                price=100.0,
            )
            result = await engine.register_order(order)
            assert result["result"] == "FAIL"
            assert "short exposure cap exceeded" in result["reason"].lower()
        finally:
            await engine.stop()

    async def test_short_and_cover_emit_single_fill_event_per_fill(
        self, mock_data_access
    ):
        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="level1", manual_tick_override=False
        )
        await engine.start()
        emitted_events: list[tuple[str, str, dict]] = []
        engine.register_emit_handler(
            lambda event, user_id, data: emitted_events.append((event, user_id, data))
        )

        try:
            engine.level_data.available_tools.short_selling = True
            engine.game_state.tick = 2

            sell_short = Order(
                order_id=None,
                user_id="user1",
                action=OrderAction.SELL_SHORT,
                direction=Direction.SELL,
                order_type=OrderType.LIMIT,
                ticker="AAPL",
                qty=21,
                price=100.0,
            )
            short_result = await engine.register_order(sell_short)
            assert short_result["result"] == "PASS"

            short_order = engine.order_id_to_order[short_result["order_id"]]
            short_order.qty_left = 0
            engine.on_fill(short_result["order_id"], 100.0, 21, 0)

            fill_events = [payload for event, _, payload in emitted_events if event == "orderFilled"]
            assert len(fill_events) == 1
            assert fill_events[0]["order"]["order_id"] == short_result["order_id"]
            assert fill_events[0]["order"]["action"] == OrderAction.SELL_SHORT.value
            assert fill_events[0]["fill"]["qty"] == 21
            assert fill_events[0]["fill"]["qty_left"] == 0
            assert fill_events[0]["fill"]["fill_id"].endswith("-fill-1")
            assert "gameState" in fill_events[0]
            assert "netWorth" in fill_events[0]["gameState"]

            buy_to_cover = Order(
                order_id=None,
                user_id="user1",
                action=OrderAction.BUY_TO_COVER,
                direction=Direction.BUY,
                order_type=OrderType.LIMIT,
                ticker="AAPL",
                qty=21,
                price=99.0,
            )
            cover_result = await engine.register_order(buy_to_cover)
            assert cover_result["result"] == "PASS"

            cover_order = engine.order_id_to_order[cover_result["order_id"]]
            cover_order.qty_left = 0
            engine.on_fill(cover_result["order_id"], 99.0, 21, 0)

            fill_events = [payload for event, _, payload in emitted_events if event == "orderFilled"]
            assert len(fill_events) == 2
            assert [payload["order"]["action"] for payload in fill_events] == [
                OrderAction.SELL_SHORT.value,
                OrderAction.BUY_TO_COVER.value,
            ]
            assert [payload["fill"]["qty"] for payload in fill_events] == [21, 21]
            assert [payload["fill"]["fill_id"] for payload in fill_events] == [
                f"{short_result['order_id']}-fill-1",
                f"{cover_result['order_id']}-fill-1",
            ]

            assert len(engine.game_state.logbook) == 2
            assert [order.action for order in engine.game_state.logbook] == [
                OrderAction.SELL_SHORT,
                OrderAction.BUY_TO_COVER,
            ]
            assert [fill.fill_id for fill in engine.game_state.fills] == [
                f"{short_result['order_id']}-fill-1",
                f"{cover_result['order_id']}-fill-1",
            ]
        finally:
            await engine.stop()

    async def test_partial_short_cover_preserves_remaining_entry_and_unrealized_pl(
        self, mock_data_access
    ):
        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="level1", manual_tick_override=False
        )
        await engine.start()

        try:
            engine.level_data.available_tools.short_selling = True
            engine.game_state.tick = 2

            sell_short = Order(
                order_id=None,
                user_id="user1",
                action=OrderAction.SELL_SHORT,
                direction=Direction.SELL,
                order_type=OrderType.LIMIT,
                ticker="AAPL",
                qty=10,
                price=100.0,
            )
            short_result = await engine.register_order(sell_short)
            short_order = engine.order_id_to_order[short_result["order_id"]]
            short_order.qty_left = 0
            engine.on_fill(short_result["order_id"], 100.0, 10, 0)

            cover = Order(
                order_id=None,
                user_id="user1",
                action=OrderAction.BUY_TO_COVER,
                direction=Direction.BUY,
                order_type=OrderType.LIMIT,
                ticker="AAPL",
                qty=4,
                price=90.0,
            )
            cover_result = await engine.register_order(cover)
            cover_order = engine.order_id_to_order[cover_result["order_id"]]
            cover_order.qty_left = 0
            engine.on_fill(cover_result["order_id"], 90.0, 4, 0)

            pos = engine.game_state.positions["AAPL"]
            assert pos.short_avail_qty == 6
            assert pos.short_reserved_qty == 0
            assert pos.short_entry_price == pytest.approx(100.0)
            assert engine.game_state.avail_cash == pytest.approx(10640.0)
            assert engine.game_state.reserved_cash == pytest.approx(0.0)

            fe_state = await engine.get_fe_game_state()
            assert fe_state["AAPL"]["shortTotalQty"] == 6
            assert fe_state["AAPL"]["shortEntryPrice"] == pytest.approx(100.0)
            assert fe_state["AAPL"]["unrealizedShortPL"] == pytest.approx(0.0)
            assert fe_state["netWorth"] == pytest.approx(10040.0)
            assert fe_state["totalPL"] == pytest.approx(40.0)
            assert [fill.qty for fill in engine.game_state.fills] == [10, 4]
        finally:
            await engine.stop()

    async def test_use_trade_action_missions_count_short_actions(
        self, mock_data_access
    ):
        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="level1", manual_tick_override=False
        )
        await engine.start()

        try:
            engine.level_data.passing_criteria = TutorialMissionCriteriaModel(
                type="all_of",
                missions=[
                    TutorialMissionModel(
                        id="short_opened",
                        type="use_trade_action",
                        mission_params={"trade_action": "sell_short", "min_count": 1},
                    ),
                    TutorialMissionModel(
                        id="short_covered",
                        type="use_trade_action",
                        mission_params={"trade_action": "buy_to_cover", "min_count": 1},
                    ),
                ],
            )
            engine.level_data.bonus_missions = []
            engine.game_state.logbook.extend(
                [
                    Order(
                        order_id="short_1",
                        user_id="user1",
                        action=OrderAction.SELL_SHORT,
                        direction=Direction.SELL,
                        order_type=OrderType.MARKET,
                        ticker="AAPL",
                        qty=2,
                        price=None,
                    ),
                    Order(
                        order_id="cover_1",
                        user_id="user1",
                        action=OrderAction.BUY_TO_COVER,
                        direction=Direction.BUY,
                        order_type=OrderType.MARKET,
                        ticker="AAPL",
                        qty=2,
                        price=None,
                    ),
                ]
            )

            progress = engine._build_mission_progress(
                force_final=True, net_worth=engine.level_data.starting_cash
            )

            assert progress["missions"]["short_opened"]["completed"] is True
            assert progress["missions"]["short_opened"]["value"] == 1
            assert progress["missions"]["short_covered"]["completed"] is True
            assert progress["missions"]["short_covered"]["value"] == 1
        finally:
            await engine.stop()


class TestMacroEffectsScheduling:
    async def test_single_news_event_can_drive_multi_phase_effects(
        self, mock_data_access
    ):
        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="level1", manual_tick_override=False
        )
        simulator = _RecordingSimulator()
        engine.ticker_to_simulator["AAPL"] = simulator

        engine.level_data.news = {
            0: {
                "AAPL": [
                    (
                        "Fed Speech Sparks Multi-Phase Repricing",
                        "Initial move can reverse after deeper interpretation.",
                        0.0,
                        0,
                    )
                ]
            }
        }
        engine.level_data.news_effects = {
            0: {"AAPL": [(-0.012, 2)]},
            2: {"AAPL": [(0.009, 2)]},
            4: {"AAPL": [(-0.01, 2)]},
        }
        engine.level_data.macro_effects = {}

        tick0 = await engine.next_tick_logic(emit_event=False)
        tick1 = await engine.next_tick_logic(emit_event=False)
        tick2 = await engine.next_tick_logic(emit_event=False)
        tick3 = await engine.next_tick_logic(emit_event=False)
        tick4 = await engine.next_tick_logic(emit_event=False)

        assert simulator.changes_by_tick == [
            [(-0.012, 2)],
            [],
            [(0.009, 2)],
            [],
            [(-0.01, 2)],
        ]
        assert len(tick0["news"]) == 1
        assert tick1["news"] == []
        assert tick2["news"] == []
        assert tick3["news"] == []
        assert tick4["news"] == []

    async def test_macro_and_news_effects_can_apply_on_same_tick(
        self, mock_data_access
    ):
        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="level1", manual_tick_override=False
        )
        simulator = _RecordingSimulator()
        engine.ticker_to_simulator["AAPL"] = simulator

        engine.level_data.news = {
            0: {"AAPL": [("News headline", "News body", 0.0, 0)]}
        }
        engine.level_data.news_effects = {0: {"AAPL": [(-0.02, 2)]}}
        engine.level_data.macro_effects = {
            0: {
                "AAPL": [
                    (-0.01, 3, "Rate shock", "Rates reprice higher", "interest_rate")
                ]
            }
        }

        result = await engine.next_tick_logic(emit_event=False)

        assert simulator.changes_by_tick == [[(-0.02, 2), (-0.01, 3)]]
        assert len(result["news"]) == 1
        assert len(result["macro_events"]) == 1
        assert result["macro_events"][0]["factor_key"] == "interest_rate"
        assert result["macro_events"][0]["title"] == "Rate shock"

    async def test_macro_effect_triggers_only_on_its_start_tick(self, mock_data_access):
        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="level1", manual_tick_override=False
        )
        simulator = _RecordingSimulator()
        engine.ticker_to_simulator["AAPL"] = simulator
        engine.level_data.news = {}
        engine.level_data.news_effects = {}
        engine.level_data.macro_effects = {
            1: {
                "AAPL": [
                    (-0.015, 4, "Inflation surprise", "CPI above consensus", "inflation")
                ]
            }
        }

        tick0 = await engine.next_tick_logic(emit_event=False)
        tick1 = await engine.next_tick_logic(emit_event=False)

        assert simulator.changes_by_tick == [[], [(-0.015, 4)]]
        assert tick0["macro_events"] == []
        assert len(tick1["macro_events"]) == 1
        assert tick1["macro_events"][0]["factor_key"] == "inflation"


class TestRiskMissions:
    async def test_max_total_orders_and_max_drawdown_missions(self, mock_data_access):
        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="level1", manual_tick_override=False
        )
        await engine.start()

        try:
            engine._total_orders_submitted = 5
            engine._max_drawdown_pct_seen = 0.018
            engine.level_data.passing_criteria = TutorialMissionCriteriaModel(
                type="all_of",
                missions=[
                    TutorialMissionModel(
                        id="cap_order_count",
                        type="max_total_orders",
                        mission_params={"max_total_orders": 6},
                    ),
                    TutorialMissionModel(
                        id="cap_drawdown",
                        type="max_drawdown_pct",
                        mission_params={"max_drawdown_pct": 0.02},
                    ),
                ],
            )
            engine.level_data.bonus_missions = []

            progress = engine._build_mission_progress(
                force_final=True, net_worth=engine.level_data.starting_cash
            )

            assert progress["missions"]["cap_order_count"]["completed"] is True
            assert progress["missions"]["cap_order_count"]["value"] == 5
            assert progress["missions"]["cap_drawdown"]["completed"] is True
            assert progress["missions"]["cap_drawdown"]["value"] == pytest.approx(0.018)
        finally:
            await engine.stop()

    async def test_risk_only_missions_can_pass_without_profit_target(
        self, mock_data_access
    ):
        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="level1", manual_tick_override=False
        )
        await engine.start()

        try:
            engine._total_orders_submitted = 3
            engine._max_drawdown_pct_seen = 0.012
            engine.level_data.passing_criteria = TutorialMissionCriteriaModel(
                type="all_of",
                missions=[
                    TutorialMissionModel(
                        id="cap_order_count",
                        type="max_total_orders",
                        mission_params={"max_total_orders": 4},
                    ),
                    TutorialMissionModel(
                        id="cap_drawdown",
                        type="max_drawdown_pct",
                        mission_params={"max_drawdown_pct": 0.015},
                    ),
                ],
            )
            engine.level_data.bonus_missions = [
                TutorialMissionModel(
                    id="bonus_small_loss_ok",
                    type="pnl_at_end",
                    mission_params={"min_pnl": -150.0},
                )
            ]

            progress = engine._build_mission_progress(force_final=True, net_worth=9900.0)

            assert progress["metrics"]["pnl"] == pytest.approx(-100.0)
            assert progress["missions"]["cap_order_count"]["completed"] is True
            assert progress["missions"]["cap_drawdown"]["completed"] is True
            assert progress["missions"]["bonus_small_loss_ok"]["completed"] is True
        finally:
            await engine.stop()

    async def test_drawdown_baseline_resets_after_preload(self, monkeypatch):
        def mock_get_tutorial_level(level_id):
            return {
                "level_id": level_id,
                "level_type": "tutorial",
                "tick_mode": "auto",
                "manual_start": True,
                "auto_tick_interval_seconds": 60,
                "starting_cash": 10000.0,
                "start_date": "2025-01-01",
                "end_date": "2025-01-10",
                "starting_tickers": ["AAPL"],
                "is_manual_tick": False,
                "total_ticks": 10,
                "preloaded_ticks": 2,
                "news": {},
                "ticker_configs": [
                    {
                        "ticker": "AAPL",
                        "simulator_type": "orderbook",
                        "initial_fair_price": 100.0,
                        "base_volume": 10,
                        "volatility": 10,
                        "has_npc_orders": False,
                        "rng_seed": 42,
                    }
                ],
            }

        monkeypatch.setattr(
            "services.game_service.service.single_player_engine.da.get_tutorial_level",
            mock_get_tutorial_level,
        )
        monkeypatch.setattr(
            "services.game_service.service.single_player_engine.da.update_tutorial_status",
            lambda *args, **kwargs: None,
        )

        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="level-preload-reset", manual_tick_override=False
        )
        # Simulate stale preloaded drawdown state that must be reset before visible play.
        engine._max_drawdown_pct_seen = 0.4
        engine._peak_net_worth = 20000.0

        await engine.start()
        try:
            assert engine._max_drawdown_pct_seen == 0.0
            assert engine._peak_net_worth == pytest.approx(engine._calculate_net_worth())
        finally:
            await engine.stop()

    async def test_get_fe_game_state_includes_drawdown_when_tool_enabled(
        self, mock_data_access
    ):
        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="level1", manual_tick_override=False
        )
        await engine.start()

        try:
            engine.level_data.available_tools.drawdown_panel = True
            engine.game_state.avail_cash = 9000.0
            engine.game_state.reserved_cash = 0.0
            engine._peak_net_worth = 10000.0
            engine._max_drawdown_pct_seen = 0.11

            fe_state = await engine.get_fe_game_state()

            assert fe_state["netWorth"] == pytest.approx(9000.0)
            assert fe_state["drawdown_pct"] == pytest.approx(0.1)
            assert fe_state["max_drawdown_pct"] == pytest.approx(0.11)
        finally:
            await engine.stop()

    async def test_get_fe_game_state_omits_drawdown_when_tool_disabled(
        self, mock_data_access
    ):
        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="level1", manual_tick_override=False
        )
        await engine.start()

        try:
            engine.level_data.available_tools.drawdown_panel = False
            fe_state = await engine.get_fe_game_state()

            assert "drawdown_pct" not in fe_state
            assert "max_drawdown_pct" not in fe_state
        finally:
            await engine.stop()


class _MutablePriceSimulator:
    def __init__(self, price: float):
        self.price = float(price)

    def best_bid(self) -> float:
        return self.price

    def best_ask(self) -> float:
        return self.price

    def next_tick(self, _changes):
        return {"open": self.price, "high": self.price, "low": self.price, "close": self.price}


class TestStartingHoldingsAndProfitMissions:
    async def test_seeded_starting_positions_set_visible_start_baseline(
        self, monkeypatch
    ):
        def mock_get_tutorial_level(level_id):
            return {
                "level_id": level_id,
                "level_type": "tutorial",
                "tick_mode": "auto",
                "manual_start": True,
                "auto_tick_interval_seconds": 60,
                "starting_cash": 5000.0,
                "start_date": "2025-01-01",
                "end_date": "2025-01-10",
                "starting_tickers": ["AAPL"],
                "starting_positions": {"AAPL": {"qty": 10, "cost_basis": 100.0}},
                "is_manual_tick": False,
                "total_ticks": 10,
                "preloaded_ticks": 0,
                "news": {},
                "ticker_configs": [
                    {
                        "ticker": "AAPL",
                        "simulator_type": "orderbook",
                        "initial_fair_price": 100.0,
                        "base_volume": 10,
                        "volatility": 10,
                        "has_npc_orders": False,
                        "rng_seed": 42,
                    }
                ],
            }

        monkeypatch.setattr(
            "services.game_service.service.single_player_engine.da.get_tutorial_level",
            mock_get_tutorial_level,
        )
        monkeypatch.setattr(
            "services.game_service.service.single_player_engine.da.update_tutorial_status",
            lambda *args, **kwargs: None,
        )

        engine = SinglePlayerGameEngine(
            user_id="user1", level_id="seeded-start", manual_tick_override=False
        )
        await engine.start()

        try:
            engine.ticker_to_simulator["AAPL"] = _MutablePriceSimulator(100.0)
            engine._capture_starting_baselines()

            fe_state = await engine.get_fe_game_state()
            assert engine.game_state.positions["AAPL"].long_avail_qty == 10
            assert engine.game_state.positions["AAPL"].long_cost_basis == pytest.approx(
                100.0
            )
            assert fe_state["netWorth"] == pytest.approx(6000.0)
            assert fe_state["totalPL"] == pytest.approx(0.0)
            assert engine._starting_net_worth == pytest.approx(6000.0)
        finally:
            await engine.stop()

    async def test_pnl_at_end_mission_tracks_absolute_profit_threshold(
        self, monkeypatch
    ):
        def mock_get_tutorial_level(level_id):
            return {
                "level_id": level_id,
                "level_type": "tutorial",
                "tick_mode": "auto",
                "manual_start": True,
                "auto_tick_interval_seconds": 60,
                "starting_cash": 10000.0,
                "start_date": "2025-01-01",
                "end_date": "2025-01-10",
                "starting_tickers": ["AAPL"],
                "starting_positions": {"AAPL": {"qty": 100, "cost_basis": 100.0}},
                "is_manual_tick": False,
                "total_ticks": 10,
                "preloaded_ticks": 0,
                "news": {},
                "ticker_configs": [
                    {
                        "ticker": "AAPL",
                        "simulator_type": "orderbook",
                        "initial_fair_price": 100.0,
                        "base_volume": 10,
                        "volatility": 10,
                        "has_npc_orders": False,
                        "rng_seed": 42,
                    }
                ],
            }

        monkeypatch.setattr(
            "services.game_service.service.single_player_engine.da.get_tutorial_level",
            mock_get_tutorial_level,
        )
        monkeypatch.setattr(
            "services.game_service.service.single_player_engine.da.update_tutorial_status",
            lambda *args, **kwargs: None,
        )

        engine = SinglePlayerGameEngine(user_id="user1", level_id="profit-only", manual_tick_override=False)
        await engine.start()

        try:
            simulator = _MutablePriceSimulator(100.0)
            engine.ticker_to_simulator["AAPL"] = simulator
            engine._capture_starting_baselines()

            engine.level_data.passing_criteria = TutorialMissionCriteriaModel(
                type="all_of",
                missions=[
                    TutorialMissionModel(
                        id="profit_target",
                        type="pnl_at_end",
                        mission_params={"min_pnl": 300.0},
                    )
                ],
            )
            engine.level_data.bonus_missions = []

            simulator.price = 99.0  # net worth 19900 -> pnl -100
            below_target = engine._build_mission_progress(force_final=True, net_worth=19900.0)
            assert below_target["missions"]["profit_target"]["completed"] is False
            assert below_target["missions"]["profit_target"]["value"] == pytest.approx(-100.0)

            simulator.price = 104.0  # net worth 20400 -> pnl +400
            above_target = engine._build_mission_progress(force_final=True, net_worth=20400.0)
            assert above_target["missions"]["profit_target"]["completed"] is True
            assert above_target["missions"]["profit_target"]["value"] == pytest.approx(400.0)
        finally:
            await engine.stop()


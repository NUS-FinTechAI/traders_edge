"""Multiplayer game engine for concurrent multi-user trading sessions.

This module provides the MultiplayerGameEngine class, which extends GameEngine
to support real-time multiplayer trading games with WebSocket communication,
queue-based order processing, and concurrent market simulation.

The engine manages:
- Multiple users trading simultaneously in the same game session
- Per-ticker order queues for serialized order processing
- Shared fill queue for cross-simulator fill notifications
- Thread-safe state management via asyncio locks
- WebSocket event broadcasting to all connected clients

Typical usage:
    engine = MultiplayerGameEngine(level_id="mp_level_1")
    await engine.start()
    await engine.register_user(user_id="user123")
    await engine.register_order(order)
"""

import asyncio
from datetime import datetime
from typing import Any

from common import Order
from market_simulators import OrderbookSimulator
from services.game_service.models.game import (
    GameStateModel,
    LevelAvailableToolsModel,
    LevelDataModel,
    MultiplayerGameStateModel,
    OrderFill,
    Position,
)
from services.game_service.service.game_engine import GameEngine
from services.game_service.service.news_helpers import (
    derive_headline,
    normalize_level_news_entry_for_display,
)
from utils.constants import (
    BROADCAST_USER_ID,
    MARKET_BUY_RESERVE_MULTIPLIER,
    OrderAction,
    OrderType,
    SHORT_EXPOSURE_CAP_FRACTION,
    Status,
)


class MultiplayerGameEngine(GameEngine):
    """Multiplayer trading game engine with async queue-based architecture.

    Extends GameEngine to support concurrent multi-user trading sessions with
    WebSocket communication. Each game instance manages multiple users trading
    in the same market environment with shared price feeds and independent
    positions/cash balances.

    Architecture:
        - Per-ticker order queues: Serializes order processing for each ticker
          to ensure deterministic execution order
        - Shared fill queue: Central queue where all simulators publish fill
          events for processing by the fill listener task
        - Background tasks: Each simulator runs in its own async task processing
          orders from its queue
        - Fill listener task: Single task consuming fills from the shared queue
          and updating game state accordingly
        - Thread safety: asyncio.Lock (state_lock) protects all game state
          modifications

    Tick Modes:
        - Manual-tick mode: User explicitly triggers each market tick via UI
          action (legacy tutorial flow)
        - Auto-tick mode: Market advances automatically at configured intervals
          (orderbook/bid-ask simulation flow)
    """
    @classmethod
    def _room_tool_keys(cls) -> tuple[str, ...]:
        """Return the canonical set of room-toggle keys supported in multiplayer.

        This includes base level tool keys plus multiplayer-only extras.
        """
        return tuple(
            dict.fromkeys(
                [
                    *LevelAvailableToolsModel.model_fields.keys(),
                    *cls.EXTRA_ROOM_TOOL_KEYS,
                ]
            )
        )

    @property
    def is_game_over(self) -> bool:
        """Check if game has reached the final tick.

        Returns:
            True if current tick >= total_ticks, False otherwise.
        """
        return self.game_state.tick >= self.level_data.total_ticks

    def __init__(
        self,
        level_id: str,
    ) -> None:
        """Initialize multiplayer game engine for a specific level.

        Args:
            level_id: Unique identifier for the multiplayer level to load.
                Used to fetch level configuration from database.
        """
        super().__init__(mode="Multiplayer")
        self.level_id: str = level_id
        # Maps user_id (Firebase UID) → human-readable user_name. Populated as
        # users join via register_user. Not cached aggressively because a user
        # may rename mid-session; we accept the small drift between joins and
        # the next activePlayersResponse broadcast.
        self._user_names: dict[str, str] = {}
        self.init_game()

    def get_user_names(self) -> dict[str, str]:
        """Snapshot of UID → display name for everyone currently registered."""
        return dict(self._user_names)

    # ----------- Initialization Helpers --------------
    # Currently, multiplayer has this as its default, demo setting.
    # The current configuration is hardcoded but this can be extended in the future to load different levels with different settings.
    # This will provide a basic trading scenario that multiple users can join and interact with, 
    # and can be used for testing and demonstration purposes.

    # When NPC orders are enabled, a tick is sent every 2 seconds
    DEFAULT_MULTIPLAYER_AUTO_TICK_SECONDS = 2

    # When NPC orders are disabled, ticks are slower since actual players make decisions slower.
    NO_NPC_MULTIPLAYER_AUTO_TICK_SECONDS = 60

    EXTRA_ROOM_TOOL_KEYS = ("fake_news", "private_chat")
    ALWAYS_ENABLED_TOOLS = {"bid_ask_spread"}
    
    def _init_with_level_data(self) -> None:
        """Initialize multiplayer level data with hardcoded orderbook-only config."""
        hard_coded_level_json = {
            "level_id": "mp-test-hardcoded",
            "level_type": "puzzle",
            "tick_mode": "auto",
            "manual_start": False,
            "auto_tick_interval_seconds": self.DEFAULT_MULTIPLAYER_AUTO_TICK_SECONDS,
            "start_date": "2024-01-01",
            "end_date": "2024-01-31",
            "starting_tickers": ["AAPL", "NVDA"],
            "starting_cash": 100000.0,
            "total_ticks": 240,
            "is_manual_tick": False,
            "interval": str(self.DEFAULT_MULTIPLAYER_AUTO_TICK_SECONDS),
            "news": {
                8: {
                    "AAPL": [
                        (
                            "Supply Chain Shock Hits Tech",
                            "Key component deliveries are now expected to slip into next week.\n"
                            "Traders are lowering near-term shipment assumptions for mega-cap tech.\n"
                            "Risk appetite is fading as analysts cut short-horizon estimates.",
                            -0.02,
                            4,
                        )
                    ],
                    "NVDA": [
                        (
                            "Supply Chain Shock Hits Tech",
                            "Key component deliveries are now expected to slip into next week.\n"
                            "Traders are lowering near-term shipment assumptions for mega-cap tech.\n"
                            "Risk appetite is fading as analysts cut short-horizon estimates.",
                            -0.02,
                            4,
                        )
                    ],
                },
                20: {
                    "NVDA": [
                        (
                            "AI Orders Surge Again",
                            "Cloud operators sign fresh capacity commitments for accelerator clusters.\n"
                            "Channel checks suggest demand is running ahead of prior guidance.\n"
                            "Momentum buyers are rotating back into AI infrastructure names.",
                            0.03,
                            6,
                        )
                    ]
                },
                60: {
                    "AAPL": [
                        (
                            "Services Growth Tops Forecasts",
                            "Subscription renewals and digital services spend both beat internal targets.\n"
                            "Margin expectations are improving as high-value revenue mix expands.\n"
                            "Analysts are revisiting earnings estimates after the latest update.",
                            0.015,
                            5,
                        )
                    ]
                },
            },
            "news_effects": {
                8: {
                    "AAPL": [(-0.02, 4)],
                    "NVDA": [(-0.02, 4)],
                },
                20: {"NVDA": [(0.03, 6)]},
                60: {"AAPL": [(0.015, 5)]},
            },
            "ticker_configs": [
                {
                    "ticker": "AAPL",
                    "simulator_type": "orderbook",
                    "initial_fair_price": 180.0,
                    "base_volume": 12,
                    "volatility": 10,
                    "has_npc_orders": True,
                    "rng_seed": None,
                },
                {
                    "ticker": "NVDA",
                    "simulator_type": "orderbook",
                    "initial_fair_price": 850.0,
                    "base_volume": 8,
                    "volatility": 12,
                    "has_npc_orders": True,
                    "rng_seed": None,
                },
            ],
            "available_tools": {
                tool_key: True
                for tool_key in self._room_tool_keys()
            },
        }

        self.level_data = LevelDataModel.model_validate(hard_coded_level_json)

    def configure_room_features(
        self,
        *,
        has_npc_orders: bool,
        available_tools: dict[str, bool],
    ) -> None:
        """Apply host-selected room configuration to engine runtime state.

        This is the main entry point used by the websocket router when a room
        is first instantiated.
        """
        resolved_tools = self._resolve_room_available_tools(
            requested_tools=available_tools,
            has_npc_orders=has_npc_orders,
        )
        for tool_key, enabled in resolved_tools.items():
            setattr(self.level_data.available_tools, tool_key, enabled)
        self._room_available_tools = resolved_tools
        self._apply_room_has_npc_orders(has_npc_orders)

    @classmethod
    def _resolve_room_available_tools(
        cls, *, requested_tools: dict[str, bool] | None, has_npc_orders: bool
    ) -> dict[str, bool]:
        """Normalize incoming room tool toggles into the effective tool map.

        Rules:
        - Unknown/omitted tools default to enabled in multiplayer.
        - `bid_ask_spread` is always enabled.
        - No-NPC rooms force `market_order=False` and `limit_order=True`.
        """
        resolved = {tool_key: True for tool_key in cls._room_tool_keys()}
        incoming = requested_tools or {}
        for tool_key, enabled in incoming.items():
            # Should technically already be enforced in build_room_features in router, but acts as extra guard
            if tool_key in cls.ALWAYS_ENABLED_TOOLS:
                continue
            resolved[tool_key] = bool(enabled)

        # Bid/ask is always visible in multiplayer
        resolved["bid_ask_spread"] = True
        if not has_npc_orders:
            # Currently, no-NPC mode only sipports limit orders due to the lack of synthetic NPC liquidity that would make market orders viable. 
            # This can be revisited in the future by enabling when there's liquidity
            # But we just keep things simple for now.
            resolved["market_order"] = False
            resolved["limit_order"] = True
        return resolved

    def _apply_room_has_npc_orders(self, has_npc_orders: bool) -> None:
        """Apply NPC-liquidity mode to engine clocks and per-ticker simulators."""

        self._room_has_npc_orders = bool(has_npc_orders)
        
        # No-NPC rooms tick much slower because the market is player-driven.
        self.level_data.auto_tick_interval_seconds = (
            self.DEFAULT_MULTIPLAYER_AUTO_TICK_SECONDS
            if has_npc_orders
            else self.NO_NPC_MULTIPLAYER_AUTO_TICK_SECONDS
        )
        self.level_data.interval = str(self.level_data.auto_tick_interval_seconds)
        # Update tick config
        for ticker_cfg in self.level_data.ticker_configs:
            ticker_cfg["has_npc_orders"] = has_npc_orders
        # Update live simulators used by current room runtime immediately
        for ticker in self.level_data.starting_tickers:
            simulator = self.ticker_to_simulator.get(ticker)
            if isinstance(simulator, OrderbookSimulator):
                simulator.has_npc_orders = has_npc_orders

    async def _on_simulator_event_processed(
        self, ticker: str, event: dict[str, Any]
    ) -> None:
        """Post-process simulator register/cancel events for no-NPC rooms.

        In no-NPC mode, there may be long gaps between timed ticks. This hook
        pushes an immediate order-book snapshot after register/cancel so clients
        see updated bids/asks without waiting for the next scheduled tick.
        """
        # NPC mode already emits frequent activity via regular ticks/fills.
        if self._room_has_npc_orders:
            return

        event_type = event.get("type")
        if event_type not in {"register", "cancel"}:
            return

        if event_type == "register":
            order = event.get("order")
            if not isinstance(order, Order):
                return
            # In no-NPC mode the room only accepts priced limit orders.
            if order.order_type != OrderType.LIMIT:
                return

        simulator = self.ticker_to_simulator.get(ticker)
        if not isinstance(simulator, OrderbookSimulator):
            return

        ticker_snapshot = simulator.order_book.get_order_book_snapshot()
        async with self.state_lock:
            users = list(self.game_state.user_states.keys())
            tick_value = int(self.game_state.tick)

        # Emit as a dedicated no-NPC orderbook update event (separate from the
        # regular turn-advancing `next_tick` event) containing only this
        # ticker's updated book snapshot.
        payload = {
            "tick": tick_value,
            "data": {
                ticker: ticker_snapshot,
            },
        }
        for user_id in users:
            self.emit("no_npc_orderbook_update", user_id, payload)

    def _init_with_user_progress(self) -> None:
        """Initialize a fresh game state for every level start.

        User in-level progress is not resumed from storage. Each start begins
        from starting cash and tick -1.
        """
        self.game_state = MultiplayerGameStateModel()
        self.game_state.tick = -1

    def _init_local_vars(self) -> None:
        """Initialize order queues, simulators, and order tracking.

        Creates per-ticker order queues for serialized order processing and
        initializes market simulators. Also reconstructs order_id_to_order mapping
        from existing logbook.

        Multiplayer currently runs orderbook-only tick simulation.
        """
        ticker_configs_by_symbol = {
            cfg.get("ticker"): cfg for cfg in self.level_data.ticker_configs
        }

        for ticker in self.level_data.starting_tickers:
            # Create queue for this ticker.
            self.order_queues[ticker] = asyncio.Queue()
            ticker_cfg = ticker_configs_by_symbol.get(ticker) or {}
            orderbook = OrderbookSimulator(
                fill_queue=self.fill_queue,
                ticker=ticker,
                volume=int(ticker_cfg.get("base_volume") or 10),
                volatility=int(ticker_cfg.get("volatility") or 10),
                seed=ticker_cfg.get("rng_seed"),
                has_npc_orders=bool(
                    ticker_cfg.get("has_npc_orders")
                    if ticker_cfg.get("has_npc_orders") is not None
                    else True
                ),
            )
            if ticker_cfg.get("initial_fair_price") is not None:
                initial_price = float(ticker_cfg["initial_fair_price"])
                orderbook.fair_price = initial_price
                orderbook.previous_price = initial_price
            self.ticker_to_simulator[ticker] = orderbook

        for order in self.game_state.logbook:
            self.order_id_to_order[order.order_id] = order

        self._starting_net_worth_by_user: dict[str, float] = {}
        self._room_has_npc_orders = all(
            bool(getattr(simulator, "has_npc_orders", True))
            for simulator in self.ticker_to_simulator.values()
        )
        self._room_available_tools = self._resolve_room_available_tools(
            requested_tools=self.level_data.available_tools.model_dump(),
            has_npc_orders=self._room_has_npc_orders,
        )

    # ---------- Accessors ----------------
    def _get_current_prices(self) -> dict[str, float]:
        prices: dict[str, float] = {}
        for ticker in self.level_data.starting_tickers:
            simulator = self.ticker_to_simulator.get(ticker)
            if simulator is None:
                prices[ticker] = 0.0
                continue
            try:
                prices[ticker] = float(simulator.best_bid())
            except Exception:
                prices[ticker] = 0.0
        return prices

    def _build_fe_game_state_from_prices(
        self, user_id: str, prices_by_ticker: dict[str, float]
    ) -> dict[str, Any]:
        user_state = self.game_state.user_states[user_id]
        ret: dict[str, Any] = {}
        total_value_all_stocks = 0.0

        for ticker in self.level_data.starting_tickers:
            pos = user_state.positions.get(ticker, Position())
            long_total_qty = pos.long_avail_qty + pos.long_reserved_qty
            short_total_qty = pos.short_avail_qty + pos.short_reserved_qty
            net_qty = long_total_qty - short_total_qty
            closing_price = float(prices_by_ticker.get(ticker, 0.0))
            long_value = long_total_qty * closing_price
            short_liability = short_total_qty * closing_price
            net_position_value = long_value - short_liability
            total_value_all_stocks += net_position_value
            unrealized_long_pl = (closing_price - pos.long_cost_basis) * long_total_qty
            unrealized_short_pl = (pos.short_entry_price - closing_price) * short_total_qty

            ret[ticker] = {
                "longAvailQty": pos.long_avail_qty,
                "longReservedQty": pos.long_reserved_qty,
                "longCostBasis": pos.long_cost_basis,
                "longTotalQty": long_total_qty,
                "shortAvailQty": pos.short_avail_qty,
                "shortReservedQty": pos.short_reserved_qty,
                "shortEntryPrice": pos.short_entry_price,
                "shortTotalQty": short_total_qty,
                "netQty": net_qty,
                "closingPrice": closing_price,
                "longValue": long_value,
                "shortLiability": short_liability,
                "netPositionValue": net_position_value,
                "unrealizedLongPL": unrealized_long_pl,
                "unrealizedShortPL": unrealized_short_pl,
                "unrealizedPL": unrealized_long_pl + unrealized_short_pl,
            }

        ret["availCash"] = user_state.avail_cash
        ret["reservedCash"] = user_state.reserved_cash
        ret["tick"] = self.game_state.tick
        ret["totalValueAllStocks"] = total_value_all_stocks
        ret["netWorth"] = total_value_all_stocks + ret["availCash"] + ret["reservedCash"]
        starting_net_worth = float(
            self._starting_net_worth_by_user.get(user_id, self.level_data.starting_cash)
        )
        ret["totalPL"] = ret["netWorth"] - starting_net_worth
        return ret

    async def get_fe_game_state(self, user_id: str) -> dict[str, Any]:
        """Retrieve game state with calculated frontend-friendly values.

        Returns position data, cash balances, and derived metrics including:
        - Position details (long and short legs)
        - Unrealized P&L for each ticker
        - Total net worth and total P&L

        Thread-safe: Acquires state_lock for reading game state.
        """
        prices_by_ticker = self._get_current_prices()
        async with self.state_lock:
            return self._build_fe_game_state_from_prices(user_id, prices_by_ticker)

    async def get_game_state(self, user_id: str) -> dict[str, Any]:
        """Retrieve raw game state without modifications.

        Thread-safe: Acquires state_lock for reading.

        Returns:
            Dictionary representation of current game state for user_id.
        """
        async with self.state_lock:
            user_model = self.game_state.user_states[user_id]
            user_model.tick = self.game_state.tick
            return user_model.model_dump()

    # ---------- start ----------------
    async def start(self) -> None:
        """Start the multiplayer game engine and broadcast game start event."""
        await super().start()
        self.emit(
            "game_start",
            BROADCAST_USER_ID,
            {"msg": "Game has started!"},
        )

    async def register_user(
        self,
        user_id: str,
        host_user_id: str | None = None,
        user_name: str | None = None,
        host_user_name: str | None = None,
    ) -> None:
        """Register a new user to the game.

        Initializes user state with starting cash and seeded/empty positions, and
        emits a user-scoped register payload.

        Args:
            user_id: Unique identifier for the user joining the game.
            host_user_id: Current room host user id.
            user_name: Optional public display name for this user. Stored on the
                engine so the active-players payload can surface human-readable
                names alongside the (post-Firebase, opaque) UIDs.
            host_user_name: Optional public display name for the host.
        """
        if user_name:
            self._user_names[user_id] = user_name
        if host_user_id and host_user_name:
            self._user_names[host_user_id] = host_user_name

        async with self.state_lock:
            if user_id in self.game_state.user_states:
                return

            user_positions: dict[str, Position] = {}
            for ticker in self.level_data.starting_tickers:
                seeded = self.level_data.starting_positions.get(ticker)
                if seeded is not None and seeded.qty > 0:
                    user_positions[ticker] = Position(
                        long_avail_qty=int(seeded.qty),
                        long_cost_basis=float(seeded.cost_basis),
                    )
                else:
                    user_positions[ticker] = Position(
                        long_avail_qty=100,
                        long_cost_basis=100.0,
                    )

            self.game_state.user_states[user_id] = GameStateModel(
                avail_cash=self.level_data.starting_cash,
                positions=user_positions,
            )

        game_state = await self.get_game_state(user_id)
        fe_state = await self.get_fe_game_state(user_id)
        self._starting_net_worth_by_user[user_id] = float(fe_state.get("netWorth", 0.0))

        resp = {**self.get_level_data(), **game_state}
        del resp["news"]
        resp.pop("is_manual_tick", None)
        resp.pop("news_effects", None)
        resp["starting_net_worth"] = fe_state.get("netWorth")
        resp["host"] = host_user_id
        resp["host_name"] = self._user_names.get(host_user_id) if host_user_id else None
        resp["user_name"] = self._user_names.get(user_id)
        resp["has_npc_orders"] = self._room_has_npc_orders
        resp["room_available_tools"] = self._room_available_tools
        self.emit("register_user", user_id, resp)

    # ---------- Next tick and its helpers ----------------
    async def next_tick_logic(self) -> dict[str, Any]:
        """Advance game to next trading tick.

        Increments tick counter, validates reserved funds consistency, and
        retrieves next tick data from all simulators including news events.

        Returns:
            Dictionary with simulator data for each ticker and news for current tick.
            Empty if game is over.
        """
        async with self.state_lock:
            self.game_state.tick += 1
            self.validate_reserved_funds()
            if self.is_game_over:
                ret = await self.on_game_over()
                payload = {"data": ret}
                self.emit("game_over", BROADCAST_USER_ID, payload)
                return ret
            users_in_tick = list(self.game_state.user_states.keys())
            current_tick = self.game_state.tick

        ret: dict[str, Any] = {}
        news_payload_by_key: dict[tuple[str, str], dict[str, str | None]] = {}
        news = self.level_data.news.get(current_tick, {})
        scheduled_effects = self.level_data.news_effects.get(current_tick, {})
        for ticker in self.level_data.starting_tickers:
            ticker_news = news.get(ticker, [])
            changes: list[tuple[float, int]] = []
            for raw_news_entry in ticker_news:
                headline, content = normalize_level_news_entry_for_display(raw_news_entry)
                dedupe_key = (headline, content)
                existing_payload = news_payload_by_key.get(dedupe_key)
                if existing_payload is None:
                    news_payload_by_key[dedupe_key] = {
                        "title": headline,
                        "content": content,
                        "ticker": ticker,
                    }
                elif existing_payload.get("ticker") != ticker:
                    existing_payload["ticker"] = None

            if not self.level_data.is_manual_tick:
                for change_pct, change_ticks in scheduled_effects.get(ticker, []):
                    if change_pct != 0 and change_ticks > 0:
                        changes.append((change_pct, change_ticks))
            ret[ticker] = self.ticker_to_simulator[ticker].next_tick(changes)
        ret["news"] = list(news_payload_by_key.values())

        for user in users_in_tick:
            game_state_payload = await self.get_fe_game_state(user)
            async with self.state_lock:
                user_state = self.game_state.user_states[user]
                logbook_snapshot = [order.model_dump() for order in user_state.logbook]
                fills_snapshot = [fill.model_dump() for fill in user_state.fills]
            payload = {
                "data": ret,
                "gameState": game_state_payload,
                "logbook": logbook_snapshot,
                "fills": fills_snapshot,
            }
            self.emit("next_tick", user, payload)

        return ret

    def validate_reserved_funds(self) -> None:
        """Verify reserved cash matches sum of active buy-side orders.

        Asserts that `reserved_cash` equals the sum of `reserved_funds` across
        all OPEN and PARTIALLY_FILLED BUY/BUY_TO_COVER orders.
        """
        for user_state in self.game_state.user_states.values():
            total_reserved = 0.0
            for order in user_state.logbook:
                if order.action in (OrderAction.BUY, OrderAction.BUY_TO_COVER) and (
                    order.status == Status.OPEN
                    or order.status == Status.PARTIALLY_FILLED
                ):
                    total_reserved += order.reserved_funds
            if abs(total_reserved - user_state.reserved_cash) > 1e-6:
                raise AssertionError("Inconsistent reserved cash")

    def _estimate_buy_reserve_price(self, order: Order) -> float:
        """Estimate worst-case buy-side cash reservation for order registration.

        BUY and BUY_TO_COVER reserve cash before fill. MARKET uses a safety
        multiplier on best ask so fast upticks do not immediately create
        negative available cash between registration and execution.
        """
        match order.order_type:
            case OrderType.MARKET:
                return (
                    self.ticker_to_simulator[order.ticker].best_ask()
                    * MARKET_BUY_RESERVE_MULTIPLIER
                )
            case OrderType.LIMIT:
                return float(order.price or 0.0)
            case OrderType.STOP:
                trigger = order.stop_price if order.stop_price is not None else order.price
                return float(trigger or 0.0)
            case OrderType.STOP_LIMIT:
                return float(order.price or 0.0)
            case _:
                raise Exception("Unknown order type")

    def _estimate_sell_notional_price(self, order: Order) -> float:
        """Estimate sell-side notional used for short-exposure validation."""
        match order.order_type:
            case OrderType.MARKET:
                return float(self.ticker_to_simulator[order.ticker].best_bid())
            case OrderType.LIMIT:
                return float(order.price or 0.0)
            case OrderType.STOP:
                trigger = order.stop_price if order.stop_price is not None else order.price
                return float(trigger or 0.0)
            case OrderType.STOP_LIMIT:
                return float(order.price or 0.0)
            case _:
                raise Exception("Unknown order type")

    def _current_short_exposure(
        self, user_state: GameStateModel, prices_by_ticker: dict[str, float]
    ) -> float:
        """Mark-to-market exposure of currently open short inventory."""
        exposure = 0.0
        for ticker, pos in user_state.positions.items():
            short_total_qty = pos.short_avail_qty + pos.short_reserved_qty
            if short_total_qty <= 0:
                continue
            price = float(
                prices_by_ticker.get(ticker)
                or pos.short_entry_price
                or pos.long_cost_basis
                or 0.0
            )
            exposure += short_total_qty * price
        return exposure

    def _pending_short_exposure(self, user_state: GameStateModel) -> float:
        """Exposure of unfilled portions of active SELL_SHORT orders."""
        exposure = 0.0
        for order in user_state.logbook:
            if order.action != OrderAction.SELL_SHORT:
                continue
            if order.status not in (Status.OPEN, Status.PARTIALLY_FILLED):
                continue
            pending_qty = max(0, int(order.qty_left))
            if pending_qty <= 0:
                continue
            price = self._estimate_sell_notional_price(order)
            exposure += pending_qty * price
        return exposure

    def _validate_short_exposure_cap(self, user_state: GameStateModel, order: Order) -> None:
        """Reject SELL_SHORT if projected short exposure exceeds configured cap.

        Projected exposure combines:
        - current open short inventory
        - pending open short orders
        - this incoming short order
        """
        prices_by_ticker = self._get_current_prices()
        current_exposure = self._current_short_exposure(user_state, prices_by_ticker)
        pending_exposure = self._pending_short_exposure(user_state)
        order_exposure = order.qty * self._estimate_sell_notional_price(order)
        projected_exposure = current_exposure + pending_exposure + order_exposure
        net_worth = float(self._calculate_net_worth(order.user_id, prices_by_ticker=prices_by_ticker))
        cap = max(0.0, net_worth * SHORT_EXPOSURE_CAP_FRACTION)
        if projected_exposure > cap:
            raise Exception("Short exposure cap exceeded for this level")

    def _validate_order_tool_access(self, order: Order) -> None:
        tools = self.level_data.available_tools.model_dump()
        if not any(bool(enabled) for enabled in tools.values()):
            return

        required_tool_by_order_type = {
            OrderType.MARKET: "market_order",
            OrderType.LIMIT: "limit_order",
            OrderType.STOP: "stop_order",
            OrderType.STOP_LIMIT: "stop_limit_order",
        }
        required_tool = required_tool_by_order_type.get(order.order_type)
        if required_tool is None:
            raise Exception("Unknown order type")
        if not bool(getattr(self.level_data.available_tools, required_tool, False)):
            raise Exception(
                f"{required_tool.replace('_', ' ').title()} is not unlocked in this level"
            )
        if order.action in (OrderAction.SELL_SHORT, OrderAction.BUY_TO_COVER):
            # Short actions are guarded by an explicit feature flag.
            if not bool(getattr(self.level_data.available_tools, "short_selling", False)):
                raise Exception("Short selling is not unlocked in this level")

    def _validate_room_order_constraints(self, order: Order) -> None:
        """Enforce room-mode order constraints that are independent of tool unlocks."""
        if self._room_has_npc_orders:
            return
        # Player-only mode does not allow market execution because there is no
        # synthetic liquidity provider. Orders must be priced limits.
        if order.order_type != OrderType.LIMIT:
            raise Exception(
                "NPC orders are disabled in this room. Use priced limit orders."
            )

    # --------- register_order and its helpers ------------
    async def register_order(self, order: Order) -> dict[str, Any]:
        """Validate and enqueue a new order for processing.

        Validates order (fund availability, position availability for close actions),
        reserves necessary funds/positions, and enqueues order to simulator.

        Thread-safe: Acquires state_lock for validation and state updates.

        Args:
            order: Order object with action, qty, ticker, and order_type.

        Returns:
            - On success: {"result": "PASS", "order_id": str, "reserved": float}
            - On failure: {"result": "FAIL", "order_id": str, "reason": str}
        """
        if order.qty <= 0:
            return {
                "result": "FAIL",
                "order_id": "",
                "reason": "Order quantity must be positive",
            }

        async with self.state_lock:
            user_state = self.game_state.user_states.get(order.user_id)
            if user_state is None:
                return {
                    "result": "FAIL",
                    "order_id": "",
                    "reason": "User is not registered in this game",
                }

            self.assign_order_id(order)

            try:
                # Room-level constraints are checked before generic tool gates so
                # users receive the most specific no-NPC rejection reason.
                self._validate_room_order_constraints(order)
                self._validate_order_tool_access(order)
                self._validate_position_qty_for_action(user_state, order)
                if order.action == OrderAction.SELL_SHORT:
                    # New short opens are additionally bounded by portfolio-level exposure.
                    self._validate_short_exposure_cap(user_state, order)
                reserve_fund = self._validate_fund_sufficient(user_state, order)
            except Exception as e:
                return {"result": "FAIL", "order_id": order.order_id, "reason": str(e)}

            self.order_id_to_order[order.order_id] = order
            order.reserved_funds = reserve_fund
            order.tick = self.game_state.tick
            self._reserve_funds(user_state, reserve_fund)
            self._reserve_position_for_close_action(user_state, order)
            self.game_state.logbook.append(order)
            user_state.logbook.append(order)

        await self.order_queues[order.ticker].put({"type": "register", "order": order})

        return {
            "result": "PASS",
            "order_id": order.order_id,
            "reserved": reserve_fund,
            "order_type": order.order_type.value,
            "action": order.action.value,
            "ticker": order.ticker,
        }

    def _validate_position_qty_for_action(
        self, user_state: GameStateModel, order: Order
    ) -> None:
        pos = user_state.positions.get(order.ticker, Position())
        # SELL and BUY_TO_COVER close existing legs and therefore require
        # unreserved inventory on the corresponding leg.
        if order.action == OrderAction.SELL and order.qty > pos.long_avail_qty:
            raise Exception("Not enough unreserved long stock to sell")
        if order.action == OrderAction.BUY_TO_COVER and order.qty > pos.short_avail_qty:
            raise Exception("Not enough unreserved short stock to cover")

    def _validate_fund_sufficient(self, user_state: GameStateModel, order: Order) -> float:
        if order.action in (OrderAction.SELL, OrderAction.SELL_SHORT):
            # Sell-side actions do not reserve cash up front; cash is credited on fill.
            return 0.0
        price = self._estimate_buy_reserve_price(order)
        if not price:
            raise Exception("Unknown exception: price is None")
        required_price = price * order.qty
        if required_price > user_state.avail_cash:
            raise Exception("Insufficient funds to buy")
        return required_price

    def _reserve_position_for_close_action(
        self, user_state: GameStateModel, order: Order
    ) -> None:
        pos = user_state.positions.setdefault(order.ticker, Position())
        if order.action == OrderAction.SELL:
            # Reserve long inventory for pending close-long orders.
            pos.long_avail_qty -= order.qty
            pos.long_reserved_qty += order.qty
        elif order.action == OrderAction.BUY_TO_COVER:
            # Reserve short inventory for pending cover orders.
            pos.short_avail_qty -= order.qty
            pos.short_reserved_qty += order.qty

    def _reserve_funds(self, user_state: GameStateModel, reserve_fund: float) -> None:
        user_state.avail_cash -= reserve_fund
        user_state.reserved_cash += reserve_fund

    @staticmethod
    def _next_fill_id(user_state: GameStateModel, order_id: str) -> str:
        fill_count = sum(1 for fill in user_state.fills if fill.order_id == order_id)
        return f"{order_id}-fill-{fill_count + 1}"

    # ---------- on_fill and its helpers ------------
    def on_fill(self, order_id: str, price: float, qty: int, qty_left: int) -> None:
        """Process partial/full order fill and update user game state.

        Updates order status, average fill price, long/short position quantities,
        reserved/available cash, appends a canonical fill record, and emits a
        websocket `orderFilled` event.

        Args:
            order_id: ID of order being filled.
            price: Execution price per share.
            qty: Number of shares filled in this fill event.
            qty_left: Remaining quantity after this fill.
        """
        order: Order = self.order_id_to_order[order_id]
        game_state = self.game_state.user_states[order.user_id]
        order.qty_left = qty_left

        order.status = Status.FILLED if order.qty_left == 0 else Status.PARTIALLY_FILLED

        total_qty_filled = order.qty - order.qty_left
        prev_qty_filled = total_qty_filled - qty
        if prev_qty_filled < 0:
            raise Exception("Inconsistent fill sequence: cumulative qty is below fill qty")
        price_already_filled = order.price_filled * prev_qty_filled
        price_currently_filled = price * qty
        if total_qty_filled > 0:
            order.price_filled = (
                price_already_filled + price_currently_filled
            ) / total_qty_filled

        pos = game_state.positions.setdefault(order.ticker, Position())
        if order.action == OrderAction.BUY:
            # Open/increase long leg and recompute long cost basis.
            prior_long_qty = pos.long_avail_qty
            next_long_qty = prior_long_qty + qty
            if next_long_qty > 0:
                pos.long_cost_basis = (
                    (pos.long_cost_basis * prior_long_qty) + (price * qty)
                ) / next_long_qty
            pos.long_avail_qty = next_long_qty
        elif order.action == OrderAction.SELL:
            # Consume reserved long inventory as close-long fills arrive.
            pos.long_reserved_qty -= qty
            remaining_long = pos.long_avail_qty + pos.long_reserved_qty
            if remaining_long <= 0:
                pos.long_cost_basis = 0.0
        elif order.action == OrderAction.SELL_SHORT:
            # Open/increase short leg and recompute blended short entry price.
            prior_short_qty = pos.short_avail_qty + pos.short_reserved_qty
            next_short_qty = prior_short_qty + qty
            if next_short_qty > 0:
                pos.short_entry_price = (
                    (pos.short_entry_price * prior_short_qty) + (price * qty)
                ) / next_short_qty
            pos.short_avail_qty += qty
        elif order.action == OrderAction.BUY_TO_COVER:
            # Consume reserved short inventory as cover fills arrive.
            pos.short_reserved_qty -= qty
            remaining_short = pos.short_avail_qty + pos.short_reserved_qty
            if remaining_short <= 0:
                pos.short_entry_price = 0.0

        if order.action in (OrderAction.BUY, OrderAction.BUY_TO_COVER):
            # Buy-side actions spend reserved cash first, then available cash
            # if execution is worse than reservation estimate.
            fill_cost = price * qty
            reserve_used = min(order.reserved_funds, fill_cost)
            game_state.reserved_cash -= reserve_used
            order.reserved_funds -= reserve_used

            uncovered_cost = fill_cost - reserve_used
            if uncovered_cost > 0:
                game_state.avail_cash -= uncovered_cost

            # Release any unused reserve once the order is fully filled.
            if order.status == Status.FILLED and order.reserved_funds > 0:
                game_state.reserved_cash -= order.reserved_funds
                game_state.avail_cash += order.reserved_funds
                order.reserved_funds = 0.0
        else:
            # Sell-side actions realize proceeds immediately on each fill.
            game_state.avail_cash += price * qty

        if order.status == Status.FILLED:
            order.filled_tick = self.game_state.tick

        fill_record = OrderFill(
            fill_id=self._next_fill_id(game_state, order_id),
            order_id=order_id,
            user_id=order.user_id,
            action=order.action,
            direction=order.direction,
            order_type=order.order_type,
            ticker=order.ticker,
            qty=qty,
            qty_left=order.qty_left,
            price=float(price),
            cumulative_qty_filled=(order.qty - order.qty_left),
            tick=int(self.game_state.tick),
            ts=datetime.now().isoformat(),
        )
        game_state.fills.append(fill_record)

        prices_by_ticker = self._get_current_prices()
        game_state_payload = self._build_fe_game_state_from_prices(
            user_id=order.user_id,
            prices_by_ticker=prices_by_ticker,
        )
        self.emit(
            "orderFilled",
            order.user_id,
            {
                "order": order.model_dump(),
                "fill": fill_record.model_dump(),
                "gameState": game_state_payload,
            },
        )

    # --------- cancel_order and its helpers ------------
    async def cancel_order(self, order_id: str) -> dict[str, Any]:
        """Cancel an open or partially-filled order.

        Sends cancel event to simulator and releases reserved funds/position
        quantities. Validates order status before and after simulator
        communication to handle races with incoming fills.

        Args:
            order_id: ID of order to cancel.

        Returns:
            - On success: {"result": "PASS", "order_id": str, "reserved": float}
            - On failure: {"result": "FAIL", "order_id": str, "message": str}
        """
        async with self.state_lock:
            order: Order | None = self.order_id_to_order.get(order_id)
            if order is None:
                return {
                    "result": "FAIL",
                    "order_id": order_id,
                    "message": "No such order",
                }

            if order.status not in [Status.OPEN, Status.PARTIALLY_FILLED]:
                return {
                    "result": "FAIL",
                    "order_id": order_id,
                    "message": f"Unable to cancel an order that is {order.status}",
                }

            ticker = order.ticker

        # Send cancel event to simulator (outside lock).
        await self.order_queues[ticker].put({"type": "cancel", "order_id": order_id})

        if order.status == Status.FILLED:
            return {
                "result": "FAIL",
                "order_id": order_id,
                "message": "Order already filled",
            }

        # Update state (with lock).
        async with self.state_lock:
            game_state = self.game_state.user_states[order.user_id]
            released_reserved_funds = order.reserved_funds
            if order.action in (OrderAction.BUY, OrderAction.BUY_TO_COVER):
                game_state.avail_cash += released_reserved_funds
                game_state.reserved_cash -= released_reserved_funds
                order.reserved_funds = 0.0
            elif order.action == OrderAction.SELL:
                pos = game_state.positions[order.ticker]
                if order.qty_left > pos.long_reserved_qty:
                    raise Exception(
                        "Inconsistent state: trying to cancel more than reserved"
                    )
                pos.long_reserved_qty -= order.qty_left
                pos.long_avail_qty += order.qty_left

            elif order.action == OrderAction.BUY_TO_COVER:
                # Return unfilled cover quantity to short available inventory.
                pos = game_state.positions[order.ticker]
                if order.qty_left > pos.short_reserved_qty:
                    raise Exception(
                        "Inconsistent state: trying to cancel more than reserved"
                    )
                pos.short_reserved_qty -= order.qty_left
                pos.short_avail_qty += order.qty_left

            order.status = Status.CANCELED
            order.filled_tick = self.game_state.tick

        return {
            "result": "PASS",
            "order_id": order_id,
            "reserved": released_reserved_funds,
        }

    # --------- game_end and its helpers ------------
    async def on_game_over(self) -> dict[str, Any]:
        """Finalize game and return per-user net worth snapshot."""
        self._running = False

        net_worths: dict[str, float] = {}
        for user_id in self.game_state.user_states:
            net_worths[user_id] = self._calculate_net_worth(user_id)

        return {
            "netWorths": net_worths,
        }

    def _calculate_net_worth(
        self, user_id: str, prices_by_ticker: dict[str, float] | None = None
    ) -> float:
        """Calculate total net worth for a user.

        Sums available cash, reserved cash, and marked-to-market net position
        value (`long_value - short_liability`) across all tickers.
        """
        game_state = self.game_state.user_states[user_id]
        net_worth = game_state.avail_cash + game_state.reserved_cash
        for ticker, pos in game_state.positions.items():
            long_total_qty = pos.long_avail_qty + pos.long_reserved_qty
            short_total_qty = pos.short_avail_qty + pos.short_reserved_qty
            closing_price = pos.long_cost_basis or pos.short_entry_price
            if prices_by_ticker is not None and ticker in prices_by_ticker:
                closing_price = float(prices_by_ticker[ticker])
                net_worth += (long_total_qty * closing_price) - (
                    short_total_qty * closing_price
                )
                continue
            sim = self.ticker_to_simulator.get(ticker)
            if sim is not None:
                try:
                    closing_price = sim.best_bid()
                except Exception:
                    closing_price = pos.long_cost_basis or pos.short_entry_price
            net_worth += (long_total_qty * closing_price) - (
                short_total_qty * closing_price
            )
        return net_worth

    # ---------- add fake news logic ------------
    async def add_fake_news(self, ticker: str, content: str, n: int = 2) -> None:
        """Schedule a fake news event for a future tick.

        The event is inserted into the level's scheduled news stream and will
        be emitted like normal news when that tick is reached.
        """
        delay_ticks = max(1, int(n))
        inserted_tick = self.game_state.tick + delay_ticks
        if inserted_tick not in self.level_data.news:
            self.level_data.news[inserted_tick] = {}
        if ticker not in self.level_data.news[inserted_tick]:
            self.level_data.news[inserted_tick][ticker] = []
        headline = derive_headline(content)
        self.level_data.news[inserted_tick][ticker].append(
            (headline, content, 0.0, 0)
        )

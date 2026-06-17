import asyncio
from datetime import date, datetime
from typing import Any, Literal

import pandas as pd
from common import Order
from market_simulators import OrderbookSimulator, YFinanceSimulator
from services.game_service.data_access import data_access as da
from services.game_service.models.game import (
    GameStateModel,
    LevelDataModel,
    OrderFill,
    Position,
    TutorialMissionModel,
)
from services.game_service.service.game_engine import GameEngine
from services.game_service.service.news_helpers import normalize_level_news_entry_for_display
from services.game_service.service.portfolio_analytics import build_portfolio_analytics
from utils.constants import (
    BROADCAST_USER_ID,
    MARKET_BUY_RESERVE_MULTIPLIER,
    OrderAction,
    OrderType,
    SHORT_EXPOSURE_CAP_FRACTION,
    Status,
)


class SinglePlayerGameEngine(GameEngine):
    """
    Async version of SinglePlayerGameEngine with queue-based simulator communication.

    Architecture:
    - Per-ticker order queues (serializes orders for each ticker)
    - Shared fill queue (all simulators publish fills here)
    - Background tasks for each simulator
    - Single fill listener task
    - asyncio.Lock for state protection

    Currently supports both manual-tick and auto-tick levels:
    - Manual-tick mode (legacy tutorial flow): user triggers each tick.
    - Auto-tick mode (orderbook/bid-ask flow): ticks advance automatically.
    """

    @property
    def is_game_over(self):
        return self.game_state.tick >= self.level_data.total_ticks

    def __init__(
        self,
        user_id: str,
        level_id: str,
        mode: Literal["Tutorial", "Puzzle", "Multiplayer"] = "Tutorial",
        manual_tick_override: bool = True,
    ) -> None:
        super().__init__(mode=mode)
        self.user_id: str = user_id
        self.level_id: str = level_id
        self.manual_tick_override = manual_tick_override
        self.init_game()

    # ----------- Initialization Helpers --------------
    def _init_with_level_data(self) -> None:
        """Load level data from database based on mode and level_id and apply optional manual/auto tick override.

        Initializes level_data with tutorial or puzzle level configuration and
        calculates total number of trading ticks based on the date range.

        Raises:
            Exception: If mode is neither "Tutorial" nor "Puzzle".
        """
        match self.mode:
            case "Tutorial":
                level_json = da.get_tutorial_level(self.level_id)
            case "Puzzle":
                level_json = da.get_puzzle_level(self.level_id)
            case _:
                raise Exception("Invalid mode")

        if not level_json:
            raise Exception(f"Level not found: {self.level_id}")

        self.level_data = LevelDataModel.model_validate(level_json)

        # Backward compatibility for levels that do not persist total_ticks yet.
        # Currently in testing it is init to 100 ticks
        if self.level_data.total_ticks <= 0:
            self.level_data.total_ticks = len(
                pd.bdate_range(
                    start=self.level_data.start_date,
                    end=self.level_data.end_date,
                )
            )

    def _init_with_user_progress(self) -> None:
        """Initialize a fresh game state for every level start.

        User in-level progress is not resumed from storage. Each start begins
        from seeded starting cash/holdings and tick -1.
        """

        self.game_state = GameStateModel(avail_cash=self.level_data.starting_cash)
        self.game_state.tick = -1

        for ticker in self.level_data.starting_tickers:
            if ticker in self.game_state.positions:
                continue
            seeded_position = self.level_data.starting_positions.get(ticker)
            if seeded_position is None or seeded_position.qty <= 0:
                self.game_state.positions[ticker] = Position()
                continue
            self.game_state.positions[ticker] = Position(
                long_avail_qty=int(seeded_position.qty),
                long_reserved_qty=0,
                long_cost_basis=float(seeded_position.cost_basis),
            )

        self._capture_starting_baselines()
        self._reset_runtime_risk_metrics()

    def _init_local_vars(self) -> None:
        """Initialize order queues, simulators, and order tracking.

        Creates per-ticker order queues for serialized order processing and
        initializes market simulators. Also reconstructs order_id_to_order mapping
        from existing logbook.

        Logic to have orderbook or yfinance here
        """
        ticker_configs_by_symbol = {
            cfg.get("ticker"): cfg for cfg in self.level_data.ticker_configs
        }

        for ticker in self.level_data.starting_tickers:
            # Create queue for this ticker
            self.order_queues[ticker] = asyncio.Queue()
            ticker_cfg = ticker_configs_by_symbol.get(ticker) or {}
            simulator_type = ticker_cfg.get("simulator_type")

            if simulator_type == "yfinance" or (
                simulator_type is None and self.level_data.is_manual_tick
            ):
                start_date = ticker_cfg.get("history_start_date") or self.level_data.start_date
                end_date = ticker_cfg.get("history_end_date") or self.level_data.end_date
                history_interval = ticker_cfg.get("history_interval") or self.level_data.interval
                self.ticker_to_simulator[ticker] = YFinanceSimulator(
                    ticker=ticker,
                    start=date.fromisoformat(start_date),
                    end=date.fromisoformat(end_date),
                    interval=history_interval,
                    fill_queue=self.fill_queue,
                )
            else:
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

        # Refresh baseline after simulators are available so net-worth math
        # uses tradable prices for runtime PnL and risk metrics.
        self._capture_starting_baselines()

    # ---------- Accessors ----------------
    def _build_fe_game_state_from_prices(
        self,
        prices_by_ticker: dict[str, float],
        include_portfolio_analytics: bool = True,
    ) -> dict[str, Any]:
        ret: dict[str, Any] = {}
        total_value_all_stocks = 0.0

        for ticker in self.level_data.starting_tickers:
            pos = self.game_state.positions.get(ticker, Position())
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

        ret["availCash"] = self.game_state.avail_cash
        ret["reservedCash"] = self.game_state.reserved_cash
        ret["tick"] = self.game_state.tick
        ret["totalValueAllStocks"] = total_value_all_stocks
        ret["netWorth"] = total_value_all_stocks + ret["availCash"] + ret["reservedCash"]
        starting_net_worth = float(
            getattr(self, "_starting_net_worth", self.level_data.starting_cash)
        )
        ret["totalPL"] = ret["netWorth"] - starting_net_worth
        if bool(getattr(self.level_data.available_tools, "drawdown_panel", False)):
            peak_net_worth = float(getattr(self, "_peak_net_worth", ret["netWorth"]))
            if peak_net_worth > 0:
                drawdown_pct = max(0.0, (peak_net_worth - ret["netWorth"]) / peak_net_worth)
            else:
                drawdown_pct = 0.0
            ret["drawdown_pct"] = float(drawdown_pct)
            ret["max_drawdown_pct"] = float(getattr(self, "_max_drawdown_pct_seen", 0.0))

        if include_portfolio_analytics:
            portfolio_analytics, _, _, _ = self._compute_portfolio_analytics(
                net_worth=float(ret["netWorth"])
            )
            ret["portfolio_analytics"] = portfolio_analytics

        return ret

    async def get_fe_game_state(self) -> dict[str, Any]:
        """Retrieve game state with calculated frontend-friendly values.

        Returns position data, cash balances, and derived metrics including:
        - Position details (quantity, cost basis, total value)
        - Unrealized P&L for each ticker
        - Total net worth and total P&L

        Thread-safe: Acquires state_lock for reading game state.

        Returns:
            Dictionary with ticker positions, cash, and derived valuation metrics.
        """
        prices_by_ticker = self._get_current_prices()
        async with self.state_lock:
            return self._build_fe_game_state_from_prices(
                prices_by_ticker=prices_by_ticker,
                include_portfolio_analytics=True,
            )

    async def get_game_state(self) -> dict[str, Any]:
        """Retrieve raw game state without modifications.

        Thread-safe: Acquires state_lock for reading.

        Returns:
            Dictionary representation of current game state.
        """
        async with self.state_lock:
            return self.game_state.model_dump()

    def _drain_fill_queue(self) -> None:
        """Drop any queued simulator fills produced during preloading."""
        while not self.fill_queue.empty():
            try:
                self.fill_queue.get_nowait()
            except asyncio.QueueEmpty:
                break

    def _capture_starting_baselines(self) -> None:
        """Snapshot visible-start baseline for PnL and risk metrics."""
        current_prices = self._get_current_prices()
        self._starting_prices_by_ticker = current_prices
        self._starting_net_worth = float(
            self._calculate_net_worth(prices_by_ticker=current_prices)
        )

    def _reset_runtime_risk_metrics(self) -> None:
        """Reset mission metrics tied to visible gameplay period."""
        baseline_prices = self._get_current_prices()
        baseline_net_worth = float(
            self._calculate_net_worth(prices_by_ticker=baseline_prices)
        )
        self._total_orders_submitted = 0
        self._peak_net_worth = baseline_net_worth
        self._max_drawdown_pct_seen = 0.0
        self._history_tick_recorded: int | None = None
        self._net_worth_history: list[float] = []
        self._price_history_by_ticker: dict[str, list[float]] = {
            ticker: [] for ticker in self.level_data.starting_tickers
        }
        self._latest_portfolio_analytics: dict[str, Any] = {}
        self._latest_portfolio_metrics: dict[str, Any] = {}
        self._latest_prices_by_ticker: dict[str, float] = baseline_prices
        self._rebalance_mission_state: dict[str, dict[str, Any]] = {}

        volatility_lookback = 20
        correlation_lookback = 20
        for mission in self._iter_all_missions():
            params = mission.mission_params or {}
            if mission.type == "max_portfolio_volatility":
                volatility_lookback = max(
                    volatility_lookback,
                    self._mission_param_int(params, "lookback_ticks") or 20,
                )
            if mission.type == "require_low_correlation_holding":
                correlation_lookback = max(
                    correlation_lookback,
                    self._mission_param_int(params, "lookback_ticks") or 20,
                )
            if mission.type == "rebalance_within_ticks":
                self._rebalance_mission_state[mission.id] = {
                    "baseline_weights": None,
                    "qualified_tick": None,
                    "qualified_shift": 0.0,
                    "latest_shift": 0.0,
                }
        self._volatility_lookback_ticks = volatility_lookback
        self._correlation_lookback_ticks = correlation_lookback
        self._snapshot_portfolio_history(
            prices_by_ticker=baseline_prices,
            net_worth=baseline_net_worth,
        )

    def _update_runtime_risk_metrics(
        self, prices_by_ticker: dict[str, float] | None = None
    ) -> None:
        """Update running peak net worth and max drawdown percentage."""
        if prices_by_ticker is not None:
            self._latest_prices_by_ticker = prices_by_ticker
        net_worth = float(
            self._calculate_net_worth(
                prices_by_ticker=getattr(self, "_latest_prices_by_ticker", None)
            )
        )
        if net_worth > self._peak_net_worth:
            self._peak_net_worth = net_worth
        if self._peak_net_worth > 0:
            drawdown = max(0.0, (self._peak_net_worth - net_worth) / self._peak_net_worth)
            if drawdown > self._max_drawdown_pct_seen:
                self._max_drawdown_pct_seen = drawdown

    def _iter_all_missions(self) -> list[TutorialMissionModel]:
        return [
            *self.level_data.passing_criteria.missions,
            *self.level_data.bonus_missions,
        ]

    @staticmethod
    def _mission_param_number(params: dict[str, Any], key: str) -> float | None:
        value = params.get(key)
        if value is None:
            return None
        try:
            parsed = float(value)
        except (TypeError, ValueError):
            return None
        if parsed != parsed:  # NaN guard
            return None
        return parsed

    @staticmethod
    def _mission_param_int(params: dict[str, Any], key: str) -> int | None:
        value = params.get(key)
        if value is None:
            return None
        try:
            return int(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _mission_param_bool(
        params: dict[str, Any], key: str, default: bool = False
    ) -> bool:
        value = params.get(key)
        if value is None:
            return default
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            lowered = value.strip().lower()
            if lowered in ("1", "true", "yes", "y"):
                return True
            if lowered in ("0", "false", "no", "n"):
                return False
        if isinstance(value, (int, float)):
            return bool(value)
        return default

    def _get_current_prices(self) -> dict[str, float]:
        prices: dict[str, float] = {}
        for ticker in self.level_data.starting_tickers:
            fallback_pos = self.game_state.positions.get(ticker, Position())
            fallback_price = float(
                fallback_pos.long_cost_basis
                or fallback_pos.short_entry_price
                or 0.0
            )
            simulator = self.ticker_to_simulator.get(ticker)
            if simulator is None:
                prices[ticker] = fallback_price
                continue
            try:
                prices[ticker] = float(simulator.best_bid())
            except Exception:
                prices[ticker] = fallback_price
        return prices

    def _get_reference_portfolios_payload(self) -> list[dict[str, Any]]:
        return [portfolio.model_dump() for portfolio in self.level_data.reference_portfolios]

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
        """Estimate sell-side notional used for short-exposure validation.

        This is not a cash reservation; it is a risk proxy for:
        - open short inventory valuation
        - pending SELL_SHORT exposure checks
        """
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

    def _current_short_exposure(self, prices_by_ticker: dict[str, float]) -> float:
        """Mark-to-market exposure of currently open short inventory."""
        exposure = 0.0
        for ticker, pos in self.game_state.positions.items():
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

    def _pending_short_exposure(self) -> float:
        """Exposure of unfilled portions of active SELL_SHORT orders."""
        exposure = 0.0
        for order in self.game_state.logbook:
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

    def _validate_short_exposure_cap(self, order: Order) -> None:
        """Reject SELL_SHORT if projected short exposure exceeds configured cap.

        Projected exposure combines:
        - current open short inventory
        - pending open short orders
        - this incoming short order
        """
        prices_by_ticker = self._get_current_prices()
        current_exposure = self._current_short_exposure(prices_by_ticker)
        pending_exposure = self._pending_short_exposure()
        order_exposure = order.qty * self._estimate_sell_notional_price(order)
        projected_exposure = current_exposure + pending_exposure + order_exposure
        net_worth = float(self._calculate_net_worth(prices_by_ticker=prices_by_ticker))
        cap = max(0.0, net_worth * SHORT_EXPOSURE_CAP_FRACTION)
        if projected_exposure > cap:
            raise Exception(
                "Short exposure cap exceeded for this level"
            )

    @staticmethod
    def _calculate_weight_shift(
        baseline_weights: dict[str, float], current_weights: dict[str, float]
    ) -> float:
        tickers = set(baseline_weights.keys()) | set(current_weights.keys())
        if not tickers:
            return 0.0
        total_abs_diff = sum(
            abs(float(current_weights.get(ticker, 0.0)) - float(baseline_weights.get(ticker, 0.0)))
            for ticker in tickers
        )
        # Convert double-counted turnover into one-sided portfolio shift.
        return 0.5 * total_abs_diff

    def _snapshot_portfolio_history(
        self, prices_by_ticker: dict[str, float], net_worth: float
    ) -> None:
        current_tick = int(self.game_state.tick)
        if self._history_tick_recorded == current_tick:
            return
        self._net_worth_history.append(float(net_worth))
        for ticker in self.level_data.starting_tickers:
            self._price_history_by_ticker.setdefault(ticker, []).append(
                float(prices_by_ticker.get(ticker, 0.0))
            )
        self._history_tick_recorded = current_tick

    def _update_rebalance_mission_state(
        self, analytics_metrics: dict[str, Any]
    ) -> None:
        if not self._rebalance_mission_state:
            return
        current_tick = int(self.game_state.tick)
        current_weights = dict(analytics_metrics.get("position_weights", {}) or {})
        current_largest_weight = float(analytics_metrics.get("largest_position_weight", 0.0))

        for mission in self._iter_all_missions():
            if mission.type != "rebalance_within_ticks":
                continue
            mission_state = self._rebalance_mission_state.setdefault(
                mission.id,
                {
                    "baseline_weights": None,
                    "qualified_tick": None,
                    "qualified_shift": 0.0,
                    "latest_shift": 0.0,
                },
            )
            params = mission.mission_params or {}
            trigger_tick = self._mission_param_int(params, "trigger_tick") or 0
            if current_tick < trigger_tick:
                continue

            baseline_weights = mission_state.get("baseline_weights")
            if not isinstance(baseline_weights, dict):
                mission_state["baseline_weights"] = dict(current_weights)
                baseline_weights = mission_state["baseline_weights"]

            shift = self._calculate_weight_shift(
                baseline_weights=baseline_weights,
                current_weights=current_weights,
            )
            mission_state["latest_shift"] = float(shift)

            if mission_state.get("qualified_tick") is not None:
                continue

            min_shift = self._mission_param_number(params, "min_rebalance_shift") or 0.0
            max_single_after = self._mission_param_number(
                params, "max_single_weight_after_rebalance"
            )
            if max_single_after is not None and current_largest_weight > max_single_after:
                continue

            has_order_after_trigger = any(
                (order.tick is not None and int(order.tick) >= trigger_tick)
                for order in self.game_state.logbook
            )
            if has_order_after_trigger and shift >= min_shift:
                mission_state["qualified_tick"] = current_tick
                mission_state["qualified_shift"] = float(shift)

    def _is_rebalance_due(self) -> bool:
        current_tick = int(self.game_state.tick)
        for mission in self._iter_all_missions():
            if mission.type != "rebalance_within_ticks":
                continue
            params = mission.mission_params or {}
            trigger_tick = self._mission_param_int(params, "trigger_tick") or 0
            max_after_trigger = self._mission_param_int(params, "max_ticks_after_trigger") or 0
            deadline_tick = trigger_tick + max_after_trigger
            mission_state = self._rebalance_mission_state.get(mission.id, {})
            qualified_tick = mission_state.get("qualified_tick")
            if (
                qualified_tick is None
                and current_tick >= trigger_tick
                and current_tick <= deadline_tick
            ):
                return True
        return False

    def _compute_portfolio_analytics(
        self, net_worth: float | None = None
    ) -> tuple[dict[str, Any], dict[str, Any], dict[str, float], float]:
        prices_by_ticker = self._get_current_prices()
        self._latest_prices_by_ticker = prices_by_ticker

        if net_worth is None:
            net_worth = float(self._calculate_net_worth(prices_by_ticker=prices_by_ticker))

        self._snapshot_portfolio_history(
            prices_by_ticker=prices_by_ticker,
            net_worth=net_worth,
        )

        starting_net_worth = float(
            getattr(self, "_starting_net_worth", self.level_data.starting_cash)
        )
        starting_prices_by_ticker = dict(
            getattr(self, "_starting_prices_by_ticker", prices_by_ticker)
        )
        ticker_metadata_payload = {
            ticker: (
                metadata.model_dump()
                if hasattr(metadata, "model_dump")
                else dict(metadata or {})
            )
            for ticker, metadata in (self.level_data.ticker_metadata or {}).items()
        }
        reference_portfolios = self._get_reference_portfolios_payload()
        analytics, analytics_metrics = build_portfolio_analytics(
            tickers=self.level_data.starting_tickers,
            positions=self.game_state.positions,
            prices_by_ticker=prices_by_ticker,
            ticker_metadata=ticker_metadata_payload,
            reference_portfolios=reference_portfolios,
            starting_prices_by_ticker=starting_prices_by_ticker,
            starting_net_worth=starting_net_worth,
            current_net_worth=float(net_worth),
            net_worth_history=self._net_worth_history,
            price_history_by_ticker=self._price_history_by_ticker,
            rebalance_due=False,
            volatility_lookback=max(2, int(getattr(self, "_volatility_lookback_ticks", 20))),
            correlation_lookback=max(2, int(getattr(self, "_correlation_lookback_ticks", 20))),
        )

        self._update_rebalance_mission_state(analytics_metrics)
        rebalance_due = self._is_rebalance_due()
        warnings = analytics.setdefault("warnings", {})
        warnings["rebalance_due"] = bool(rebalance_due)
        warning_messages = warnings.get("messages", [])
        if not isinstance(warning_messages, list):
            warning_messages = []
        rebalance_message = "A rebalance window is active; evaluate weight drift now."
        warning_messages = [
            str(item)
            for item in warning_messages
            if str(item) != rebalance_message
        ]
        if rebalance_due:
            warning_messages.append(rebalance_message)
        warnings["messages"] = warning_messages

        self._latest_portfolio_analytics = analytics
        self._latest_portfolio_metrics = analytics_metrics
        return analytics, analytics_metrics, prices_by_ticker, float(net_worth)

    async def _preload_ticks(self) -> list[dict[str, Any]]:
        """Advance the engine by configured preloaded ticks before game_start."""
        requested = int(self.level_data.preloaded_ticks or 0)
        max_preload = max(0, int(self.level_data.total_ticks) - 1)
        preload_count = max(0, min(requested, max_preload))

        preloaded_tick_data: list[dict[str, Any]] = []
        for _ in range(preload_count):
            tick_data = await self.next_tick_logic(emit_event=False)
            preloaded_tick_data.append({"tick": self.game_state.tick, "data": tick_data})

        self._drain_fill_queue()
        self.level_data.preloaded_ticks = preload_count
        return preloaded_tick_data

    # ---------- start ----------------
    async def start(self) -> None:
        preloaded_tick_data = await self._preload_ticks()
        # Preloaded ticks are hidden from the player; all baselines reset here.
        self._capture_starting_baselines()
        self._reset_runtime_risk_metrics()
        await super().start()
        resp = {**self.get_level_data(), **await self.get_game_state()}
        fe_state = await self.get_fe_game_state()
        del resp["news"]  # To not expose news to  user
        resp.pop("is_manual_tick", None)
        resp.pop("news_effects", None)  # Effect schedule is internal to the simulator.
        resp.pop("macro_effects", None)  # Effect schedule is internal to the simulator.
        resp["portfolio_analytics"] = fe_state.get("portfolio_analytics", {})
        resp["starting_net_worth"] = float(
            getattr(self, "_starting_net_worth", self.level_data.starting_cash)
        )
        resp["preloaded_ticks"] = len(preloaded_tick_data)
        resp["preloaded_until_tick"] = self.game_state.tick if preloaded_tick_data else -1
        resp["preloaded_tick_data"] = preloaded_tick_data
        self.emit("game_start", BROADCAST_USER_ID, resp)

    # ---------- Next tick and its helpers ----------------
    async def next_tick_logic(self, emit_event: bool = True) -> dict[str, Any]:
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
                if emit_event:
                    payload = {"data": ret}
                    self.emit("game_over", BROADCAST_USER_ID, payload)
                return ret

            current_tick = self.game_state.tick

        ret = {}
        news_payload_by_key: dict[tuple[str, str], dict[str, str | None]] = {}
        macro_payload_by_key: dict[
            tuple[str, str, str], dict[str, str | None]
        ] = {}
        news = self.level_data.news.get(current_tick, {})
        scheduled_news_effects = self.level_data.news_effects.get(current_tick, {})
        scheduled_macro_effects = self.level_data.macro_effects.get(current_tick, {})
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
                # Merge all scheduled impact windows into one simulator input list.
                # Both news and macro effects share the same (pct, duration) format.
                for change_pct, change_ticks in scheduled_news_effects.get(ticker, []):
                    if change_pct != 0 and change_ticks > 0:
                        changes.append((change_pct, change_ticks))
                for (
                    change_pct,
                    change_ticks,
                    macro_title,
                    macro_content,
                    factor_key,
                ) in scheduled_macro_effects.get(ticker, []):
                    if change_pct != 0 and change_ticks > 0:
                        # Macro windows affect fair-price dynamics through the same
                        # change pipeline as news windows.
                        changes.append((change_pct, change_ticks))
                    macro_dedupe_key = (factor_key, macro_title, macro_content)
                    existing_macro_payload = macro_payload_by_key.get(macro_dedupe_key)
                    if existing_macro_payload is None:
                        macro_payload_by_key[macro_dedupe_key] = {
                            "factor_key": factor_key,
                            "title": macro_title,
                            "content": macro_content,
                            "ticker": ticker,
                        }
                    elif existing_macro_payload.get("ticker") != ticker:
                        existing_macro_payload["ticker"] = None
            ret[ticker] = self.ticker_to_simulator[ticker].next_tick(changes)
        ret["news"] = list(news_payload_by_key.values())
        ret["macro_events"] = list(macro_payload_by_key.values())

        # Track drawdown/order-risk metrics once per tick using current mark-to-market.
        self._update_runtime_risk_metrics(prices_by_ticker=self._get_current_prices())

        if emit_event:
            game_state_payload = await self.get_fe_game_state()
            async with self.state_lock:
                logbook_snapshot = [order.model_dump() for order in self.game_state.logbook]
                fills_snapshot = [fill.model_dump() for fill in self.game_state.fills]
            payload = {
                "data": ret,
                "gameState": game_state_payload,
                "logbook": logbook_snapshot,
                "fills": fills_snapshot,
            }
            self.emit("next_tick", BROADCAST_USER_ID, payload)

        return ret

    def validate_reserved_funds(self) -> None:
        """Verify total reserved cash matches sum of active buy orders.

        Asserts that reserved_cash field equals sum of reserved_funds
        from all OPEN and PARTIALLY_FILLED buy orders.

        Raises:
            AssertionError: If reserved cash is inconsistent (diff > 1e-6).
        """
        total_reserved = 0.0
        for order in self.game_state.logbook:
            if order.action in (OrderAction.BUY, OrderAction.BUY_TO_COVER) and (
                order.status == Status.OPEN or order.status == Status.PARTIALLY_FILLED
            ):
                total_reserved += order.reserved_funds
        assert abs(total_reserved - self.game_state.reserved_cash) < 1e-6

    def _validate_order_tool_access(self, order: Order) -> None:
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

    # --------- register_order and its helpers ------------
    async def register_order(self, order: Order) -> dict[str, Any]:
        """Validate and enqueue a new order for processing.

        Validates order (fund availability, position availability for close actions),
        reserves necessary funds/stocks, and enqueues order to simulator.

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
            self.assign_order_id(order)

            try:
                self._validate_order_tool_access(order)
                self._validate_position_qty_for_action(order)
                if order.action == OrderAction.SELL_SHORT:
                    # New short opens are additionally bounded by portfolio-level exposure.
                    self._validate_short_exposure_cap(order)
                reserve_fund = self._validate_fund_sufficient(order)
            except Exception as e:
                return {"result": "FAIL", "order_id": order.order_id, "reason": str(e)}

            # Update state
            self.order_id_to_order[order.order_id] = order
            order.reserved_funds = reserve_fund
            order.tick = self.game_state.tick
            self._reserve_funds(reserve_fund)
            self._reserve_position_for_close_action(order)
            self.game_state.logbook.append(order)
            self._total_orders_submitted += 1

        # Enqueue order for simulator (outside lock)
        await self.order_queues[order.ticker].put({"type": "register", "order": order})

        return {
            "result": "PASS",
            "order_id": order.order_id,
            "reserved": reserve_fund,
            "order_type": order.order_type.value,
            "action": order.action.value,
            "ticker": order.ticker,
        }

    def _validate_position_qty_for_action(self, order: Order) -> None:
        """Validate there is sufficient open position for closing actions.

        Args:
            order: Order to validate.

        Raises:
            Exception: If close quantity exceeds available quantity on that leg.
        """
        pos = self.game_state.positions.get(order.ticker, Position())
        # SELL and BUY_TO_COVER close existing legs and therefore require
        # unreserved inventory on the corresponding leg.
        if order.action == OrderAction.SELL and order.qty > pos.long_avail_qty:
            raise Exception("Not enough unreserved long stock to sell")
        if (
            order.action == OrderAction.BUY_TO_COVER
            and order.qty > pos.short_avail_qty
        ):
            raise Exception("Not enough unreserved short stock to cover")

    def _validate_fund_sufficient(self, order: Order) -> float:
        """Calculate and validate sufficient funds for buy-side orders.

        Args:
            order: Order to validate.

        Returns:
            Amount of cash to reserve for this order.

        Raises:
            Exception: If insufficient funds, unknown order type, or price unavailable.
        """
        if order.action in (OrderAction.SELL, OrderAction.SELL_SHORT):
            # Sell-side actions do not reserve cash up front; cash is credited on fill.
            return 0.0
        price = self._estimate_buy_reserve_price(order)
        if not price:
            raise Exception("Unknown exception: price is None")
        required_price = price * order.qty
        if required_price > self.game_state.avail_cash:
            raise Exception("Insufficient funds to buy")
        return required_price

    def _reserve_position_for_close_action(self, order: Order) -> None:
        """Reserve shares/contracts for close actions.

        Moves specified quantity from available to reserved on the
        corresponding position leg for close actions.

        Args:
            order: Order to reserve shares/contracts for.
        """
        pos = self.game_state.positions.setdefault(order.ticker, Position())
        if order.action == OrderAction.SELL:
            # Reserve long inventory for pending close-long orders.
            pos.long_avail_qty -= order.qty
            pos.long_reserved_qty += order.qty
        elif order.action == OrderAction.BUY_TO_COVER:
            # Reserve short inventory for pending cover orders.
            pos.short_avail_qty -= order.qty
            pos.short_reserved_qty += order.qty

    def _reserve_funds(self, reserve_fund: float) -> None:
        """Move cash from available to reserved pool.

        Args:
            reserve_fund: Amount of cash to reserve.
        """
        self.game_state.avail_cash -= reserve_fund
        self.game_state.reserved_cash += reserve_fund

    def _next_fill_id(self, order_id: str) -> str:
        fill_count = sum(1 for fill in self.game_state.fills if fill.order_id == order_id)
        return f"{order_id}-fill-{fill_count + 1}"

    # ---------- on_fill and its helpers ------------
    def on_fill(self, order_id: str, price: float, qty: int, qty_left: int) -> None:
        """Process partial or full order fill and update game state.

        Updates order status, average fill price, position quantities, and cash.
        Emits fill event via WebSocket. Must be called with state_lock held.

        Args:
            order_id: ID of order being filled.
            price: Execution price per share.
            qty: Number of shares filled.
            qty_left: Remaining quantity after this fill.
        """
        order: Order = self.order_id_to_order[order_id]
        order.qty_left = qty_left

        # Update status
        order.status = Status.FILLED if order.qty_left == 0 else Status.PARTIALLY_FILLED

        # Update price_filled
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

        # Update position
        pos = self.game_state.positions.setdefault(order.ticker, Position())
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

        # Update cash
        if order.action in (OrderAction.BUY, OrderAction.BUY_TO_COVER):
            # Buy-side actions spend reserved cash first, then available cash
            # if execution is worse than reservation estimate.
            fill_cost = price * qty
            reserve_used = min(order.reserved_funds, fill_cost)
            self.game_state.reserved_cash -= reserve_used
            order.reserved_funds -= reserve_used

            uncovered_cost = fill_cost - reserve_used
            if uncovered_cost > 0:
                self.game_state.avail_cash -= uncovered_cost

            # Release any unused reserve once the order is fully filled.
            if order.status == Status.FILLED and order.reserved_funds > 0:
                self.game_state.reserved_cash -= order.reserved_funds
                self.game_state.avail_cash += order.reserved_funds
                order.reserved_funds = 0.0
        elif order.action in (OrderAction.SELL, OrderAction.SELL_SHORT):
            # Sell-side actions realize proceeds immediately on each fill.
            self.game_state.avail_cash += price * qty

        if order.status == Status.FILLED:
            order.filled_tick = self.game_state.tick

        fill_record = OrderFill(
            fill_id=self._next_fill_id(order_id),
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
        self.game_state.fills.append(fill_record)

        prices_by_ticker = self._get_current_prices()
        game_state_payload = self._build_fe_game_state_from_prices(
            prices_by_ticker=prices_by_ticker,
            include_portfolio_analytics=False,
        )

        # Emit canonical fill payload to WebSocket.
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

        Sends cancel event to simulator and releases reserved funds/shares.
        Validates order status before and after simulator communication to
        handle fills arriving during cancel processing.

        Args:
            order_id: ID of order to cancel.

        Returns:
            - On success: {"result": "PASS", "order_id": str, "reserved": float}
            - On failure: {"result": "FAIL", "order_id": str, "message": str}
        """
        async with self.state_lock:
            order: Order | None = self.order_id_to_order.get(order_id)
            if not order:
                return {
                    "result": "FAIL",
                    "order_id": order_id,
                    "message": "No such order",
                }

            if order.status not in [Status.OPEN, Status.PARTIALLY_FILLED]:
                return {
                    "result": "FAIL",
                    "order_id": order_id,
                    "message": f"Unable to cancel a order that is {order.status}",
                }

            ticker = order.ticker

        # Send cancel event to simulator (outside lock)
        await self.order_queues[ticker].put({"type": "cancel", "order_id": order_id})

        # Notice: this will only work for single threaded coroutines
        if order.status == Status.FILLED:
            return {
                "result": "FAIL",
                "order_id": order_id,
                "message": "Order already filled",
            }
        # Update state (with lock)
        async with self.state_lock:
            released_reserved_funds = order.reserved_funds
            if order.action in (OrderAction.BUY, OrderAction.BUY_TO_COVER):
                self.game_state.avail_cash += released_reserved_funds
                self.game_state.reserved_cash -= released_reserved_funds
                order.reserved_funds = 0.0
            elif order.action == OrderAction.SELL:
                pos = self.game_state.positions[order.ticker]
                if order.qty_left > pos.long_reserved_qty:
                    raise Exception(
                        "Inconsistent state: trying to cancel more than reserved"
                    )
                pos.long_reserved_qty -= order.qty_left
                pos.long_avail_qty += order.qty_left
            elif order.action == OrderAction.BUY_TO_COVER:
                # Return unfilled cover quantity to short available inventory.
                pos = self.game_state.positions[order.ticker]
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
        """Finalize game and evaluate mission-based completion.

        Stops all background tasks, calculates final net worth, evaluates
        passing criteria, and persists results to database.

        Returns:
            Dictionary with final net worth, completion status, points, and
            mission progress details.
        """
        # Signal all tasks to stop but does not kill the coroutines immediately.
        self._running = False

        net_worth = float(self._calculate_net_worth())
        mission_progress = self._build_mission_progress(
            force_final=True, net_worth=net_worth
        )

        passing_results = [
            mission_progress["missions"].get(
                mission.id, {"completed": False, "value": 0.0}
            )
            for mission in self.level_data.passing_criteria.missions
        ]
        if self.level_data.passing_criteria.type == "any_of":
            completed = (
                any(bool(item.get("completed")) for item in passing_results)
                if passing_results
                else True
            )
        else:
            completed = (
                all(bool(item.get("completed")) for item in passing_results)
                if passing_results
                else True
            )

        # Calculate points coming from the passing criteria (compulsory) missions
        passing_points = sum(
            mission.points
            for mission in self.level_data.passing_criteria.missions
            if bool(
                mission_progress["missions"]
                .get(mission.id, {"completed": False})
                .get("completed")
            )
        )

        # Calculate points coming from the bonus missions
        bonus_points = sum(
            mission.points
            for mission in self.level_data.bonus_missions
            if bool(
                mission_progress["missions"]
                .get(mission.id, {"completed": False})
                .get("completed")
            )
        )

        # Calculate points coming from the user's final net worth
        final_cash_points = float(
            net_worth * self.level_data.final_cash_points_multiplier
        )
        total_points = int(round(final_cash_points + passing_points + bonus_points))

        if self.mode == "Tutorial":
            da.update_tutorial_status(
                tutorial_id=self.level_id,
                completed=bool(completed),
                stars=0,  # Stars are deprecated.
                score=total_points,
                user_id=self.user_id,
            )

        if completed:
            from services.progression_service.service import (
                daily_activity_service as das,
            )

            das.record_level_completed(
                self.user_id,
                {"level_id": self.level_id, "mode": self.mode},
            )

        return {
            "netWorth": net_worth,
            "pnl": net_worth
            - float(getattr(self, "_starting_net_worth", self.level_data.starting_cash)),
            "completed": int(completed),
            "totalPoints": total_points,
            "finalCashPoints": final_cash_points,
            "missionPoints": passing_points,
            "bonusPoints": bonus_points,
            "missionProgress": mission_progress,
        }

    def _calculate_net_worth(
        self, prices_by_ticker: dict[str, float] | None = None
    ) -> float:
        """Compute mark-to-market net worth with explicit short liability.

        Per ticker contribution is:
            (long_qty * price) - (short_qty * price)
        """
        net_worth = self.game_state.avail_cash + self.game_state.reserved_cash
        for ticker, pos in self.game_state.positions.items():
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

    def _build_mission_progress(
        self, force_final: bool = False, net_worth: float | None = None
    ) -> dict[str, Any]:
        """Build mission progress from game state and order logbook.

        Computes frontend-facing mission progress without maintaining separate
        mutable mission state during gameplay.

        Args:
            force_final: Whether final-only checks should be applied
                (for example, `pnl_at_end` missions).
            net_worth: Optional precomputed net worth to avoid recalculation.

        Returns:
            Dict containing:
            - `metrics`: `{order_type_counts, pnl}`
            - `missions`: `{mission_id: {completed, value}}`
        """
        (
            portfolio_analytics,
            portfolio_metrics,
            _prices_by_ticker,
            computed_net_worth,
        ) = self._compute_portfolio_analytics(net_worth=net_worth)
        net_worth = computed_net_worth
        starting_net_worth = float(
            getattr(self, "_starting_net_worth", self.level_data.starting_cash)
        )
        pnl = float(net_worth - starting_net_worth)
        total_orders_submitted = int(
            getattr(self, "_total_orders_submitted", len(self.game_state.logbook))
        )
        max_drawdown_pct_seen = float(getattr(self, "_max_drawdown_pct_seen", 0.0))

        order_type_counts: dict[str, int] = {
            "limit": 0,
            "market": 0,
            "stop": 0,
            "stop_limit": 0,
        }
        order_type_direction_counts: dict[str, dict[str, int]] = {
            "limit": {"buy": 0, "sell": 0},
            "market": {"buy": 0, "sell": 0},
            "stop": {"buy": 0, "sell": 0},
            "stop_limit": {"buy": 0, "sell": 0},
        }
        action_counts: dict[str, int] = {
            "buy": 0,
            "sell": 0,
            "sell_short": 0,
            "buy_to_cover": 0,
        }
        order_type_value_to_mission_key = {
            OrderType.LIMIT: "limit",
            OrderType.MARKET: "market",
            OrderType.STOP: "stop",
            OrderType.STOP_LIMIT: "stop_limit",
        }
        action_value_to_mission_key = {
            OrderAction.BUY: "buy",
            OrderAction.SELL: "sell",
            OrderAction.SELL_SHORT: "sell_short",
            OrderAction.BUY_TO_COVER: "buy_to_cover",
        }
        for order in self.game_state.logbook:
            order_type = order_type_value_to_mission_key.get(order.order_type)
            action_key = action_value_to_mission_key.get(order.action)
            if action_key:
                action_counts[action_key] = action_counts.get(action_key, 0) + 1
            if not order_type:
                continue
            if order_type in order_type_counts:
                order_type_counts[order_type] += 1
                order_direction = order.direction.value.lower()
                if order_direction in ("buy", "sell"):
                    order_type_direction_counts[order_type][order_direction] += 1

        missions: dict[str, dict[str, Any]] = {}
        all_missions = [
            *self.level_data.passing_criteria.missions,
            *self.level_data.bonus_missions,
        ]
        for mission in all_missions:
            completed, value = self._evaluate_mission(
                mission=mission,
                pnl=pnl,
                order_type_counts=order_type_counts,
                order_type_direction_counts=order_type_direction_counts,
                action_counts=action_counts,
                total_orders_submitted=total_orders_submitted,
                max_drawdown_pct_seen=max_drawdown_pct_seen,
                portfolio_metrics=portfolio_metrics,
                force_final=force_final,
            )
            missions[mission.id] = {"completed": completed, "value": value}

        return {
            "metrics": {
                "order_type_counts": order_type_counts,
                "order_type_direction_counts": order_type_direction_counts,
                "action_counts": action_counts,
                "pnl": pnl,
                "starting_net_worth": starting_net_worth,
                "total_orders_submitted": total_orders_submitted,
                "max_drawdown_pct_seen": max_drawdown_pct_seen,
                "portfolio": portfolio_analytics,
                "portfolio_metrics": portfolio_metrics,
            },
            "missions": missions,
        }

    def _evaluate_mission(
        self,
        mission: TutorialMissionModel,
        pnl: float,
        order_type_counts: dict[str, int],
        order_type_direction_counts: dict[str, dict[str, int]],
        action_counts: dict[str, int],
        total_orders_submitted: int,
        max_drawdown_pct_seen: float,
        portfolio_metrics: dict[str, Any],
        force_final: bool = False,
    ) -> tuple[bool, float]:
        """Evaluate one mission and return completion + observed value.

        Args:
            mission: Mission definition from level metadata.
            pnl: Current/final PnL.
            order_type_counts: Aggregated order counts from logbook.
            force_final: Whether final-only missions can complete.

        Returns:
            Tuple `(completed, value)` for this mission.
        """
        params = mission.mission_params or {}

        if mission.type == "use_order_type":
            order_type = str(params.get("order_type") or "").lower()
            order_direction = str(params.get("order_direction") or "").lower()
            if order_direction in ("buy", "sell"):
                count = float(
                    order_type_direction_counts.get(order_type, {}).get(order_direction, 0)
                )
            else:
                count = float(order_type_counts.get(order_type, 0))
            completed = True
            min_count = self._mission_param_number(params, "min_count")
            max_count = self._mission_param_number(params, "max_count")
            if min_count is not None:
                completed = completed and count >= min_count
            if max_count is not None:
                completed = completed and count <= max_count
            return completed, count

        if mission.type == "use_trade_action":
            trade_action = str(params.get("trade_action") or "").lower()
            count = float(action_counts.get(trade_action, 0))
            completed = True
            min_count = self._mission_param_number(params, "min_count")
            max_count = self._mission_param_number(params, "max_count")
            if min_count is not None:
                completed = completed and count >= min_count
            if max_count is not None:
                completed = completed and count <= max_count
            return completed, count

        if mission.type == "pnl_at_end":
            require_final = self._mission_param_bool(params, "require_final", True)
            completed = force_final if require_final else True
            min_pnl = self._mission_param_number(params, "min_pnl")
            max_pnl = self._mission_param_number(params, "max_pnl")
            if min_pnl is not None:
                completed = completed and pnl >= min_pnl
            if max_pnl is not None:
                completed = completed and pnl <= max_pnl
            return completed, pnl

        if mission.type == "max_total_orders":
            observed = float(total_orders_submitted)
            max_total_orders = self._mission_param_number(params, "max_total_orders")
            if max_total_orders is None:
                return False, observed
            return total_orders_submitted <= max_total_orders, observed

        if mission.type == "max_drawdown_pct":
            observed = float(max_drawdown_pct_seen)
            max_drawdown_pct = self._mission_param_number(params, "max_drawdown_pct")
            if max_drawdown_pct is None:
                return False, observed
            return observed <= max_drawdown_pct, observed

        if mission.type == "min_distinct_positions":
            observed = float(portfolio_metrics.get("distinct_positions", 0))
            min_positions = self._mission_param_number(params, "min_positions")
            if min_positions is None:
                min_positions = self._mission_param_number(params, "min_distinct_positions")
            if min_positions is None:
                return False, observed
            return observed >= min_positions, observed

        if mission.type == "min_distinct_sectors":
            observed = float(portfolio_metrics.get("distinct_sectors", 0))
            min_sectors = self._mission_param_number(params, "min_sectors")
            if min_sectors is None:
                min_sectors = self._mission_param_number(params, "min_distinct_sectors")
            if min_sectors is None:
                return False, observed
            return observed >= min_sectors, observed

        if mission.type == "max_single_position_weight":
            observed = float(portfolio_metrics.get("largest_position_weight", 0.0))
            max_weight = self._mission_param_number(params, "max_weight")
            if max_weight is None:
                max_weight = self._mission_param_number(params, "max_single_position_weight")
            if max_weight is None:
                return False, observed
            return observed <= max_weight, observed

        if mission.type == "max_sector_weight":
            observed = float(portfolio_metrics.get("largest_sector_weight", 0.0))
            max_sector_weight = self._mission_param_number(params, "max_sector_weight")
            if max_sector_weight is None:
                return False, observed
            return observed <= max_sector_weight, observed

        if mission.type == "exclude_ticker":
            ticker = str(params.get("ticker") or "").upper()
            held_tickers = set(
                str(ticker_symbol).upper()
                for ticker_symbol in (portfolio_metrics.get("held_tickers") or [])
            )
            observed = 1.0 if ticker and ticker in held_tickers else 0.0
            if not ticker:
                return False, observed
            return observed == 0.0, observed

        if mission.type == "require_ticker_tag":
            tag = str(params.get("tag") or "").strip().lower()
            min_count = self._mission_param_number(params, "min_count")
            if min_count is None:
                min_count = 1.0
            held_ticker_tags = dict(portfolio_metrics.get("held_ticker_tags", {}) or {})
            observed_count = 0.0
            if tag:
                for tags in held_ticker_tags.values():
                    normalized_tags = {
                        str(tag_item).strip().lower()
                        for tag_item in (tags or [])
                        if str(tag_item).strip()
                    }
                    if tag in normalized_tags:
                        observed_count += 1.0
            if not tag:
                return False, observed_count
            return observed_count >= min_count, observed_count

        if mission.type == "require_low_correlation_holding":
            max_correlation = self._mission_param_number(params, "max_correlation")
            if max_correlation is None:
                return False, 0.0
            min_observations = self._mission_param_int(params, "min_observations") or 0
            lookback_ticks = self._mission_param_int(params, "lookback_ticks") or int(
                getattr(self, "_correlation_lookback_ticks", 20)
            )
            avg_abs_corr_by_ticker = dict(
                portfolio_metrics.get("avg_abs_corr_by_ticker", {}) or {}
            )
            if not avg_abs_corr_by_ticker:
                observed = float(portfolio_metrics.get("min_avg_abs_correlation") or 0.0)
                return False, observed

            eligible_values: list[float] = []
            for ticker, avg_abs_corr in avg_abs_corr_by_ticker.items():
                ticker_history = self._price_history_by_ticker.get(str(ticker), [])
                available_observations = min(
                    max(0, len(ticker_history) - 1),
                    max(1, lookback_ticks),
                )
                if available_observations < min_observations:
                    continue
                try:
                    eligible_values.append(float(avg_abs_corr))
                except (TypeError, ValueError):
                    continue
            if not eligible_values:
                observed = float(portfolio_metrics.get("min_avg_abs_correlation") or 0.0)
                return False, observed
            observed = float(min(eligible_values))
            return observed <= max_correlation, observed

        if mission.type == "max_portfolio_beta":
            observed_beta = portfolio_metrics.get("portfolio_beta")
            if observed_beta is None:
                return False, 0.0
            max_beta = self._mission_param_number(params, "max_beta")
            if max_beta is None:
                return False, float(observed_beta)
            observed = float(observed_beta)
            return observed <= max_beta, observed

        if mission.type == "max_portfolio_volatility":
            observed_volatility = portfolio_metrics.get("portfolio_volatility")
            if observed_volatility is None:
                return False, 0.0
            max_volatility = self._mission_param_number(params, "max_volatility")
            if max_volatility is None:
                return False, float(observed_volatility)
            min_observations = self._mission_param_int(params, "min_observations") or 0
            lookback_ticks = self._mission_param_int(params, "lookback_ticks") or int(
                getattr(self, "_volatility_lookback_ticks", 20)
            )
            available_observations = min(
                max(0, len(self._net_worth_history) - 1),
                max(1, lookback_ticks),
            )
            if available_observations < min_observations:
                return False, float(observed_volatility)
            observed = float(observed_volatility)
            return observed <= max_volatility, observed

        if mission.type == "rebalance_within_ticks":
            mission_state = self._rebalance_mission_state.get(mission.id, {})
            trigger_tick = self._mission_param_int(params, "trigger_tick") or 0
            max_ticks_after_trigger = self._mission_param_int(
                params, "max_ticks_after_trigger"
            ) or 0
            deadline_tick = trigger_tick + max_ticks_after_trigger
            qualified_tick = mission_state.get("qualified_tick")
            observed = float(
                mission_state.get("qualified_shift", mission_state.get("latest_shift", 0.0))
                or 0.0
            )
            if qualified_tick is None:
                return False, observed
            return int(qualified_tick) <= deadline_tick, observed

        if mission.type in (
            "min_excess_return_vs_benchmark",
            "min_excess_return_vs_reference",
        ):
            require_final = self._mission_param_bool(params, "require_final", True)
            if require_final and not force_final:
                return False, 0.0
            min_excess_return = self._mission_param_number(params, "min_excess_return")
            if min_excess_return is None:
                return False, 0.0
            excess_returns = dict(portfolio_metrics.get("excess_returns", {}) or {})
            if mission.type == "min_excess_return_vs_benchmark":
                target_key = str(params.get("benchmark_key") or "").strip()
                if not target_key:
                    target_key = str(portfolio_metrics.get("benchmark_key") or "").strip()
            else:
                target_key = str(params.get("reference_key") or "").strip()

            observed_excess_return: float | None = None
            if target_key:
                candidate = excess_returns.get(target_key)
                if candidate is not None:
                    observed_excess_return = float(candidate)
            if observed_excess_return is None:
                observed_fallback = portfolio_metrics.get("benchmark_excess_return")
                observed_excess_return = (
                    float(observed_fallback)
                    if observed_fallback is not None
                    else None
                )
            if observed_excess_return is None:
                return False, 0.0
            return observed_excess_return >= min_excess_return, float(observed_excess_return)

        return False, 0.0

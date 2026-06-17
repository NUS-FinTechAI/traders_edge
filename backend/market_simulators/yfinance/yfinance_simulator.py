import asyncio
from collections import deque
from datetime import date, timedelta
from typing import Any

import pandas as pd
import yfinance as yf
from common import Order
from market_simulators.market_simulator import MarketSimulator
from utils.constants import INTRADAY_INTERVALS, YFINANCE_INTERVALS, Direction, OrderType


class YFinanceSimulator(MarketSimulator):
    """
    Async YFinance simulator with queue-based fill publishing.

    For market orders: fills at day's close.
    For limit/stop/stop-limit orders: fills on future candles when triggered.
    """

    # --------- __init__ and its helpers ------------
    def __init__(
        self,
        ticker: str,
        start: date,
        end: date,
        interval: str = "1d",
        fill_queue: asyncio.Queue | None = None,
    ) -> None:
        """Initialize YFinance simulator with historical data.

        Downloads historical OHLC data from Yahoo Finance, reindexes to all
        business days between start and end dates (forward-fills missing data),
        and validates the requested time interval against yfinance limitations.

        Args:
            ticker: Stock ticker symbol (e.g., 'AAPL').
            start: First date to include in historical data.
            end: Last date to include in historical data.
            interval: OHLC data granularity ('1m', '5m', '15m', '1h', '1d', etc.).
            fill_queue: Optional asyncio Queue to publish fill events.

        Raises:
            ValueError: If interval is invalid, start > end, start is in future,
                       or date range exceeds API limits for the interval.
        """
        super().__init__(fill_queue)

        self.ticker_name = ticker
        self.ticker = yf.Ticker(ticker)
        self.start = start
        self.end = end
        self.interval = interval
        self.pending_limit_orders = deque()
        self._init_yfinance()
        self.tick = -1  # -1 as tick 0 is the first official tick

        self.df = self.ticker.history(
            start=start,
            end=end + timedelta(days=2),
            interval=interval,
            raise_errors=True,
        )
        self.df.index = self.df.index.tz_localize(None).date
        all_days = pd.bdate_range(start=start, end=end)
        self.df = self.df.reindex(all_days).ffill()

    def _init_yfinance(self):
        """Validate yfinance configuration before data download."""
        self._validate_interval()

    def _validate_interval(self) -> None:
        """Validate interval value and check date range against API limits.

        Different intervals have different historical data availability:
        - '1m': Last 7 days only
        - Intraday (<1 day): Last 60 days only
        - Daily and longer: Last 730 days

        Raises:
            ValueError: If interval is unsupported or date range exceeds limits.
        """
        if self.interval not in YFINANCE_INTERVALS:
            raise ValueError(f"Invalid interval: {self.interval}")

        if self.start > self.end:
            raise ValueError("start date must be before end date")

        today = date.today()
        days_from_today = (today - self.start).days

        if days_from_today < 0:
            raise ValueError("start date cannot be in the future")

        # This is by our own testing
        # 1 min - last 30 days
        # 30mins and below - 60 days
        # 1 hour data - 730 days
        # 90 min - last 60 days

        # Online says
        # 1 min - last 7 days
        # intra day (< 1 day) - last 60
        # Anything else - last 730 days
        # To be safe, we will follow online

        if self.interval == "1m":
            max_days = 7
        elif self.interval in INTRADAY_INTERVALS:
            max_days = 60
        else:
            max_days = 730

        # >= to be on the safe side
        if days_from_today >= max_days:
            raise ValueError(
                f"Interval '{self.interval}' only supports data up to "
                f"{max_days} days from today (start={self.start}, today={today})"
            )

    def _get_market_OCHL(self, tick: int | None = None) -> pd.Series:
        """Retrieve OHLC data for a specific tick.

        Args:
            tick: Specific tick index. If None, uses current tick.

        Returns:
            pandas Series with Open, High, Low, Close, Volume for the tick.

        Raises:
            Exception: If current tick is invalid (not yet started or beyond data).
        """
        if tick is not None:
            return self.df.iloc[tick]
        if self.tick < 0 or self.tick >= len(self.df):
            raise Exception("Tick has not started yet")
        return self.df.iloc[self.tick]

    # --------- Async interface implementation ---------

    def register_order(self, order: Order) -> bool:
        """Register and process an order.

        Market orders execute immediately at the current close price.
        Limit and stop orders are queued and checked against future high/low prices
        during next_tick() calls.

        Args:
            order: Order object with type, price, quantity, and direction.

        Returns:
            True if order was registered successfully.
        """
        assert order.order_id is not None

        if order.order_type == OrderType.MARKET:
            filled_qty = order.qty_left
            fill_price = self._get_market_OCHL()["Close"]
            order.qty_left = 0
            self._publish_fill(order.order_id, fill_price, filled_qty, order.qty_left)
        else:
            if order.order_type == OrderType.STOP and order.stop_price is None:
                # Backward compatibility with older payloads using `price`.
                order.stop_price = order.price
                order.price = None
            self.pending_limit_orders.append(order)
        return True

    def next_tick(self, *args, **kwargs) -> dict[str, Any]:
        """Advance to next tick and process pending limit orders.

        Increments tick counter, evaluates all pending limit/stop orders against
        the current tick's high/low prices, and publishes fills for triggered orders.

        Buy orders fill if price <= high; sell orders fill if price >= low.

        Returns:
            Dictionary with OHLC data for current tick (Open, High, Low, Close, Volume).
        """
        self.tick += 1
        ohcl = self._get_market_OCHL()

        pending_limit_order = deque()
        high = ohcl["High"]
        low = ohcl["Low"]

        for order in self.pending_limit_orders:
            order: Order = order  # for type hinting
            assert order.order_id is not None

            if order.order_type == OrderType.LIMIT:
                if order.price is None:
                    pending_limit_order.append(order)
                    continue

                if order.direction == Direction.SELL and high >= order.price:
                    filled_qty = order.qty_left
                    order.qty_left = 0
                    fill_price = max(low, order.price)
                    self._publish_fill(
                        order.order_id, fill_price, filled_qty, order.qty_left
                    )
                    continue

                if order.direction == Direction.BUY and low <= order.price:
                    filled_qty = order.qty_left
                    order.qty_left = 0
                    fill_price = min(high, order.price)
                    self._publish_fill(
                        order.order_id, fill_price, filled_qty, order.qty_left
                    )
                    continue

            elif order.order_type == OrderType.STOP:
                trigger_price = (
                    order.stop_price
                    if order.stop_price is not None
                    else order.price
                )
                if trigger_price is None:
                    pending_limit_order.append(order)
                    continue

                triggered = (
                    order.direction == Direction.SELL and low <= trigger_price
                ) or (order.direction == Direction.BUY and high >= trigger_price)
                if triggered:
                    filled_qty = order.qty_left
                    order.qty_left = 0
                    fill_price = low if order.direction == Direction.SELL else high
                    self._publish_fill(
                        order.order_id, fill_price, filled_qty, order.qty_left
                    )
                    continue

            elif order.order_type == OrderType.STOP_LIMIT:
                if order.price is None or order.stop_price is None:
                    pending_limit_order.append(order)
                    continue

                triggered = (
                    order.direction == Direction.SELL and low <= order.stop_price
                ) or (order.direction == Direction.BUY and high >= order.stop_price)
                if not triggered:
                    pending_limit_order.append(order)
                    continue

                # Triggered: now behave like a limit order.
                order.order_type = OrderType.LIMIT
                if order.direction == Direction.SELL and high >= order.price:
                    filled_qty = order.qty_left
                    order.qty_left = 0
                    fill_price = max(low, order.price)
                    self._publish_fill(
                        order.order_id, fill_price, filled_qty, order.qty_left
                    )
                    continue
                if order.direction == Direction.BUY and low <= order.price:
                    filled_qty = order.qty_left
                    order.qty_left = 0
                    fill_price = min(high, order.price)
                    self._publish_fill(
                        order.order_id, fill_price, filled_qty, order.qty_left
                    )
                    continue

            pending_limit_order.append(order)

        self.pending_limit_orders = pending_limit_order
        return dict(ohcl)

    def cancel_order(self, order_id: str) -> None | Order:
        """Cancel a pending limit or stop order.

        Args:
            order_id: ID of order to cancel.

        Returns:
            The cancelled Order object.

        Raises:
            Exception: If order_id not found in pending orders.
        """
        marked = None
        for order in self.pending_limit_orders:
            if order.order_id == order_id:
                marked = order
                break
        if not marked:
            return

        self.pending_limit_orders.remove(marked)
        return marked

    def best_bid(self) -> float:
        """Get current best bid price.

        Returns the close price of the current tick.

        Returns:
            Current close price.
        """
        return self._get_market_OCHL()["Close"]

    def best_ask(self) -> float:
        """Get current best ask price.

        Returns the close price of the current tick.

        Returns:
            Current close price.
        """
        return self._get_market_OCHL()["Close"]

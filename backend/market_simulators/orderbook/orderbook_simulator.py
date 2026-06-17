import asyncio
import random
from typing import Any, Deque

import numpy as np
from common import Order
from market_simulators.market_simulator import MarketSimulator
from market_simulators.orderbook.orderbook import OrderBook
from utils.constants import NPC_ORDER_PREFIX, Direction, OrderAction, OrderType


class OrderbookSimulator(MarketSimulator):
    """
    OrderbookSimulator is a wrapper over the OrderBook class so that we can simulate orders from "Non-users".
    """

    def __init__(
        self,
        fill_queue: asyncio.Queue,
        ticker: str,
        volume: int = 10,
        volatility: int = 10,
        seed: int | None = None,
        has_npc_orders: bool = True,
    ) -> None:
        super().__init__(fill_queue)
        self.order_book = OrderBook(on_fill=self._on_fill)
        self.volume: int = volume
        self.ticker: str = ticker
        self.volatility: int = volatility
        self.fair_price = 100.0  # initial price
        self.curr_rate = 0.0  # initial rate of change
        self.order_cnt = 0
        self.npc_orders: Deque[set[str]] = Deque()
        self.active_rates = []
        self.OHCL = {}
        self.has_npc_orders = has_npc_orders
        self.previous_price = self.fair_price

        self.tick = -1

        if seed:
            random.seed(seed)
            np.random.seed(seed)
            self.rng = np.random.default_rng(seed)
        else:
            self.rng = np.random.default_rng()

    def _on_fill(self, order_id: str, price: float, qty: int, qty_left: int) -> None:
        """Callback from OrderBook - publishes to fill queue"""
        self._update_OHCL(price, qty)
        self.previous_price = price
        self._publish_fill(order_id, price, qty, qty_left)

    def _update_OHCL(self, price: float, qty: int) -> None:
        self.OHCL["open"] = self.OHCL.get("open", price)
        self.OHCL["high"] = max(self.OHCL.get("high", price), price)
        self.OHCL["low"] = min(self.OHCL.get("low", price), price)
        self.OHCL["close"] = price
        self.OHCL["volume"] = self.OHCL.get("volume", 0) + qty

    def register_order(self, order: Order) -> bool:
        self.order_book.register_order(order)
        return True

    def next_tick(self, change: list[tuple[float, int]]) -> dict[str, Any]:
        self.tick += 1

        # Case where we do not enable bot bids/asks. In this case, all bids/asks represented are made by the actual players
        if not self.has_npc_orders:
            # Account for case where players did not make any trades - we have OHLC of 0,0,0,0
            no_trade_snapshot = {
                "open": 0.0,
                "high": 0.0,
                "low": 0.0,
                "close": 0.0,
                "volume": 0,
            }
            ret = {
                **(self.OHCL if self.OHCL else no_trade_snapshot),
                **self.order_book.get_order_book_snapshot(),
            }
            self.OHCL = {}
            return ret

        self.npc_orders.append(set())
        self.del_old_orders()

        # Simulate some price movement
        self.update_fair_price(change)

        # Use very small noise to keep assumed_price close to fair_price
        # This prevents wide spreads - noise is in basis points (0.5% std = 50 bps)
        noise_pct = random.gauss(0, 0.005)  # 0.5% std deviation = ~1.5% at 3-sigma
        assumed_price = self.fair_price * (1 + noise_pct)
        assumed_price = max(0.01, assumed_price)  # Floor at 1 cent

        self.add_random_limit_orders(
            mid_price=assumed_price,
        )

        self.add_random_market_order()
        ret = {**self.OHCL, **self.order_book.get_order_book_snapshot()}
        self.OHCL = {}
        return ret

    def cancel_order(self, order_id: str) -> None:
        self.order_book.cancel_order(order_id)

    def best_bid(self) -> float:
        best_bid = self.order_book.get_best_bid(None)
        if best_bid is None:
            return self.previous_price  # fallback to previous price if no bids
        return best_bid

    def best_ask(self) -> float:
        best_ask = self.order_book.get_best_ask(None)
        if best_ask is None:
            return self.previous_price  # fallback to previous price if no asks
        return best_ask

    def update_fair_price(self, change: list[tuple[float, int]]) -> None:
        """Apply price changes that spike immediately and taper over specified ticks.

        Each change (pct, ticks) applies its full percentage immediately, then
        tapers uniformly over the remaining ticks. After 'ticks' total ticks,
        the effect is completely gone.
        """
        new_active_rates = []

        # Add new changes to active effects
        for pct, ticks in change:
            # Ignore no-op or invalid durations to avoid dividing by zero later.
            if ticks <= 0 or pct == 0:
                continue
            # new rates spike immediately
            self.curr_rate += pct
            new_active_rates.append([pct, ticks, ticks])

        # Reduce  from all active effects
        for pct, total_ticks, ticks_remaining in self.active_rates:
            if total_ticks <= 0:
                continue
            # Reduce current rate by proportional amount
            self.curr_rate -= pct / total_ticks

            # Decrement remaining ticks and keep if still active
            ticks_remaining -= 1
            if ticks_remaining > 0:
                new_active_rates.append([pct, total_ticks, ticks_remaining])

        self.active_rates = new_active_rates
        self.fair_price *= 1 + self.curr_rate

    def _create_npc_order(
        self, price: float, qty: int, type: OrderType, direction: Direction
    ) -> None:
        action = (
            OrderAction.BUY if direction == Direction.BUY else OrderAction.SELL
        )
        order = Order(
            order_id=f"{NPC_ORDER_PREFIX}_{self.tick}_{type}_{direction}_{self.order_cnt}",
            user_id=NPC_ORDER_PREFIX,
            action=action,
            ticker=self.ticker,
            order_type=type,
            direction=direction,
            price=price,
            qty=qty,
        )
        self.order_cnt += 1
        self.order_book.register_order(order)
        assert order.order_id is not None
        self.npc_orders[-1].add(order.order_id)

    def add_random_limit_orders(
        self,
        mid_price: float,
        levels: int = 15,
        tick_size: float | None = None,
        decay: float = 0.15,
        size_noise: float = 0.3,
        precision: float = 0.10,
    ) -> None:
        """
        Populate the book with symmetric limit orders around mid_price.
        """

        mid_price = float(mid_price)

        # Use explicit tick size (fallback to precision)
        tick = tick_size if tick_size is not None else precision

        # Smooth scaling with volatility
        vol_scale = 1.0 + 0.5 * self.volatility
        base_volume = self.volume * vol_scale

        for level in range(1, levels + 1):
            bid_price = mid_price - level * tick
            ask_price = mid_price + level * tick

            # Depth decay by level
            depth_weight = np.exp(-decay * level)

            # Lognormal noise for realistic size skew
            noise = np.random.lognormal(mean=0.0, sigma=size_noise)

            bid_qty = int(max(1, base_volume * depth_weight * noise))
            ask_qty = int(max(1, base_volume * depth_weight * noise))

            self._create_npc_order(
                price=round(bid_price, 2),
                qty=bid_qty,
                type=OrderType.LIMIT,
                direction=Direction.BUY,
            )

            self._create_npc_order(
                price=round(ask_price, 2),
                qty=ask_qty,
                type=OrderType.LIMIT,
                direction=Direction.SELL,
            )

    def add_random_market_order(
        self,
        base_volume: float = 5.0,
        pressure_sensitivity: float = 2.0,
        noise: float = 0.3,
    ) -> None:
        """
        Generate realistic directional market order flow.
        """

        # 1) Uninformed (noise) flow: symmetric
        noise_sign = 1 if random.random() < 0.5 else -1
        noise_flow = noise_sign * base_volume

        # 2) Informed (pressure) flow
        pressure_flow = pressure_sensitivity * self.curr_rate

        # 3) Combine flows
        net_flow = noise_flow + pressure_flow

        # 4) Multiplicative size noise (strictly positive)
        net_flow *= np.random.lognormal(mean=0.0, sigma=noise)

        qty = int(abs(net_flow))
        if qty < 1:
            return

        if net_flow > 0:
            self._create_npc_order(
                price=0.0,
                qty=qty,
                type=OrderType.MARKET,
                direction=Direction.BUY,
            )
        else:
            self._create_npc_order(
                price=0.0,
                qty=qty,
                type=OrderType.MARKET,
                direction=Direction.SELL,
            )

    def del_old_orders(self) -> None:
        """
        Deletes old orders from the order book.

        """
        if self.tick <= 10:
            return

        old_orders = self.npc_orders.popleft()
        for order_id in old_orders:
            self.order_book.cancel_order(order_id)

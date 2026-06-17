from typing import Callable

from common import Order
from sortedcontainers import SortedDict
from utils.constants import Direction, OrderType
from utils.data_structures import DoublyLinkedList, Node


class OrderLadder:

    @property
    def volume(self) -> int:
        """Get total volume of orders in the ladder.

        Returns:
            int: Total quantity of all orders in the ladder.
        """
        return sum(self.price_volumes.values())

    def __init__(self, direction: Direction) -> None:
        """Initialize an order ladder for a specific direction.

        Args:
            direction: Direction of orders in this ladder (BUY or SELL).
        """
        self.direction = direction
        self.price_volumes = SortedDict()
        self.price_levels = SortedDict()
        self.order_id_to_order: dict[str, Node] = dict()

    def add_order(self, order: Order) -> None:
        """Add a limit order to the order ladder.

        Args:
            order: The limit order to add.

        Raises:
            Exception: If order type is not LIMIT/STOP_LIMIT.
        """
        if order.order_type not in (OrderType.LIMIT, OrderType.STOP_LIMIT):
            raise Exception("Only limit-like orders can be added to order ladder")
        dll: DoublyLinkedList = self.price_levels.setdefault(
            order.price, DoublyLinkedList()
        )
        self.price_volumes[order.price] = (
            self.price_volumes.get(order.price, 0) + order.qty_left
        )
        node = dll.append(order)
        assert order.order_id is not None  # for type checker
        self.order_id_to_order[order.order_id] = node

    def is_empty(self) -> bool:
        """Check if the order ladder has no orders.

        Returns:
            bool: True if ladder is empty, False otherwise.
        """
        return not self.price_levels or sum(self.price_volumes.values()) <= 0

    def best_price(self) -> float | None:
        """Get the best price at the top of the order ladder.

        For BUY orders, returns the highest price. For SELL orders, returns the lowest.

        Returns:
            float | None: The best price, or None if ladder is empty.
        """
        if self.is_empty():
            return None
        if self.direction == Direction.BUY:
            return self.price_levels.peekitem(-1)[0]
        else:
            return self.price_levels.peekitem(0)[0]

    def match_order(self, order: Order) -> tuple[str, str, float, int, int]:
        """Match an incoming order with the best resting order in the ladder.

        Executes a trade between the incoming order and the first (best) order
        in the ladder, updating quantities and removing fully filled orders.

        Args:
            order: The incoming order to match.

        Returns:
            tuple:
            (incoming_order_id, resting_order_id, traded_price, traded_qty, resting_qty_left)

        Raises:
            Exception: If ladder is empty or order direction matches ladder direction.
        """
        if self.is_empty():
            raise Exception("No orders to match")

        if self.direction == order.direction:
            raise Exception("Order direction mismatch for matching")

        # should not be None here as ladder is not empty
        best_price = self.best_price()
        assert best_price is not None  # for type checker

        dll: DoublyLinkedList = self.price_levels[best_price]
        resting_order_node: Node = dll.head.next  # type: ignore should have next
        resting_order: Order = resting_order_node.val
        assert resting_order.order_id is not None  # for type checker
        assert order.order_id is not None  # for type checker

        traded_qty = min(order.qty_left, resting_order.qty_left)
        traded_price = best_price

        # Update quantities
        order.qty_left -= traded_qty
        resting_order.qty_left -= traded_qty
        self.price_volumes[best_price] = (
            self.price_volumes.get(best_price, 0) - traded_qty
        )

        # If resting order is fully filled, remove it from ladder
        if resting_order.qty_left == 0:
            dll.remove(resting_order_node)
            if dll.is_empty():
                assert (
                    self.price_volumes[best_price] == 0
                ), "MISMATCH: price level empty but volume not zero"
                del self.price_levels[best_price]
                del self.price_volumes[best_price]
            del self.order_id_to_order[resting_order.order_id]

        return (
            order.order_id,
            resting_order.order_id,
            traded_price,
            traded_qty,
            resting_order.qty_left,
        )

    def del_order(self, order_id: str) -> Order | None:
        """Remove an order from the order ladder.

        Args:
            order_id: The ID of the order to delete.

        Returns:
            Order | None: The deleted order, or None if order not found.
        """
        if order_id not in self.order_id_to_order:
            return None
        node: Node = self.order_id_to_order[order_id]
        order: Order = node.val
        dll: DoublyLinkedList = self.price_levels[order.price]  # type: ignore

        dll.remove(node)
        self.price_volumes[order.price] = (
            self.price_volumes.get(order.price, 0) - order.qty_left
        )

        # Clean up empty price level
        if dll.is_empty():
            assert (
                self.price_volumes[order.price] == 0
            ), "MISMATCH: price level empty but volume not zero"
            del self.price_levels[order.price]
            del self.price_volumes[order.price]
        del self.order_id_to_order[order_id]
        return order


class OrderBook:
    """Simulates an order book based market matching engine.

    Handles limit, market, stop-market, and stop-limit orders for both buy and
    sell directions.
    Uses a doubly-linked list + sorted dict structure for efficient order matching
    and price level management. Executes fills when orders match and manages
    stop order triggering based on traded prices.
    """

    def __init__(
        self, on_fill: Callable[[str, float, int, int], None] | None = None
    ) -> None:
        """Initialize the order book.

        Args:
            on_fill: Callback function invoked when an order is filled.
                    Signature: (order_id, price, quantity, qty_left) -> None
        """
        # IMPT @mingyuan, during presentation can talk about design decision
        # ie why i decided to use DLL + SortedDict
        self.bids = OrderLadder(Direction.BUY)
        self.asks = OrderLadder(Direction.SELL)

        self.bids_stop = SortedDict()
        self.asks_stop = SortedDict()
        self.bids_stop_limit = SortedDict()
        self.asks_stop_limit = SortedDict()
        self.bids_market = DoublyLinkedList()
        self.asks_market = DoublyLinkedList()
        self.order_id_to_order: dict[str, Node] = (
            dict()
        )  # only for market / stop / stop-limit orders

        self.on_fill = on_fill or (lambda order, price, qty, qty_left: None)

    # --------- register_order and its helpers -----------
    def register_order(self, order: Order) -> None:
        """Register a new order with the order book.

        Validates the order and routes it to the appropriate handler based
        on order type (LIMIT, MARKET, or STOP). May trigger immediate matching
        and fill callbacks.

        Args:
            order: The order to register.

        Raises:
            Exception: If order validation fails or order type is unknown.
        """
        self._validate_order(order)

        match order.order_type:
            case OrderType.MARKET:
                self._add_market_order(order)
            case OrderType.LIMIT:
                self._add_limit_order(order)
            case OrderType.STOP:
                self._add_stop_order(order)
            case OrderType.STOP_LIMIT:
                self._add_stop_limit_order(order)
            case _:
                raise Exception("Unknown order type")

    def _validate_order(self, order: Order) -> None:
        """Validate an order before registration.

        Checks that order ID is valid and unique, and that non-market orders
        have a price specified.

        Args:
            order: The order to validate.

        Raises:
            Exception: If validation fails.
        """
        if order.order_id is None or order.order_id in self.order_id_to_order:
            raise Exception("Order ID is None or already exists")
        if order.order_type == OrderType.LIMIT and order.price is None:
            raise Exception("Limit orders must have a price")

        if order.order_type == OrderType.STOP:
            if order.stop_price is None and order.price is None:
                raise Exception("Stop orders must have a stop price")
            if order.stop_price is None:
                # Backward-compatible: older callers used `price` for stop trigger.
                order.stop_price = order.price
                order.price = None

        if order.order_type == OrderType.STOP_LIMIT:
            if order.price is None:
                raise Exception("Stop-limit orders must have a limit price")
            if order.stop_price is None:
                raise Exception("Stop-limit orders must have a stop price")

    def _add_limit_order(self, order: Order) -> None:
        """Process and add a limit order to the order book.

        Attempts to match the order against market orders first, then limit
        orders at acceptable prices. Remaining unmatched quantity is added
        to the order ladder. Triggers stop orders if any fills occur.

        Args:
            order: The limit order to add.
        """
        market_book = (
            self.asks_market if order.direction == Direction.BUY else self.bids_market
        )
        limit_book = self.asks if order.direction == Direction.BUY else self.bids
        traded_price = None
        assert order.price is not None  # for type checker
        assert order.order_id is not None  # for type checker

        while order.qty_left > 0 and not market_book.is_empty():
            market_order_node = market_book.head.next
            if market_order_node is None:
                raise Exception("Critical: Market book structure corrupted")
            market_order: Order = market_order_node.val
            assert market_order.order_id is not None  # for type checker

            traded_qty = min(order.qty_left, market_order.qty_left)
            traded_price = order.price

            order.qty_left -= traded_qty
            market_order.qty_left -= traded_qty
            if market_order.qty_left == 0:
                market_book.remove(market_order_node)
                del self.order_id_to_order[market_order.order_id]

            self.on_fill(order.order_id, traded_price, traded_qty, order.qty_left)
            self.on_fill(
                market_order.order_id,
                traded_price,
                traded_qty,
                market_order.qty_left,
            )

        while order.qty_left > 0 and not limit_book.is_empty():
            best_price = limit_book.best_price()
            if (
                best_price is None
                or (order.direction == Direction.BUY and order.price < best_price)
                or (order.direction == Direction.SELL and order.price > best_price)
            ):
                break

            (
                taker_order_id,
                maker_order_id,
                traded_price,
                traded_qty,
                maker_qty_left,
            ) = limit_book.match_order(order)

            self.on_fill(taker_order_id, traded_price, traded_qty, order.qty_left)
            self.on_fill(maker_order_id, traded_price, traded_qty, maker_qty_left)

        if order.qty_left > 0:
            (self.bids if order.direction == Direction.BUY else self.asks).add_order(
                order
            )

        if traded_price is not None:
            self._handle_stop_orders(traded_price)

    def _add_market_order(self, order: Order) -> None:
        """Process and add a market order to the order book.

        Matches the market order against available limit orders in the opposite
        direction until filled or no liquidity remains. Unmatched quantity is
        added to the market order queue. Triggers stop orders if any fills occur.

        Args:
            order: The market order to add.
        """
        limit_book = self.asks if order.direction == Direction.BUY else self.bids
        traded_price = None

        while order.qty_left > 0 and not limit_book.is_empty():
            (
                taker_order_id,
                maker_order_id,
                traded_price,
                traded_qty,
                maker_qty_left,
            ) = limit_book.match_order(order)

            self.on_fill(taker_order_id, traded_price, traded_qty, order.qty_left)
            self.on_fill(maker_order_id, traded_price, traded_qty, maker_qty_left)

        if order.qty_left > 0:
            market_orders = (
                self.bids_market
                if order.direction == Direction.BUY
                else self.asks_market
            )
            node = market_orders.append(order)
            assert order.order_id is not None  # for type checker
            self.order_id_to_order[order.order_id] = node

        if traded_price is not None:
            self._handle_stop_orders(traded_price)

    def _add_stop_order(self, order: Order) -> None:
        """Add a stop order to the order book.

        Stop orders are stored separately and activated when a trade occurs
        at their trigger price.

        Args:
            order: The stop order to add.
        """
        stop_book = (
            self.bids_stop if order.direction == Direction.BUY else self.asks_stop
        )
        trigger_price = order.stop_price if order.stop_price is not None else order.price
        assert trigger_price is not None  # for type checker
        order.stop_price = trigger_price
        assert order.order_id is not None  # for type checker

        dll: DoublyLinkedList = stop_book.setdefault(trigger_price, DoublyLinkedList())
        node = dll.append(order)
        self.order_id_to_order[order.order_id] = node

    def _add_stop_limit_order(self, order: Order) -> None:
        """Add a stop-limit order to the order book.

        Stop-limit orders are stored separately and, once triggered, become
        regular limit orders at `order.price`.
        """
        stop_book = (
            self.bids_stop_limit
            if order.direction == Direction.BUY
            else self.asks_stop_limit
        )
        assert order.stop_price is not None  # validated in _validate_order
        assert order.order_id is not None

        dll: DoublyLinkedList = stop_book.setdefault(order.stop_price, DoublyLinkedList())
        node = dll.append(order)
        self.order_id_to_order[order.order_id] = node

    def _handle_stop_orders(self, price: float) -> None:
        """Activate and process stop orders triggered by a trade price.

        Checks for buy stop orders above the price and sell stop orders below,
        converts them to market orders, and adds them to the order book.

        Args:
            price: The trade price that may trigger stop orders.
        """
        to_activate_market: list[Order] = []
        to_activate_limit: list[Order] = []

        # Handle stop sell orders (trigger when trade <= stop).
        while (
            self.asks_stop and (stop_price := self.asks_stop.peekitem(-1)[0]) >= price
        ):
            dll = self.asks_stop[stop_price]
            node = dll.head.next
            while node != dll.tail:
                stop_order: Order = node.val
                assert stop_order.order_id is not None
                if stop_order.order_id in self.order_id_to_order:
                    del self.order_id_to_order[stop_order.order_id]
                to_activate_market.append(stop_order)
                next_node = node.next
                dll.remove(node)
                node = next_node
            del self.asks_stop[stop_price]

        # Handle stop buy orders (trigger when trade >= stop).
        while self.bids_stop and (stop_price := self.bids_stop.peekitem(0)[0]) <= price:
            dll = self.bids_stop[stop_price]
            node = dll.head.next
            while node != dll.tail:
                stop_order: Order = node.val
                assert stop_order.order_id is not None
                if stop_order.order_id in self.order_id_to_order:
                    del self.order_id_to_order[stop_order.order_id]
                to_activate_market.append(stop_order)
                next_node = node.next
                dll.remove(node)
                node = next_node
            del self.bids_stop[stop_price]

        # Handle stop-limit sell orders (trigger when trade <= stop).
        while (
            self.asks_stop_limit
            and (stop_price := self.asks_stop_limit.peekitem(-1)[0]) >= price
        ):
            dll = self.asks_stop_limit[stop_price]
            node = dll.head.next
            while node != dll.tail:
                stop_limit_order: Order = node.val
                assert stop_limit_order.order_id is not None
                if stop_limit_order.order_id in self.order_id_to_order:
                    del self.order_id_to_order[stop_limit_order.order_id]
                to_activate_limit.append(stop_limit_order)
                next_node = node.next
                dll.remove(node)
                node = next_node
            del self.asks_stop_limit[stop_price]

        # Handle stop-limit buy orders (trigger when trade >= stop).
        while (
            self.bids_stop_limit
            and (stop_price := self.bids_stop_limit.peekitem(0)[0]) <= price
        ):
            dll = self.bids_stop_limit[stop_price]
            node = dll.head.next
            while node != dll.tail:
                stop_limit_order: Order = node.val
                assert stop_limit_order.order_id is not None
                if stop_limit_order.order_id in self.order_id_to_order:
                    del self.order_id_to_order[stop_limit_order.order_id]
                to_activate_limit.append(stop_limit_order)
                next_node = node.next
                dll.remove(node)
                node = next_node
            del self.bids_stop_limit[stop_price]

        for order in to_activate_market:
            # order.order_type = OrderType.MARKET, Keeping it as STOP to track
            # TODO @mingyuan, There is currently no FE update that a STOP has became a MARKET
            self._add_market_order(order)
        for order in to_activate_limit:
            self._add_limit_order(order)

    def cancel_order(self, order_id: str) -> None | Order:
        """Cancel an existing order in the order book.

        Args:
            order_id: The ID of the order to cancel.

        Returns:
            Order: The cancelled order.

        Raises:
            Exception: If order with given ID is not found.
        """
        if order_id not in self.order_id_to_order:
            order = self.bids.del_order(order_id) or self.asks.del_order(order_id)
            return order

        node: Node = self.order_id_to_order[order_id]
        DoublyLinkedList().remove(node)  # detach from whatever list it's in
        del self.order_id_to_order[order_id]
        return node.val

    def get_best_bid(self, price: int | None = None) -> float | None:
        """Get the best bid price in the order book.

        Returns the highest bid price. If a price is provided, returns the
        highest bid price that is less than or equal to that price.

        Args:
            price: Optional price limit. If provided, returns highest bid <= price.

        Returns:
            float | None: The best bid price, or None if no bids exist.
        """
        if self.bids.is_empty():
            return None

        if price is None:
            return self.bids.best_price()

        # Find highest bid <= price
        index = self.bids.price_levels.bisect_right(price)
        if index == 0:
            return None  # no bid <= price

        return self.bids.price_levels.keys()[index - 1]

    def get_best_ask(self, price: int | None = None) -> float | None:
        """Get the best ask price in the order book.

        Returns the lowest ask price. If a price is provided, returns the
        lowest ask price that is greater than or equal to that price.

        Args:
            price: Optional price limit. If provided, returns lowest ask >= price.

        Returns:
            float | None: The best ask price, or None if no asks exist.
        """
        if self.asks.is_empty():
            return None

        if price is None:
            return self.asks.best_price()

        # Find lowest ask >= price
        index = self.asks.price_levels.bisect_left(price)
        if index == len(self.asks.price_levels):
            return None  # no ask >= price

        return self.asks.price_levels.keys()[index]

    def get_order_book_snapshot(self) -> dict:
        """Get a snapshot of the current order book state.

        Returns:
            dict: A dictionary representation of the order book with bids and asks.
        """
        snapshot = {
            "bids": [
                {"price": price, "volume": volume}
                for price, volume in reversed(self.bids.price_volumes.items())
            ],
            "asks": [
                {"price": price, "volume": volume}
                for price, volume in self.asks.price_volumes.items()
            ],
        }
        return snapshot

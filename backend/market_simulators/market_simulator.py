import asyncio
from abc import ABC, abstractmethod
from typing import Any

from common import Order


class MarketSimulator(ABC):
    """
    Base class for market simulators.

    Simulators now work with asyncio queues instead of callbacks.
    They publish fill events to a shared queue.
    """

    def __init__(self, fill_queue: asyncio.Queue | None = None):
        """
        Initialize simulator.

        Args:
            fill_queue: Shared queue where fill events are published
        """
        self.fill_queue = fill_queue or asyncio.Queue()

    @abstractmethod
    def register_order(self, order: Order) -> bool:
        """
        Register an order with the simulator.

        Args:
            order: Order to register

        Returns:
            True if order was accepted, False otherwise
        """
        pass

    @abstractmethod
    def next_tick(self, *args, **kwargs) -> dict[str, Any]:
        """
        Advance to the next market tick.

        Returns:
            Market data for the current tick (OHLC, etc.)
        """
        pass

    @abstractmethod
    def cancel_order(self, order_id: str) -> None | Order:
        """
        Cancel an order.

        Args:
            order_id: ID of order to cancel

        Returns:
            None if order was not found, or the canceled Order object if successful
        """
        pass

    @abstractmethod
    def best_bid(self) -> float:
        """Get best bid price"""
        pass

    @abstractmethod
    def best_ask(self) -> float:
        """Get best ask price"""
        pass

    def _publish_fill(
        self, order_id: str, price: float, qty: int, qty_left: int
    ) -> None:
        """
        Publish a fill event to the fill queue.

        This is a synchronous method that puts the event in the queue.
        Subclasses should call this instead of using callbacks.

        Args:
            order_id: ID of the filled order
            price: Price at which order was filled
            qty: Quantity filled in this fill
            qty_left: Remaining quantity on the order after this fill
        """
        try:
            # Use put_nowait for sync context
            self.fill_queue.put_nowait(
                {
                    "order_id": order_id,
                    "price": price,
                    "qty": qty,
                    "qty_left": qty_left,
                }
            )
        except asyncio.QueueFull:
            # Log error but don't crash simulator
            print(f"ERROR: Fill queue full, dropping fill for {order_id}")

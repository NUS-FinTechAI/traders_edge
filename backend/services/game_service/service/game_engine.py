import asyncio
from abc import ABC, abstractmethod
from typing import Any, Callable, Literal

from common import Order
from market_simulators.market_simulator import MarketSimulator
from services.game_service.models.game import *
from services.game_service.router.connection_manager import ConnectionManager
from utils.constants import BROADCAST_USER_ID, NPC_ORDER_PREFIX


class GameEngine(ABC):
    @property
    def is_game_over(self) -> bool:
        """Check if the game has ended.

        Returns:
            bool: True if the game is over, False otherwise.
        """
        raise NotImplementedError()

    def __init__(
        self,
        mode: Literal["Tutorial", "Puzzle", "Endless", "Multiplayer"] = "Tutorial",
    ) -> None:
        """Initialize the game engine.

        Args:
            mode: The game mode determining difficulty and mechanics (Tutorial, Puzzle, Endless, Multiplayer).
        """
        super().__init__()
        self.mode = mode
        self.ticker_to_simulator: dict[str, MarketSimulator] = {}
        self.order_id_to_order = {}
        self._emit_handler: Callable[[str, str, Any], None] = print
        self.order_cnt = 0

    # ----------- Initialization Helpers --------------
    def init_game(self) -> None:
        """Initialize all game components and state.

        Orchestrates the initialization sequence: async primitives, level data,
        fresh game state, and local variables.
        """
        self._init_async()
        self._init_with_level_data()
        self._init_with_user_progress()
        self._init_local_vars()
        self.manual_next_tick = self.level_data.is_manual_tick
        self.auto_tick_requires_manual_start = bool(
            not self.manual_next_tick and getattr(self.level_data, "manual_start", False)
        )

    def _init_async(self):
        """Initialize all async primitives, locks, queues, and task tracking.

        Sets up state synchronization via locks, turn signaling with conditions,
        and message queues for order and fill processing.
        """
        # Async primitives
        # For game state
        self.state_lock = asyncio.Lock()

        # For next turn signalling
        # No need to couple this with state_lock
        self.is_next_turn = False
        self.next_turn_cond = asyncio.Condition()
        self.next_turn_task: asyncio.Task | None = None
        self.next_tick_task: asyncio.Task | None = None
        self.active_simulators = 0

        # Queues and tasks for simulators
        self.fill_queue: asyncio.Queue = asyncio.Queue()
        self.order_queues: dict[str, asyncio.Queue] = {}
        self.simulator_tasks: list[asyncio.Task] = []
        self.fill_listener_task: asyncio.Task | None = None
        self._running = False

    @abstractmethod
    def _init_with_level_data(self) -> None:
        """Initialize level data from the game configuration.

        Subclasses must implement this to load level-specific parameters,
        tickers, and other level configuration.
        """
        self.level_data: LevelDataModel

    @abstractmethod
    def _init_with_user_progress(self) -> None:
        """Initialize user progress and game state.

        Args:
            force_new_game: If True, reset to initial state. If False, resume from saved progress.
        """
        pass

    @abstractmethod
    def _init_local_vars(self) -> None:
        """Initialize any additional local variables required by the subclass."""
        pass

    def register_emit_handler(self, handler: Callable[[str, str, Any], None]) -> None:
        """
        Register a handler for emitting messages to the user.

        Args:
            handler: A callable that accepts (event: str, data: Any) and sends it to the user.
                    Typically a websocket emit function, but can be any message transport.
        """
        self._emit_handler = handler

    def emit(self, event: str, user: str, data: Any = None) -> None:
        """Emit a message event to the user.

        Args:
            event: The event name/type (e.g., 'next_tick', 'order_filled').
            user: The user ID or 'all' for broadcast.
            data: The data payload for the event.
        """
        self._emit_handler(event, user, data)

    # ---------- Accessors ----------------
    def get_level_data(self) -> dict[str, Any]:
        """Get level configuration data as a dictionary.

        Returns:
            dict: The level data model converted to a dictionary.
        """
        return self.level_data.model_dump()

    @abstractmethod
    async def get_game_state(self, *args, **kwargs) -> dict[str, Any]:
        """Get the current game state.

        Returns:
            dict: A dictionary containing the complete game state.
        """
        pass

    @abstractmethod
    async def get_fe_game_state(self, *args, **kwargs) -> dict[str, Any]:
        """Get the game state formatted for frontend display.

        Returns a modified version of the game state with computed values
        suitable for UI presentation, including:
        - Total value of stocks
        - Net worth
        - Profit/loss

        Returns:
            dict: Frontend-formatted game state with derived values.
        """
        pass

    async def _on_simulator_event_processed(
        self, ticker: str, event: dict[str, Any]
    ) -> None:
        """Optional hook called after a simulator event is processed.

        Subclasses can override to emit additional events after register/cancel
        operations are applied to the simulator state.
        """
        return

    # ---------- Life cycle methods ---------------
    async def start(self) -> None:
        """Start background tasks for simulators and fill listener.

        Launches simulator tasks for each ticker, a fill listener task,
        and optionally a periodic next-tick runner task.
        """
        if self._running:
            return

        self._running = True

        # Start simulator task for each ticker
        for ticker in self.level_data.starting_tickers:
            task = asyncio.create_task(
                self._run_simulator(ticker), name=f"simulator-{ticker}"
            )
            self.simulator_tasks.append(task)

        # Start fill listener
        self.fill_listener_task = asyncio.create_task(
            self._listen_fills(), name="fill-listener"
        )

        # start next tick task
        if not self.manual_next_tick and not self.auto_tick_requires_manual_start:
            self._start_next_tick_task()

    async def stop(self) -> None:
        """Stop all background tasks and wait for graceful shutdown.

        Cancels all simulator tasks, the fill listener, and waits for them
        to complete before returning.
        """
        self._running = False

        # Cancel all tasks
        for task in self.simulator_tasks:
            task.cancel()

        if self.fill_listener_task:
            self.fill_listener_task.cancel()

        if self.next_tick_task:
            self.next_tick_task.cancel()

        # Wait for cancellation
        await asyncio.gather(*self.simulator_tasks, return_exceptions=True)
        if self.fill_listener_task:
            await asyncio.gather(self.fill_listener_task, return_exceptions=True)
        if self.next_tick_task:
            await asyncio.gather(self.next_tick_task, return_exceptions=True)

    def _start_next_tick_task(self) -> None:
        if self.manual_next_tick:
            return
        if self.next_tick_task and not self.next_tick_task.done():
            return
        self.next_tick_task = asyncio.create_task(
            self._next_tick_runner(), name="next-tick-runner"
        )

    async def start_ticking(self) -> dict[str, Any]:
        """Begin auto-ticking for levels that require manual start confirmation."""
        if self.manual_next_tick:
            return {
                "result": "FAIL",
                "reason": "startTicking is only valid for auto-tick levels",
            }
        if not self._running:
            return {"result": "FAIL", "reason": "game has not started yet"}
        if not self.auto_tick_requires_manual_start:
            self._start_next_tick_task()
            return {"result": "PASS", "started": False, "reason": "already active"}

        self.auto_tick_requires_manual_start = False
        self._start_next_tick_task()
        return {"result": "PASS", "started": True}

    async def _listen_fills(self) -> None:
        """
        Background task that listens to fill events from all simulators.
        Applies fills to game state with lock protection.
        """
        while self._running:
            try:
                # Wait for fill event
                fill = await self.fill_queue.get()

                if fill["order_id"].startswith(NPC_ORDER_PREFIX):
                    self.emit(
                        "price_tick",
                        BROADCAST_USER_ID,
                        {"price": fill["price"]},
                    )
                    continue

                # Apply fill with state lock
                async with self.state_lock:
                    self.on_fill(
                        fill["order_id"],
                        fill["price"],
                        fill["qty"],
                        fill["qty_left"],
                    )

            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Error processing fill: {e}")

    async def _run_simulator(self, ticker: str) -> None:
        """Background task that processes orders for one ticker serially.

        Each ticker has its own task to maintain order serialization.
        Listens for order registration and cancellation events and delegates
        to the simulator. Coordinates with turn changes via next_turn_cond.

        Args:
            ticker: The ticker symbol to simulate.
        """
        simulator = self.ticker_to_simulator[ticker]
        queue = self.order_queues[ticker]
        while self._running:
            try:
                # Wait for order event
                event = await queue.get()
                # reader and writer lock lock to sync with next turn
                async with self.next_turn_cond:
                    while self.is_next_turn:
                        await self.next_turn_cond.wait()
                    self.active_simulators += 1

                # Process based on event type
                match event["type"]:
                    case "register":
                        simulator.register_order(event["order"])
                    case "cancel":
                        simulator.cancel_order(event["order_id"])
                    case _:
                        raise ValueError(f"Unknown event type: {event['type']}")
                await self._on_simulator_event_processed(ticker, event)
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Error in simulator {ticker}: {e}")
            finally:
                async with self.next_turn_cond:
                    self.active_simulators -= 1
                    if self.active_simulators == 0:
                        self.next_turn_cond.notify_all()

    async def _next_tick_runner(self) -> None:
        """Background task that periodically advances the game tick.

        Reads the auto-tick interval from normalized level config and calls
        next_tick() at regular intervals. Falls back to legacy `interval`
        field parsing for compatibility.
        """
        interval = self.level_data.auto_tick_interval_seconds
        if interval is None:
            try:
                interval = int(self.level_data.interval)
            except Exception as e:
                print(f"Error parsing interval: {e}")
                interval = 1
        while self._running and not self.is_game_over:
            try:
                await asyncio.sleep(interval)
                await self.next_tick()
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Error in next tick runner: {e}")

    # ---------- Next tick and its helpers ----------------
    async def next_tick(self) -> None:
        """Advance the game by one tick.

        Coordinates with all simulators to ensure they finish processing,
        executes the tick logic, emits the updated state to all clients,
        and resumes simulator processing.
        """
        try:
            async with self.next_turn_cond:
                self.is_next_turn = True
                while self.active_simulators > 0:
                    await self.next_turn_cond.wait()

            await self.next_tick_logic()

            async with self.next_turn_cond:
                self.is_next_turn = False
                self.next_turn_cond.notify_all()
        except Exception as e:
            print(f"Error in next tick runner: {e}")

    @abstractmethod
    async def next_tick_logic(self) -> dict[str, Any]:
        """Execute game logic for a single tick.

        Subclasses must implement to update game state, process market changes,
        check win/loss conditions, etc.

        Returns:
            dict: Tick-specific data to be emitted to clients.
        """
        pass

    # --------- register_order and its helpers ------------
    @abstractmethod
    async def register_order(self, order: Order) -> dict[str, Any]:
        """Register a new order to be processed by the simulator.

        Args:
            order: The order to register.

        Returns:
            dict: Response data including order confirmation details.
        """
        pass

    def assign_order_id(self, order: Order) -> str:
        """Generate unique order ID based on user, direction, ticker, and counter.

        Args:
            order: Order to assign ID to.

        Returns:
            The assigned order ID.
        """
        order.order_id = f"{order.user_id}_{order.action.value}_{order.ticker}_{self.order_cnt}"
        self.order_cnt += 1
        return order.order_id

    @abstractmethod
    def on_fill(self, order_id: str, price: float, qty: int, qty_left: int) -> None:
        """Handle an order fill event from the simulator.

        Args:
            order_id: The ID of the order that was filled.
            price: The fill price.
            qty: The quantity filled.
            qty_left: Remaining order quantity after this fill.
        """
        pass

    # --------- cancel_order and its helpers ------------
    @abstractmethod
    async def cancel_order(self, order_id) -> dict[str, Any]:
        """Cancel an existing order.

        Args:
            order_id: The ID of the order to cancel.

        Returns:
            dict: Response data including cancellation confirmation.
        """
        pass

    # --------- Game Over and Disconnect Handlers ------------
    @abstractmethod
    async def on_game_over(self) -> dict[str, Any]:
        """Handle game over event.

        Returns:
            dict: Game over data including final score and results.
        """
        pass

    async def on_disconnect(self) -> dict[str, Any]:
        """Handle client disconnection.

        Stops all background tasks and cleans up resources.

        Returns:
            dict: Empty dictionary.
        """
        await self.stop()
        return {}

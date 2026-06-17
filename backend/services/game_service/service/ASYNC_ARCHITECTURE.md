# Async Engine Architecture

## Overview

This implements an async queue-based architecture to separate the game engine from market simulators, allowing concurrent operation while maintaining thread safety.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              FastAPI WebSocket Handler                   │
│                    (async)                               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         SinglePlayerGameEngineAsync                      │
│                                                          │
│  • asyncio.Lock for state protection                    │
│  • Per-ticker order queues (dict[str, Queue])           │
│  • Shared fill queue (Queue)                            │
└──┬───────────────────────────────┬──────────────────────┘
   │                               │
   │ Order Events                  │ Fill Events
   ▼                               ▼
┌─────────────────┐         ┌──────────────────┐
│ Order Queue     │         │   Fill Queue     │
│ (Per Ticker)    │         │   (Shared)       │
└────────┬────────┘         └────────▲─────────┘
         │                           │
         │ Consumed by               │ Published by
         ▼                           │
┌─────────────────────────────────┐ │
│  Background Task per Ticker     │─┘
│  (OrderbookSimulatorAsync)      │
│                                 │
│  • Processes orders serially    │
│  • Publishes fills to queue     │
└─────────────────────────────────┘
```

## Key Components

### 1. `MarketSimulator` (Base Class)
- **File**: `market_simulators/market_simulator_async.py`
- Now accepts `fill_queue` in constructor
- Provides `_publish_fill()` method instead of callback
- Subclasses publish fill events to queue

### 2. `OrderbookSimulatorAsync`
- **File**: `market_simulators/orderbook/orderbook_simulator_async.py`
- Async version of OrderbookSimulator
- Receives fills from OrderBook via callback
- Publishes fills to shared queue

### 3. `SinglePlayerGameEngineAsync`
- **File**: `services/game_service/service/single_player_engine_async.py`
- Async version of SinglePlayerGameEngine
- **State Protection**: `asyncio.Lock` protects all game state
- **Order Queues**: One `asyncio.Queue` per ticker
- **Fill Queue**: Single shared queue for all fill events
- **Background Tasks**:
  - One task per ticker (processes orders serially)
  - One fill listener task (applies fills to state)

## Message Flow

### Order Registration
```python
1. WebSocket → engine.register_order(order)
2. Engine validates with state_lock
3. Engine enqueues to order_queues[ticker]
4. Background task for ticker picks up order
5. Simulator processes order
6. Simulator publishes fill to fill_queue
7. Fill listener picks up fill
8. Fill listener applies to state with state_lock
9. Fill listener emits WebSocket event
```

### Order Cancellation
```python
1. WebSocket → engine.cancel_order(order_id)
2. Engine validates with state_lock
3. Engine enqueues cancel event to order_queues[ticker]
4. Background task processes cancellation
5. Engine updates state with state_lock
```

## Race Condition Prevention

### Problem 1: Concurrent Order Validation
**Solution**: Lock during read-modify-write
```python
async def register_order(self, order):
    async with self.state_lock:
        # Atomic: validate cash, reserve funds
        self._validate_fund_sufficient(order)
        self._reserve_funds(order)
    # Enqueue outside lock
    await self.order_queues[ticker].put(order)
```

### Problem 2: Concurrent Fill Processing
**Solution**: Single fill listener + lock
```python
async def _listen_fills(self):
    while self._running:
        fill = await self.fill_queue.get()
        async with self.state_lock:
            self._apply_fill(...)  # No await = atomic
```

### Problem 3: Reading State During Updates
**Solution**: Lock during reads
```python
async def get_fe_game_state(self):
    async with self.state_lock:
        # Snapshot all state atomically
        snapshot = {...}
    # Get market data outside lock
    return snapshot
```

## Benefits

✅ **Non-blocking**: Engine never blocks on simulator
✅ **Serialized per ticker**: Each ticker processes orders in sequence
✅ **Concurrent tickers**: Different tickers process in parallel
✅ **Thread-safe**: Lock protects shared state
✅ **FastAPI compatible**: Uses asyncio natively
✅ **WebSocket responsive**: Handlers don't block
✅ **Testable**: Easy to mock queues

## Usage

### Basic Usage
```python
import asyncio

# Create engine
engine = SinglePlayerGameEngineAsync(
    user_id="user1",
    level_id="tutorial_1"
)

# Start background tasks
await engine.start()

# Register order (non-blocking)
result = await engine.register_order(order)

# Get state
state = await engine.get_fe_game_state()

# Cleanup
await engine.stop()
```

### With FastAPI WebSocket
```python
@router.websocket("/ws/game/{user_id}/{level_id}")
async def game_websocket(websocket: WebSocket, user_id: str, level_id: str):
    await websocket.accept()
    
    engine = SinglePlayerGameEngineAsync(user_id, level_id)
    await engine.start()
    
    try:
        while True:
            data = await websocket.receive_json()
            
            match data["action"]:
                case "register_order":
                    result = await engine.register_order(data["order"])
                    await websocket.send_json(result)
                case "get_state":
                    state = await engine.get_fe_game_state()
                    await websocket.send_json(state)
    finally:
        await engine.stop()
```

## Files Created

1. **market_simulators/market_simulator_async.py**
   - Async base class for simulators

2. **market_simulators/orderbook/orderbook_simulator_async.py**
   - Async orderbook simulator

3. **services/game_service/service/single_player_engine_async.py**
   - Async game engine

4. **services/game_service/service/async_engine_examples.py**
   - Usage examples

5. **utils/event_bus.py** (optional)
   - Custom event bus (alternative to queues)

## Testing

Run examples:
```bash
python backend/services/game_service/service/async_engine_examples.py
```

## Migration Path

### Current Code (Sync)
```python
engine = SinglePlayerGameEngine(...)
engine.register_order(order)  # Blocks
```

### New Code (Async)
```python
engine = SinglePlayerGameEngineAsync(...)
await engine.start()  # Start background tasks
await engine.register_order(order)  # Non-blocking
await engine.stop()  # Cleanup
```

## Performance Characteristics

- **Order registration**: O(1) - just enqueues
- **Fill processing**: O(1) per fill
- **State reads**: O(n) where n = number of tickers
- **Lock contention**: Minimal - operations are fast
- **Queue overhead**: Negligible for game workloads

## Future Enhancements

1. **Redis/RabbitMQ**: Replace asyncio.Queue with external MQ
2. **Distributed**: Run simulators on separate processes/machines
3. **Event sourcing**: Log all events for replay
4. **Metrics**: Track queue depths, latencies
5. **Backpressure**: Handle slow simulators gracefully

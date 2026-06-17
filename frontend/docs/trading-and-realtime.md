# Trading And Realtime Flow

This document explains the active trading screen, how live data enters it, and where trading-specific logic belongs.

## Core Files

- `src/features/trading/components/TradingPage.tsx`
- `src/features/trading/pages/SinglePlayerTradingPage.tsx`
- `src/features/trading/pages/MultiplayerTradingPage.tsx`
- `src/features/trading/hooks/useSinglePlayerGame.ts`
- `src/features/trading/hooks/useMultiplayerGame.ts`
- `src/features/trading/hooks/useTradingSessionState.ts`
- `src/features/trading/services/gameSocket.ts`
- `src/features/trading/services/tradingPayloadMappers.ts`
- `src/features/trading/utils/tradingCalculations.ts`
- `src/features/trading/components/TradingLeftPanel.tsx`
- `src/features/trading/components/TradingRightPanel.tsx`

## Screen Responsibility

`TradingPage.tsx` is a shared presentation shell. It is responsible for:

- assembling the left and right trading panels
- wiring tutorial target refs
- opening and closing overlays such as trade modals, timers, unlocks, missions, context popups, and the game-end modal
- deriving display-only indicator series from normalized chart data
- calling session actions exposed by a game hook

It should not:

- open sockets directly
- make HTTP calls directly
- parse raw backend payloads
- own a second copy of market or portfolio state

Those responsibilities belong in the hooks and services below it.

## Two Entry Paths, One Screen

The same `TradingPage` renders both runtime modes by dependency-injecting a session hook.

### Single-player path

```text
SinglePlayerTradingPage
  -> useLevelAccessGate
  -> TradingPage(useSinglePlayerGame)
  -> gameSocket.ts opens /game/single-player/ws
  -> useTradingSessionState normalizes live payloads
```

Key files:

- `src/features/trading/pages/SinglePlayerTradingPage.tsx`
- `src/features/trading/hooks/useSinglePlayerGame.ts`
- `src/features/trading/services/gameSocket.ts`

Single-player owns the transport itself. It authenticates the socket with the Firebase token, sends start or next-tick commands, and forwards server events into `useTradingSessionState`.

### Multiplayer path

```text
MultiplayerPage
  -> MultiplayerSessionProvider owns room socket
  -> /multiplayer/trading/:roomCode
  -> TradingPage(useMultiplayerGame)
  -> useMultiplayerGame adapts provider payloads
  -> useTradingSessionState normalizes live payloads
```

Key files:

- `src/features/multiplayer/context/MultiplayerSessionProvider.tsx`
- `src/features/trading/pages/MultiplayerTradingPage.tsx`
- `src/features/trading/hooks/useMultiplayerGame.ts`

Multiplayer trading does not create another room socket. It reads the provider state and reuses the same normalization pipeline as single-player.

## Trading Session State

`useTradingSessionState.ts` is the main state machine for trading.

It consumes:

- start/bootstrap payloads
- tick updates
- price ticks
- order acknowledgements
- order fill events
- game-over payloads

It produces UI-ready state such as:

- `allPoints` for the chart
- `livePrice`, `bestBid`, `bestAsk`, `spread`, and order book rows
- `availableTickers` and `selectedTicker`
- `newsFeed`, unread state, and news read tracking
- normalized portfolio totals and analytics
- pending and past trade logs
- available tools and per-level feature toggles
- unlocks, passing criteria, bonus missions, and level context
- timer and modal flags

This hook is the data boundary between backend contracts and React presentation.

## Payload Normalization

Normalization helpers live in `src/features/trading/services/tradingPayloadMappers.ts`.

They are responsible for turning backend payloads into frontend-friendly shapes:

- start payload metadata
- preloaded price history
- ticker glance data
- order book slices
- missions, unlocks, and context popup order

If a backend contract changes, this mapper layer should absorb the shape change before it reaches UI components.

## Realtime Event Flow

### Session bootstrap

Single-player starts after the page mounts and the socket handshake completes.
Multiplayer starts when the room provider receives the bootstrap event from the room socket.

High-level bootstrap sequence:

```text
socket/provider receives start payload
  -> tradingPayloadMappers parse metadata and initial market data
  -> useTradingSessionState stores level tools, portfolio, chart data, news, and popup queue order
  -> TradingPage renders panels and overlays
```

### Ticks and prices

There are two live update types:

- tick/turn updates
  - advance the simulation turn, portfolio, logs, news, and other game state
- price tick updates
  - update the live price stream and ticker-specific chart information

`useTradingSessionState` merges both into the current ticker state rather than letting chart components hold their own live data cache.

### Orders

Order flow:

```text
TradingPage opens TradeModal
  -> user confirms order
  -> game hook sends register-order command
  -> backend emits order response and later fill events
  -> useTradingSessionState updates pending/past trades and portfolio state
```

Order validation that is purely UI-level stays in `TradingPage.tsx` and `TradeModal`:

- missing limit price
- missing stop price
- market orders blocked when room rules disable them
- start-level guard for auto-ticking levels

Order outcome state stays backend-driven.

### Game over

Game-over payloads are normalized into modal state. `GameEndModal` reads the computed result from session state and hands navigation back to the route-level page wrapper.

## Chart Architecture

The chart is fed from normalized session state, not directly from the socket service.

Source data:

- `preloaded_tick_data` from the start payload
- incremental price/tick events applied in `useTradingSessionState`

Derived data:

- current price and delta via `computeAssetPriceMetrics`
- moving average series via `computeSimpleMovingAverageSeries`
- exponential moving average series via `computeExponentialMovingAverageSeries`

These indicators are derived in `TradingPage.tsx` from `sessionState.allPoints`.
The chart component remains a renderer, not an analytics owner.

## UI Composition

### Left panel

Main file:

- `src/features/trading/components/TradingLeftPanel.tsx`

Responsibilities:

- chart and indicator toggles
- current ticker information
- bid/ask and order book views
- trade entry controls
- next-turn controls for manual sessions

### Right panel

Main file:

- `src/features/trading/components/TradingRightPanel.tsx`

Responsibilities:

- timer card
- portfolio summary and analytics
- pending and past trades
- news feed
- macro panels
- tutorial replay and popup reopen actions

### Overlays and side systems

Main files:

- `TradingInfoPopups.tsx`
- `AutoTickStartPopup.tsx`
- `ResumeConfirmPopup.tsx`
- `TimerEndNextGamePopup.tsx`
- `GameEndModal.tsx`
- `MultiplayerRoomPanel.tsx`

These components are presentation layers over state owned elsewhere.

## Tutorials And Popup Queue

Tutorial definitions live in `src/features/tutorials/registry/tradingTutorialRegistry.ts`.

Flow:

1. `TradingPage` creates DOM refs for interactive areas.
2. `useTradingTutorialFlow.ts` resolves those refs into tutorial step targets.
3. `useTutorialQueue.ts` manages the currently open tutorial.
4. `TutorialOverlay.tsx` renders the active step.

The info popup queue is separate from tutorials:

- `useInfoPopupQueue.ts` owns popup order and pause/resume behavior
- `TradingInfoPopups.tsx` renders unlock, mission, and context popups

Current popup order comes from the start payload parsing layer:

```text
unlocks -> missions -> context
```

When a user launches a tutorial from the unlock popup, the queue pauses until the tutorial closes, then resumes from the remaining popup list.

Current tutorial entry points are explicit UI actions:

- replay from the right panel
- play tutorial from an unlock popup

Do not assume background auto-start behavior unless you add it intentionally.

## Backend Source Of Truth

Treat these as backend-owned:

- market prices and candle/tick history
- order status and fills
- available tools
- mission completion state
- unlocks and level context
- portfolio balances and analytics
- room features and room membership

Frontend-owned derived state is limited to:

- selected ticker
- read/unread news markers in the current session
- modal visibility
- timer arming
- indicator visibility toggles
- tutorial progression

## Safe Extension Rules

When extending trading, prefer these placements:

- new backend payload field
  - add or update a type in `types/tradingTypes.ts`
  - normalize it in `services/tradingPayloadMappers.ts`
  - store it in `useTradingSessionState.ts`
  - pass the final shape down to components
- new transport event
  - add it in the relevant socket service or multiplayer provider
  - keep raw event parsing out of UI components
- new trading panel or card
  - add a focused component under `components`
  - feed it normalized props from `TradingLeftPanel` or `TradingRightPanel`
- new chart indicator
  - derive it from `sessionState.allPoints`
  - keep renderer components stateless where possible

Avoid:

- calling the socket directly from `TradingLeftPanel` or `TradingRightPanel`
- storing duplicate copies of portfolio or chart data in child components
- mixing tutorial gating logic into presentation-only subcomponents
- adding route-specific navigation logic deep inside trading children

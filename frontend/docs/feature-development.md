# Frontend Feature Development Guide

This guide explains how to add or change frontend features without bloating pages or bypassing the current architecture.

## Placement Rules

Use the smallest scope that matches the feature.

### Add a feature-specific component

Place it under `src/features/<feature>/components` when it is only used by one feature.

Examples:

- a new trading analytics card -> `src/features/trading/components`
- a new multiplayer lobby panel -> `src/features/multiplayer/components`

Use `src/shared/ui` only for genuinely reusable primitives such as cards, buttons, overlays, and shared theme-backed widgets.

### Add a feature-specific hook

Place it under `src/features/<feature>/hooks` when it coordinates feature state or behavior.

Good candidates:

- orchestration over several child components
- transforming service output into UI props
- state machines such as tutorial flow or trading session state

Do not hide plain rendering decisions in hooks just to reduce JSX size.

### Add a service

Place it under `src/features/<feature>/services` if it belongs to one feature.
Place it under `src/services` only when the service is true app infrastructure.

Use services for:

- HTTP calls through `apiClient`
- WebSocket adapters
- payload normalization
- feature-specific data formatting that is reused across hooks/components

Keep raw `fetch` and WebSocket event parsing out of React components.

### Add types

Place types close to where they are used:

- feature-local contracts -> `src/features/<feature>/types`
- shared cross-feature contracts -> promote carefully only when multiple features genuinely depend on them

## State Management Rules

Choose state ownership intentionally.

- local component state
  - open/close flags, form values, sorting, tabs, temporary filters
- provider state
  - auth, theme, quiz shell state, multiplayer room state
- feature hook state
  - normalized trading session data, tutorial flow, popup queue
- backend state
  - any durable game, profile, level, room, or achievement fact

If the backend is the source of truth, the frontend should mirror and present it, not invent a competing state model.

## HTTP Integration

All HTTP work should go through `src/services/apiClient.ts`.

Pattern:

1. add the backend call in the relevant feature service
2. define or update the response type near that feature
3. consume the service from a hook or page-level orchestration component
4. pass plain props into presentational children

Avoid:

- calling `fetch` inside leaf components
- constructing API URLs in JSX files
- duplicating token/header logic across features

## WebSocket Integration

Keep socket responsibilities layered:

1. socket service or provider receives raw events
2. mapper/helper normalizes payloads if needed
3. hook stores the normalized state
4. components render the result

For single-player trading, the transport boundary is `gameSocket.ts`.
For multiplayer room and match state, the transport boundary is `MultiplayerSessionProvider.tsx` plus `multiplayerSocketService.ts`.

Avoid direct socket writes from child components. Expose explicit actions from the owning hook or provider instead.

## Trading-Specific Change Rules

The safest way to extend trading is:

1. update the contract in `types/tradingTypes.ts`
2. normalize backend data in `services/tradingPayloadMappers.ts`
3. store the result in `useTradingSessionState.ts`
4. thread the final prop into `TradingPage`, `TradingLeftPanel`, or `TradingRightPanel`
5. keep child components focused on display and local UI interaction

Use `TradingPage.tsx` for:

- shared screen composition
- modal wiring
- tutorial refs
- display-only derived metrics

Do not turn `TradingPage.tsx` into:

- a second socket client
- an API client
- a payload parsing layer
- a persistence layer for backend-owned state

## Tutorials And Popup Queue

### Add a tutorial

1. register the tutorial id and step definitions in `src/features/tutorials/registry/tradingTutorialRegistry.ts`
2. target existing refs from `useTradingTutorialFlow.ts`, or add a new ref in `TradingPage.tsx` and thread it into the hook
3. expose a UI trigger where the tutorial should be launched

If a tutorial gates progression on a specific action, keep that gating inside `useTradingTutorialFlow.ts`, not inside general-purpose UI components.

### Add a popup to the startup queue

1. extend `InfoPopupType` in `src/features/trading/components/TradingInfoPopups.tsx`
2. add rendering support to `TradingInfoPopups.tsx`
3. add queue handling to `useInfoPopupQueue.ts`
4. set the popup order from the start-payload normalization path

Keep popup ordering deterministic. Today the queue is a simple ordered list, not a priority engine.

## Naming And Styling Conventions

- React components use PascalCase file names and exports.
- Hooks use the `useX` naming pattern.
- Service files are named for the feature or transport they wrap, such as `levelsApi.ts` or `multiplayerSocketService.ts`.
- Theme-backed class choices should prefer `THEME_CONFIG` and existing shared UI primitives.
- Tailwind utility classes are common, but shared primitives should absorb repeated styling patterns rather than repeating long class strings everywhere.

## Anti-Patterns To Avoid

- putting API calls inside leaf components
- parsing backend payload shapes directly in JSX files
- creating duplicate frontend sources of truth for game state
- adding feature logic to `shared/ui` just because the component is visually reusable
- routing around providers instead of consuming their contexts
- overloading page components with transport, normalization, and presentation responsibilities at once

## Safe Change Checklist

Before merging a frontend feature:

- confirm the state owner is correct
- keep backend communication in services/providers/hooks
- keep pages/screens as orchestration layers, not transport layers
- thread normalized props into presentational children
- update docs when a new architectural seam is introduced
- run the frontend checks that are available in the workspace

# Frontend Architecture

This document describes the active frontend architecture in `frontend/src`.
It is intended as the starting point for maintainers and coding agents.

## App Shell

Boot order is small and explicit:

1. `src/main.tsx` mounts `App`.
2. `src/App.tsx` wraps the app with `ThemeProvider`, `AuthProvider`, and `BrowserRouter`.
3. `src/routes/AppRoutes.tsx` decides which route tree is available based on auth and onboarding state.

Provider stack:

```text
ThemeProvider
  AuthProvider
    BrowserRouter
      AppRoutes
```

Only a few concerns are global:

- `ThemeProvider`: dark/light theme state and theme persistence
- `AuthProvider`: Firebase auth state plus the app-level user loaded from `/user/me`
- `QuizProvider`: quiz attempt state for the protected application shell
- `MultiplayerSessionProvider`: room-level multiplayer socket state for the `/multiplayer` subtree

## Route Structure

The route tree lives in `src/routes/AppRoutes.tsx`.

Public routes:

- `/login` -> `src/features/auth/components/LoginForm.tsx`
- `/setup-username` -> `src/features/auth/components/UsernameSetup.tsx`

Protected shell:

```text
ProtectedRoute
  QuizProvider
    AppLayout
      /dashboard
      /adventureMode
      /adventureMode/:module/:level
      /adventureMode/quiz/:module/:phase
      /puzzleMode
      /puzzleMode/:level
      /multiplayer
      /multiplayer/trading/:roomCode
      /profile
```

Important routing behavior:

- `ProtectedRoute` blocks all authenticated app screens.
- `AppLayout` owns the common authenticated shell, including navigation.
- `/multiplayer` is wrapped in `MultiplayerSessionProvider`, so both the lobby and the multiplayer trading route share one room session.
- Unknown protected routes redirect to `/dashboard`.

## Folder Map

`src` is mostly feature-oriented, but there are a few app-level folders:

- `src/features`
  - Feature modules such as `auth`, `dashboard`, `levels`, `multiplayer`, `puzzle`, `quiz`, `trading`, and `tutorials`
- `src/providers`
  - Small global providers only
- `src/routes`
  - Route tree and navigation guards
- `src/services`
  - Shared infrastructure services such as Firebase setup and the HTTP client
- `src/shared/ui`
  - Cross-feature UI primitives, theme config, overlays, and toast helpers
- `src/hooks`
  - App-wide hooks, currently light usage

Feature folders generally follow this pattern:

- `components`
  - React UI pieces for that feature
- `hooks`
  - Feature-specific state and orchestration
- `services`
  - HTTP clients, WebSocket adapters, or mapping helpers
- `types`
  - Feature-local contracts

## Feature Responsibilities

### `auth`

Main files:

- `src/features/auth/hooks/useAuth.ts`
- `src/features/auth/components/LoginForm.tsx`
- `src/features/auth/components/UsernameSetup.tsx`
- `src/features/auth/components/ProtectedRoute.tsx`
- `src/features/auth/services/profileApi.ts`

Responsibilities:

- listen to Firebase auth changes with `onAuthStateChanged`
- exchange the Firebase identity for the app-level user from `/user/me`
- detect the onboarding case where Firebase auth exists but `/user/me` returns `404`
- guard protected routes and redirect users into username setup when needed

Active auth flow:

```text
Google sign-in
  -> Firebase user becomes available
  -> useAuth() calls /user/me
  -> 200: user is authenticated into the app
  -> 404: user is redirected to /setup-username
```

`AuthProvider` is the source of truth for frontend auth state. Components should consume `useAuthContext()` rather than reading Firebase directly.

### `profile` and achievements

Profile UI is currently colocated under the auth feature:

- `src/features/auth/components/profile/UserProfile.tsx`
- `src/features/auth/components/profile/AchievementsSection.tsx`
- `src/features/auth/services/achievementsService.ts`

Responsibilities:

- show the authenticated user's username, email, and user id
- fetch and present achievement progress
- keep achievement presentation logic inside the profile UI rather than scattering it across dashboard or trading code

### `dashboard`

Main files:

- `src/features/dashboard/components/DashboardPage.tsx`
- `src/features/dashboard/components/GamesSection.tsx`
- `src/features/dashboard/services/dashboardApi.ts`

Responsibilities:

- the authenticated landing page
- recent activity widgets
- entry points into adventure mode, puzzle mode, and multiplayer flows

### `levels`

Main files:

- `src/features/levels/components/LevelSelectPage.tsx`
- `src/features/levels/components/LevelDetailPopup.tsx`
- `src/features/levels/services/levelsApi.ts`

Responsibilities:

- fetch module/level availability
- present level cards and gating state
- navigate into trading or quiz routes

`useLevelAccessGate` in `src/features/trading/hooks/useLevelAccessGate.ts` mirrors backend availability rules as a UX pre-check before mounting a trading route.

### `quiz`

Main files:

- `src/features/quiz/context/QuizContext.tsx`
- `src/features/quiz/components/QuizPage.tsx`
- `src/features/quiz/services/quizApi.ts`

Responsibilities:

- pre/post module quiz routes
- quiz state that needs to survive within the protected app shell
- backend quiz submission and result fetches

### `puzzle`

Main files:

- `src/features/puzzle/components/PuzzleLevelSelectPage.tsx`
- `src/features/puzzle/services/puzzleLevelSelectApi.ts`

Responsibilities:

- fetch puzzle availability
- route users into single-player trading sessions that use puzzle level ids

### `multiplayer`

Main files:

- `src/features/multiplayer/pages/MultiplayerPage.tsx`
- `src/features/multiplayer/context/MultiplayerSessionProvider.tsx`
- `src/features/multiplayer/services/multiplayerApi.ts`
- `src/features/multiplayer/services/multiplayerSocketService.ts`

Responsibilities:

- create rooms via HTTP
- connect/join rooms via WebSocket
- keep room membership, host status, room features, private messages, and live match payloads in one provider
- navigate from the lobby into `/multiplayer/trading/:roomCode` when the server starts the match

The multiplayer provider is the room-session boundary. The trading page consumes provider state; it does not open its own multiplayer room socket.

### `trading`

Main files:

- `src/features/trading/components/TradingPage.tsx`
- `src/features/trading/pages/SinglePlayerTradingPage.tsx`
- `src/features/trading/pages/MultiplayerTradingPage.tsx`
- `src/features/trading/hooks/useSinglePlayerGame.ts`
- `src/features/trading/hooks/useMultiplayerGame.ts`
- `src/features/trading/hooks/useTradingSessionState.ts`
- `src/features/trading/services/gameSocket.ts`
- `src/features/trading/services/tradingPayloadMappers.ts`

Responsibilities:

- bootstrap and maintain a live trading session
- normalize backend payloads into UI-ready state
- render the chart, ticket controls, macro data, news, portfolio data, timers, missions, unlocks, and game-end overlays
- separate single-player socket transport from multiplayer provider-backed transport while keeping a shared screen

Trading is the most stateful area of the frontend and carries the highest maintenance risk.

### `tutorials`

Main files:

- `src/features/tutorials/components/TutorialOverlay.tsx`
- `src/features/tutorials/hooks/useTutorialQueue.ts`
- `src/features/tutorials/registry/tradingTutorialRegistry.ts`
- `src/features/trading/hooks/useTradingTutorialFlow.ts`
- `src/features/trading/hooks/useInfoPopupQueue.ts`

Responsibilities:

- define tutorial step sequences
- render guided overlays against DOM refs
- coordinate tutorial playback with unlock, mission, and context popups

Tutorials are their own feature. They are not embedded ad hoc inside trading subcomponents.

## Application Flow

### Startup and auth

```text
App mount
  -> Firebase auth listener resolves
  -> if signed out, show /login
  -> if signed in, fetch /user/me
  -> if profile missing, route to /setup-username
  -> else unlock protected routes
```

### Level selection to trading

```text
/adventureMode
  -> fetch level data
  -> user opens a level
  -> route to /adventureMode/:module/:level
  -> useLevelAccessGate confirms access
  -> SinglePlayerTradingPage mounts TradingPage with useSinglePlayerGame
```

### Multiplayer lobby to trading

```text
/multiplayer
  -> create room via REST or join via room code
  -> MultiplayerSessionProvider opens room socket
  -> room state stays in provider
  -> server emits game_start
  -> provider navigates to /multiplayer/trading/:roomCode
  -> MultiplayerTradingPage mounts TradingPage with useMultiplayerGame
```

## State Ownership

Use this split when changing or adding code:

- local component state
  - UI-only state such as modal open/close, selected tab, expanded panels, replayed tutorial, and form input
- provider state
  - cross-route state such as auth, quiz progress, theme, and multiplayer room session
- hook-owned feature state
  - large feature-local state machines such as trading session normalization
- backend source of truth
  - level availability, room state, market ticks, portfolio balances, order results, unlocks, missions, and achievements

Important rule:

- if the backend already owns a fact, mirror it on the frontend instead of recomputing a second source of truth

The main example is trading: `useTradingSessionState.ts` is a normalized mirror of backend payloads, not an independent game simulation.

## HTTP and WebSocket Boundaries

### HTTP

Shared HTTP infrastructure lives in `src/services/apiClient.ts`.

Key behavior:

- resolves its base URL from `VITE_API_URL` or the browser hostname
- attaches a fresh Firebase ID token to each request
- retries once on `401` with a forced token refresh

Feature services should call `apiClient`, not `fetch` directly from React components.

### WebSockets

There are two realtime transports:

- `src/features/trading/services/gameSocket.ts`
  - single-player trading socket
- `src/features/multiplayer/services/multiplayerSocketService.ts`
  - multiplayer room socket, including lobby and match events

Components should not parse raw socket messages. That work belongs in socket services, payload mappers, and feature hooks.

## Important Configuration Files

- `vite.config.ts`
  - Vite dev/build configuration
- `tailwind.config.js`
  - Tailwind theme extension and content scan paths
- `eslint.config.js`
  - lint rules for the frontend codebase
- `src/shared/ui/config/themeConfig.ts`
  - app theme tokens used across the UI
- `src/index.css`
  - global styles and Tailwind imports

## Where To Read Next

- `trading-and-realtime.md` for the live trading screen and socket flow
- `feature-development.md` for extension rules, conventions, and anti-patterns

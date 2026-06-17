# Traders Edge Frontend

This directory contains the React + TypeScript frontend for Traders Edge. It is a feature-oriented Vite application with two very different runtime modes:

- standard route-driven screens such as dashboard, profile, level select, puzzle select, and quizzes
- a realtime trading surface that is fed primarily by WebSocket payloads in both single-player and multiplayer sessions

The trading code is the architectural center of gravity. Most frontend maintenance risk lives there, especially around payload normalization, order flow, multiplayer room state, and tutorial overlays.

## Documentation Map

- `docs/project-structure.md`: frontend architecture, provider stack, route organization, state ownership, and app-level flows
- `docs/trading-and-realtime.md`: trading page composition, WebSocket lifecycle, single-player vs multiplayer, chart/order/news flow, tutorials, and popup queues
- `docs/feature-development.md`: where to place new code, how to extend trading safely, conventions, and frontend-specific anti-patterns

## Quick Start

```bash
npm install
npm run dev
```

Cypress specs live under `tests/cypress/e2e` and are configured by `tests/cypress.config.js`.

## Runtime Configuration

The frontend resolves backend URLs at runtime rather than hard-coding localhost-only endpoints.

- `VITE_API_URL`: overrides the HTTP API base used by `src/services/apiClient.ts`
- `VITE_WS_URL`: overrides the WebSocket base used by both trading and multiplayer socket services

Fallback behavior:

- HTTP defaults to `http://<current-host>:8000`
- single-player WS defaults to `ws://<current-host>:8000/game/single-player/ws`
- multiplayer WS defaults to `ws://<current-host>:8000/game/multiplayer/ws/:roomCode`

## Route Map

| Route | Purpose | Main Files |
| --- | --- | --- |
| `/login` | Google sign-in entry | `src/features/auth/components/LoginForm.tsx` |
| `/setup-username` | onboarding step after Firebase sign-in when `/user/me` does not exist yet | `src/features/auth/components/UsernameSetup.tsx` |
| `/dashboard` | landing page after auth | `src/features/dashboard/components/DashboardPage.tsx` |
| `/adventureMode` | module + level selection | `src/features/levels/components/LevelSelectPage.tsx` |
| `/adventureMode/:module/:level` | single-player trading level | `src/features/trading/pages/SinglePlayerTradingPage.tsx` |
| `/adventureMode/quiz/:module/:phase` | pre/post module quiz | `src/features/quiz/components/QuizPage.tsx` |
| `/puzzleMode` | puzzle level selection | `src/features/puzzle/components/PuzzleLevelSelectPage.tsx` |
| `/puzzleMode/:level` | puzzle trading session | `src/features/trading/pages/SinglePlayerTradingPage.tsx` |
| `/multiplayer` | room creation / join / lobby | `src/features/multiplayer/pages/MultiplayerPage.tsx` |
| `/multiplayer/trading/:roomCode` | multiplayer trading session | `src/features/trading/pages/MultiplayerTradingPage.tsx` |
| `/profile` | user summary + achievements | `src/features/auth/components/profile/UserProfile.tsx` |

All protected routes flow through `src/routes/AppRoutes.tsx`, `src/features/auth/components/ProtectedRoute.tsx`, and `src/features/auth/components/AppLayout.tsx`.

## Architecture Snapshot

- Provider stack: `ThemeProvider` -> `AuthProvider` -> `BrowserRouter`
- Protected routes are wrapped by `ProtectedRoute`, then `QuizProvider`, then `AppLayout`
- Global app contexts are intentionally small: theme, auth, quiz state, and multiplayer room state
- Most feature code lives under `src/features/<feature>` with `components`, `services`, `hooks`, and `types` subfolders
- Shared design primitives live under `src/shared/ui`
- HTTP calls are centralized through `src/services/apiClient.ts`
- Realtime trading data is normalized in `src/features/trading/hooks/useTradingSessionState.ts`
- Multiplayer lobby and multiplayer trading share one room session through `src/features/multiplayer/context/MultiplayerSessionProvider.tsx`
- Tutorials are implemented as a dedicated feature in `src/features/tutorials`, not as ad hoc component state

## Current Implementation Notes

These are current behavior notes, not design aspirations.

- Authentication is Firebase-backed. `useAuth()` listens to `onAuthStateChanged`, and `apiClient` attaches fresh Firebase ID tokens to backend requests.
- App authentication is only considered complete after `useAuth()` successfully loads `/user/me`.
- `/setup-username` is the onboarding path for signed-in Firebase users whose app profile row does not exist yet.
- Live trading routes are driven by WebSocket bootstrap payloads, `preloaded_tick_data`, and incremental tick updates.
- Multiplayer uses one room/session provider for lobby state and live match events, then adapts that provider into the shared trading screen.
- The active tutorial system lives under `src/features/tutorials`.

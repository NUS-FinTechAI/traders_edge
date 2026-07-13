# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Trader's Edge is a trading-education platform: a React/Vite frontend and a FastAPI backend backed by PostgreSQL. The backend simulates real-time trading via WebSockets, with both historical (yfinance) and synthetic (orderbook) market simulators.

## Commands

### Full stack (Docker Compose)
- `docker compose up --build` — boots `backend` (8000), `frontend` (5173), and `db` (Postgres 16, 5432).
- The db container auto-runs SQL in [backend/config/database/init-new/](backend/config/database/init-new/) on first boot. To re-run schema/seed, delete `backend/config/database/postgres_data/` first.
- Backend source is bind-mounted for hot reload; frontend uses Vite HMR (with `node_modules` excluded from the bind mount).

### Backend (Python/FastAPI)
- Install: `cd backend && pip install -r requirements.txt`
- Run: `cd backend && python main.py` (uvicorn on `0.0.0.0:8000` with `--reload`)
- Test: `cd backend && pytest` — config is [backend/tests/pytest.ini](backend/tests/pytest.ini) (`asyncio_mode = auto`, so async tests don't need `@pytest.mark.asyncio`)
- Single test: `cd backend && pytest tests/market_simulators/test_orderbook.py::TestOrderLadder::test_add_limit_order_to_bids`
- Coverage: `pytest --cov=market_simulators --cov=utils --cov-report=html`
- Format: `black .` and `isort .` (both pinned in requirements.txt — no linter is configured, formatters only).

### Frontend (React/Vite)
- Install: `cd frontend && npm install`
- Dev: `cd frontend && npm run dev`
- Build: `cd frontend && npm run build` (runs `tsc -b && vite build` — type errors fail the build)
- Lint: `cd frontend && npm run lint` (ESLint flat config in [eslint.config.js](frontend/eslint.config.js))
- E2E tests: `cd frontend && npx cypress open` / `npx cypress run`. Tests live in [frontend/tests/cypress/](frontend/tests/cypress/) (non-default location; config in [frontend/tests/cypress.config.js](frontend/tests/cypress.config.js)). No unit-test framework is set up.

#### Running Cypress E2E against the Firebase Auth emulator
The specs sign in through the Firebase Auth emulator (the Google popup OAuth flow can't be driven inside Cypress). Three terminals:

1. Emulator: `npx firebase emulators:start --only auth` (in repo root — config is [firebase.json](firebase.json)). Listens on `127.0.0.1:9099`.
2. Backend: `docker compose up --build` (or `cd backend && python main.py`). Backend must be pointed at the emulator:
   - `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099` (no scheme — the SDK requires `host:port`)
   - `FIREBASE_PROJECT_ID=demo-traders-edge` (any string the emulator was started with)
   Both go in `backend/.env`.
3. Frontend dev server: `cd frontend && npm run dev`. Frontend env (`frontend/.env`) needs `VITE_FIREBASE_AUTH_EMULATOR_HOST=http://127.0.0.1:9099` so the Web SDK routes through the emulator.
4. Run Cypress: `cd frontend && npx cypress run` (or `cypress open` for interactive).

Each spec calls `cy.signInViaEmulator(email, password)` — a custom command in [frontend/tests/cypress/support/e2e.js](frontend/tests/cypress/support/e2e.js) that creates a user via the emulator REST API and signs in through an in-app bridge (`window.__cypressSignInWithPassword`, attached by [services/firebase.ts](frontend/src/services/firebase.ts) in non-prod builds only).

## Architecture

### Backend service-layer pattern
Each service under [backend/services/](backend/services/) (`game_service`, `market_data_service`, `progression_service`, `user_service`) follows the same four-layer split:

```
service_name/
├── router/        # FastAPI APIRouter + WebSocket handlers
├── service/       # Business logic / engines
├── data_access/   # SQL via psycopg2; uses the shared pool from config/database/postgres.py
└── models/        # Pydantic request/response + domain models
```

`backend/app.py` mounts the four routers; `backend/config/__init__.py` exposes `start_up`/`clean_up` lifecycle hooks (DB pool init/teardown).

### Async game-engine architecture
This is the most important non-obvious piece. See [backend/services/game_service/service/ASYNC_ARCHITECTURE.md](backend/services/game_service/service/ASYNC_ARCHITECTURE.md) and [backend/docs/DEVELOPER.md](backend/docs/DEVELOPER.md).

A `GameEngine` (abstract → `SinglePlayerGameEngine` / `MultiplayerGameEngine`) coordinates one or more `MarketSimulator`s (abstract → `OrderbookSimulator` / `YFinanceSimulator`) via asyncio queues:

- One `asyncio.Queue` **per ticker** for inbound order events (per-ticker serialization; tickers run concurrently).
- One **shared** `asyncio.Queue` for fills, drained by a single fill-listener task that mutates engine state under an `asyncio.Lock`.
- WebSocket handlers in [router/](backend/services/game_service/router/) call `register_order` / `cancel_order` on the engine and never block on simulator work.

When adding a new simulator, subclass `MarketSimulator` in [backend/market_simulators/market_simulator.py](backend/market_simulators/market_simulator.py) and publish fills via `_publish_fill` — the engine plumbing handles the rest.

### Market simulator semantics differ
- `OrderbookSimulator` hands every order type to a real order book that matches against NPC liquidity orders generated each tick. Matching is symmetric across order types.
- `YFinanceSimulator` fills MARKET orders immediately at the current candle close, but queues LIMIT/STOP/STOP_LIMIT and resolves them against subsequent candle High/Low. Don't assume parity between the two.

### Frontend layout
Feature-based under [frontend/src/](frontend/src/) — see [frontend/docs/project-structure.md](frontend/docs/project-structure.md):

- `features/<name>/{components,hooks,services,types}/` — one folder per feature (`auth`, `dashboard`, `levels`, `multiplayer`, `puzzle`, `quiz`, `trading`, `tutorials`).
- `shared/ui/` for reusable primitives; do **not** put feature-specific components here.
- `providers/` for context (Auth, Theme), `routes/AppRoutes.tsx` for React Router v7 setup, `services/apiClient.ts` for the shared HTTP client.
- Stack: React 19, Vite 7, TailwindCSS 4 (`@tailwindcss/vite` plugin), MUI 7, `lightweight-charts` + `apexcharts` for trading visuals.

### CORS
Backend allows only `http://localhost:5173` and `http://127.0.0.1:5173` (hard-coded in [backend/app.py](backend/app.py)). Add new origins there if testing from a different host/port.

### Environment files
`.env` files live at the repo root (Postgres credentials, consumed by the `db` service) and inside `backend/` and `frontend/`. They are gitignored.

### Authentication (Firebase OIDC)
Auth is in progress (PR 1 landed); details in [docs/auth.md](backend/docs/auth.md) once written, and the design doc at [.claude/plans/i-want-to-add-starry-kettle.md](.claude/plans/i-want-to-add-starry-kettle.md).

**Backend env vars** (in `backend/.env`):
- Real project: set either `FIREBASE_CREDENTIALS_JSON` (inline service-account JSON, single line) or `GOOGLE_APPLICATION_CREDENTIALS` (filesystem path to the JSON). `FIREBASE_PROJECT_ID` is optional unless the credentials don't carry one.
- Auth emulator: `FIREBASE_AUTH_EMULATOR_HOST=localhost:9099` + `FIREBASE_PROJECT_ID=<any-id-used-when-starting-emulator>`. No credentials JSON needed.

**Frontend env vars** (in `frontend/.env` — these end up in the JS bundle, which is normal for Firebase Web SDK; the API key is a project identifier, not a secret):
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`.

**Backend auth dep**: every protected route declares `Depends(require_user)` or `Depends(require_existing_user)` from [backend/common/auth.py](backend/common/auth.py). The dep verifies the `Authorization: Bearer <token>` header via `firebase_admin.auth.verify_id_token` inside `asyncio.to_thread` (sync SDK call must not block the event loop). On valid token it returns a `TokenClaims` (`uid`, `email`, `email_verified`, `name?`); `require_existing_user` additionally requires a matching `users` row and 404s otherwise (signal to the frontend to route to `/setup-username`).

**Public profile endpoints stay unauthenticated**: `GET /user/{user_id}/total_points`, `GET /game/leaderboard/{level_id}`, and the progression-service profile routes are intentionally callable without a token — they expose only the same data a leaderboard would already reveal.

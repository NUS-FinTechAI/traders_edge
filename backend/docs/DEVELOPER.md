# Trader's Edge - Backend Developer Documentation

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Services](#services)
  - [Game Service](#game-service)
  - [Market Data Service](#market-data-service)
  - [Progression Service](#progression-service)
  - [User Service](#user-service)
- [Market Simulators](#market-simulators)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [WebSocket Communication](#websocket-communication)
- [Getting Started](#getting-started)

---

## Overview

**Trader's Edge** is a trading education platform backend built with **FastAPI**. It provides:
- Real-time trading simulation via WebSockets
- Tutorial and puzzle game modes
- Multiplayer trading rooms
- User progression tracking with achievements
- Historical market data integration via yfinance

---

## Architecture

### High-Level Architecture

```mermaid
flowchart TB
    subgraph Frontend
        FE[React Frontend]
    end
    
    subgraph Backend["Backend (FastAPI)"]
        API[FastAPI Application]
        
        subgraph Services
            GS[Game Service]
            MDS[Market Data Service]
            PS[Progression Service]
            US[User Service]
        end
        
        subgraph Engines["Game Engines"]
            SPE[Single Player Engine]
            MPE[Multiplayer Engine]
        end
        
        subgraph Simulators["Market Simulators"]
            OBS[Orderbook Simulator]
            YFS[YFinance Simulator]
        end
    end
    
    subgraph Data["Data Layer"]
        PG[(PostgreSQL)]
        YF[Yahoo Finance API]
    end
    
    FE <-->|REST/WebSocket| API
    API --> GS
    API --> MDS
    API --> PS
    API --> US
    
    GS --> SPE
    GS --> MPE
    SPE --> OBS
    SPE --> YFS
    MPE --> OBS
    
    GS --> PG
    PS --> PG
    US --> PG
    MDS --> YF

    style FE fill:#61dafb,stroke:#333,color:#000
    style API fill:#009688,stroke:#333,color:#fff
    style GS fill:#4caf50,stroke:#333,color:#fff
    style MDS fill:#4caf50,stroke:#333,color:#fff
    style PS fill:#4caf50,stroke:#333,color:#fff
    style US fill:#4caf50,stroke:#333,color:#fff
    style SPE fill:#ff9800,stroke:#333,color:#000
    style MPE fill:#ff9800,stroke:#333,color:#000
    style OBS fill:#9c27b0,stroke:#333,color:#fff
    style YFS fill:#9c27b0,stroke:#333,color:#fff
    style PG fill:#336791,stroke:#333,color:#fff
    style YF fill:#7b1fa2,stroke:#333,color:#fff
```

### Request Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant F as FastAPI
    participant R as Router
    participant S as Service
    participant DA as Data Access
    participant DB as PostgreSQL

    C->>F: HTTP Request
    F->>R: Route to handler

    R->>S: Business logic
    S->>DA: Data operation

    DA->>DB: SQL Query
    DB-->>DA: Result

    DA-->>S: Processed data
    S-->>R: Response data

    R-->>F: JSON Response
    F-->>C: HTTP Response
```

### Async Engine Architecture

The game engine communicates with market simulators through asyncio queues for concurrency safety and non-blocking operation.

```mermaid
flowchart TB
    subgraph WS["FastAPI WebSocket Handler (async)"]
        WSH[WebSocket Handler]
    end

    subgraph Engine["Game Engine"]
        ENG[Game Engine]
        LOCK[asyncio.Lock<br/>State Protection]
        OQ[Per-Ticker Order Queues<br/>dict of asyncio.Queue]
        FQ[Shared Fill Queue<br/>asyncio.Queue]
    end

    subgraph Tasks["Background Tasks"]
        T1[Ticker Task 1<br/>OrderbookSimulator]
        T2[Ticker Task 2<br/>YFinanceSimulator]
        TN[Ticker Task N<br/>MarketSimulator]
        FL[Fill Listener Task]
    end

    WSH -->|register_order / cancel_order| ENG
    ENG --> LOCK
    ENG -->|enqueue order events| OQ
    
    OQ -->|consumed by| T1
    OQ -->|consumed by| T2
    OQ -->|consumed by| TN
    
    T1 -->|publish fills| FQ
    T2 -->|publish fills| FQ
    TN -->|publish fills| FQ
    
    FQ -->|consumed by| FL
    FL -->|update state with lock| ENG

    style WSH fill:#2196f3,stroke:#333,color:#fff
    style ENG fill:#4caf50,stroke:#333,color:#fff
    style LOCK fill:#ff9800,stroke:#333,color:#000
    style OQ fill:#00bcd4,stroke:#333,color:#000
    style FQ fill:#00bcd4,stroke:#333,color:#000
    style T1 fill:#9c27b0,stroke:#333,color:#fff
    style T2 fill:#9c27b0,stroke:#333,color:#fff
    style TN fill:#9c27b0,stroke:#333,color:#fff
    style FL fill:#e91e63,stroke:#333,color:#fff
```

**Key benefits of this architecture:**
- **Non-blocking**: Engine never blocks on simulator processing
- **Per-ticker serialization**: Orders for each ticker processed in sequence
- **Concurrent tickers**: Different tickers process in parallel
- **Thread-safe**: asyncio.Lock protects shared game state
- **WebSocket responsive**: Handlers remain responsive during heavy load

---

## Project Structure

```
backend/
├── main.py                 # Application entry point (uvicorn runner)
├── app.py                  # FastAPI app configuration & routing
├── requirements.txt        # Python dependencies
├── Dockerfile              # Container configuration
│
├── common/                 # Shared models
│   └── order.py            # Order model definition
│
├── config/                 # Configuration
│   └── database/
│       ├── postgres.py     # Database connection pool
│       └── init/           # SQL initialization scripts
│
├── market_simulators/      # Trading simulation engines
│   ├── market_simulator.py # Abstract base class
│   ├── orderbook/          # Real-time orderbook simulation
│   └── yfinance/           # Historical data simulation
│
├── services/               # Business logic layer
│   ├── game_service/       # Game engine & trading logic
│   ├── market_data_service/# Market data endpoints
│   ├── progression_service/# User progress & achievements
│   └── user_service/       # User management
│
├── utils/                  # Utility modules
│   ├── constants.py        # Enums & constants
│   └── data_structures.py  # Shared data structures
│
└── tests/                  # Test suite
```

---

## Services

### Service Layer Pattern

Each service follows a consistent layered architecture:

```mermaid
flowchart TB
    subgraph Service["Service Module"]
        Router[Router Layer<br/>API Endpoints]
        BusinessLogic[Business Layer<br/>Business Logic]
        DataAccess[Data Access Layer<br/>Database Operations]
        Models[Models<br/>Pydantic/DB Models]
    end
    
    Router --> BusinessLogic
    BusinessLogic --> DataAccess
    BusinessLogic --> Models
    DataAccess --> Models
    style Router fill:#2196f3,stroke:#333,color:#fff
    style BusinessLogic fill:#4caf50,stroke:#333,color:#fff
    style DataAccess fill:#ff9800,stroke:#333,color:#000
    style Models fill:#9c27b0,stroke:#333,color:#fff
```

---

### Game Service

The core trading simulation service. Handles single-player tutorials, puzzles, and multiplayer trading rooms.

#### Components

```mermaid
classDiagram
    class GameEngine {
        <<abstract>>
        +mode: str
        +ticker_to_simulator: dict
        +order_id_to_order: dict
        +init_game()
        +start()
        +stop()
        +get_game_state()
        +register_order(order)
        +cancel_order(order_id)
        +next_tick()
    }
    
    class SinglePlayerGameEngine {
        +user_id: str
        +level_id: str
        +game_state: GameStateModel
        +level_data: LevelDataModel
        +register_order(order)
        +get_fe_game_state()
    }
    
    class MultiplayerGameEngine {
        +level_id: str
        +user_states: dict
        +register_user(user_id)
        +broadcast_state()
    }
    
    GameEngine <|-- SinglePlayerGameEngine
    GameEngine <|-- MultiplayerGameEngine

    style GameEngine fill:#607d8b,color:#fff
    style SinglePlayerGameEngine fill:#4caf50,color:#fff
    style MultiplayerGameEngine fill:#2196f3,color:#fff
```

#### Game State Model

```mermaid
erDiagram
    GameState {
        int tick
        float avail_cash
        float reserved_cash
        dict positions
        list logbook
        list fills
    }
    
    Position {
        int long_avail_qty
        int long_reserved_qty
        float long_cost_basis
        int short_avail_qty
        int short_reserved_qty
        float short_entry_price
    }
    
    Order {
        string order_id
        string user_id
        OrderAction action
        Direction direction
        OrderType order_type
        string ticker
        Status status
        int qty
        float price
    }
    
    GameState ||--o{ Position : contains
    GameState ||--o{ Order : tracks
```

#### Tutorial Mission System

```mermaid
flowchart LR
    subgraph Missions["Mission Types"]
        A[use_order_type]
        B[use_trade_action]
        C[pnl_at_end]
        D[max_total_orders]
        E[max_drawdown_pct]
        F[min_distinct_positions]
    end
    
    subgraph Criteria["Mission Criteria"]
        ALL[all_of - Must complete all]
        ANY[any_of - Complete any one]
    end
    
    Missions --> Criteria

    style A fill:#e3f2fd,stroke:#1976d2,color:#000
    style B fill:#e3f2fd,stroke:#1976d2,color:#000
    style C fill:#e8f5e9,stroke:#388e3c,color:#000
    style D fill:#fff3e0,stroke:#f57c00,color:#000
    style E fill:#fce4ec,stroke:#c2185b,color:#000
    style F fill:#f3e5f5,stroke:#7b1fa2,color:#000
    style ALL fill:#4caf50,stroke:#333,color:#fff
    style ANY fill:#ff9800,stroke:#333,color:#000
```

---

### Market Data Service

Provides historical market data via Yahoo Finance integration.

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/market-data/ticker/{ticker}` | Get stock OHLC data with optional indicators |

**Query Parameters:**
- `start`: Start date (default: 7 days ago)
- `end`: End date (default: today)
- `indicators`: List of technical indicators
- `interval`: Data interval (currently only `1d` supported)

---

### Progression Service

Manages user progress, achievements, and daily activity tracking.

#### Achievements Flow

```mermaid
flowchart TD
    A[User Action] --> B{Check Achievement<br/>Conditions}
    B -->|Met| C[Unlock Achievement]
    B -->|Not Met| D[Continue]
    C --> E[Record in<br/>user_achievements]
    E --> F[Emit Achievement<br/>Notification]

    style A fill:#e3f2fd,stroke:#1976d2,color:#000
    style B fill:#fff3e0,stroke:#f57c00,color:#000
    style C fill:#e8f5e9,stroke:#388e3c,color:#000
    style D fill:#eceff1,stroke:#607d8b,color:#000
    style E fill:#f3e5f5,stroke:#7b1fa2,color:#000
    style F fill:#ffeb3b,stroke:#fbc02d,color:#000
```

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/progression/achievements/{user_id}` | Get user's achievement status |
| GET | `/progression/daily-activity/{user_id}` | Get daily activity data |

---

### User Service

Handles user registration, authentication, and profile management.

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/user/{user_id}` | Get user information |
| GET | `/user/{user_id}/total_points` | Get user's total points |
| POST | `/user/` | Create new user |
| PUT | `/user/` | Update user profile |

---

## Market Simulators

### Order Type Handling Comparison

```mermaid
flowchart TB
    subgraph YF["YFinance Simulator"]
        Y0["Incoming Order"]
        Y1{"Order Type"}
        Y2["MARKET: fill immediately at current Close"]
        Y3["LIMIT: queue until next ticks"]
        Y4["STOP: queue until trigger"]
        Y5["STOP_LIMIT: queue until trigger"]
        Y6["On each tick, use candle High/Low"]
        Y7["If condition met -> publish fill"]
        Y8["If not met -> keep pending"]
        Y9["STOP_LIMIT after trigger becomes LIMIT"]
        Y0 --> Y1
        Y1 -->|MARKET| Y2
        Y1 -->|LIMIT| Y3
        Y1 -->|STOP| Y4
        Y1 -->|STOP_LIMIT| Y5
        Y3 --> Y6
        Y4 --> Y6
        Y5 --> Y6
        Y6 --> Y7
        Y6 --> Y8
        Y5 --> Y9
    end
```

```mermaid
flowchart TB
    subgraph OB["Orderbook Simulator"]
        O0["Incoming Order"]
        O1{"Order Type"}
        O2["Pass directly to OrderBook engine"]
        O3["OrderBook attempts matching against book liquidity"]
        O4["If matched -> fill callback -> publish fill"]
        O5["If not matched -> remains on book / pending"]
        O6["NPC orders added each tick to create liquidity"]
        O0 --> O1
        O1 -->|MARKET| O2
        O1 -->|LIMIT| O2
        O1 -->|STOP| O2
        O1 -->|STOP_LIMIT| O2
        O2 --> O3
        O3 --> O4
        O3 --> O5
        O6 --> O3
    end
```

### Simulator Architecture

```mermaid
classDiagram
    class MarketSimulator {
        <<abstract>>
        +fill_queue: asyncio.Queue
        +register_order(order) bool
        +next_tick() dict
        +cancel_order(order_id) Order
        +best_bid() float
        +best_ask() float
        #_publish_fill(order_id, price, qty, qty_left)
    }
    
    class OrderbookSimulator {
        +order_book: OrderBook
        +fair_price: float
        +volume: int
        +volatility: int
        +has_npc_orders: bool
        +update_fair_price(change)
        -_create_npc_order()
    }
    
    class YFinanceSimulator {
        +ticker: yf.Ticker
        +df: DataFrame
        +pending_limit_orders: deque
        -_validate_interval()
    }
    
    MarketSimulator <|-- OrderbookSimulator
    MarketSimulator <|-- YFinanceSimulator

    style MarketSimulator fill:#607d8b,color:#fff
    style OrderbookSimulator fill:#e91e63,color:#fff
    style YFinanceSimulator fill:#9c27b0,color:#fff
```

### OrderbookSimulator

Real-time order book simulation with NPC (non-player character) orders for liquidity.

**Features:**
- Dynamic fair price with configurable volatility
- Automatic NPC order generation for realistic market depth
- Support for LIMIT, MARKET, STOP, and STOP_LIMIT orders
- Price impact from news events

**Price Update Flow:**

```mermaid
flowchart TD
    A[Tick Starts] --> B[Apply News Effects]
    B --> C[Update Fair Price]
    C --> D[Add Noise ±0.5%]
    D --> E[Generate NPC Limit Orders]
    E --> F[Generate NPC Market Orders]
    F --> G[Match Orders]
    G --> H[Publish Fills]
    H --> I[Return OHLC Data]

    style A fill:#2196f3,stroke:#333,color:#fff
    style B fill:#ff9800,stroke:#333,color:#000
    style C fill:#4caf50,stroke:#333,color:#fff
    style D fill:#9c27b0,stroke:#333,color:#fff
    style E fill:#00bcd4,stroke:#333,color:#000
    style F fill:#00bcd4,stroke:#333,color:#000
    style G fill:#e91e63,stroke:#333,color:#fff
    style H fill:#ff5722,stroke:#333,color:#fff
    style I fill:#8bc34a,stroke:#333,color:#000
```

### YFinanceSimulator

Historical data playback using Yahoo Finance.

**Features:**
- Historical OHLC data from Yahoo Finance
- Automatic business day reindexing
- Forward-fill for missing data
- Support for various intervals (1m to 1mo)

**Interval Limitations:**
| Interval | Max Historical Range |
|----------|---------------------|
| 1m | 7 days |
| Intraday (<1d) | 60 days |
| 1d and longer | 730 days |

---

## Database Schema

### Entity Relationship Diagram

```mermaid
erDiagram
    users {
        TEXT user_id PK
        TEXT user_name
        TEXT user_email UK
    }
    
    tutorial_levels {
        TEXT tutorial_id PK
        TEXT title
        INTEGER level_order
        INTEGER module
        INTEGER starting_cash
        INTEGER passing_cash
        INTEGER one_star_cash
        INTEGER two_star_cash
        INTEGER three_star_cash
        JSONB metadata
    }
    
    puzzle_levels {
        TEXT puzzle_id PK
        TEXT title
        INTEGER level_order
        INTEGER starting_cash
        INTEGER passing_cash
        JSONB metadata
    }
    
    user_tutorial_progress {
        TEXT user_id PK,FK
        TEXT tutorial_id PK,FK
        INTEGER score
        INTEGER stars
        BOOLEAN attempted
        BOOLEAN completed
        TIMESTAMP last_attempted
        JSONB progress
    }
    
    user_puzzle_progress {
        TEXT user_id PK,FK
        TEXT puzzle_id PK,FK
        INTEGER score
        INTEGER stars
        BOOLEAN attempted
        JSONB progress
    }
    
    achievements {
        TEXT achievement_id PK
        TEXT title
        TEXT description
        TEXT hint
        TEXT icon_key
    }
    
    user_achievements {
        TEXT user_id PK,FK
        TEXT achievement_id PK,FK
        TIMESTAMPTZ unlocked_at
    }
    
    user_activity_events {
        TEXT user_id FK
        TEXT event_type
        DATE event_date
        TIMESTAMPTZ created_at
        JSONB metadata
    }
    
    module_quizzes {
        TEXT quiz_id PK
        INTEGER module
        TEXT quiz_type
        TEXT title
        TEXT description
        INTEGER passing_score
        JSONB metadata
    }
    
    module_quiz_questions {
        TEXT question_id PK
        TEXT quiz_id FK
        INTEGER question_order
        TEXT prompt
        JSONB options
        INTEGER correct_option_index
        TEXT explanation
    }
    
    user_module_quiz_progress {
        TEXT user_id PK,FK
        TEXT quiz_id PK,FK
        INTEGER best_score
        INTEGER attempts
        BOOLEAN completed
        TIMESTAMPTZ last_attempted
        JSONB last_answers
    }
    
    users ||--o{ user_tutorial_progress : has
    users ||--o{ user_puzzle_progress : has
    users ||--o{ user_achievements : earns
    users ||--o{ user_activity_events : generates
    users ||--o{ user_module_quiz_progress : takes
    
    tutorial_levels ||--o{ user_tutorial_progress : tracks
    puzzle_levels ||--o{ user_puzzle_progress : tracks
    achievements ||--o{ user_achievements : granted
    module_quizzes ||--o{ module_quiz_questions : contains
    module_quizzes ||--o{ user_module_quiz_progress : tracks
```

---

## API Reference

### Game Service Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/game/details/{level_id}` | Get level configuration |
| GET | `/game/user/{user_id}` | Get all levels with user progress |
| GET | `/game/quiz/{quiz_id}` | Get quiz details |
| POST | `/game/quiz/{quiz_id}/attempt` | Submit quiz answers |
| GET | `/game/puzzle/{user_id}` | Get puzzle levels |
| GET | `/game/leaderboard/{level_id}` | Get level leaderboard |
| POST | `/game/multiplayer/rooms` | Create multiplayer room |
| WS | `/game/single-player/ws` | Single-player game WebSocket |
| WS | `/game/multiplayer/ws/{room_id}` | Multiplayer game WebSocket |

### Debug Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/ping` | Health check |
| GET | `/game/debug/single-player` | Debug HTML page for single-player websocket |
| GET | `/game/debug/multiplayer` | Debug HTML page multiplayer websocket |

---

## WebSocket Communication

### Connection Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant WS as WebSocket
    participant CM as ConnectionManager
    participant GE as GameEngine
    participant SIM as MarketSimulator

    C->>WS: Connect
    WS->>C: Accept
    C->>WS: {event: "start", data: {...}}
    WS->>GE: Initialize engine
    GE->>SIM: Create simulators
    GE-->>WS: Engine ready
    
    loop Game Loop
        C->>WS: {event: "registerOrder", data: {...}}
        WS->>GE: register_order(order)
        GE->>SIM: Submit order
        SIM-->>GE: Order accepted
        GE-->>C: Order confirmation
        
        alt Manual Tick Mode
            C->>WS: {event: "nextTick"}
            WS->>GE: next_tick()
        else Auto Tick Mode
            GE->>GE: Auto advance tick
        end
        
        GE->>SIM: next_tick()
        SIM-->>GE: Fill events
        GE-->>C: {event: "nextTick", data: {...}}
    end
    
    C->>WS: Disconnect
    WS->>GE: on_disconnect()
```

### WebSocket Events

#### Client → Server Events

| Event | Description | Payload |
|-------|-------------|---------|
| `start` | Initialize game session | `{user_id, level_id, mode}` |
| `registerOrder` | Submit a new order | `{ticker, action, order_type, qty, price?, stop_price?}` |
| `cancelOrder` | Cancel pending order | `{order_id}` |
| `nextTick` | Advance game tick (manual mode) | - |
| `startTicking` | Start auto-tick mode | - |

#### Server → Client Events

| Event | Description | Payload |
|-------|-------------|---------|
| `nextTick` | Tick advanced with new state | Game state object |
| `orderFilled` | Order was filled | Fill details |
| `orderCanceled` | Order was canceled | Order details |
| `gameOver` | Game has ended | Final state |
| `error` | Error occurred | Error message |

### Multiplayer-Specific Events

| Event | Description | Payload |
|-------|-------------|---------|
| `activePlayersResponse` | Player list updated | `{active_players, host, room_features}` |
| `roomError` | Room error | `{error}` |
| `playerJoined` | New player joined | Player info |
| `playerLeft` | Player disconnected | Player info |

---

## Getting Started

### Prerequisites

- Python 3.11+
- PostgreSQL 14+
- Docker (optional)

### Local Development

1. **Install dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Set environment variables:**
   ```bash
   export DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/mydb"
   ```

3. **Initialize database:**
   ```bash
   psql $DATABASE_URL < config/database/init/01-schema.sql
   psql $DATABASE_URL < config/database/init/02-initial_state.sql
   ```

4. **Run the server:**
   ```bash
   python main.py
   # Or with uvicorn directly:
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

### Docker Development

```bash
docker-compose up --build
```

### Running Tests

```bash
cd backend
pytest tests/ -v
```

---

## Order Types Reference

### Order Types

| Type | Description |
|------|-------------|
| **MARKET** | Execute immediately at best available price |
| **LIMIT** | Execute at specified price or better |
| **STOP** | Trigger a market order when stop_price is reached |
| **STOP_LIMIT** | Trigger a limit order when stop_price is reached |

### Order Actions

| Action | Description |
|--------|-------------|
| **BUY** | Open or add to a long position |
| **SELL** | Close or reduce a long position |
| **SELL_SHORT** | Open or add to a short position |
| **BUY_TO_COVER** | Close or reduce a short position |

### Order Flow

```mermaid
flowchart LR
    A[User Submits Order] --> B{Order Type}
    B -->|MARKET| C[Execute at Best Price]
    B -->|LIMIT| D[Queue Until Price Met]
    B -->|STOP| E[Wait for Trigger]
    B -->|STOP_LIMIT| F[Wait for Trigger]
    E --> C
    F --> D
    C --> G[Fill Published]
    D --> G
    G --> H[Update Position]

    style A fill:#2196f3,stroke:#333,color:#fff
    style B fill:#ff9800,stroke:#333,color:#000
    style C fill:#4caf50,stroke:#333,color:#fff
    style D fill:#00bcd4,stroke:#333,color:#000
    style E fill:#9c27b0,stroke:#333,color:#fff
    style F fill:#e91e63,stroke:#333,color:#fff
    style G fill:#8bc34a,stroke:#333,color:#000
    style H fill:#3f51b5,stroke:#333,color:#fff
```

### Order Validation Rules

| Order Type | Required Fields | Validation |
|------------|-----------------|------------|
| MARKET | qty | qty > 0 |
| LIMIT | qty, price | qty > 0, price > 0 |
| STOP | qty, stop_price | qty > 0, stop_price > 0 |
| STOP_LIMIT | qty, price, stop_price | qty > 0, price > 0, stop_price > 0 |

---

## Configuration

### CORS Configuration

Allowed origins (configured in `app.py`):
- `http://localhost:5173`
- `http://127.0.0.1:5173`

### Database Connection Pool

- Min connections: 1
- Max connections: 20
- Connection URL: `DATABASE_URL` environment variable

---

## Error Handling

The API uses standard HTTP status codes:

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input |
| 403 | Forbidden - Permission denied |
| 404 | Not Found - Resource doesn't exist |
| 418 | I'm a teapot - Feature not supported |
| 503 | Service Unavailable - Server overloaded |

WebSocket errors are returned as JSON:
```json
{
  "error": "Error message description"
}
```

---

## Contributing

1. Follow the existing service layer pattern
2. Add tests for new functionality
3. Update this documentation for API changes
4. Use Pydantic models for request/response validation


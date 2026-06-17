-- USERS
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,          -- Firebase Auth UID
    user_name TEXT NOT NULL,
    user_email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case-insensitive uniqueness on display name. IntegrityError on this index
-- is the source of truth for HTTP 409 in POST /user/ and PUT /user/me.
CREATE UNIQUE INDEX IF NOT EXISTS users_user_name_lower_idx
    ON users (LOWER(user_name));

-- ENUMS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'level_type_enum') THEN
        CREATE TYPE level_type_enum AS ENUM ('tutorial', 'puzzle');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tick_mode_enum') THEN
        CREATE TYPE tick_mode_enum AS ENUM ('manual', 'auto');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'simulator_type_enum') THEN
        CREATE TYPE simulator_type_enum AS ENUM ('yfinance', 'orderbook');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'macro_factor_key_enum') THEN
        CREATE TYPE macro_factor_key_enum AS ENUM ('interest_rate', 'inflation');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mission_group_enum') THEN
        CREATE TYPE mission_group_enum AS ENUM ('passing', 'bonus');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mission_type_enum') THEN
        CREATE TYPE mission_type_enum AS ENUM (
            'use_order_type',
            'use_trade_action',
            'pnl_at_end',
            'max_total_orders',
            'max_drawdown_pct',
            'min_distinct_positions',
            'min_distinct_sectors',
            'max_single_position_weight',
            'max_sector_weight',
            'exclude_ticker',
            'require_ticker_tag',
            'require_low_correlation_holding',
            'max_portfolio_beta',
            'max_portfolio_volatility',
            'rebalance_within_ticks',
            'min_excess_return_vs_benchmark',
            'min_excess_return_vs_reference'
        );
    END IF;
END$$;

-- NORMALIZED LEVELS
CREATE TABLE IF NOT EXISTS levels (
    level_id TEXT PRIMARY KEY,
    level_type level_type_enum NOT NULL,
    title TEXT NOT NULL,
    module INTEGER,
    level_order INTEGER NOT NULL CHECK (level_order > 0),
    context TEXT NOT NULL DEFAULT '',
    level_tutorial_id TEXT,
    tick_mode tick_mode_enum NOT NULL,
    manual_start BOOLEAN NOT NULL,
    total_ticks INTEGER NOT NULL CHECK (total_ticks > 0),
    preloaded_ticks INTEGER NOT NULL DEFAULT 0,
    auto_tick_interval_seconds INTEGER,
    starting_cash NUMERIC(12, 2) NOT NULL DEFAULT 100000 CHECK (starting_cash >= 0),
    final_cash_points_multiplier NUMERIC(10, 4) NOT NULL DEFAULT 0,
    passing_criteria_type TEXT NOT NULL DEFAULT 'all_of'
        CHECK (passing_criteria_type IN ('all_of', 'any_of')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CHECK (
        (
            tick_mode = 'manual'
            AND auto_tick_interval_seconds IS NULL
            AND manual_start = false
        ) OR (
            tick_mode = 'auto'
            AND auto_tick_interval_seconds IS NOT NULL
            AND auto_tick_interval_seconds > 0
            AND manual_start = true
        )
    ),
    CHECK (preloaded_ticks >= 0 AND preloaded_ticks < total_ticks),
    CHECK (level_tutorial_id IS NULL OR btrim(level_tutorial_id) <> ''),
    CHECK (
        (level_type = 'tutorial' AND module IS NOT NULL) OR
        (level_type = 'puzzle' AND module IS NULL)
    )
);

CREATE OR REPLACE FUNCTION set_level_manual_start_default()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.manual_start IS NULL THEN
        NEW.manual_start := (NEW.tick_mode = 'auto');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_level_manual_start_default ON levels;
CREATE TRIGGER trg_set_level_manual_start_default
BEFORE INSERT OR UPDATE OF tick_mode, manual_start
ON levels
FOR EACH ROW
EXECUTE FUNCTION set_level_manual_start_default();

CREATE UNIQUE INDEX IF NOT EXISTS uq_levels_tutorial_module_order
    ON levels (module, level_order)
    WHERE level_type = 'tutorial';

CREATE UNIQUE INDEX IF NOT EXISTS uq_levels_puzzle_order
    ON levels (level_order)
    WHERE level_type = 'puzzle';

CREATE TABLE IF NOT EXISTS level_tickers (
    level_ticker_id BIGSERIAL PRIMARY KEY,
    level_id TEXT NOT NULL REFERENCES levels(level_id) ON DELETE CASCADE,
    ticker TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 1 CHECK (display_order > 0),
    simulator_type simulator_type_enum NOT NULL,

    -- yfinance config (manual mode)
    history_start_date DATE,
    history_end_date DATE,
    history_interval TEXT,

    -- orderbook config (auto mode)
    initial_fair_price NUMERIC(12, 4),
    base_volume INTEGER CHECK (base_volume IS NULL OR base_volume >= 0),
    volatility NUMERIC(8, 4),
    has_npc_orders BOOLEAN,
    -- Null by default to keep runs stochastic unless an explicit seed is provided.
    rng_seed INTEGER,
    starting_position_qty INTEGER NOT NULL DEFAULT 0 CHECK (starting_position_qty >= 0),
    starting_position_cost_basis NUMERIC(12, 4),

    UNIQUE (level_id, ticker),
    CHECK (
        (simulator_type = 'yfinance' AND history_start_date IS NOT NULL AND history_end_date IS NOT NULL AND history_interval IS NOT NULL) OR
        (simulator_type = 'orderbook' AND initial_fair_price IS NOT NULL)
    ),
    CHECK (
        (
            starting_position_qty = 0
            AND starting_position_cost_basis IS NULL
        ) OR (
            starting_position_qty > 0
            AND starting_position_cost_basis IS NOT NULL
            AND starting_position_cost_basis >= 0
        )
    )
);

CREATE TABLE IF NOT EXISTS level_ticker_metadata (
    level_ticker_id BIGINT PRIMARY KEY REFERENCES level_tickers(level_ticker_id) ON DELETE CASCADE,
    company_name TEXT NOT NULL DEFAULT '',
    company_description TEXT NOT NULL DEFAULT '',
    sector_key TEXT NOT NULL DEFAULT 'unknown',
    pe_ratio NUMERIC(12, 4),
    roe_pct NUMERIC(12, 4),
    debt_to_equity NUMERIC(12, 4),
    beta NUMERIC(12, 6),
    volatility_hint NUMERIC(12, 6),
    ticker_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    CHECK (jsonb_typeof(ticker_tags) = 'array'),
    CHECK (pe_ratio IS NULL OR pe_ratio >= 0),
    CHECK (debt_to_equity IS NULL OR debt_to_equity >= 0)
);

CREATE INDEX IF NOT EXISTS idx_level_ticker_metadata_sector
    ON level_ticker_metadata(sector_key);

CREATE TABLE IF NOT EXISTS level_reference_portfolios (
    reference_portfolio_id BIGSERIAL PRIMARY KEY,
    level_id TEXT NOT NULL REFERENCES levels(level_id) ON DELETE CASCADE,
    reference_key TEXT NOT NULL,
    reference_role TEXT NOT NULL CHECK (reference_role IN ('benchmark', 'reference')),
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    display_order INTEGER NOT NULL DEFAULT 1 CHECK (display_order > 0),
    UNIQUE (level_id, reference_key),
    UNIQUE (level_id, display_order)
);

CREATE TABLE IF NOT EXISTS level_reference_portfolio_components (
    reference_component_id BIGSERIAL PRIMARY KEY,
    reference_portfolio_id BIGINT NOT NULL REFERENCES level_reference_portfolios(reference_portfolio_id) ON DELETE CASCADE,
    level_ticker_id BIGINT NOT NULL REFERENCES level_tickers(level_ticker_id) ON DELETE CASCADE,
    weight NUMERIC(12, 6) NOT NULL CHECK (weight > 0),
    display_order INTEGER NOT NULL DEFAULT 1 CHECK (display_order > 0),
    UNIQUE (reference_portfolio_id, display_order),
    UNIQUE (reference_portfolio_id, level_ticker_id)
);

CREATE INDEX IF NOT EXISTS idx_reference_components_lookup
    ON level_reference_portfolio_components(reference_portfolio_id, level_ticker_id);

CREATE TABLE IF NOT EXISTS level_news_events (
    news_event_id BIGSERIAL PRIMARY KEY,
    level_id TEXT NOT NULL REFERENCES levels(level_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    start_tick INTEGER NOT NULL CHECK (start_tick >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_level_news_events_tick
    ON level_news_events(level_id, start_tick);

CREATE TABLE IF NOT EXISTS level_news_event_tickers (
    news_event_id BIGINT NOT NULL REFERENCES level_news_events(news_event_id) ON DELETE CASCADE,
    level_ticker_id BIGINT NOT NULL REFERENCES level_tickers(level_ticker_id) ON DELETE CASCADE,
    PRIMARY KEY (news_event_id, level_ticker_id)
);

CREATE INDEX IF NOT EXISTS idx_level_news_event_tickers_lookup
    ON level_news_event_tickers(level_ticker_id, news_event_id);

CREATE TABLE IF NOT EXISTS level_news_event_effects (
    news_event_effect_id BIGSERIAL PRIMARY KEY,
    news_event_id BIGINT NOT NULL REFERENCES level_news_events(news_event_id) ON DELETE CASCADE,
    multiplier NUMERIC(10, 6) NOT NULL,
    start_tick INTEGER NOT NULL CHECK (start_tick >= 0),
    end_tick INTEGER NOT NULL CHECK (end_tick >= start_tick),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_level_news_event_effects_tick
    ON level_news_event_effects(start_tick, end_tick, news_event_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_level_news_event_effects_window
    ON level_news_event_effects(news_event_id, start_tick, end_tick, multiplier);

CREATE OR REPLACE FUNCTION validate_level_news_event()
RETURNS TRIGGER AS $$
DECLARE
    v_tick_mode tick_mode_enum;
    v_total_ticks INTEGER;
BEGIN
    SELECT l.tick_mode, l.total_ticks
    INTO v_tick_mode, v_total_ticks
    FROM levels l
    WHERE l.level_id = NEW.level_id;

    IF v_tick_mode IS NULL THEN
        RAISE EXCEPTION 'Invalid level_id for news event: %', NEW.level_id;
    END IF;

    IF NEW.start_tick >= v_total_ticks THEN
        RAISE EXCEPTION 'News start_tick (%) must be < total_ticks (%).', NEW.start_tick, v_total_ticks;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'trg_validate_level_news_event'
          AND tgrelid = 'level_news_events'::regclass
    ) THEN
        CREATE TRIGGER trg_validate_level_news_event
        BEFORE INSERT OR UPDATE ON level_news_events
        FOR EACH ROW
        EXECUTE FUNCTION validate_level_news_event();
    END IF;
END$$;

CREATE OR REPLACE FUNCTION validate_level_news_event_effect()
RETURNS TRIGGER AS $$
DECLARE
    v_event_level_id TEXT;
    v_tick_mode tick_mode_enum;
    v_total_ticks INTEGER;
    v_article_tick INTEGER;
BEGIN
    SELECT lne.level_id, l.tick_mode, l.total_ticks, lne.start_tick
    INTO v_event_level_id, v_tick_mode, v_total_ticks, v_article_tick
    FROM level_news_events lne
    JOIN levels l ON l.level_id = lne.level_id
    WHERE lne.news_event_id = NEW.news_event_id;

    IF v_event_level_id IS NULL THEN
        RAISE EXCEPTION 'Invalid news_event_id for news effect mapping: %', NEW.news_event_id;
    END IF;

    IF NEW.end_tick >= v_total_ticks THEN
        RAISE EXCEPTION 'News effect end_tick (%) must be < total_ticks (%).', NEW.end_tick, v_total_ticks;
    END IF;

    -- Effects cannot begin before the article is visible.
    IF NEW.start_tick < v_article_tick THEN
        RAISE EXCEPTION 'News effect start_tick (%) must be >= article tick (%).', NEW.start_tick, v_article_tick;
    END IF;

    IF v_tick_mode = 'manual' AND NEW.start_tick <> NEW.end_tick THEN
        RAISE EXCEPTION 'Manual mode news effects must have start_tick = end_tick.';
    END IF;

    IF v_tick_mode = 'manual' AND NEW.multiplier <> 0 THEN
        RAISE EXCEPTION 'Manual mode news effects must have multiplier = 0.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'trg_validate_level_news_event_effect'
          AND tgrelid = 'level_news_event_effects'::regclass
    ) THEN
        CREATE TRIGGER trg_validate_level_news_event_effect
        BEFORE INSERT OR UPDATE ON level_news_event_effects
        FOR EACH ROW
        EXECUTE FUNCTION validate_level_news_event_effect();
    END IF;
END$$;

CREATE OR REPLACE FUNCTION validate_level_news_event_ticker()
RETURNS TRIGGER AS $$
DECLARE
    v_event_level_id TEXT;
    v_ticker_level_id TEXT;
    v_tick_mode tick_mode_enum;
    v_simulator_type simulator_type_enum;
BEGIN
    SELECT lne.level_id, l.tick_mode
    INTO v_event_level_id, v_tick_mode
    FROM level_news_events lne
    JOIN levels l ON l.level_id = lne.level_id
    WHERE lne.news_event_id = NEW.news_event_id;

    IF v_event_level_id IS NULL THEN
        RAISE EXCEPTION 'Invalid news_event_id for news ticker mapping: %', NEW.news_event_id;
    END IF;

    SELECT lt.level_id, lt.simulator_type
    INTO v_ticker_level_id, v_simulator_type
    FROM level_tickers lt
    WHERE lt.level_ticker_id = NEW.level_ticker_id;

    IF v_ticker_level_id IS NULL THEN
        RAISE EXCEPTION 'Invalid level_ticker_id for news ticker mapping: %', NEW.level_ticker_id;
    END IF;

    IF v_event_level_id <> v_ticker_level_id THEN
        RAISE EXCEPTION 'News event (%) and ticker (%) must belong to the same level.',
            NEW.news_event_id, NEW.level_ticker_id;
    END IF;

    IF v_tick_mode = 'manual' AND v_simulator_type <> 'yfinance' THEN
        RAISE EXCEPTION 'Manual mode news can only be attached to yfinance tickers.';
    END IF;

    IF v_tick_mode = 'auto' AND v_simulator_type <> 'orderbook' THEN
        RAISE EXCEPTION 'Auto mode news can only be attached to orderbook tickers.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'trg_validate_level_news_event_ticker'
          AND tgrelid = 'level_news_event_tickers'::regclass
    ) THEN
        CREATE TRIGGER trg_validate_level_news_event_ticker
        BEFORE INSERT OR UPDATE ON level_news_event_tickers
        FOR EACH ROW
        EXECUTE FUNCTION validate_level_news_event_ticker();
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS level_macro_factors (
    macro_factor_id BIGSERIAL PRIMARY KEY,
    level_id TEXT NOT NULL REFERENCES levels(level_id) ON DELETE CASCADE,
    factor_key macro_factor_key_enum NOT NULL,
    title TEXT NOT NULL,
    current_value NUMERIC(12, 6) NOT NULL,
    previous_value NUMERIC(12, 6),
    last_change_bps INTEGER,
    market_stance_note TEXT NOT NULL DEFAULT '',
    display_order INTEGER NOT NULL DEFAULT 1 CHECK (display_order > 0),
    UNIQUE (level_id, factor_key)
);

CREATE INDEX IF NOT EXISTS idx_level_macro_factors_level_display_order
    ON level_macro_factors(level_id, display_order);

CREATE TABLE IF NOT EXISTS level_macro_factor_effects (
    macro_factor_effect_id BIGSERIAL PRIMARY KEY,
    macro_factor_id BIGINT NOT NULL REFERENCES level_macro_factors(macro_factor_id) ON DELETE CASCADE,
    multiplier NUMERIC(10, 6) NOT NULL,
    start_tick INTEGER NOT NULL CHECK (start_tick >= 0),
    end_tick INTEGER NOT NULL CHECK (end_tick >= start_tick),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (macro_factor_id)
);

CREATE INDEX IF NOT EXISTS idx_level_macro_factor_effects_tick
    ON level_macro_factor_effects(start_tick, end_tick, macro_factor_id);

CREATE TABLE IF NOT EXISTS level_macro_factor_effect_tickers (
    macro_factor_effect_id BIGINT NOT NULL REFERENCES level_macro_factor_effects(macro_factor_effect_id) ON DELETE CASCADE,
    level_ticker_id BIGINT NOT NULL REFERENCES level_tickers(level_ticker_id) ON DELETE CASCADE,
    PRIMARY KEY (macro_factor_effect_id, level_ticker_id)
);

CREATE INDEX IF NOT EXISTS idx_level_macro_factor_effect_tickers_lookup
    ON level_macro_factor_effect_tickers(level_ticker_id, macro_factor_effect_id);

CREATE OR REPLACE FUNCTION validate_level_macro_factor_effect()
RETURNS TRIGGER AS $$
DECLARE
    v_level_id TEXT;
    v_tick_mode tick_mode_enum;
    v_total_ticks INTEGER;
BEGIN
    SELECT lmf.level_id, l.tick_mode, l.total_ticks
    INTO v_level_id, v_tick_mode, v_total_ticks
    FROM level_macro_factors lmf
    JOIN levels l ON l.level_id = lmf.level_id
    WHERE lmf.macro_factor_id = NEW.macro_factor_id;

    IF v_level_id IS NULL THEN
        RAISE EXCEPTION 'Invalid macro_factor_id for macro effect mapping: %', NEW.macro_factor_id;
    END IF;

    IF NEW.end_tick >= v_total_ticks THEN
        RAISE EXCEPTION 'Macro effect end_tick (%) must be < total_ticks (%).', NEW.end_tick, v_total_ticks;
    END IF;

    IF v_tick_mode = 'manual' AND NEW.start_tick <> NEW.end_tick THEN
        RAISE EXCEPTION 'Manual mode macro effects must have start_tick = end_tick.';
    END IF;

    IF v_tick_mode = 'manual' AND NEW.multiplier <> 0 THEN
        RAISE EXCEPTION 'Manual mode macro effects must have multiplier = 0.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'trg_validate_level_macro_factor_effect'
          AND tgrelid = 'level_macro_factor_effects'::regclass
    ) THEN
        CREATE TRIGGER trg_validate_level_macro_factor_effect
        BEFORE INSERT OR UPDATE ON level_macro_factor_effects
        FOR EACH ROW
        EXECUTE FUNCTION validate_level_macro_factor_effect();
    END IF;
END$$;

CREATE OR REPLACE FUNCTION validate_level_macro_factor_effect_ticker()
RETURNS TRIGGER AS $$
DECLARE
    v_effect_level_id TEXT;
    v_ticker_level_id TEXT;
    v_tick_mode tick_mode_enum;
    v_simulator_type simulator_type_enum;
BEGIN
    SELECT lmf.level_id, l.tick_mode
    INTO v_effect_level_id, v_tick_mode
    FROM level_macro_factor_effects lmfe
    JOIN level_macro_factors lmf ON lmf.macro_factor_id = lmfe.macro_factor_id
    JOIN levels l ON l.level_id = lmf.level_id
    WHERE lmfe.macro_factor_effect_id = NEW.macro_factor_effect_id;

    IF v_effect_level_id IS NULL THEN
        RAISE EXCEPTION 'Invalid macro_factor_effect_id for macro ticker mapping: %', NEW.macro_factor_effect_id;
    END IF;

    SELECT lt.level_id, lt.simulator_type
    INTO v_ticker_level_id, v_simulator_type
    FROM level_tickers lt
    WHERE lt.level_ticker_id = NEW.level_ticker_id;

    IF v_ticker_level_id IS NULL THEN
        RAISE EXCEPTION 'Invalid level_ticker_id for macro ticker mapping: %', NEW.level_ticker_id;
    END IF;

    IF v_effect_level_id <> v_ticker_level_id THEN
        RAISE EXCEPTION 'Macro effect (%) and ticker (%) must belong to the same level.',
            NEW.macro_factor_effect_id, NEW.level_ticker_id;
    END IF;

    IF v_tick_mode = 'manual' AND v_simulator_type <> 'yfinance' THEN
        RAISE EXCEPTION 'Manual mode macro effects can only be attached to yfinance tickers.';
    END IF;

    IF v_tick_mode = 'auto' AND v_simulator_type <> 'orderbook' THEN
        RAISE EXCEPTION 'Auto mode macro effects can only be attached to orderbook tickers.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'trg_validate_level_macro_factor_effect_ticker'
          AND tgrelid = 'level_macro_factor_effect_tickers'::regclass
    ) THEN
        CREATE TRIGGER trg_validate_level_macro_factor_effect_ticker
        BEFORE INSERT OR UPDATE ON level_macro_factor_effect_tickers
        FOR EACH ROW
        EXECUTE FUNCTION validate_level_macro_factor_effect_ticker();
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS level_missions (
    level_mission_id BIGSERIAL PRIMARY KEY,
    level_id TEXT NOT NULL REFERENCES levels(level_id) ON DELETE CASCADE,
    mission_key TEXT NOT NULL,
    mission_group mission_group_enum NOT NULL,
    mission_type mission_type_enum NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 1,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
    mission_params JSONB NOT NULL DEFAULT '{}'::jsonb,

    UNIQUE (level_id, mission_key),
    CHECK (jsonb_typeof(mission_params) = 'object')
);

CREATE TABLE IF NOT EXISTS tool_definitions (
    tool_id BIGSERIAL PRIMARY KEY,
    tool_key TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    tool_tutorial_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (tool_tutorial_id IS NULL OR btrim(tool_tutorial_id) <> '')
);

CREATE TABLE IF NOT EXISTS level_tool_availability (
    level_id TEXT NOT NULL REFERENCES levels(level_id) ON DELETE CASCADE,
    tool_id BIGINT NOT NULL REFERENCES tool_definitions(tool_id) ON DELETE CASCADE,
    enabled BOOLEAN NOT NULL DEFAULT true,
    PRIMARY KEY (level_id, tool_id)
);

CREATE TABLE IF NOT EXISTS level_unlocks (
    level_unlock_id BIGSERIAL PRIMARY KEY,
    source_level_id TEXT NOT NULL REFERENCES levels(level_id) ON DELETE CASCADE,
    tool_id BIGINT NOT NULL REFERENCES tool_definitions(tool_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_level_unlocks_source_tool
    ON level_unlocks (source_level_id, tool_id);

CREATE TABLE IF NOT EXISTS user_level_progress (
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    level_id TEXT NOT NULL REFERENCES levels(level_id) ON DELETE CASCADE,
    attempted BOOLEAN NOT NULL DEFAULT false,
    completed BOOLEAN NOT NULL DEFAULT false,
    best_points INTEGER NOT NULL DEFAULT 0 CHECK (best_points >= 0),
    attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    last_attempted TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, level_id)
);

-- ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS achievements (
    achievement_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    hint TEXT NOT NULL DEFAULT 'hmmmm...',
    icon_key TEXT NOT NULL -- refer to lucide icons react library, e.g. Trophy, Star etc...
);

-- USER ACHIEVEMENT UNLOCKS
CREATE TABLE IF NOT EXISTS user_achievements (
    user_id TEXT NOT NULL,
    achievement_id TEXT NOT NULL,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, achievement_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(achievement_id) ON DELETE CASCADE
);

-- LOG OF USER ACTIVITY - LOGIN, LEVEL COMPLETED ETC...
CREATE TABLE IF NOT EXISTS user_activity_events (
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,         -- just 'level_completed' event for now, we add more type later
    event_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}' -- STUFF LIKE mode, level_id ETC
);

CREATE TABLE IF NOT EXISTS module_quizzes (
    quiz_id TEXT PRIMARY KEY,                         -- must be 'MOD1_PRE', 'MOD1_POST'
    module INTEGER NOT NULL,                          -- same meaning as tutorial levels module ordering
    quiz_type TEXT NOT NULL CHECK (quiz_type IN ('pre', 'post')),
    title TEXT NOT NULL,
    description TEXT,
    passing_score INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    UNIQUE (module, quiz_type)
);

CREATE TABLE IF NOT EXISTS module_quiz_questions (
    question_id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL REFERENCES module_quizzes(quiz_id) ON DELETE CASCADE,
    question_order INTEGER NOT NULL,
    prompt TEXT NOT NULL,
    options JSONB NOT NULL,                           -- e.g. ["A", "B", "C", "D"]
    correct_option_index INTEGER NOT NULL,            -- 0-based index into options
    explanation TEXT,
    metadata JSONB DEFAULT '{}',
    UNIQUE (quiz_id, question_order),
    CHECK (jsonb_typeof(options) = 'array'),
    CHECK (correct_option_index >= 0) -- ensure index bounds in code
);

CREATE TABLE IF NOT EXISTS user_module_quiz_progress (
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    quiz_id TEXT NOT NULL REFERENCES module_quizzes(quiz_id) ON DELETE CASCADE,
    best_score INTEGER NOT NULL DEFAULT 0,
    attempts INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT false,
    last_attempted TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_answers JSONB NOT NULL DEFAULT '{}'::jsonb,  -- {question_id: selected_index}
    PRIMARY KEY (user_id, quiz_id)
);

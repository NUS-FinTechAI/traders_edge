-- USERS
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,          -- use UUID as string
    user_name TEXT NOT NULL,
    user_email TEXT UNIQUE NOT NULL
);

-- TUTORIAL LEVELS
CREATE TABLE IF NOT EXISTS tutorial_levels (
    tutorial_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    level_order INTEGER,
    module INTEGER,
    starting_cash INTEGER DEFAULT 100000,
    passing_cash INTEGER DEFAULT 100000,
    one_star_cash INTEGER DEFAULT 100500,
    two_star_cash INTEGER DEFAULT 101000,
    three_star_cash INTEGER DEFAULT 102000,
    metadata JSONB DEFAULT '{}'
);

-- PUZZLE LEVELS
CREATE TABLE IF NOT EXISTS puzzle_levels (
    puzzle_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    level_order INTEGER,
    starting_cash INTEGER DEFAULT 100000,
    passing_cash INTEGER DEFAULT 100000,
    one_star_cash INTEGER DEFAULT 100500,
    two_star_cash INTEGER DEFAULT 101000,
    three_star_cash INTEGER DEFAULT 102000,
    metadata JSONB DEFAULT '{}'
);

-- USER TUTORIAL PROGRESS
CREATE TABLE IF NOT EXISTS user_tutorial_progress (
    user_id TEXT NOT NULL,
    tutorial_id TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    stars INTEGER DEFAULT 0 CHECK (stars BETWEEN 0 AND 3),
    attempted BOOLEAN DEFAULT false,
    completed BOOLEAN DEFAULT false,
    last_attempted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progress JSONB DEFAULT '{}',
    PRIMARY KEY (user_id, tutorial_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (tutorial_id) REFERENCES tutorial_levels(tutorial_id) ON DELETE CASCADE
);

-- USER PUZZLE PROGRESS
CREATE TABLE IF NOT EXISTS user_puzzle_progress (
    user_id TEXT NOT NULL,
    puzzle_id TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    stars INTEGER DEFAULT 0 CHECK (stars BETWEEN 0 AND 3),
    attempted BOOLEAN DEFAULT false,
    progress JSONB DEFAULT '{}',
    PRIMARY KEY (user_id, puzzle_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (puzzle_id) REFERENCES puzzle_levels(puzzle_id) ON DELETE CASCADE
);

-- ACHIEVEMENTS
CREATE TABLE achievements (
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
    module INTEGER NOT NULL,                          -- same meaning as tutorial_levels.module
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
    CHECK (correct_option_index >= 0) -- will have to ensure that correct option is not more than array length in code
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

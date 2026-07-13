# postgres.py
import os
from contextlib import contextmanager

from psycopg2 import pool

schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
initial_state_path = os.path.join(os.path.dirname(__file__), "initial_state.sql")

# Parse database URL from environment
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://myuser:mypassword@localhost:5432/mydb"
)

# Connection pool for better performance
connection_pool = None


def init_connection_pool():
    """Initialize the connection pool"""
    global connection_pool
    if connection_pool is None:
        connection_pool = pool.SimpleConnectionPool(1, 20, DATABASE_URL)
    return connection_pool


def get_conn():
    """Get a connection from the pool"""
    pool = init_connection_pool()
    return pool.getconn()


def return_conn(conn):
    """Return a connection to the pool"""
    if connection_pool:
        connection_pool.putconn(conn)


@contextmanager
def get_db_cursor(commit=False):
    """Context manager for database operations"""
    conn = get_conn()
    try:
        cursor = conn.cursor()
        yield cursor
        if commit:
            conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        return_conn(conn)


def ensure_module_quizzes_seeded():
    """Backfill module quiz tables and seed rows for existing databases."""
    seed_path = os.path.join(
        os.path.dirname(__file__),
        "init-new",
        "02-initial_state.sql",
    )
    with open(seed_path, encoding="utf-8") as seed_file:
        seed_sql = seed_file.read()

    marker = "-- Populate module quizzes"
    end_marker = "-- (No seed user_module_quiz_progress"
    start_index = seed_sql.index(marker)
    end_index = seed_sql.index(end_marker, start_index)
    quiz_seed_sql = seed_sql[start_index:end_index]

    with get_db_cursor(commit=True) as cursor:
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS module_quizzes (
                quiz_id TEXT PRIMARY KEY,
                module INTEGER NOT NULL,
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
                options JSONB NOT NULL,
                correct_option_index INTEGER NOT NULL,
                explanation TEXT,
                metadata JSONB DEFAULT '{}',
                UNIQUE (quiz_id, question_order),
                CHECK (jsonb_typeof(options) = 'array'),
                CHECK (correct_option_index >= 0)
            );

            CREATE TABLE IF NOT EXISTS user_module_quiz_progress (
                user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                quiz_id TEXT NOT NULL REFERENCES module_quizzes(quiz_id) ON DELETE CASCADE,
                best_score INTEGER NOT NULL DEFAULT 0,
                attempts INTEGER NOT NULL DEFAULT 0,
                completed BOOLEAN NOT NULL DEFAULT false,
                last_attempted TIMESTAMPTZ NOT NULL DEFAULT now(),
                last_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
                PRIMARY KEY (user_id, quiz_id)
            );
            """
        )
        cursor.execute(quiz_seed_sql)


def ensure_quiz_level_unlocks_reconciled():
    """Backfill level unlock rows for users who completed module pre-quizzes."""
    with get_db_cursor(commit=True) as cursor:
        cursor.execute(
            """
            INSERT INTO user_level_progress (
                user_id,
                level_id,
                best_points,
                attempted,
                completed,
                attempts,
                last_attempted
            )
            SELECT
                umqp.user_id,
                first_level.level_id,
                0,
                false,
                false,
                0,
                CURRENT_TIMESTAMP
            FROM user_module_quiz_progress umqp
            JOIN module_quizzes mq
              ON mq.quiz_id = umqp.quiz_id
            JOIN LATERAL (
                SELECT l.level_id
                FROM levels l
                WHERE l.level_type = 'tutorial'
                  AND l.module = mq.module
                ORDER BY l.level_order
                LIMIT 1
            ) AS first_level ON true
            WHERE umqp.completed = true
              AND mq.quiz_type = 'pre'
            ON CONFLICT (user_id, level_id) DO NOTHING
            """
        )


def start_up():
    """Initialize database on application startup"""
    init_connection_pool()
    ensure_module_quizzes_seeded()
    ensure_quiz_level_unlocks_reconciled()


def clean_up():
    """Clean up connection pool on application shutdown"""
    global connection_pool
    if connection_pool is not None:
        connection_pool.closeall()
        connection_pool = None

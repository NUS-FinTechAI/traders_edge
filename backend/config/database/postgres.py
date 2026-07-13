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


def start_up():
    """Initialize database on application startup"""
    init_connection_pool()


def clean_up():
    """Clean up connection pool on application shutdown"""
    global connection_pool
    if connection_pool is not None:
        connection_pool.closeall()
        connection_pool = None

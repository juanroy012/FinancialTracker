import sqlite3
from pathlib import Path
from typing import Generator
import os

_data_dir = Path(os.environ.get("FT_DATA_DIR") or Path(__file__).resolve().parents[2] / "instance")
_data_dir.mkdir(parents=True, exist_ok=True)
DB_PATH = str(_data_dir / "app.db")

def get_connection() -> Generator[sqlite3.Connection, None, None]:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS categories (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            name    TEXT NOT NULL UNIQUE
        );
        CREATE TABLE IF NOT EXISTS transactions (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            type         TEXT NOT NULL CHECK (type IN ('income', 'expense')),
            amount_cents INTEGER NOT NULL,
            date         TEXT NOT NULL,
            note         TEXT,
            category_id  INTEGER REFERENCES categories(id)
        );
        CREATE TABLE IF NOT EXISTS accounts (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            type    TEXT NOT NULL CHECK (type IN ('ewallet', 'bank')),
            name    TEXT NOT NULL,
            balance INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS users (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            username        TEXT NOT NULL UNIQUE,
            hashed_password TEXT NOT NULL
        );
        """
    )

    migrations = [
        ("categories",   "user_id INTEGER REFERENCES users(id)"),
        ("transactions", "user_id INTEGER REFERENCES users(id)"),
        ("accounts",     "user_id INTEGER REFERENCES users(id)"),
        ("transactions", "account_id INTEGER REFERENCES accounts(id)"),
        ("accounts",     "balance INTEGER NOT NULL DEFAULT 0"),
        ("categories",   "type TEXT NOT NULL DEFAULT 'expense'"),
        ("categories",   "icon TEXT NOT NULL DEFAULT ''"),
        ("categories",   "color TEXT NOT NULL DEFAULT 'amber'"),
        ("accounts",     "icon TEXT NOT NULL DEFAULT ''"),
        ("accounts",     "currency TEXT NOT NULL DEFAULT 'IDR'"),
    ]
    for table, column_def in migrations:
        try:
            conn.execute(f"ALTER TABLE {table} ADD COLUMN {column_def}")
            conn.commit()
        except sqlite3.OperationalError:
            pass

    conn.commit()
    conn.close()

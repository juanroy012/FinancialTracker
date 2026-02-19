"""
Database connection and initialization for SQLite.
"""
import sqlite3
from pathlib import Path
from typing import Generator

import os as _os
_data_dir = Path(_os.environ.get("FT_DATA_DIR") or Path(__file__).resolve().parents[2] / "instance")
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
    """Create tables if they do not exist. Call once at startup or via a CLI."""
    conn = sqlite3.connect(DB_PATH)
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        );
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
            amount_cents INTEGER NOT NULL,
            date TEXT NOT NULL,
            note TEXT,
            category_id INTEGER REFERENCES categories(id)
        );
        CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL CHECK (type IN ('ewallet', 'bank')),
            name TEXT NOT NULL,
            balance INTEGER NOT NULL
        )
        """
    )
    # Non-breaking migration: add account_id to transactions if not already present.
    # SQLite does not support IF NOT EXISTS for ALTER TABLE, so we catch the error.
    try:
        conn.execute(
            "ALTER TABLE transactions ADD COLUMN account_id INTEGER REFERENCES accounts(id)"
        )
        conn.commit()
    except sqlite3.OperationalError:
        pass  # column already exists

    # Non-breaking migration: add balance to accounts if not already present.
    try:
        conn.execute(
            "ALTER TABLE accounts ADD COLUMN balance INTEGER NOT NULL DEFAULT 0"
        )
        conn.commit()
    except sqlite3.OperationalError:
        pass  # column already exists

    # Non-breaking migration: add type to categories if not already present.
    try:
        conn.execute(
            "ALTER TABLE categories ADD COLUMN type TEXT NOT NULL DEFAULT 'expense'"
        )
        conn.commit()
    except sqlite3.OperationalError:
        pass  # column already exists

    # Non-breaking migration: add icon + color to categories.
    try:
        conn.execute("ALTER TABLE categories ADD COLUMN icon TEXT NOT NULL DEFAULT ''")
        conn.commit()
    except sqlite3.OperationalError:
        pass
    try:
        conn.execute("ALTER TABLE categories ADD COLUMN color TEXT NOT NULL DEFAULT 'amber'")
        conn.commit()
    except sqlite3.OperationalError:
        pass

    # Non-breaking migration: add icon to accounts.
    try:
        conn.execute("ALTER TABLE accounts ADD COLUMN icon TEXT NOT NULL DEFAULT ''")
        conn.commit()
    except sqlite3.OperationalError:
        pass

    conn.commit()
    conn.close()

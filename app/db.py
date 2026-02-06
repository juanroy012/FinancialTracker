"""
Database connection and initialization for SQLite.
All DB access goes through get_connection() or helpers defined here.
"""
import sqlite3
from pathlib import Path
from typing import Generator


DB_PATH = "./instance/app.db"
Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)

def get_connection() -> Generator[sqlite3.Connection, None, None]:
    """Resolve database path from app config."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
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
        """
    )
    conn.commit()
    conn.close()

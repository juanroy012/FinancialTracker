import sqlite3
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure the repo root is on sys.path so `import backend` works when pytest
# is run from different working directories or shells (e.g. Git Bash).
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from backend.app.__main__ import app
from backend.app.db import get_connection

_SCHEMA = """
CREATE TABLE IF NOT EXISTS categories (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT NOT NULL UNIQUE,
    type  TEXT NOT NULL DEFAULT 'expense',
    icon  TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT 'amber'
);
CREATE TABLE IF NOT EXISTS accounts (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    type    TEXT NOT NULL CHECK (type IN ('ewallet', 'bank')),
    name    TEXT NOT NULL,
    balance INTEGER NOT NULL DEFAULT 0,
    icon    TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS transactions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    type         TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount_cents INTEGER NOT NULL,
    date         TEXT NOT NULL,
    note         TEXT,
    category_id  INTEGER REFERENCES categories(id),
    account_id   INTEGER REFERENCES accounts(id)
);
"""


@pytest.fixture()
def client():
    conn = sqlite3.connect(":memory:", check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.executescript(_SCHEMA)

    def _override():
        try:
            yield conn
        finally:
            pass

    app.dependency_overrides[get_connection] = _override
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
    conn.close()

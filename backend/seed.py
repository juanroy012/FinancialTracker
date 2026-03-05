"""
Seeder script — populates the database with realistic demo data for the
'admin' account (username: admin, password: admin).

Run from the project root:
    source venv/bin/activate
    python -m backend.seed

The script is idempotent: running it more than once will skip the admin user
creation if the account already exists, and will NOT duplicate categories,
accounts, or transactions (it clears the user's existing data first and
re-seeds cleanly).

This file is listed in .gitignore and is NOT committed to the repository.
"""

import sqlite3
import sys
from pathlib import Path
from datetime import date, timedelta
import random

# ── make sure the repo root is on sys.path ──────────────────────────────────
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend.app.db import DB_PATH, init_db
from backend.app.auth import hash_password

# ── helpers ──────────────────────────────────────────────────────────────────

def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def _get_or_create_user(conn: sqlite3.Connection, username: str, password: str) -> int:
    row = conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
    if row:
        print(f"  ✓ User '{username}' already exists (id={row['id']})")
        return row["id"]
    cursor = conn.execute(
        "INSERT INTO users (username, hashed_password) VALUES (?, ?)",
        (username, hash_password(password)),
    )
    conn.commit()
    print(f"  ✓ Created user '{username}' (id={cursor.lastrowid})")
    return cursor.lastrowid


def _clear_user_data(conn: sqlite3.Connection, user_id: int):
    """Remove all existing data for this user so re-seeding is clean."""
    conn.execute("DELETE FROM transactions WHERE user_id = ?", (user_id,))
    conn.execute("DELETE FROM accounts    WHERE user_id = ?", (user_id,))
    conn.execute("DELETE FROM categories  WHERE user_id = ?", (user_id,))
    conn.commit()
    print(f"  ✓ Cleared existing data for user_id={user_id}")


def _seed_categories(conn: sqlite3.Connection, user_id: int) -> dict:
    """Insert categories and return { name: id }."""
    cats = [
        # income
        ("Salary",       "income",  "💼", "emerald"),
        ("Freelance",    "income",  "💻", "cyan"),
        ("Investment",   "income",  "📈", "sky"),
        ("Bonus",        "income",  "🎁", "violet"),
        # expense
        ("Food",         "expense", "🍜", "amber"),
        ("Transport",    "expense", "🚗", "orange"),
        ("Rent",         "expense", "🏠", "rose"),
        ("Utilities",    "expense", "💡", "yellow"),
        ("Health",       "expense", "💊", "pink"),
        ("Shopping",     "expense", "🛍️",  "purple"),
        ("Entertainment","expense", "🎮", "indigo"),
        ("Education",    "expense", "📚", "blue"),
        ("Savings",      "expense", "🏦", "teal"),
    ]
    result = {}
    for name, ctype, icon, color in cats:
        # The categories table has a global UNIQUE on name.
        # Try to insert; if it already exists for another user just look it up.
        conn.execute(
            "INSERT OR IGNORE INTO categories (name, type, icon, color, user_id) VALUES (?,?,?,?,?)",
            (name, ctype, icon, color, user_id),
        )
        row = conn.execute("SELECT id FROM categories WHERE name = ?", (name,)).fetchone()
        result[name] = row["id"]
    conn.commit()
    print(f"  ✓ Seeded {len(cats)} categories")
    return result


def _seed_accounts(conn: sqlite3.Connection, user_id: int) -> dict:
    """Insert accounts and return { name: id }."""
    accounts = [
        ("BCA Savings",  "bank",    50_000_000, "IDR"),
        ("Mandiri",      "bank",    25_000_000, "IDR"),
        ("GCash",        "ewallet",  3_500_000, "IDR"),
        ("OVO",          "ewallet",  1_200_000, "IDR"),
        ("USD Savings",  "bank",         3_500, "USD"),
    ]
    result = {}
    for name, atype, balance, currency in accounts:
        cursor = conn.execute(
            "INSERT INTO accounts (type, name, balance, icon, currency, user_id) VALUES (?,?,?,?,?,?)",
            (atype, name, balance, "", currency, user_id),
        )
        result[name] = {"id": cursor.lastrowid, "balance": balance, "currency": currency}
    conn.commit()
    print(f"  ✓ Inserted {len(accounts)} accounts")
    return result


def _seed_transactions(
    conn: sqlite3.Connection,
    user_id: int,
    cat_ids: dict,
    acc_map: dict,
):
    """Insert ~6 months of realistic transactions and reconcile account balances."""

    today = date.today()
    # Start 6 months back
    start = date(today.year, today.month, 1) - timedelta(days=180)

    # Zero out balances — we rebuild from transactions
    for acc in acc_map.values():
        conn.execute("UPDATE accounts SET balance = 0 WHERE id = ?", (acc["id"],))

    random.seed(42)

    bca_id     = acc_map["BCA Savings"]["id"]
    mandiri_id = acc_map["Mandiri"]["id"]
    gcash_id   = acc_map["GCash"]["id"]
    ovo_id     = acc_map["OVO"]["id"]
    usd_id     = acc_map["USD Savings"]["id"]

    def add(tx_date, tx_type, amount, cat_name, acc_id, note=None):
        conn.execute(
            "INSERT INTO transactions "
            "(type, amount_cents, date, note, category_id, account_id, user_id) "
            "VALUES (?,?,?,?,?,?,?)",
            (
                tx_type,
                amount,
                tx_date.isoformat(),
                note or f"{cat_name} – {tx_date.strftime('%b %Y')}",
                cat_ids.get(cat_name),
                acc_id,
                user_id,
            ),
        )
        delta = amount if tx_type == "income" else -amount
        conn.execute("UPDATE accounts SET balance = balance + ? WHERE id = ?", (delta, acc_id))

    # ── Opening balances (one-time income on the first day) ──────────────────
    opening_day = start - timedelta(days=1)
    add(opening_day, "income", 50_000_000, "Salary",    bca_id,     "Opening balance")
    add(opening_day, "income", 25_000_000, "Salary",    mandiri_id, "Opening balance")
    add(opening_day, "income", 15_000_000, "Salary",    gcash_id,   "Opening balance")
    add(opening_day, "income", 10_000_000, "Salary",    ovo_id,     "Opening balance")
    add(opening_day, "income",      2_000, "Investment", usd_id,    "Opening balance")

    # ── Monthly transactions ─────────────────────────────────────────────────
    current = start.replace(day=1)
    while current <= today:
        m = current

        # Salary
        salary = random.randint(12_000_000, 15_000_000)
        add(m.replace(day=25), "income", salary, "Salary", bca_id)

        # Freelance (not every month)
        if random.random() > 0.4:
            add(m.replace(day=random.randint(5, 20)), "income",
                random.randint(1_500_000, 5_000_000), "Freelance", bca_id)

        # Investment dividends (quarterly)
        if m.month in (3, 6, 9, 12):
            add(m.replace(day=15), "income",
                random.randint(500_000, 2_000_000), "Investment", bca_id)

        # USD savings deposit
        add(m.replace(day=28), "income",
            random.randint(100, 300), "Salary", usd_id)

        # Rent
        add(m.replace(day=1), "expense", 3_500_000, "Rent", bca_id)

        # Utilities
        add(m.replace(day=5), "expense",
            random.randint(300_000, 600_000), "Utilities", bca_id)

        # Groceries (weekly)
        for week in range(4):
            day = min(7 + week * 7, 28)
            add(m.replace(day=day), "expense",
                random.randint(150_000, 350_000), "Food", gcash_id)

        # Eating out
        for _ in range(random.randint(3, 6)):
            add(m.replace(day=random.randint(1, 28)), "expense",
                random.randint(50_000, 200_000), "Food", ovo_id)

        # Transport
        for _ in range(random.randint(8, 15)):
            add(m.replace(day=random.randint(1, 28)), "expense",
                random.randint(15_000, 80_000), "Transport", gcash_id)

        # Health
        if random.random() > 0.5:
            add(m.replace(day=random.randint(1, 28)), "expense",
                random.randint(100_000, 500_000), "Health", bca_id)

        # Shopping
        for _ in range(random.randint(1, 3)):
            add(m.replace(day=random.randint(1, 28)), "expense",
                random.randint(200_000, 1_500_000), "Shopping", mandiri_id)

        # Entertainment
        if random.random() > 0.3:
            add(m.replace(day=random.randint(1, 28)), "expense",
                random.randint(100_000, 400_000), "Entertainment", ovo_id)

        # Education
        if random.random() > 0.6:
            add(m.replace(day=random.randint(1, 28)), "expense",
                random.randint(200_000, 800_000), "Education", bca_id)

        # Savings transfer
        add(m.replace(day=26), "expense",
            random.randint(1_000_000, 3_000_000), "Savings", mandiri_id)

        # Advance to next month
        if current.month == 12:
            current = current.replace(year=current.year + 1, month=1)
        else:
            current = current.replace(month=current.month + 1)

    conn.commit()
    total = conn.execute(
        "SELECT COUNT(*) FROM transactions WHERE user_id = ?", (user_id,)
    ).fetchone()[0]
    print(f"  ✓ Inserted {total} transactions across 6 months")


# ── main ─────────────────────────────────────────────────────────────────────

def main():
    print("── FinancialTracker Seeder ──────────────────────────────")
    print(f"  DB: {DB_PATH}")

    # Ensure schema is up to date
    init_db()
    print("  ✓ Database schema initialised")

    conn = _connect()

    try:
        user_id = _get_or_create_user(conn, username="admin", password="admin")
        _clear_user_data(conn, user_id)
        cat_ids = _seed_categories(conn, user_id)
        acc_map = _seed_accounts(conn, user_id)
        _seed_transactions(conn, user_id, cat_ids, acc_map)

        # Print final account balances
        print("\n  Final account balances:")
        rows = conn.execute(
            "SELECT name, balance, currency FROM accounts WHERE user_id = ? ORDER BY id",
            (user_id,),
        ).fetchall()
        for r in rows:
            print(f"    {r['name']:20s}  {r['currency']}  {r['balance']:>15,}")

        print("\n  ✅  Seeding complete!")
        print("     Login with  username: admin  /  password: admin")
    finally:
        conn.close()


if __name__ == "__main__":
    main()


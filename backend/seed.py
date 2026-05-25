"""
Seeder script — populates the database with realistic financial history for the
public account

"""

import sqlite3
import sys
from pathlib import Path
from datetime import date, timedelta
import random
import os

# ── make sure the repo root is on sys.path ──────────────────────────────────
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

try:
    from app.db import DB_PATH, init_db
    from app.auth import hash_password
except ImportError:
    from backend.app.db import DB_PATH, init_db
    from backend.app.auth import hash_password

PUBLIC_SEED_USER = os.environ.get("FT_PUBLIC_SEED_USER") or os.environ.get("FT_PUBLIC_DEMO_USER") or "public"

# ── helpers ──────────────────────────────────────────────────────────────────

def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def _ensure_public_seed_data(conn: sqlite3.Connection) -> None:
    row = conn.execute(
        "SELECT id FROM users WHERE username = ?",
        (PUBLIC_SEED_USER,),
    ).fetchone()
    if row:
        user_id = row["id"]
    else:
        cur = conn.execute(
            "INSERT INTO users (username, hashed_password) VALUES (?, ?)",
            (PUBLIC_SEED_USER, "public-login-disabled"),
        )
        user_id = cur.lastrowid

    existing = conn.execute(
        "SELECT COUNT(*) AS c FROM transactions WHERE user_id = ?",
        (user_id,),
    ).fetchone()["c"]
    if existing >= 420:
        return

    conn.execute("DELETE FROM transactions WHERE user_id = ?", (user_id,))
    conn.execute("DELETE FROM accounts WHERE user_id = ?", (user_id,))
    conn.execute("DELETE FROM categories WHERE user_id = ?", (user_id,))

    categories = [
        ("Salary", "income", "briefcase", "emerald"),
        ("Freelance", "income", "wallet", "cyan"),
        ("Investment", "income", "investment", "sky"),
        ("Bonus", "income", "gift", "violet"),
        ("Food", "expense", "utensils", "amber"),
        ("Transport", "expense", "car", "orange"),
        ("Rent", "expense", "house", "rose"),
        ("Utilities", "expense", "receipt", "yellow"),
        ("Health", "expense", "health", "pink"),
        ("Shopping", "expense", "shopping", "purple"),
        ("Entertainment", "expense", "sparkles", "indigo"),
        ("Education", "expense", "graduation", "blue"),
        ("Insurance", "expense", "shield", "teal"),
    ]
    category_ids: dict[str, int] = {}
    for name, ctype, icon, color in categories:
        conn.execute(
            "INSERT OR IGNORE INTO categories (name, type, icon, color, user_id) VALUES (?, ?, ?, ?, ?)",
            (name, ctype, icon, color, user_id),
        )
        row = conn.execute("SELECT id FROM categories WHERE name = ?", (name,)).fetchone()
        if row is None:
            raise RuntimeError("Failed to create seed category")
        category_ids[name] = row["id"]

    accounts = [
        ("RBC Chequing", "bank", "CAD"),
        ("TD Savings", "bank", "CAD"),
        ("Scotiabank Visa", "bank", "CAD"),
        ("Wealthsimple Cash", "ewallet", "CAD"),
        ("USD Savings", "bank", "USD"),
    ]
    account_ids: dict[str, int] = {}
    for name, acc_type, currency in accounts:
        cur = conn.execute(
            "INSERT INTO accounts (type, name, balance, icon, currency, user_id) VALUES (?, ?, ?, ?, ?, ?)",
            (acc_type, name, 0, "", currency, user_id),
        )
        if cur.lastrowid is None:
            raise RuntimeError("Failed to create seed account")
        account_ids[name] = cur.lastrowid

    random.seed(73)
    today = date.today()
    start = date(today.year, today.month, 1) - timedelta(days=540)
    transactions: list[tuple[str, int, date, str, str, str]] = []

    opening_day = start - timedelta(days=1)
    transactions.extend([
        ("income", 14_500, opening_day, "Opening balance", "Salary", "RBC Chequing"),
        ("income", 6_750, opening_day, "Opening balance", "Salary", "TD Savings"),
        ("income", 1_250, opening_day, "Opening balance", "Salary", "Wealthsimple Cash"),
        ("income", 900, opening_day, "Opening balance", "Investment", "USD Savings"),
    ])

    current = start.replace(day=1)
    while current <= today:
        m = current
        salary = random.randint(5_200, 6_800)
        transactions.append(("income", salary, m.replace(day=25), "Payroll deposit", "Salary", "RBC Chequing"))

        if random.random() > 0.35:
            transactions.append((
                "income",
                random.randint(900, 3_400),
                m.replace(day=random.randint(6, 18)),
                "Client contract payout",
                "Freelance",
                "RBC Chequing",
            ))

        if m.month in (3, 6, 9, 12):
            transactions.append((
                "income",
                random.randint(150, 620),
                m.replace(day=15),
                "Quarterly dividend",
                "Investment",
                "TD Savings",
            ))

        if m.month in (6, 12):
            transactions.append((
                "income",
                random.randint(1_200, 2_700),
                m.replace(day=20),
                "Performance bonus",
                "Bonus",
                "RBC Chequing",
            ))

        transactions.append(("expense", random.randint(2_050, 2_550), m.replace(day=1), "Rent payment", "Rent", "RBC Chequing"))
        transactions.append(("expense", random.randint(180, 340), m.replace(day=4), "Hydro and internet", "Utilities", "RBC Chequing"))
        transactions.append(("expense", random.randint(85, 140), m.replace(day=12), "Phone bill", "Utilities", "RBC Chequing"))
        transactions.append(("expense", random.randint(110, 240), m.replace(day=8), "Auto insurance", "Insurance", "RBC Chequing"))

        for week in range(4):
            day = min(7 + week * 7, 28)
            transactions.append(("expense", random.randint(95, 190), m.replace(day=day), "Groceries", "Food", "Wealthsimple Cash"))

        for _ in range(random.randint(5, 10)):
            transactions.append(("expense", random.randint(18, 64), m.replace(day=random.randint(1, 28)), "Transit and rides", "Transport", "Wealthsimple Cash"))

        for _ in range(random.randint(2, 5)):
            transactions.append(("expense", random.randint(35, 150), m.replace(day=random.randint(1, 28)), "Restaurants", "Food", "Scotiabank Visa"))

        for _ in range(random.randint(1, 4)):
            transactions.append(("expense", random.randint(80, 520), m.replace(day=random.randint(1, 28)), "Retail purchase", "Shopping", "Scotiabank Visa"))

        if random.random() > 0.45:
            transactions.append(("expense", random.randint(65, 220), m.replace(day=random.randint(1, 28)), "Gym or pharmacy", "Health", "RBC Chequing"))

        if random.random() > 0.3:
            transactions.append(("expense", random.randint(45, 210), m.replace(day=random.randint(1, 28)), "Streaming and events", "Entertainment", "Scotiabank Visa"))

        if random.random() > 0.7:
            transactions.append(("expense", random.randint(130, 560), m.replace(day=random.randint(1, 28)), "Course fee", "Education", "TD Savings"))

        transactions.append(("expense", random.randint(700, 1_900), m.replace(day=26), "Savings contribution", "Investment", "RBC Chequing"))
        transactions.append(("income", random.randint(90, 220), m.replace(day=28), "USD transfer", "Investment", "USD Savings"))

        if current.month == 12:
            current = current.replace(year=current.year + 1, month=1)
        else:
            current = current.replace(month=current.month + 1)

    balances = {acc_id: 0 for acc_id in account_ids.values()}
    for tx_type, amount, tx_date, note, category_name, account_name in transactions:
        account_id = account_ids[account_name]
        conn.execute(
            "INSERT INTO transactions (type, amount_cents, date, note, category_id, account_id, user_id) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                tx_type,
                amount,
                tx_date.isoformat(),
                note,
                category_ids[category_name],
                account_id,
                user_id,
            ),
        )
        balances[account_id] += amount if tx_type == "income" else -amount

    for account_id, balance in balances.items():
        conn.execute("UPDATE accounts SET balance = ? WHERE id = ?", (balance, account_id))

    conn.commit()


def ensure_public_seed_data() -> None:
    conn = _connect()
    try:
        _ensure_public_seed_data(conn)
    finally:
        conn.close()


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
    if cursor.lastrowid is None:
        raise RuntimeError("Failed to create seed user")
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
        ("Salary",       "income",  "briefcase", "emerald"),
        ("Freelance",    "income",  "wallet", "cyan"),
        ("Investment",   "income",  "investment", "sky"),
        ("Bonus",        "income",  "gift", "violet"),
        # expense
        ("Food",         "expense", "utensils", "amber"),
        ("Transport",    "expense", "car", "orange"),
        ("Rent",         "expense", "house", "rose"),
        ("Utilities",    "expense", "receipt", "yellow"),
        ("Health",       "expense", "health", "pink"),
        ("Shopping",     "expense", "shopping",  "purple"),
        ("Entertainment","expense", "sparkles", "indigo"),
        ("Education",    "expense", "graduation", "blue"),
        ("Savings",      "expense", "piggybank", "teal"),
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
        ("RBC Chequing",      "bank",    12_500, "CAD"),
        ("TD Savings",        "bank",     8_750, "CAD"),
        ("KOHO Wallet",       "ewallet",  1_350, "CAD"),
        ("Wealthsimple Cash", "ewallet",    620, "CAD"),
        ("USD Savings",       "bank",      950, "USD"),
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
    """Insert ~18 months of realistic transactions and reconcile account balances."""

    today = date.today()
    # Start around 18 months back
    start = date(today.year, today.month, 1) - timedelta(days=540)

    # Zero out balances — we rebuild from transactions
    for acc in acc_map.values():
        conn.execute("UPDATE accounts SET balance = 0 WHERE id = ?", (acc["id"],))

    random.seed(42)

    rbc_id = acc_map["RBC Chequing"]["id"]
    td_id = acc_map["TD Savings"]["id"]
    koho_id = acc_map["KOHO Wallet"]["id"]
    ws_cash_id = acc_map["Wealthsimple Cash"]["id"]
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
    add(opening_day, "income", 12_500, "Salary",     rbc_id,     "Opening balance")
    add(opening_day, "income", 8_750, "Salary",      td_id,      "Opening balance")
    add(opening_day, "income", 1_350, "Salary",      koho_id,    "Opening balance")
    add(opening_day, "income",   620, "Salary",      ws_cash_id, "Opening balance")
    add(opening_day, "income",   950, "Investment",  usd_id,     "Opening balance")

    # ── Monthly transactions ─────────────────────────────────────────────────
    current = start.replace(day=1)
    while current <= today:
        m = current

        # Salary
        salary = random.randint(4_800, 6_200)
        add(m.replace(day=25), "income", salary, "Salary", rbc_id)

        # Freelance (not every month)
        if random.random() > 0.4:
            add(m.replace(day=random.randint(5, 20)), "income",
                random.randint(750, 2_400), "Freelance", rbc_id)

        # Investment dividends (quarterly)
        if m.month in (3, 6, 9, 12):
            add(m.replace(day=15), "income",
                random.randint(120, 520), "Investment", rbc_id)

        # USD savings deposit
        add(m.replace(day=28), "income",
            random.randint(80, 180), "Salary", usd_id)

        # Rent
        add(m.replace(day=1), "expense", 2_100, "Rent", rbc_id)

        # Utilities
        add(m.replace(day=5), "expense",
            random.randint(160, 310), "Utilities", rbc_id)

        # Groceries (weekly)
        for week in range(4):
            day = min(7 + week * 7, 28)
            add(m.replace(day=day), "expense",
                random.randint(85, 170), "Food", koho_id)

        # Eating out
        for _ in range(random.randint(3, 6)):
            add(m.replace(day=random.randint(1, 28)), "expense",
                random.randint(25, 85), "Food", ws_cash_id)

        # Transport
        for _ in range(random.randint(8, 15)):
            add(m.replace(day=random.randint(1, 28)), "expense",
                random.randint(12, 48), "Transport", koho_id)

        # Health
        if random.random() > 0.5:
            add(m.replace(day=random.randint(1, 28)), "expense",
                random.randint(70, 260), "Health", rbc_id)

        # Shopping
        for _ in range(random.randint(1, 3)):
            add(m.replace(day=random.randint(1, 28)), "expense",
                random.randint(90, 540), "Shopping", td_id)

        # Entertainment
        if random.random() > 0.3:
            add(m.replace(day=random.randint(1, 28)), "expense",
                random.randint(45, 190), "Entertainment", ws_cash_id)

        # Education
        if random.random() > 0.6:
            add(m.replace(day=random.randint(1, 28)), "expense",
                random.randint(110, 430), "Education", rbc_id)

        # Savings transfer
        add(m.replace(day=26), "expense",
            random.randint(650, 1_800), "Savings", td_id)

        # Advance to next month
        if current.month == 12:
            current = current.replace(year=current.year + 1, month=1)
        else:
            current = current.replace(month=current.month + 1)

    # ── April 2026 (explicit) ────────────────────────────────────────────────
    apr = date(2026, 4, 1)
    already_has_apr = conn.execute(
        "SELECT COUNT(*) FROM transactions WHERE user_id=? AND date >= '2026-04-01' AND date <= '2026-04-30'",
        (user_id,),
    ).fetchone()[0]
    if not already_has_apr:
        add(apr.replace(day=1),  "expense", 2_100,  "Rent",          rbc_id,    "Rent payment")
        add(apr.replace(day=4),  "expense",   230,  "Utilities",     rbc_id,    "Hydro and internet")
        add(apr.replace(day=5),  "expense",    38,  "Transport",     koho_id,   "Transit pass")
        add(apr.replace(day=7),  "expense",   140,  "Food",          koho_id,   "Groceries")
        add(apr.replace(day=9),  "expense",    62,  "Food",          ws_cash_id,"Dinner out")
        add(apr.replace(day=11), "expense",   310,  "Shopping",      td_id,     "Retail purchase")
        add(apr.replace(day=13), "expense",    28,  "Transport",     koho_id,   "Transit and rides")
        add(apr.replace(day=14), "expense",   140,  "Food",          koho_id,   "Groceries")
        add(apr.replace(day=15), "income",    480,  "Investment",    rbc_id,    "Quarterly dividend")
        add(apr.replace(day=16), "expense",    75,  "Entertainment", ws_cash_id,"Streaming and events")
        add(apr.replace(day=17), "expense",   155,  "Health",        rbc_id,    "Gym and pharmacy")
        add(apr.replace(day=18), "expense",    45,  "Food",          ws_cash_id,"Lunch out")
        add(apr.replace(day=19), "expense",    32,  "Transport",     koho_id,   "Transit and rides")
        add(apr.replace(day=21), "expense",   140,  "Food",          koho_id,   "Groceries")
        add(apr.replace(day=22), "expense",   420,  "Shopping",      td_id,     "Retail purchase")
        add(apr.replace(day=23), "expense",    55,  "Food",          ws_cash_id,"Restaurants")
        add(apr.replace(day=24), "expense",    41,  "Transport",     koho_id,   "Transit and rides")
        add(apr.replace(day=25), "income",  5_650,  "Salary",        rbc_id,    "Payroll deposit")
        add(apr.replace(day=25), "expense",   200,  "Education",     rbc_id,    "Course fee")
        add(apr.replace(day=26), "expense", 1_200,  "Savings",       td_id,     "Savings contribution")
        add(apr.replace(day=27), "income",  1_850,  "Freelance",     rbc_id,    "Client contract payout")
        add(apr.replace(day=28), "expense",   140,  "Food",          koho_id,   "Groceries")
        add(apr.replace(day=28), "income",    130,  "Salary",        usd_id,    "USD deposit")
        add(apr.replace(day=29), "expense",    58,  "Food",          ws_cash_id,"Dinner out")

    # ── May 2026 (explicit, up to ~25th) ────────────────────────────────────
    may = date(2026, 5, 1)
    already_has_may = conn.execute(
        "SELECT COUNT(*) FROM transactions WHERE user_id=? AND date >= '2026-05-01' AND date <= '2026-05-31'",
        (user_id,),
    ).fetchone()[0]
    if not already_has_may:
        add(may.replace(day=1),  "expense", 2_100,  "Rent",          rbc_id,    "Rent payment")
        add(may.replace(day=3),  "expense",   195,  "Utilities",     rbc_id,    "Hydro and internet")
        add(may.replace(day=5),  "expense",    35,  "Transport",     koho_id,   "Transit and rides")
        add(may.replace(day=7),  "expense",   155,  "Food",          koho_id,   "Groceries")
        add(may.replace(day=8),  "expense",    68,  "Food",          ws_cash_id,"Restaurants")
        add(may.replace(day=9),  "expense",   270,  "Shopping",      td_id,     "Retail purchase")
        add(may.replace(day=10), "expense",    42,  "Transport",     koho_id,   "Transit and rides")
        add(may.replace(day=12), "expense",    90,  "Health",        rbc_id,    "Pharmacy")
        add(may.replace(day=14), "expense",   155,  "Food",          koho_id,   "Groceries")
        add(may.replace(day=15), "expense",    55,  "Food",          ws_cash_id,"Lunch out")
        add(may.replace(day=16), "income",  1_400,  "Freelance",     rbc_id,    "Client contract payout")
        add(may.replace(day=17), "expense",    38,  "Transport",     koho_id,   "Transit and rides")
        add(may.replace(day=18), "expense",   180,  "Entertainment", ws_cash_id,"Streaming and events")
        add(may.replace(day=19), "expense",   490,  "Shopping",      td_id,     "Retail purchase")
        add(may.replace(day=20), "expense",    72,  "Food",          ws_cash_id,"Dinner out")
        add(may.replace(day=21), "expense",   155,  "Food",          koho_id,   "Groceries")
        add(may.replace(day=22), "expense",    30,  "Transport",     koho_id,   "Transit and rides")
        add(may.replace(day=23), "expense",   340,  "Education",     rbc_id,    "Course fee")
        add(may.replace(day=24), "expense",    50,  "Food",          ws_cash_id,"Lunch out")
        add(may.replace(day=25), "income",  5_900,  "Salary",        rbc_id,    "Payroll deposit")
        add(may.replace(day=25), "expense", 1_500,  "Savings",       td_id,     "Savings contribution")
        add(may.replace(day=25), "income",    150,  "Salary",        usd_id,    "USD deposit")

    conn.commit()
    total = conn.execute(
        "SELECT COUNT(*) FROM transactions WHERE user_id = ?", (user_id,)
    ).fetchone()[0]
    print(f"  ✓ Inserted {total} transactions across 18 months")


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

        print("\n  Seeding complete!")
        print("     Login with  username: admin  /  password: admin")
    finally:
        conn.close()


if __name__ == "__main__":
    main()


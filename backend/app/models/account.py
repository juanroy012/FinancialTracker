import sqlite3
from typing import List

from ..schemas.account import AccountCreate, AccountRead

def get_all_accounts(user_id: int, conn: sqlite3.Connection) -> List[AccountRead]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM accounts WHERE user_id = ?", (user_id,))
    rows = cursor.fetchall()
    return [AccountRead(id=row["id"], type=row["type"], name=row["name"], balance=row["balance"], icon=row["icon"], currency=row["currency"]) for row in rows]

def get_accounts_by_name(name: str, user_id: int, conn: sqlite3.Connection) -> List[AccountRead] | None:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM accounts WHERE name=? AND user_id = ?", (name, user_id))
    rows = cursor.fetchall()
    if not rows:
        return None
    return [AccountRead(id=row["id"], type=row["type"], name=row["name"], balance=row["balance"], icon=row["icon"], currency=row["currency"]) for row in rows]

def create_account(account: AccountCreate, user_id: int, conn: sqlite3.Connection) -> AccountRead:
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO accounts(type, name, balance, icon, currency, user_id) VALUES (?, ?, ?, ?, ?, ?)",
        (account.type, account.name, account.balance, account.icon, account.currency, user_id)
    )
    conn.commit()
    account_id = cursor.lastrowid
    return AccountRead(id=account_id, type=account.type, name=account.name, balance=account.balance, icon=account.icon, currency=account.currency)

def delete_account(account_id: int, user_id: int, conn: sqlite3.Connection) -> bool:
    cursor = conn.cursor()
    cursor.execute("DELETE FROM accounts WHERE id = ? AND user_id = ?", (account_id, user_id))
    conn.commit()
    return cursor.rowcount > 0

def update_account(
    account_id: int,
    update: AccountCreate,
    user_id: int,
    conn: sqlite3.Connection
    ) -> AccountRead | None:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM accounts WHERE id = ? AND user_id = ?", (account_id, user_id))
    row = cursor.fetchone()
    if row is None:
        return None
    cursor.execute(
        "UPDATE accounts SET type = ?, name = ?, balance = ?, icon = ?, currency = ? WHERE id = ? AND user_id = ?",
        (update.type, update.name, update.balance, update.icon, update.currency, account_id, user_id)
    )
    conn.commit()
    return AccountRead(id=account_id, type=update.type, name=update.name, balance=update.balance, icon=update.icon, currency=update.currency)

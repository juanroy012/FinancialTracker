"""
Transaction model: all DB operations for transactions.
Use parameterized queries only. Amounts in cents (integer).
"""
from sqlite3 import Connection

from ..schemas.transaction import TransactionCreate, TransactionRead


def _row_to_read(row) -> TransactionRead:
    return TransactionRead(
        id=row["id"],
        type=row["type"],
        amount_cents=row["amount_cents"],
        date=row["date"],
        note=row["note"],
        category_id=row["category_id"],
        account_id=row["account_id"],
    )


def get_all_transactions(user_id: int, conn: Connection) -> list[TransactionRead]:
    """Return all transactions belonging to the given user."""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transactions WHERE user_id = ?", (user_id,))
    return [_row_to_read(row) for row in cursor.fetchall()]


def get_transactions_by_name(transaction_name: str, user_id: int, conn: Connection) -> list[TransactionRead] | None:
    """Return transactions matching a note scoped to the user, or None if not found."""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transactions WHERE note = ? AND user_id = ?", (transaction_name, user_id))
    rows = cursor.fetchall()
    if not rows:
        return None
    return [_row_to_read(row) for row in rows]


def create_transaction(new: TransactionCreate, user_id: int, conn: Connection) -> TransactionRead:
    """Insert a new transaction owned by the given user and adjust the linked account balance."""
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO transactions (type, amount_cents, date, note, category_id, account_id, user_id) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        (new.type, new.amount_cents, new.date, new.note, new.category_id, new.account_id, user_id),
    )
    if new.account_id is not None:
        delta = new.amount_cents if new.type == "income" else -new.amount_cents
        conn.execute(
            "UPDATE accounts SET balance = balance + ? WHERE id = ? AND user_id = ?",
            (delta, new.account_id, user_id)
        )
    conn.commit()
    return TransactionRead(
        id=cursor.lastrowid,
        type=new.type,
        amount_cents=new.amount_cents,
        date=new.date,
        note=new.note,
        category_id=new.category_id,
        account_id=new.account_id,
    )


def delete_transaction(transaction_id: int, user_id: int, conn: Connection) -> bool:
    """Delete a transaction scoped to the user and reverse its effect on the account balance."""
    cursor = conn.cursor()
    old = cursor.execute(
        "SELECT * FROM transactions WHERE id = ? AND user_id = ?", (transaction_id, user_id)
    ).fetchone()
    if old is None:
        return False
    cursor.execute("DELETE FROM transactions WHERE id = ? AND user_id = ?", (transaction_id, user_id))
    if old["account_id"] is not None:
        delta = -old["amount_cents"] if old["type"] == "income" else old["amount_cents"]
        conn.execute(
            "UPDATE accounts SET balance = balance + ? WHERE id = ? AND user_id = ?",
            (delta, old["account_id"], user_id)
        )
    conn.commit()
    return True


def update_transaction(
    transaction_id: int,
    update: TransactionCreate,
    user_id: int,
    conn: Connection
) -> TransactionRead | None:
    """Update a transaction scoped to the user and reconcile the linked account balance."""
    cursor = conn.cursor()
    old = cursor.execute(
        "SELECT * FROM transactions WHERE id = ? AND user_id = ?", (transaction_id, user_id)
    ).fetchone()
    if old is None:
        return None
    cursor.execute(
        "UPDATE transactions SET type = ?, amount_cents = ?, date = ?, note = ?, "
        "category_id = ?, account_id = ? WHERE id = ? AND user_id = ?",
        (update.type, update.amount_cents, update.date, update.note,
         update.category_id, update.account_id, transaction_id, user_id),
    )
    if old["account_id"] is not None:
        old_delta = -old["amount_cents"] if old["type"] == "income" else old["amount_cents"]
        conn.execute(
            "UPDATE accounts SET balance = balance + ? WHERE id = ? AND user_id = ?",
            (old_delta, old["account_id"], user_id)
        )
    if update.account_id is not None:
        new_delta = update.amount_cents if update.type == "income" else -update.amount_cents
        conn.execute(
            "UPDATE accounts SET balance = balance + ? WHERE id = ? AND user_id = ?",
            (new_delta, update.account_id, user_id)
        )
    conn.commit()
    row = cursor.execute("SELECT * FROM transactions WHERE id = ?", (transaction_id,)).fetchone()
    return _row_to_read(row)

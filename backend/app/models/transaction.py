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


def get_all_transactions(conn: Connection) -> list[TransactionRead]:
    """Return all transactions from the database as a list of row dicts."""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transactions")
    return [_row_to_read(row) for row in cursor.fetchall()]


def get_transactions_by_name(transaction_name: str, conn: Connection) -> list[TransactionRead] | None:
    """Return transactions matching a note, or None if not found."""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transactions WHERE note = ?", (transaction_name,))
    rows = cursor.fetchall()
    if not rows:
        return None
    return [_row_to_read(row) for row in rows]


def create_transaction(new: TransactionCreate, conn: Connection) -> TransactionRead:
    """Insert a new transaction and adjust the linked account balance."""
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO transactions (type, amount_cents, date, note, category_id, account_id) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (new.type, new.amount_cents, new.date, new.note, new.category_id, new.account_id),
    )
    # Increase balance for income, decrease for expense
    if new.account_id is not None:
        delta = new.amount_cents if new.type == "income" else -new.amount_cents
        conn.execute("UPDATE accounts SET balance = balance + ? WHERE id = ?", (delta, new.account_id))
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


def delete_transaction(transaction_id: int, conn: Connection) -> bool:
    """Delete a transaction and reverse its effect on the linked account balance."""
    cursor = conn.cursor()
    old = cursor.execute("SELECT * FROM transactions WHERE id = ?", (transaction_id,)).fetchone()
    if old is None:
        return False
    cursor.execute("DELETE FROM transactions WHERE id = ?", (transaction_id,))
    # Reverse the balance effect: undo income (subtract) or undo expense (add back)
    if old["account_id"] is not None:
        delta = -old["amount_cents"] if old["type"] == "income" else old["amount_cents"]
        conn.execute("UPDATE accounts SET balance = balance + ? WHERE id = ?", (delta, old["account_id"]))
    conn.commit()
    return True


def update_transaction(
    transaction_id: int,
    update: TransactionCreate,
    conn: Connection
) -> TransactionRead | None:
    """Update a transaction and reconcile the linked account balance."""
    cursor = conn.cursor()
    old = cursor.execute("SELECT * FROM transactions WHERE id = ?", (transaction_id,)).fetchone()
    if old is None:
        return None
    cursor.execute(
        "UPDATE transactions SET type = ?, amount_cents = ?, date = ?, note = ?, "
        "category_id = ?, account_id = ? WHERE id = ?",
        (update.type, update.amount_cents, update.date, update.note,
         update.category_id, update.account_id, transaction_id),
    )
    # Reverse the old balance effect
    if old["account_id"] is not None:
        old_delta = -old["amount_cents"] if old["type"] == "income" else old["amount_cents"]
        conn.execute("UPDATE accounts SET balance = balance + ? WHERE id = ?", (old_delta, old["account_id"]))
    # Apply the new balance effect
    if update.account_id is not None:
        new_delta = update.amount_cents if update.type == "income" else -update.amount_cents
        conn.execute("UPDATE accounts SET balance = balance + ? WHERE id = ?", (new_delta, update.account_id))
    conn.commit()
    row = cursor.execute("SELECT * FROM transactions WHERE id = ?", (transaction_id,)).fetchone()
    return _row_to_read(row)

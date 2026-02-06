"""
Transaction model: all DB operations for transactions.
Use parameterized queries only. Amounts in cents (integer).
"""
from sqlite3 import Connection

from app.schemas.transaction import TransactionCreate, TransactionRead


def get_all_transactions(conn: Connection) -> list[TransactionRead]:
    """Return all transactions from the database as a list of row dicts."""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transactions")
    rows = cursor.fetchall()
    return [TransactionRead(
                id=row["id"],
                type=row["type"],
                amount_cents=row["amount_cents"],
                date=row["date"],
                note=row["note"],
                category_id=row["category_id"])
            for row in rows]


def get_transaction_by_id(transaction_id: int, conn: Connection) -> TransactionRead | None:
    """Return a single transaction by id, or None if not found."""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transactions WHERE id = ?", (transaction_id,))
    row = cursor.fetchone()
    if row is None:
        return None
    return TransactionRead(
            id=row["id"],
            type=row["type"],
            amount_cents=row["amount_cents"],
            date=row["date"],
            note=row["note"],
            category_id=row["category_id"]
    )


def create_transaction(
    new: TransactionCreate,
    conn: Connection
) -> None:
    """Insert a new transaction. Id is auto-generated."""
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO transactions (type, amount_cents, date, note, category_id) "
        "VALUES (?, ?, ?, ?, ?)",
        (new.type, new.amount_cents, new.date, new.note, new.category_id),
    )
    conn.commit()
    transaction_id = cursor.lastrowid
    return TransactionRead(
            id=transaction_id,
            type=new.type,
            amount_cents=new.amount_cents,
            date=new.date,
            note=new.note,
            category_id=new.category_id
    )


def delete_transaction(transaction_id: int, conn: Connection) -> bool:
    """Delete a transaction by id."""
    cursor = conn.cursor()
    cursor.execute("DELETE FROM transactions WHERE id = ?", (transaction_id,))
    conn.commit()
    return cursor.rowcount > 0


def update_transaction(
    transaction_id: int,
    update: TransactionCreate,
    conn: Connection
) -> TransactionRead | None:
    """Update an existing transaction by id."""
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE transactions SET type = ?, amount_cents = ?, date = ?, note = ?, "
        "category_id = ? WHERE id = ?",
        (update.type, update.amount_cents, update.date, update.note, update.category_id, transaction_id),
    )
    conn.commit()
    if cursor.rowcount == 0:
        return None
    row = cursor.execute("SELECT * FROM transactions WHERE id = ?", (transaction_id,)).fetchone()
    return TransactionRead(
            id=row["id"],
            type=row["type"],
            amount_cents=row["amount_cents"],
            date=row["date"],
            note=row["note"],
            category_id=row["category_id"]
    )

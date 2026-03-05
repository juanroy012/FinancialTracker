from sqlite3 import Connection, IntegrityError
from fastapi import APIRouter, Depends, HTTPException
from ..db import get_connection
from ..models.transaction import (
    get_all_transactions, get_transactions_by_name, create_transaction,
    delete_transaction, update_transaction
)
from ..schemas.transaction import TransactionRead, TransactionCreate
from ..auth import get_current_user

transaction_router = APIRouter(prefix="/transactions", tags=["Transaction"])

@transaction_router.get("/", response_model=list[TransactionRead])
def transaction_list(conn: Connection = Depends(get_connection), current_user=Depends(get_current_user)):
    return get_all_transactions(current_user["id"], conn)

@transaction_router.get("/{transaction_name}", response_model=list[TransactionRead])
def transaction_details(
    transaction_name: str,
    conn: Connection = Depends(get_connection),
    current_user=Depends(get_current_user)
    ) -> list[TransactionRead] | None:
    transaction = get_transactions_by_name(transaction_name, current_user["id"], conn)
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction doesn't exist")
    return transaction

@transaction_router.post("/", response_model=TransactionRead)
def add_transaction(
    new: TransactionCreate,
    conn: Connection = Depends(get_connection),
    current_user=Depends(get_current_user)
):
    try:
        transaction = create_transaction(new, current_user["id"], conn)
    except IntegrityError as exc:
        raise HTTPException(status_code=400, detail="Transaction already exists") from exc
    return transaction

@transaction_router.delete("/{transaction_id}", status_code=204)
def remove_transaction(
    transaction_id: int,
    conn: Connection = Depends(get_connection),
    current_user=Depends(get_current_user)
):
    if delete_transaction(transaction_id, current_user["id"], conn):
        return None
    raise HTTPException(status_code=404, detail="Transaction doesn't exist")

@transaction_router.patch("/{transaction_id}", response_model=TransactionRead)
def edit_transaction(
    transaction_id: int,
    updated_transaction: TransactionCreate,
    conn: Connection = Depends(get_connection),
    current_user=Depends(get_current_user)
    ) -> TransactionRead:
    updated = update_transaction(transaction_id, updated_transaction, current_user["id"], conn)
    if updated is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return updated

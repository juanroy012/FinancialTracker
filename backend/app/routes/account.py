from sqlite3 import Connection, IntegrityError
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from ..db import get_connection
from ..models.account import (
    get_all_accounts, get_accounts_by_name, create_account,
    delete_account, update_account
)
from ..schemas.account import AccountRead, AccountCreate

account_router = APIRouter(prefix="/accounts", tags=["Accounts"])


@account_router.get("/", response_model=List[AccountRead])
def account_list(conn: Connection = Depends(get_connection)):
    return get_all_accounts(conn)

@account_router.get("/{account_name}", response_model=AccountRead)
def account_details(
    account_name: str,
    conn: Connection = Depends(get_connection),
    ) -> list[AccountRead]:
    return get_accounts_by_name(account_name, conn)

@account_router.post("/", response_model=AccountRead)
def account_create(
    new: AccountCreate,
    conn: Connection = Depends(get_connection)
    ) -> AccountRead:
    try:
        account = create_account(new, conn)
    except IntegrityError as exc:
        raise HTTPException(status_code=400, detail="Account already exists") from exc
    return account

@account_router.delete("/{account_id}", status_code=204)
def remove_transaction(account_id: int, conn: Connection = Depends(get_connection)):
    if delete_account(account_id, conn):
        return None
    raise HTTPException(status_code=404, detail="Account doesn't exist")

@account_router.patch("/{account_id}", response_model=AccountRead)
def edit_account(
    account_id: int, 
    updated_account: AccountCreate,
    conn: Connection = Depends(get_connection)
    ) -> AccountRead:
    updated = update_account(account_id, updated_account, conn)
    if updated is None:
        raise HTTPException(status_code=404, detail="Account not found")
    return updated

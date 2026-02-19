from pydantic import BaseModel
from enum import Enum
from typing import Optional

class TransactionType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"

class TransactionCreate(BaseModel):
    type: TransactionType
    amount_cents: int
    date: str
    note: Optional[str] = None
    category_id: Optional[int] = None
    account_id: Optional[int] = None

class TransactionRead(BaseModel):
    id: int
    type: TransactionType
    amount_cents: int
    date: str
    note: Optional[str] = None
    category_id: Optional[int] = None
    account_id: Optional[int] = None
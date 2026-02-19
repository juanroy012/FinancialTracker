from pydantic import BaseModel
from enum import Enum

class AccountType(str, Enum):
    EWALLET = "ewallet"
    BANK = "bank"

class AccountRead(BaseModel):
    id: int
    type: AccountType
    name: str
    balance: int
    icon: str = ''

class AccountCreate(BaseModel):
    type: AccountType
    name: str
    balance: int
    icon: str = ''
from pydantic import BaseModel

class TransactionCreate(BaseModel):
    type: str
    amount_cents: int
    date: str
    note: str
    category_id: int
    
class TransactionRead(BaseModel):
    id: str
    type: str
    amount_cents: int
    date: str
    note: str
    category_id: int
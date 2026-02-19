from typing import Literal
from pydantic import BaseModel

class CategoryCreate(BaseModel):
    name: str
    type: Literal['income', 'expense'] = 'expense'
    icon: str = ''
    color: str = 'amber'

class CategoryRead(BaseModel):
    id: int
    name: str
    type: str
    icon: str = ''
    color: str = 'amber'

# These Pydantic models define the structure for creating, updating, and reading category data with
# attributes like name and id.
from pydantic import BaseModel

class CategoryCreate(BaseModel):
    name: str

class CategoryRead(BaseModel):
    """
    The `CategoryRead` class defines a data model with `id` and `name` attributes 
    for reading category information.
    """
    id: int
    name: str

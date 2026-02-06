from sqlite3 import Connection, IntegrityError
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.templating import Jinja2Templates
from app.models.category import get_all_categories, create_category, delete_category, update_category
from app.schemas.category import CategoryRead, CategoryCreate
from app.db import get_connection


category_router = APIRouter(prefix="/category", tags=["Category"])
templates = Jinja2Templates(directory="templates")

@category_router.get("/", response_model=list[CategoryRead])
def category_list(conn: Connection = Depends(get_connection)):
    return get_all_categories(conn)

@category_router.get("/list")
def show_category_list(request: Request, conn: Connection = Depends(get_connection)):
    categories = get_all_categories(conn)
    return templates.TemplateResponse(
        "categories.html", 
        {"request":request, "categories":categories, "title":"Category List"})

@category_router.get("/add")
def add_category_form(request: Request):
    return templates.TemplateResponse("add_category.html",{"request":request, "title":"Add Form"})

@category_router.post("/", response_model=CategoryRead)
def add_category(
    new_category: CategoryCreate,
    conn: Connection = Depends(get_connection)
    ) -> CategoryRead:
    try:
        category = create_category(new_category, conn)
    except IntegrityError as exc:
        raise HTTPException(status_code=400, detail="Category already exists") from exc
    return category

@category_router.delete("/{category_id}", status_code=204)
def remove_category(
    category_id: int,
    conn: Connection = Depends(get_connection)
    ):
    if delete_category(category_id, conn):
        return None
    raise HTTPException(status_code=204, detail="Category doesn't exist")

@category_router.patch("/{category_id}", response_model=CategoryRead)
def edit_category(
    category_id: int,
    updated_category: CategoryCreate,
    conn: Connection = Depends(get_connection)
    ) -> CategoryRead:
    updated = update_category(category_id, updated_category, conn)
    if updated is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return updated

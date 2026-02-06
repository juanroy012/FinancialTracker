"""Home and dashboard routes."""
from fastapi import APIRouter, Depends
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request
from sqlite3 import Connection

from app.db import get_connection
from app.models.transaction import get_all_transactions
from app.models.category import get_all_categories

router = APIRouter()
# Jinja2Templates tells FastAPI where HTML template files are stored
# 'templates' folder is at project root level
templates = Jinja2Templates(directory="templates")


@router.get("/")
def home(request: Request, conn: Connection = Depends(get_connection)):
    """
    Home page - dashboard showing financial overview.
    
    Why this exists:
    - Gives users quick snapshot of their finances
    - Shows total transactions, categories, income, expenses
    - Entry point to navigate to other pages
    
    Why Depends(get_connection):
    - FastAPI's dependency injection system
    - Automatically creates DB connection for this request
    - Connection is closed when request completes
    - Keeps route code clean - no manual connection management
    
    Why pass these variables to template:
    - Templates need data to display (can't access Python functions)
   - amount_cents is stored as integer (e.g. 1050 = $10.50)
    - Count gives overview of data volume
    """
    # Fetch all transactions and categories from database
    transactions = get_all_transactions(conn)
    categories = get_all_categories(conn)
    
    # Calculate financial totals
    # Why filter by type: income adds money, expenses subtract
    # Why sum amount_cents: aggregate all transaction amounts
    total_income = sum(t.amount_cents for t in transactions if t.type == "income")
    total_expenses = sum(t.amount_cents for t in transactions if t.type == "expense")
    
    # templates.TemplateResponse renders HTML file with data
    # First argument: template filename
    # Second argument: dict of variables to pass to template
    return templates.TemplateResponse(
        "home.html",
        {
            "request": request,  # Always required by Jinja2Templates
            "title": "Home",
            "transaction_count": len(transactions),
            "category_count": len(categories),
            "total_income": total_income,  # In cents
            "total_expenses": total_expenses,  # In cents
        }
    )

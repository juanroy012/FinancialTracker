"""
Entry point when you run: python -m app
See LEARNING.md for why __main__.py exists.
"""
import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.routes import router, category_router, transaction_router
from app.db import init_db

# FastAPI is the web framework - like Flask but with automatic API docs
# Why FastAPI: Built-in data validation, async support, OpenAPI docs
app = FastAPI(
    title="Financial Tracker",
    description="Track income and expenses with categories",
    version="1.0.0"
)

# Initialize database tables on startup
# Why: Ensures tables exist before any routes try to access them
# Creates: categories and transactions tables if they don't exist
init_db()

# Include routers - organizes routes by feature
# Why separate routers: Keeps code organized, easier to maintain
# router: Home page (/)
# category_router: JSON API for categories (/category)
# transaction_router: JSON API for transactions (/transaction)
app.mount("/static", StaticFiles(directory="static"), name="static")
app.include_router(router)
app.include_router(category_router)
app.include_router(transaction_router)

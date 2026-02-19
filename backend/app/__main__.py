"""
Entry point when you run: python -m app
See LEARNING.md for why __main__.py exists.
"""
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from .routes import category_router, transaction_router, account_router
from .db import init_db

# FastAPI is the web framework - like Flask but with automatic API docs
app = FastAPI(
    title="Financial Tracker",
    description="Track income and expenses with categories",
    version="1.0.0"
)

# CORS must be registered before routers so it wraps the full app.
# No trailing slash in origins — it causes subtle mismatches.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Starlette's CORSMiddleware does NOT attach CORS headers to unhandled 500
# responses, so the browser reports a "CORS error" instead of the real crash.
# This handler ensures a proper JSON 500 is returned so the middleware can
# attach its headers and the browser shows the actual error.
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {exc}"},
    )

# Initialize database tables on startup
init_db()

app.include_router(category_router)
app.include_router(transaction_router)
app.include_router(account_router)
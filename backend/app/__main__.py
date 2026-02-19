from pathlib import Path

from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from .routes import category_router, transaction_router, account_router
from .db import init_db

app = FastAPI(
    title="Financial Tracker",
    description="Track income and expenses with categories",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://financialtracker.fly.dev",
        "https://finance.juan-roy.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure unhandled 500s return JSON so CORS headers are attached correctly.
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

# Serve the built React frontend when available (Docker / PyInstaller).
import os as _os
_static_dir = _os.environ.get("FT_STATIC_DIR")
if not _static_dir:
    _static_dir = str(Path(__file__).resolve().parents[2] / "frontend" / "dist")

_static_path = Path(_static_dir)
if _static_path.is_dir():
    # Serve hashed JS/CSS/image assets from /assets
    app.mount("/assets", StaticFiles(directory=str(_static_path / "assets")), name="assets")

    # Catch-all: serve index.html for every other path so React Router works
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str) -> FileResponse:
        # Return a specific file if it exists (e.g. favicon.png at root)
        candidate = _static_path / full_path
        if candidate.is_file():
            return FileResponse(str(candidate))
        return FileResponse(str(_static_path / "index.html"))
from pathlib import Path
import os

from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from .auth import get_current_user
from .db import init_db
from .routes import category_router, transaction_router, account_router, auth_router

app = FastAPI(
    title="Financial Tracker",
    description="Track income and expenses with categories",
    version="1.1.0"
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

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(status_code=500, content={"detail": f"Internal server error: {exc}"})

init_db()

app.include_router(auth_router)
app.include_router(category_router, dependencies=[Depends(get_current_user)])
app.include_router(transaction_router, dependencies=[Depends(get_current_user)])
app.include_router(account_router, dependencies=[Depends(get_current_user)])

_static_dir = os.environ.get("FT_STATIC_DIR") or str(Path(__file__).resolve().parents[2] / "frontend" / "dist")
_static_path = Path(_static_dir)

if _static_path.is_dir():
    app.mount("/assets", StaticFiles(directory=str(_static_path / "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str) -> FileResponse:
        candidate = _static_path / full_path
        if candidate.is_file():
            return FileResponse(str(candidate))
        return FileResponse(str(_static_path / "index.html"))
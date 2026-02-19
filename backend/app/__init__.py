"""Expose the ASGI app at the package level for Uvicorn."""

# Relative import keeps this package importable whether you run from repo root
# (uvicorn backend.app:app) or from backend/ (uvicorn app:app).
from .__main__ import app
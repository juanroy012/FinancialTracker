# ─── Stage 1: build React frontend ─────────────────────────────────────────
FROM node:20-slim AS frontend-builder
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ .
RUN npm run build

# ─── Stage 2: Python backend + built frontend ───────────────────────────────
# Build:  docker build -t financial-tracker .
# Run:    docker run -p 8000:8000 financial-tracker
# Open:   http://localhost:8000
FROM python:3.12-slim

RUN useradd --create-home appuser
WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY --chown=appuser:appuser backend/ ./backend/

# Copy built React app so FastAPI can serve it
COPY --from=frontend-builder --chown=appuser:appuser /frontend/dist ./frontend/dist

# Writable data directory – on Fly.io this is backed by a persistent volume
# mounted at /data (see fly.toml).  Locally it falls back to /app/instance.
RUN mkdir -p /data /app/instance && chown -R appuser:appuser /data /app

ENV FT_DATA_DIR=/data

EXPOSE 8080
USER appuser

# Run uvicorn from the repo root so relative paths resolve correctly
CMD ["uvicorn", "backend.app.__main__:app", "--host", "0.0.0.0", "--port", "8080"]

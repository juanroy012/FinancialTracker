# FinancialTracker

![Tests](https://github.com/juan-roy/FinancialTracker/actions/workflows/test.yml/badge.svg)

A self-hosted personal finance tracker for managing accounts, transactions, and categories — with per-user data isolation and JWT authentication.

Built with **FastAPI** (Python backend) + **React + Vite** (frontend) + **SQLite**.

Live demo: **https://finance.juan-roy.com**

---

## Features

| Section | Description |
|---|---|
| **Authentication** | Register / login with username & password. JWT-based sessions, per-user data isolation |
| **Dashboard** | Monthly income vs expense donut chart, category breakdowns, balance summary |
| **Transactions** | Add / edit / delete transactions, filter by type, search, pagination |
| **Categories** | Manage income & expense categories with custom icons and colours |
| **Accounts** | Track bank accounts and e-wallets with running balances |
| **Theming** | Dark and light mode, persisted across sessions |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12+, FastAPI ≥ 0.111, Uvicorn, Pydantic v2, SQLite (WAL mode) |
| Auth | JWT (`python-jose`), bcrypt password hashing |
| Frontend | React 19, Vite 7, Tailwind CSS v4, Recharts 3 |
| Database | SQLite (`instance/app.db`) — zero setup needed |
| Deployment | Fly.io (region: `yyz`), Docker multi-stage build |

---

## Project Structure

```
FinancialTracker/
├── backend/
│   ├── app/
│   │   ├── __main__.py        # FastAPI app, CORS, startup, static file serving
│   │   ├── auth.py            # JWT creation/verification, bcrypt helpers, get_current_user
│   │   ├── config.py          # App configuration
│   │   ├── db.py              # SQLite connection (WAL mode), schema + migrations
│   │   ├── models/            # DB query helpers (account, category, transaction, user)
│   │   ├── routes/            # API route handlers (account, category, transaction, auth)
│   │   └── schemas/           # Pydantic request/response models
│   ├── tests/                 # pytest test suite (accounts, categories, transactions)
│   ├── requirements.txt       # Runtime dependencies (production)
│   └── requirements-dev.txt   # Dev/test dependencies (pytest, httpx, Faker)
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Layout, navigation, auth gate, dark/light toggle
│   │   ├── components/        # DashboardView, TransactionsView, CategoriesView, AccountsView, LoginView
│   │   └── api/               # Fetch wrappers (auth, accounts, categories, transactions, fetchWithAuth)
│   ├── index.html
│   └── package.json
├── instance/                  # SQLite database file (auto-created, gitignored)
├── Dockerfile                 # Multi-stage production build
└── fly.toml                   # Fly.io deployment config
```

---

## Local Development

### Prerequisites

- Python 3.12+
- Node.js 20+

### Backend

```bash
# From the project root
cd backend
python -m venv ../venv
source ../venv/bin/activate        # macOS / Linux
# ..\venv\Scripts\activate         # Windows

pip install -r requirements.txt

# Run the dev server (auto-reload) from the project root
cd ..
uvicorn backend.app.__main__:app --reload --port 8000
```

API docs: **http://localhost:8000/docs**

### Frontend

```bash
cd frontend
npm install
npm run dev       # dev server on http://localhost:5173
npm run build     # production build → frontend/dist/
```

The frontend dev server proxies API requests to `http://localhost:8000`.
After running `npm run build`, FastAPI automatically serves the `frontend/dist/` folder — no extra configuration needed.

---

## Authentication

All API routes (except `/auth/token` and `/auth/register`) require a valid JWT.

| Endpoint | Method | Description |
|---|---|---|
| `/auth/register` | POST | Create a new account `{ username, password }` |
| `/auth/token` | POST | Login — returns `{ access_token, token_type }` |
| `/auth/logout` | POST | Logout (invalidates session on the client) |

The frontend stores the token in `localStorage` under the key `ft-token` and attaches it automatically to every API request via `fetchWithAuth.js`.

---

## Running Tests

```bash
cd backend
source ../venv/bin/activate
pip install -r requirements-dev.txt   # installs pytest, httpx, Faker
pytest tests/ -v
```

Tests use an **in-memory SQLite database** — no external services or `.env` file needed.

### CI (GitHub Actions)

Tests run automatically on every push and pull request to `main` via `.github/workflows/test.yml`.
The workflow runs on `ubuntu-latest` with Python 3.12 and caches pip dependencies for speed.

---

## Docker

Build and run the full app (backend + pre-built frontend) as a single container:

```bash
docker build -t financial-tracker .
docker run -p 8000:8000 financial-tracker
```

Open **http://localhost:8000**

The multi-stage Dockerfile:
1. Builds the React app with Node 20
2. Bundles it into a Python 3.12-slim image
3. FastAPI serves both the API and the static frontend on port 8080

---

## Deployment (Fly.io)

```bash
fly deploy
```

The app is configured in `fly.toml`:
- Region: `yyz` (Toronto)
- Internal port: `8080`
- Persistent volume mounted at `/data` for the SQLite database
- Auto-stop when idle to conserve free allowance

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | `dev-secret-change-in-production` | JWT signing secret — **change this in production** |
| `FT_DATA_DIR` | `<project-root>/instance` | Directory where `app.db` is stored |
| `FT_STATIC_DIR` | `<project-root>/frontend/dist` | Directory of the pre-built React app |

No `.env` file is required for local development. All defaults work out of the box.

> ⚠️ Always set a strong `SECRET_KEY` in production. Anyone with this key can forge valid login tokens.

---

## Database

SQLite runs in **WAL mode** for better concurrent read performance.
The database is created automatically at `instance/app.db` on first run.
Schema migrations are applied automatically at startup using safe `ALTER TABLE` guards — no manual migration steps needed.

Each user's data (accounts, categories, transactions) is fully isolated — a logged-in user can only see and modify their own records.

To reset the database: delete `instance/app.db` and restart the backend.

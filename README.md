# FinancialTracker

A personal finance tracker for managing accounts, transactions, and categories.
Built with **FastAPI** (Python backend) + **React + Vite** (frontend) + **SQLite**.
Supports IDR (Indonesian Rupiah), dark / light mode, income & expense pie charts, and pagination.

---

## Quick Start (no coding required)

### Windows
Double-click **`start.bat`** — it will:
1. Create a Python virtual environment
2. Install backend & frontend dependencies
3. Start both servers
4. Open the app in your browser automatically

### macOS / Linux
```bash
chmod +x start.sh
./start.sh
```

> **First run** takes ~1 minute while dependencies are downloaded.
> Subsequent runs start in seconds.

Once running, open **http://localhost:5173** in your browser.

---

## What's Inside

| Section | Description |
|---|---|
| **Dashboard** | Monthly income vs expense donut chart, category breakdowns, balance summary |
| **Transactions** | Add / edit / delete transactions, filter by type, search, pagination |
| **Categories** | Manage income & expense categories with custom icons and colours |
| **Accounts** | Track bank accounts and e-wallets with running balances |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12, FastAPI, Uvicorn, Pydantic v2, SQLite |
| Frontend | React 19, Vite 7, Tailwind CSS v4, Recharts |
| Database | SQLite (`instance/app.db`) — zero setup needed |

---

## Manual Setup (developers)

### Backend
```bash
cd backend
python -m venv ../venv
# Windows
..\venv\Scripts\activate
# macOS / Linux
source ../venv/bin/activate

pip install -r requirements.txt

# Run dev server (auto-reload)
cd ..
uvicorn backend.app.__main__:app --reload --port 8000
```

API docs available at **http://localhost:8000/docs**

### Frontend
```bash
cd frontend
npm install
npm run dev     # dev server on http://localhost:5173
npm run build   # production build -> frontend/dist/
```

### Seed sample data
```bash
cd backend
../venv/Scripts/python seeds.py   # Windows
../venv/bin/python seeds.py       # macOS / Linux
```

---

## Docker

Build and run the entire app (backend + pre-built frontend) as a single container:

```bash
docker build -t financial-tracker .
docker run -p 8000:8000 financial-tracker
```

Open **http://localhost:8000**

The multi-stage Dockerfile:
1. Builds the React app with Node 20
2. Bundles it into a Python 3.12-slim image
3. FastAPI serves both the API and the static frontend on port 8000

---

## Project Structure

```
FinancialTracker/
├── backend/
│   ├── app/
│   │   ├── __main__.py      # FastAPI app, CORS, startup
│   │   ├── db.py            # SQLite connection, migrations
│   │   ├── models/          # CRUD helpers
│   │   ├── routes/          # API route handlers
│   │   └── schemas/         # Pydantic request/response models
│   ├── seeds.py             # Sample data loader
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Layout, routing, dark/light toggle
│   │   ├── components/      # DashboardView, TransactionsView, etc.
│   │   └── api/             # Fetch wrappers for each resource
│   └── package.json
├── instance/                # SQLite database (auto-created, gitignored)
├── Dockerfile               # Multi-stage production build
├── start.bat                # One-click launcher (Windows)
└── start.sh                 # One-click launcher (macOS / Linux)
```

---

## Database

SQLite file is created automatically at `instance/app.db` on first run.
No installation or configuration required.

To reset the database, delete `instance/app.db` and restart the backend.

---

## Environment

No `.env` file is required for local development. All defaults work out of the box.


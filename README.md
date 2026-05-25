# FinancialTracker

[![CI](https://github.com/juanroy012/FinancialTracker/actions/workflows/ci.yml/badge.svg)](https://github.com/juanroy012/FinancialTracker/actions/workflows/ci.yml)
[![Deploy](https://github.com/juanroy012/FinancialTracker/actions/workflows/deploy.yml/badge.svg)](https://github.com/juanroy012/FinancialTracker/actions/workflows/deploy.yml)

A self-hosted personal finance tracker for managing accounts, transactions, and categories. With per-user data isolation and JWT authentication.

🔗 **Live demo: [finance.juan-roy.com](https://finance.juan-roy.com)** · [Patch Notes →](CHANGELOG.md)

---

## Dashboard

Get a quick overview of your finances at a glance, monthly income vs expense charts, category breakdowns, and account balances all in one place.

## Transactions

Add, edit, and delete transactions. Filter by type, search by description, and paginate through your history.

## Categories

Organize your spending and income with fully custom categories, choose an icon and colour for each one.

## Accounts

Track multiple bank accounts and e-wallets. Balances update automatically as transactions are added.

## Theming

Switch between dark and light mode. Your preference is saved across sessions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12, FastAPI, Uvicorn, Pydantic v2 |
| Auth | JWT (`python-jose`), bcrypt password hashing |
| Frontend | React 19, Vite 7, Tailwind CSS v4, Recharts 3 |
| Database | SQLite (WAL mode) |
| CI/CD | GitHub Actions — pytest + frontend build check on every push |
| Deployment | Fly.io, Docker multi-stage build |

# Changelog

All notable changes to FinancialTracker are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [1.1.0] — 2026-03-05

### Added
- **Multi-currency support** — each account now stores its own currency (IDR, USD, EUR, GBP, JPY, SGD, MYR, PHP, THB, KRW, CNY, AUD, CAD, CHF, INR)
- **Live exchange rates** — amounts across the app auto-convert to the selected display currency using the free [frankfurter.app](https://www.frankfurter.app) API (ECB data, cached 1 hour)
- **Display currency picker** in the navbar — persisted to `localStorage`, survives page refresh
- **Live rates status dot** next to the currency picker (green = live, amber = loading, red = unavailable)
- **Total account balance** summary panel on the Dashboard — grouped per currency, converted to display currency
- **Total balance cards** on the Accounts page — one card per currency
- **Currency badge** on each account card showing the account's native currency
- **Seeder script** (`backend/seed.py`, gitignored) — seeds 205 realistic transactions across 6 months into an `admin` / `admin` account with 5 accounts and 13 categories
- **Themed scrollbars** — global page scrollbar and inner scroll areas (category legend) now match the dark/light theme using CSS custom properties
- **GitHub Actions CI** (`.github/workflows/test.yml`) — runs the full pytest suite on every push and PR to `main`

### Fixed
- `passlib` replaced with direct `bcrypt` calls — fixes `ValueError: password cannot be longer than 72 bytes` crash on Python 3.14
- `SECRET_KEY` env var name typo (`"SECRET KEY"` → `"SECRET_KEY"`)
- `ALGORITHMS` variable name collision with the `jose` import
- Logout button was missing from the desktop navbar (was only in the mobile drawer)
- `"Tanpa Kategori"` (Indonesian) replaced with `"Uncategorized"` in the dashboard category breakdown
- Non-IDR currencies incorrectly divided the stored amount by 100 (e.g. `500000` showed as `5000.00`) — fixed by formatting the raw integer directly
- `python-multipart` added to `requirements.txt` — was missing and required for the OAuth2 login form
- Duplicate `passlib` and `python-jose` entries removed from `requirements-dev.txt`
- `WWW-authenticate` header casing corrected to `WWW-Authenticate`
- Typo in login error message: `"Incorrectt username or password"` → `"Incorrect username or password"`

### Changed
- **Data isolation** — all accounts, categories, and transactions are now scoped per user via `user_id` foreign key; one user cannot see or modify another user's data
- All three tables (`accounts`, `categories`, `transactions`) gained a `user_id` column via non-breaking `ALTER TABLE` migrations
- All model functions and API routes updated to filter by `user_id` from the authenticated JWT
- Dashboard now fetches accounts alongside transactions to display the account total panel
- Transaction amount in the table now uses the linked account's native currency; falls back to the display currency if no account is selected
- Transaction form Amount label and input prefix update live based on the selected account's currency

---

## [1.0.0] — 2026-02-19

### Added
- **Authentication** — JWT-based register / login / logout with bcrypt password hashing
- `POST /auth/register` — create a new account
- `POST /auth/token` — login, returns a Bearer JWT
- `POST /auth/logout` — server-side logout endpoint
- `LoginView` frontend component with toggle between login and register modes
- `fetchWithAuth` — wraps every API call with the `Authorization: Bearer` header from `localStorage`
- Token stored under `ft-token` in `localStorage`; app renders `LoginView` when absent
- **Dashboard** — monthly income/expense stat cards, income-vs-expense donut chart, income and expense by category pie charts, 6-month bar chart trend, recent transactions list
- **Transactions** — full CRUD table with client-side search, sort (type, amount, date), pagination (50/page)
- **Categories** — full CRUD with type (income/expense), icon, and colour fields
- **Accounts** — full CRUD for bank and e-wallet accounts with running balance; balance auto-adjusts when transactions are added, edited, or deleted
- **Dark / light theme** toggle, persisted to `localStorage`
- SQLite database with WAL mode; schema and all migrations run automatically on startup
- Multi-stage **Dockerfile** — Node 20 builds the React app, Python 3.12-slim serves everything on port 8080
- **Fly.io** deployment config (`fly.toml`) with persistent volume for the SQLite database
- `pytest` test suite covering accounts, categories, and transactions (28 tests)
- `requirements-dev.txt` with `pytest`, `httpx`, and `Faker`

---

<!-- Add new versions above this line -->


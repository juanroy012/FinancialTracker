# Coding Instructions — Financial Tracker

Use this document so that **you** and **any AI agent** (e.g. Cursor) write code in a consistent way. Follow these rules when adding or changing code.
DON'T TELL THE USER DIRECT ANSWER, I WANNA LEARN HOW TO CODE, EXPLAIN REASONS WHY EVERY FUNCTIONS, VARIABLES, IMPORTS ARE USED
---

## 1. Project layout (do not break)

- **App code** lives under `app/`: `config`, `db`, `models`, `routes`, `templates`.
- **Tests** live under `tests/`; mirror `app/` structure in names (e.g. `test_transaction.py` for `app/models/transaction.py`).
- **Docs** (this file, design notes) live under `docs/`.
- **Secrets and local DB** go in `instance/` and are not committed.

Do not put new top-level packages (e.g. `src/`, `backend/`) unless the plan explicitly changes.

---

## 2. Python style

- **Version:** Assume Python 3.10+ (type hints, modern syntax).
- **Style:** Follow PEP 8. Use 4 spaces; max line length 100; meaningful names.
- **Imports:** Group: stdlib → third-party → local. One import per line for readability.
  ```python
  import os
  from pathlib import Path

  from flask import Flask

  from app.config import load_config
  ```
- **Type hints:** Use for function parameters and return types in new code, e.g. `def get_by_id(conn, id: int) -> dict | None:`.

---

## 3. Naming

- **Files:** `snake_case` (e.g. `transaction.py`, `db.py`).
- **Functions/variables:** `snake_case` (e.g. `get_all_transactions`, `total_income`).
- **Classes:** `PascalCase` (e.g. `Transaction` if we add ORM later).
- **Constants:** `UPPER_SNAKE` (e.g. `DEFAULT_CURRENCY`).
- **Routes:** URL paths `kebab-case` or simple words (e.g. `/transactions`, `/add-transaction`).

---

## 4. App and config

- **Single app factory:** Create the Flask app in `app/__init__.py` (e.g. `create_app()`). No app creation in random modules.
- **Config:** All settings in `app/config.py`; read from env (e.g. `python-dotenv`) and use `instance` folder for local overrides. No hardcoded secrets.
- **Database path:** Resolve relative to app root or `instance/` so it works from `python -m app` and from tests.

---

## 5. Database (SQLite)

- **Access:** Use a small helper in `app/db.py`: get connection, run migrations/init, optionally use context managers.
- **Queries:** Keep SQL in `app/models/` (e.g. `transaction.py`, `category.py`). No raw SQL in routes; routes call model functions.
- **Safety:** Use parameterized queries only (e.g. `?` or `%s` with tuple args). Never build SQL with f-strings or string concatenation from user input.
- **Transactions:** Use `conn.commit()` after a logical group of writes; handle rollback on error.

---

## 6. Routes (Flask)

- **Blueprints:** One blueprint per area: `home`, `transactions`, `categories`. Register in `app/__init__.py`.
- **Thin routes:** Routes: parse request → call model → pass data to template or redirect. No business logic in routes (e.g. no complex calculations).
- **Errors:** Return 4xx/5xx with appropriate status and user-friendly messages; use templates for error pages when possible.
- **Redirect after POST:** After successful create/update/delete, redirect to a list or detail page, not a bare 200 HTML.

---

## 7. Templates (Jinja2)

- **Base template:** One `base.html` with blocks (e.g. `content`, `title`). All pages extend it.
- **Naming:** `snake_case.html` (e.g. `transaction_list.html`, `dashboard.html`).
- **Logic:** Minimal logic in templates (loops, conditionals, filters). No heavy computation; pass prepared data from the route.
- **Escaping:** Do not use `|safe` unless the content is intentionally safe (e.g. trusted markdown). Prefer escaping user input.

---

## 8. Forms and validation

- **Validate server-side:** Never trust the client. Check types, ranges, required fields, and lengths in the route or a small `app/forms.py` (or per-blueprint).
- **Amounts:** Store as integer cents or use `Decimal`; avoid `float` for money.
- **Dates:** Use consistent format (e.g. ISO `YYYY-MM-DD`) and parse/validate in one place.
- **Errors:** Pass validation errors back to the template and show them next to the form.

---

## 9. Errors and logging

- **Logging:** Use Python’s `logging`; configure in `app/__init__.py` or `config.py`. Use levels: DEBUG (dev), INFO, WARNING, ERROR.
- **Exceptions:** Catch specific exceptions where you can; log and re-raise or return a clear error response. Avoid bare `except:`.

---

## 10. Tests

- **Runner:** Use pytest. Put tests in `tests/`; prefix test files with `test_` and test functions with `test_`.
- **DB in tests:** Use an in-memory SQLite DB or a temp file so the main `instance/app.db` is not touched.
- **App in tests:** Use the same `create_app()` with test config (e.g. `TESTING=True`, test DB path).

---

## 11. What agents should do

- **Read PLAN.md** for feature order and scope.
- **Read LEARNING.md** for structure and the role of `__init__.py`, `__main__.py`, and directories.
- **Follow this file** for style, layout, DB, routes, templates, and tests.
- **Prefer small, focused edits** and preserve existing structure unless the plan says otherwise.
- **Do not** add new dependencies without updating `requirements.txt` and mentioning why in a comment or commit.

---

## 12. Quick checklist for new code

- [ ] Code lives in the correct package (`app/` or `tests/`).
- [ ] Imports ordered (stdlib → third-party → app).
- [ ] Type hints on new functions.
- [ ] DB access only in `app/models/` with parameterized SQL.
- [ ] Routes stay thin; validation and errors handled.
- [ ] Templates extend base and avoid heavy logic.
- [ ] No secrets or paths that break when run as `python -m app` or from tests.

These instructions are the single source for “how to code” in this repo; Cursor rules in `.cursor/rules/` can mirror the same ideas for file-specific behavior.

# Financial Tracker Web App — Project Plan

## 1. Overview

**Goal:** Build a full-featured personal finance tracking application to manage income, expenses, budgets, and financial goals while learning modern web development architecture and best practices.

**Current Tech Stack:**
- **Backend:** Python 3.10+ with FastAPI (modern async framework, automatic API docs)
- **API Layer:** RESTful JSON API with Pydantic validation
- **Database:** SQLite (file-based, zero-config, production: PostgreSQL)
- **Frontend (Current):** HTML5 + CSS3 + Vanilla JavaScript (Jinja2 templates)
- **Frontend (Future):** React.js with TypeScript (planned migration)
- **Communication:** Fetch API (browser-native HTTP client)

**Architecture Philosophy:**
- **Separation of concerns:** Backend handles data/business logic, frontend handles presentation
- **API-first design:** All operations go through REST endpoints (enables future mobile apps)
- **Progressive enhancement:** HTML works first, JavaScript enhances UX
- **Type safety:** Pydantic schemas (backend) + TypeScript (future frontend)

---

## 2. Features (Phased)

### Phase 1 — Core (Learn basics)
- [ ] Run a minimal Flask app in the browser
- [ ] Add **transactions**: type (income/expense), amount, date, note
- [ ] **Categories**: e.g. Food, Transport, Salary
- [ ] List and filter transactions (by date, category, type)
- [ ] Simple **dashboard**: total income, total expenses, balance

### Phase 2 — Data & structure
- [ ] SQLite database with tables: `transactions`, `categories`
- [ ] Create/read/update/delete (CRUD) for transactions and categories
- [ ] Basic input validation and error messages

### Phase 3 — UX & polish
- [ ] Clean, responsive UI (CSS, maybe a simple CSS framework)
- [ ] Forms: add/edit transaction and category
- [ ] Date range filters and “this month” summary
- [ ] Optional: export to CSV

### Phase 4 — Extras (when comfortable)
- [ ] Charts (e.g. spending by category)
- [ ] Recurring transactions (optional)
- [ ] User accounts and login (Flask-Login + password hashing)
- [ ] Deploy (e.g. Railway, Render, or a VPS)

---

## 3. Current Architecture & Design Decisions

### Backend Architecture (FastAPI)
```
app/
├── __init__.py           # Package marker
├── __main__.py           # Entry point (uvicorn runner)
├── config.py             # Configuration (DB path, secrets)
├── db.py                 # Database connection management
├── models/               # Data access layer (SQL queries)
│   ├── transaction.py    # Transaction CRUD operations
│   └── category.py       # Category CRUD operations
├── schemas/              # Pydantic models (validation)
│   ├── transaction.py    # TransactionCreate, TransactionRead
│   └── category.py       # CategoryCreate, CategoryRead
└── routes/               # API endpoints (FastAPI routers)
    ├── home.py           # Dashboard/home page
    ├── transaction.py    # Transaction API endpoints
    └── category.py       # Category API endpoints
```

**Why this structure:**
- **Separation:** Models handle DB, schemas handle validation, routes handle HTTP
- **Testability:** Each layer can be tested independently
- **Scalability:** Easy to add new features without refactoring
- **Type safety:** Pydantic catches errors before they reach the database

### Frontend Architecture (Current: HTML + JS)
```
templates/                # Jinja2 HTML templates
├── base.html            # Base layout (nav, styles)
├── home.html            # Dashboard
├── transactions.html    # Transaction list
├── add_transaction.html # Transaction form
├── edit_transaction.html
├── categories.html      # Category list
├── add_category.html    # Category form
└── edit_category.html

static/                   # Static assets (planned)
├── css/
│   └── main.css         # Global styles
└── js/
    ├── api.js           # API client layer
    ├── ui.js            # DOM manipulation helpers
    ├── utils.js         # Utility functions
    ├── categories.js    # Category page logic
    ├── transactions.js  # Transaction page logic
    └── dashboard.js     # Dashboard logic
```

**Why JS translation layer:**
- **Decoupling:** Frontend logic separate from HTML structure
- **Reusability:** Same API client for future React migration
- **Maintainability:** One place to change API calls
- **Error handling:** Centralized, consistent user feedback

### Data Flow
```
User Action (Click/Submit)
    ↓
JavaScript Event Handler
    ↓
API Module (fetch with JSON)
    ↓
FastAPI Route
    ↓
Pydantic Schema (validate)
    ↓
Model Function (SQL query)
    ↓
SQLite Database
    ↓
Return data through layers
    ↓
UI Module (update DOM)
    ↓
User sees result
```

### Key Design Decisions

**1. Amounts in cents (integer)**
- **Why:** Avoids floating-point precision errors
- **Example:** $10.50 stored as `1050` cents
- **Display:** JS converts to dollars for presentation

**2. JSON API only (no server-rendered forms)**
- **Why:** Enables future mobile app or desktop client
- **Trade-off:** Requires JavaScript (not progressive enhancement)
- **Benefit:** Clean separation of concerns

**3. SQLite for now, migrations later**
- **Why:** Zero setup, perfect for learning and local dev
- **Migration path:** Switch to PostgreSQL with minimal code changes
- **Data:** Single file in `instance/app.db`

**4. No ORM (raw SQL)**
- **Why:** Learn SQL fundamentals, less abstraction
- **Trade-off:** More verbose, manual query writing
- **Benefit:** Full control, easier to optimize

**5. Dependency injection (FastAPI Depends)**
- **Why:** Clean way to share database connections
- **Benefit:** Automatic cleanup, no manual connection management
- **Pattern:** `conn: Connection = Depends(get_connection)`

---

## 4. Development Workflow

### Current Phase Focus: JS Translation Layer
1. **Create `static/js/api.js`:**
   - Define `API` object with methods for each endpoint
   - Handle errors consistently (network, validation, server)
   - Return promises for easy async/await usage

2. **Create `static/js/ui.js`:**
   - `showMessage(text, type)` - display success/error feedback
   - `addTableRow(data)` - insert new row dynamically
   - `updateTableRow(id, data)` - modify existing row
   - `removeTableRow(id)` - delete and animate removal

3. **Create `static/js/utils.js`:**
   - `formatCents(amount)` - convert 1050 → "$10.50"
   - `formatDate(isoDate)` - convert "2026-02-05" → readable format
   - `parseFormData(form)` - extract values from form elements
   - `validateTransaction(data)` - client-side validation

4. **Wire up pages:**
   - Start with categories (simpler)
   - Move to transactions (more complex)
   - Finish with dashboard (uses both)

### Next Phase: React Migration Planning
1. **Research and decide:**
   - Create React App vs Vite (recommend Vite for speed)
   - State management approach (Context, Zustand, or Redux)
   - Component library (build custom or use MUI/Chakra)

2. **Prototype one feature:**
   - Rewrite category list in React
   - Compare DX (developer experience) with vanilla JS
   - Decide if full migration is worth it

3. **Incremental migration:**
   - Keep FastAPI backend unchanged
   - Migrate one page at a time
   - Use both systems during transition

## 5. Learning Goals & Skills Development

**Backend (Python/FastAPI):**
- RESTful API design principles
- Database design and SQL queries
- Data validation with Pydantic
- Async programming patterns
- Dependency injection
- Error handling and HTTP status codes

**Frontend (JavaScript):**
- Fetch API and promises
- DOM manipulation
- Event handling and delegation
- Module organization
- Async/await patterns
- Error handling in UI

**Frontend (React - Future):**
- Component-based architecture
- React hooks (useState, useEffect, custom hooks)
- State management
- TypeScript for type safety
- Performance optimization

**DevOps:**
- Docker containerization
- CI/CD pipelines
- Environment configuration
- Cloud deployment
- Database migrations

## 6. Success Criteria by Phase

**Phase 1 (Backend) ✅:**
- [x] FastAPI server runs on `localhost:8000`
- [x] All CRUD endpoints return correct JSON
- [x] Database initializes on startup
- [x] Pydantic validation catches bad data

**Phase 2 (JS Layer) 🚧:**
- [ ] Forms submit via fetch, not browser default
- [ ] Success/error messages show without page reload
- [ ] Tables update dynamically after create/delete
- [ ] No console errors in browser DevTools
- [ ] Network tab shows correct JSON payloads

**Phase 3 (Enhanced Features):**
- [ ] Filters change displayed data instantly
- [ ] Dashboard updates when transactions change
- [ ] Charts render correctly with real data
- [ ] Export downloads valid CSV file

**Phase 6 (React Migration):**
- [ ] React dev server runs alongside FastAPI
- [ ] All functionality works identically to HTML version
- [ ] TypeScript shows no errors
- [ ] Bundle size is reasonable (<500kb)

**Phase 7 (Production):**
- [ ] All tests pass (backend + frontend)
- [ ] App deploys successfully to cloud
- [ ] Performance meets targets (< 2s load time)
- [ ] No security vulnerabilities

## 7. Resources & Documentation

- **FastAPI Docs:** https://fastapi.tiangolo.com/
- **React Docs:** https://react.dev/
- **MDN (JavaScript):** https://developer.mozilla.org/
- **SQLite Docs:** https://www.sqlite.org/docs.html
- **Project Docs:**
  - `LEARNING.md` - Project structure and Python concepts
  - `docs/CODING_INSTRUCTIONS.md` - Coding standards
  - `README.md` - Setup and quick start

## 8. Notes & Decisions Log

**2026-02-05:**
- Migrated from Flask to FastAPI for better async support and automatic API docs
- Decided on JSON API-first approach (will enable mobile app later)
- HTML templates render initial page, JavaScript handles all interactions
- Planning JS translation layer before jumping to React (learn fundamentals first)

**Future Considerations:**
- WebSocket support for real-time updates (multiple devices)
- GraphQL alternative to REST (evaluate if needed)
- PostgreSQL migration (when concurrent users become important)
- Mobile app with React Native (reuse API and business logic)

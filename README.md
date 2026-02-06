# Financial Tracker

A full-featured personal finance tracking application built with modern web technologies. Track income, expenses, budgets, and financial goals while learning backend API design, frontend architecture, and full-stack development patterns.

##  Project Vision

This project evolves through multiple phases:
1. **FastAPI Backend** ( Complete) - RESTful JSON API with SQLite
2. **JS Translation Layer** ( In Progress) - Clean separation between API and UI  
3. **React Frontend** ( Planned) - Modern component-based UI with TypeScript
4. **Advanced Features** ( Planned) - Budgeting, recurring transactions, multi-user support

##  Quick Start

### Local Development (Recommended)

1. **Clone and navigate to project**
   ```powershell
   cd FinancialTracker
   ```

2. **Create and activate virtual environment**
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
   
   > **Windows PowerShell issues?** If you get "running scripts is disabled":
   > ```powershell
   > Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   > ```

3. **Install dependencies**
   ```powershell
   pip install -r requirements.txt
   ```

4. **Run the application**
   ```powershell
   # Using uvicorn directly (recommended for development)
   uvicorn app.__main__:app --reload
   
   # Or using Python module syntax
   python -m app
   ```
   
5. **Open in browser**
   - **App:** http://127.0.0.1:8000
   - **API Docs:** http://127.0.0.1:8000/docs (automatic Swagger UI)
   - **Alternative Docs:** http://127.0.0.1:8000/redoc

### Docker Deployment

The project includes a production-ready Dockerfile:

```powershell
# Build image
docker build -t financial-tracker .

# Run with ephemeral storage (data lost on container removal)
docker run -p 8000:8000 financial-tracker

# Run with persistent storage (recommended)
docker run -p 8000:8000 -v financial-data:/app/instance financial-tracker
```

Access at http://127.0.0.1:8000

##  Tech Stack

### Backend
- **Python 3.10+** - Modern Python with type hints
- **FastAPI** - High-performance async web framework
- **Pydantic** - Data validation using Python type annotations
- **SQLite** - Embedded database (production: PostgreSQL)
- **Uvicorn** - Lightning-fast ASGI server

### Frontend (Current)
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with flexbox/grid
- **Vanilla JavaScript** - No framework dependencies yet
- **Fetch API** - Native HTTP client for JSON communication
- **Jinja2** - Server-side template rendering

### Frontend (Planned Migration)
- **React 18+** - Component-based UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Next-generation frontend tooling
- **React Router** - Client-side routing
- **Zustand/Context** - State management (TBD)

### DevOps
- **Docker** - Containerization
- **GitHub Actions** - CI/CD (planned)
- **Pytest** - Backend testing (planned)
- **Jest/Vitest** - Frontend testing (planned)

##  Project Structure

See [PLAN.md](PLAN.md) for complete project structure and architecture details.

##  Current Features

###  Implemented
- **Transactions Management**
  - Create, read, update, delete transactions
  - Track income and expenses
  - Amounts stored in cents (integer precision)
  - Date tracking with ISO format
  - Optional notes for each transaction
  - Category assignment
  
- **Categories Management**
  - Create and manage spending/income categories
  - UNIQUE constraint prevents duplicates
  - Link to transactions via foreign key
  
- **Dashboard**
  - Total income calculation
  - Total expenses calculation
  - Current balance (income - expenses)
  - Transaction and category counts
  - Quick action links

- **API Features**
  - RESTful JSON endpoints
  - Automatic input validation (Pydantic)
  - Interactive API documentation (Swagger/ReDoc)
  - Proper HTTP status codes
  - Error messages with details

###  In Progress
- **JavaScript Translation Layer**
  - Modular API client
  - UI update helpers
  - Utility functions (formatting, validation)
  - Page-specific controllers

###  Planned Features (See PLAN.md for full roadmap)
- Search and filtering (date range, category, amount)
- Data visualization (charts and graphs)
- Export/import (CSV, PDF)
- Budgeting system
- Recurring transactions
- Financial goals tracking
- Multi-user support with authentication
- React migration
- Mobile responsive design improvements

##  API Endpoints

FastAPI automatically generates interactive documentation at `/docs`. Here's a quick reference:

### Categories
- `GET /category/` - List all categories
- `POST /category/` - Create new category (requires JSON: `{"name": "string"}`)
- `GET /category/{id}` - Get category by ID
- `PATCH /category/{id}` - Update category
- `DELETE /category/{id}` - Delete category

### Transactions
- `GET /transaction/` - List all transactions
- `POST /transaction/` - Create new transaction
- `GET /transaction/{id}` - Get transaction by ID
- `PATCH /transaction/{id}` - Update transaction
- `DELETE /transaction/{id}` - Delete transaction

### Transaction Schema
```json
{
  "type": "income" | "expense",
  "amount_cents": 1050,           // $10.50 in cents
  "date": "2026-02-05",           // ISO format
  "note": "Coffee at Starbucks",
  "category_id": 1
}
```

##  Key Concepts & Design Decisions

### Why Cents Instead of Dollars?
Amounts are stored as integers (**cents**) to avoid floating-point precision errors:
- **Good:** `1050` cents = exactly $10.50
- **Bad:** `10.50` as float = potential rounding errors in calculations
- JavaScript converts to dollars for display: `amount_cents / 100`

### Why JSON API?
- **Separation:** Backend handles data, frontend handles presentation
- **Flexibility:** Same API can serve web, mobile, and desktop clients
- **Modern:** Industry standard for web applications
- **Documentation:** FastAPI auto-generates OpenAPI/Swagger docs

### Why FastAPI over Flask?
- **Performance:** ASGI async support (faster than WSGI)
- **Validation:** Pydantic schemas catch errors automatically
- **Documentation:** Built-in Swagger UI and ReDoc
- **Type Hints:** Better IDE support and code quality
- **Modern:** Uses Python 3.10+ features

### Project Phases
This is a learning project that evolves through distinct phases:
1. **Backend API** - Learn FastAPI, databases, REST principles
2. **JS Layer** - Learn fetch, promises, DOM manipulation, modules
3. **React** - Learn component architecture, state management, TypeScript
4. **Production** - Learn deployment, testing, CI/CD, monitoring

##  Documentation

- **[PLAN.md](PLAN.md)** - Complete feature roadmap, architecture decisions, and development phases
- **[LEARNING.md](LEARNING.md)** - Project structure explained, Python concepts, learning resources
- **[docs/CODING_INSTRUCTIONS.md](docs/CODING_INSTRUCTIONS.md)** - Coding standards and best practices

##  Development Workflow

### Setting Up Your IDE (VS Code/Cursor)

1. **Select Python interpreter:**
   - Press `Ctrl+Shift+P`
   - Type "Python: Select Interpreter"
   - Choose `.\venv\Scripts\python.exe`

2. **Open integrated terminal:**
   - Press `` Ctrl+` `` (backtick)
   - Should show `(venv)` in prompt
   - If not, run: `.\venv\Scripts\Activate.ps1`

### Common Commands

```powershell
# Start development server with hot reload
uvicorn app.__main__:app --reload

# Install new package
pip install package-name
pip freeze > requirements.txt

# View database
sqlite3 instance/app.db
.tables
.schema transactions
SELECT * FROM categories;
.quit

# Run tests (when implemented)
pytest

# Check code style
flake8 app/
black app/
```

### API Testing

**Using Swagger UI (Recommended):**
1. Open http://127.0.0.1:8000/docs
2. Click on any endpoint
3. Click "Try it out"
4. Fill in parameters
5. Click "Execute"

**Using curl:**
```powershell
# List categories
curl http://127.0.0.1:8000/category/

# Create category
curl -X POST http://127.0.0.1:8000/category/ ^
  -H "Content-Type: application/json" ^
  -d "{\"name\": \"Food\"}"

# Create transaction
curl -X POST http://127.0.0.1:8000/transaction/ ^
  -H "Content-Type: application/json" ^
  -d "{\"type\":\"expense\",\"amount_cents\":1299,\"date\":\"2026-02-05\",\"note\":\"Lunch\",\"category_id\":1}"
```

##  Contributing

This is primarily a learning project, but contributions and suggestions are welcome! Please:
1. Read [CODING_INSTRUCTIONS.md](docs/CODING_INSTRUCTIONS.md) for code style
2. Check [PLAN.md](PLAN.md) for planned features
3. Open an issue before starting major changes

##  License

This project is for educational purposes. Feel free to use, modify, and learn from it.

##  Learning Resources

- **FastAPI Tutorial:** https://fastapi.tiangolo.com/tutorial/
- **Python Type Hints:** https://docs.python.org/3/library/typing.html
- **REST API Design:** https://restfulapi.net/
- **JavaScript Modules:** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
- **React Docs:** https://react.dev/learn (for future migration)

##  Next Steps

### Immediate (Phase 2 - JS Layer)
1. Create API client module (`static/js/api.js`)
2. Create UI helpers (`static/js/ui.js`)
3. Create utility functions (`static/js/utils.js`)
4. Wire up category page with JavaScript
5. Wire up transaction page with JavaScript

### Near Future (Phase 3 - Features)
1. Add search and filtering to transaction list
2. Implement date range filters
3. Add charts to dashboard (Chart.js or D3.js)
4. Export transactions to CSV

### Long Term (Phase 6 - React)
1. Set up React with Vite and TypeScript
2. Create reusable component library
3. Implement React Router for navigation
4. Migrate pages one at a time
5. Add state management (Context/Zustand)

See [PLAN.md](PLAN.md) for the complete roadmap and detailed feature list.

---

**Current Status:** Phase 2 (JS Translation Layer) in progress  
**Last Updated:** February 5, 2026

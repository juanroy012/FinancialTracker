# Plan — FinancialTracker (Concise)

Goal: Make the codebase easy to explore and learn from. This brief plan
focuses on small, verifiable steps you can perform to understand and extend
the project.

Immediate steps:
- 1. Inspect `backend/app/db.py` and run the app: `python -m app`.
- 2. Run the generator to view long-form instructions: `python scripts/generate_agents_instructions.py`.
- 3. Open `.github/agents-instructions.md` and follow the numbered learning tasks.

Short-term milestones:
- Add a small UI enhancement in `frontend/src/components/transactions-view.js`.
- Add a test for `backend/app/models/transaction.py` in `tests/` using an isolated DB.
- Document any schema changes in `PLAN.md` and `.github/agents-instructions.md`.

Long-term:
- Migrate to React + TypeScript incrementally, keeping the API stable.
- Add CI with tests and linting.

See `.github/agents-instructions.md` for the 2000-line guided learning curriculum.

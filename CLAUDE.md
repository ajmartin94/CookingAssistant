# CLAUDE.md - Cooking Assistant

**Project:** AI-powered cooking companion

---

## What Makes This Project Unique

- **Local-first**: Easy to run, privacy-focused, SQLite + JSON
- **AI-everywhere**: Manual, AI-assist, and full automation modes
- **LLM-friendly structures**: Data designed for AI consumption

---

## Development Workflow

### Feature Pipeline

```
/brainstorm → /plan → /tdd → /migrate → /code-review → PR
```

1. **`/brainstorm`** — Collaborative Q&A to explore the idea, produces `brainstorm.md`
2. **`/plan`** — Structure the brainstorm into TDD-ready plan with acceptance criteria
3. **`/tdd`** — Execute the plan through outside-in TDD (impl/review sub-agents)
4. **`/migrate`** — Interactive cleanup of broken tests + DB migrations
5. **`/code-review`** — Verify implementation matches plan + code standards

### TDD-Enforced

Features and bugs require tests before code. Outside-in: E2E → Backend → Frontend.

<!-- Per AD-0101 -->
**Enforcement**: GitHub branch protection blocks PR merges unless all CI checks pass:
- `Backend CI (3.11)` (lint, type check, tests)
- `Frontend CI` (lint, type check, build, tests)
- `E2E Tests (chromium)` (smoke tests, full E2E suite)

See [docs/TESTING.md](docs/TESTING.md#enforcement-policy) for details.

### Three Modes
Every AI feature should support:
- **Manual**: User has full control
- **AI Assist**: AI suggests, user approves
- **AI Automation**: End-to-end with minimal input


---

## Repository Structure

```
CookingAssistant/
├── backend/          # FastAPI (see backend/CLAUDE.md)
├── frontend/         # React/TypeScript (see frontend/CLAUDE.md)
├── e2e/              # End-to-end tests (Playwright, see e2e/CLAUDE.md)
├── docs/             # Documentation
├── .github/          # CI workflows
└── .claude/          # Skills, plans, and hooks
```

---

## Quick Start

```bash
# Backend
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
```

---

## Tech-Specific Guidance

- **Backend**: See [backend/CLAUDE.md](backend/CLAUDE.md) for Python/FastAPI conventions
- **Frontend**: See [frontend/CLAUDE.md](frontend/CLAUDE.md) for React/TypeScript conventions

---

## Session Close Protocol

Before ending any session:

```bash
git status              # Check what changed
git add <files>         # Stage changes
git commit -m "..."     # Commit with conventional message
```

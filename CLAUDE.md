# CLAUDE.md - Cooking Assistant

**Project:** AI-powered cooking companion

---

## What Makes This Project Unique

- **Local-first**: Easy to run, privacy-focused, SQLite + JSON
- **AI-everywhere**: Manual, AI-assist, and full automation modes
- **LLM-friendly structures**: Data designed for AI consumption

---

## Development Workflow

### Issue Workflow

All work is tracked through GitHub Issues. Every issue goes through `/triage` before any implementation begins. Triage analyzes the issue, gathers context, determines type and size, and enforces the correct workflow.

**No skipping triage.** Do not jump to implementation, planning, or brainstorming without triaging first.

Every workflow step must post a concise summary comment on the linked GitHub issue (`gh issue comment <number> --body "..."`). The issue is the single source of truth for progress.

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

### Issue Management

- **Never close issues manually** — let PR merges close them via `Closes #123` (exception: spikes close directly after posting findings)
- **Labels**: `bug`, `enhancement`, `idea`, `chore`, `spike`, `ready`, `size:S`, `size:M`, `size:L`
- Every issue gets one type label and a size label (assigned during triage)
- See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md#backlog--issues) for how to create and manage issues

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
# One-command setup (backend + frontend + database)
make setup

# Start dev servers (separate terminals)
make dev-backend    # http://localhost:8000
make dev-frontend   # http://localhost:5173

# Run all targets: make help
```

<details>
<summary>Manual setup (without Make)</summary>

```bash
# Backend
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
```
</details>

---

## Tech-Specific Guidance

- **Backend**: See [backend/CLAUDE.md](backend/CLAUDE.md) for Python/FastAPI conventions
- **Frontend**: See [frontend/CLAUDE.md](frontend/CLAUDE.md) for React/TypeScript conventions

---

## Session Close Protocol

Before ending any session:

1. **Graduate learnings**: If the session uncovered conventions, patterns, or pitfalls, update the relevant durable docs (CLAUDE.md files, docs/) directly. Do not leave ad-hoc learning files in the repo. See [Context Management Guide](docs/CONTEXT_MANAGEMENT_GUIDE.md) for graduation criteria.
2. **Commit changes**:

```bash
git status              # Check what changed
git add <files>         # Stage changes
git commit -m "..."     # Commit with conventional message
```

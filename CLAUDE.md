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

1. **`/brainstorm`** — Collaborative Q&A to explore the idea, produces `brainstorm.md`. Post summary comment on the GitHub issue.
2. **`/plan`** — Structure the brainstorm into TDD-ready plan with acceptance criteria. Post summary comment on the issue.
3. **`/tdd`** — Execute the plan through outside-in TDD (impl/review sub-agents). Post summary comment on the issue.
4. **`/migrate`** — Interactive cleanup of broken tests + DB migrations. Post summary comment on the issue.
5. **`/code-review`** — Verify implementation matches plan + code standards. Post summary comment on the issue.

**Issue tracking**: Each pipeline step must post a concise summary comment on the linked GitHub issue (`gh issue comment <number> --body "..."`). This keeps stakeholders informed of progress without needing to read plan files.

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

- **Never close issues manually** — let PR merges close them via `Closes #123`
- Labels: `bug`, `enhancement`, `idea`, `chore`, `ready`
- See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md#backlog--issues) for full workflow

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

1. **Graduate learnings**: If the session uncovered conventions, patterns, or pitfalls, update the relevant durable docs (CLAUDE.md files, docs/) directly. Do not leave ad-hoc learning files in the repo. See [Context Management Guide](docs/CONTEXT_MANAGEMENT_GUIDE.md) for graduation criteria.
2. **Commit changes**:

```bash
git status              # Check what changed
git add <files>         # Stage changes
git commit -m "..."     # Commit with conventional message
```

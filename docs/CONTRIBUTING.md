# Contributing Guide

<!-- Per AD-0101 -->

This document explains how to contribute to the Cooking Assistant project.

---

## Pull Request Requirements

All PRs must pass CI checks before merge. **No exceptions.**

### Required Status Checks

| Check | Must Pass |
|-------|-----------|
| `Backend CI (3.11)` | Yes |
| `Frontend CI` | Yes |
| `E2E Tests (chromium)` | Yes |

If any check fails, the merge button is disabled.

### What CI Validates

**Backend (`backend-ci`)**:
- Lint: `ruff check .`
- Format: `black --check .`
- Types: `mypy app`
- Tests: `pytest`

**Frontend (`frontend-ci`)**:
- Lint: `eslint`, `stylelint`
- Format: `prettier --check`
- Types: `tsc --noEmit`
- Build: `npm run build`
- Tests: `vitest --run`

**E2E (`e2e-tests`)**:
- Smoke tests (app loads, CSS works, auth works)
- Full E2E suite (user journeys)

---

## Local Development Setup

### Prerequisites

- Python 3.10+
- Node.js 20+
- Git

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend Setup

```bash
cd frontend
npm install
```

### Running Locally

```bash
# Terminal 1: Backend
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```

---

## Optional: Local Pre-commit Hooks

For faster feedback, you can enable local lint hooks. This is **optional** — CI is the authoritative gate.

### Setup

```bash
# Install pre-commit (Python tool)
pip install pre-commit

# Install git hooks
pre-commit install
```

### What It Does

Local hooks run lint checks on staged files before each commit:
- Backend: `ruff check`, `black --check`
- Frontend: `eslint`, `prettier --check`

**Note**: Hooks only run lint checks (fast). Full tests run in CI.

### Bypassing Hooks

If you need to commit without hooks (e.g., WIP commit):

```bash
git commit --no-verify -m "WIP: work in progress"
```

Remember: CI will still enforce all checks on PR.

---

## Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Write tests first (TDD)
- Follow existing code patterns
- Keep commits focused

### 3. Run Local Checks (Optional)

```bash
# Backend
cd backend
ruff check .
black --check .
pytest

# Frontend
cd frontend
npm run lint
npm test -- --run
```

### 4. Push and Create PR

```bash
git push -u origin feature/your-feature-name
```

Then create a PR on GitHub. CI runs automatically.

### 5. Address CI Failures

If CI fails:
1. Read the failure logs
2. Fix the issue locally
3. Push again

PR cannot merge until all checks pass.

---

## Code Style

### Backend (Python)

- **Formatter**: Black (line length 88)
- **Linter**: Ruff
- **Type checker**: Mypy
- **Conventions**: See [backend/CLAUDE.md](../backend/CLAUDE.md)

### Frontend (TypeScript)

- **Formatter**: Prettier
- **Linter**: ESLint + Stylelint
- **Type checker**: TypeScript strict mode
- **Conventions**: See [frontend/CLAUDE.md](../frontend/CLAUDE.md)

---

## Backlog & Issues

We use GitHub Issues to track bugs, features, and ideas.

### Labels

| Label | When to use |
|-------|-------------|
| `bug` | Something is broken |
| `enhancement` | Improvement to existing functionality |
| `idea` | Future possibility, needs scoping |
| `chore` | Refactoring, docs, deps, CI changes |
| `ready` | Scoped and ready to be picked up |

Every issue gets **one type label** (`bug`, `enhancement`, `idea`, or `chore`).
Add `ready` when the issue is scoped and ready for implementation.

### Workflow

1. **Create an issue** — capture the idea with a type label
2. **Discuss** — use comments to refine scope; run `/brainstorm` for bigger features
3. **Add `ready`** — when scoped (usually after brainstorm completes)
4. **Implement** — reference the issue in your PR with `Closes #123`
5. **Auto-close** — issue closes when PR merges

### Finding Work

```
is:issue is:open label:ready              # Ready to pick up
is:issue is:open label:bug                # All open bugs
is:issue is:open label:idea -label:ready  # Unscoped ideas for brainstorming
```

### Conventions

- **Brainstorm docs**: Include `GitHub Issue: #123` at the top
- **PR titles**: Use conventional commits (`feat:`, `fix:`, `chore:`, etc.)
- **Branches**: Optionally include issue number (e.g., `feature/123-recipe-chat`)

---

## Testing

See [TESTING.md](TESTING.md) for detailed testing guidance.

Key points:
- Tests protect user experiences, not coverage metrics
- Smoke tests block all other tests if they fail
- Verify API responses, not just URLs
- Check computed styles for visual verification

---


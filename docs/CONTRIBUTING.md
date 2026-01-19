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

<!-- Per AD-0104 -->

### Prerequisites

- Python 3.10+
- Node.js 20+
- Git
- Beads CLI (for issue tracking)

### Install Beads CLI

```bash
curl -sSL https://raw.githubusercontent.com/steveyegge/beads/main/scripts/install.sh | bash
bd --version  # Verify installation
```

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

### E2E Test Setup

```bash
# From project root
npm install              # Install Playwright dependencies
npx playwright install   # Install browsers
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

## Testing

See [TESTING.md](TESTING.md) for detailed testing guidance.

Key points:
- Tests protect user experiences, not coverage metrics
- Smoke tests block all other tests if they fail
- Verify API responses, not just URLs
- Check computed styles for visual verification

---

## Issue Tracking

We use Beads for issue tracking. See [CLAUDE.md](../CLAUDE.md) for workflow.

```bash
bd ready                              # Find available work
bd show <id>                          # Review details
bd update <id> --status=in_progress   # Claim it
```

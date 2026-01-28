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

GitHub Issues are the single source of truth for all work. Every bug, feature, idea, and task lives as an issue. Progress is tracked through issue comments — not local files, not chat history.

### Creating Issues

Write issues so that someone (or Claude) picking them up has enough context to begin.

**A good issue includes:**
- **Title**: What's wrong or what's needed (not how to fix it)
- **Description**: What you observe, what you expect, and any relevant context
- **Type label**: One of the labels below

**Don't worry about:**
- Specifying the solution — that's determined during triage
- Estimating size — triage handles that
- Assigning to someone — pick up issues when ready

#### Bug Issues

```markdown
**What happens:** [describe the broken behavior]
**What should happen:** [describe the expected behavior]
**Steps to reproduce:** [if known]
**Context:** [browser, environment, recent changes — anything relevant]
```

#### Enhancement Issues

```markdown
**Current behavior:** [what exists today]
**Desired behavior:** [what should change]
**Why:** [what user problem this solves]
```

#### Idea Issues

Ideas are intentionally vague — that's fine. Just capture enough to start a conversation.

```markdown
**The idea:** [rough concept]
**Problem it solves:** [why this matters]
```

#### Chore Issues

```markdown
**What:** [what needs to change]
**Why:** [what's wrong with the current state]
```

#### Spike Issues

Spikes are research tasks — they produce knowledge, not code.

```markdown
**Question:** [what we need to learn]
**Why:** [what decision this informs]
**Timebox:** [how much effort before we stop and decide with what we have]
```

### Labels

#### Type Labels (one per issue)

| Label | When to use |
|-------|-------------|
| `bug` | Something is broken that was working |
| `enhancement` | Improvement to existing functionality |
| `idea` | Future possibility, needs exploration |
| `chore` | Refactoring, docs, deps, CI changes |
| `spike` | Research or investigation, no code merged |

#### Status Labels

| Label | When to use |
|-------|-------------|
| `ready` | Triaged, scoped, and ready to be picked up |

#### Size Labels (assigned during triage)

| Label | Meaning |
|-------|---------|
| `size:S` | Single layer, no breaking changes, clear scope |
| `size:M` | Multiple layers or breaking changes |
| `size:L` | Multiple layers, breaking changes, unclear scope |

### Issue Lifecycle

1. **Create** — Capture the problem or idea with a type label
2. **Triage** — `/triage #N` analyzes the issue, asks clarifying questions, assigns size and workflow. Triage posts its assessment as a comment on the issue.
3. **Execute** — Work follows the workflow assigned by triage. Each step posts progress as issue comments.
4. **Close** — PR merges with `Closes #123` in the commit/PR body. Spikes close directly after posting findings.

**Never close issues manually** (except spikes). Let PR merges handle it.

### Finding Work

```
is:issue is:open label:ready              # Triaged and ready to pick up
is:issue is:open label:ready label:size:S  # Small, ready issues
is:issue is:open label:bug                 # All open bugs
is:issue is:open label:idea -label:ready   # Unscoped ideas
is:issue is:open label:spike               # Open research tasks
```

### Conventions

- **Issue comments are the record** — all triage results, progress updates, and decisions are posted to the issue
- **PR titles**: Use conventional commits (`feat:`, `fix:`, `chore:`, etc.)
- **PR body**: Include `Closes #123` to auto-close the issue on merge
- **Branches**: `fix/<number>-<slug>`, `feature/<number>-<slug>`, `chore/<number>-<slug>`, `spike/<number>-<slug>`

---

## Testing

See [TESTING.md](TESTING.md) for detailed testing guidance.

Key points:
- Tests protect user experiences, not coverage metrics
- Smoke tests block all other tests if they fail
- Verify API responses, not just URLs
- Check computed styles for visual verification

---


# TDD Skills

Outside-in TDD workflow skills for agent-driven development.

## Overview

These skills implement an outside-in TDD workflow:

```
E2E RED → Backend RED → Backend GREEN → Frontend RED → Frontend GREEN → E2E GREEN
    ↓         ↓              ↓              ↓               ↓              ↓
  (test)    (test)        (impl)         (test)          (impl)      (acceptance)
```

Each phase has an **impl** skill (do the work) and a **review** skill (verify with fresh context).

## Skills

### Orchestrator
- `orchestrator/` - Master workflow controller, spawns subagents

### E2E (Playwright)
- `e2e-red-impl/` - Design E2E tests verifying user outcomes
- `e2e-red-review/` - Review E2E test design
- `e2e-green-impl/` - Verify E2E tests pass (acceptance gate)
- `e2e-green-review/` - Review E2E verification

### Backend (pytest)
- `backend-red-impl/` - Design backend tests verifying DB state
- `backend-red-review/` - Review backend test design
- `backend-green-impl/` - Implement backend to pass tests
- `backend-green-review/` - Review backend implementation

### Frontend (Vitest/RTL)
- `frontend-red-impl/` - Design frontend tests verifying user behavior
- `frontend-red-review/` - Review frontend test design
- `frontend-green-impl/` - Implement frontend to pass tests
- `frontend-green-review/` - Review frontend implementation

### Documentation
- `docs-plan/` - Propose documentation updates from learnings
- `docs-impl/` - Implement approved doc changes
- `docs-review/` - Review doc changes for accuracy

### Workflow
- `plan-to-tasks/` - Convert plan to user stories, pour molecules
- `plan-reality-compare/` - Compare plan to what was built

## Usage

1. **Start a workflow:**
   ```bash
   bd mol pour outside-in-tdd \
     --var story="User creates recipe via chat" \
     --var e2e_outcome="Recipe exists in DB after approval"
   ```

2. **Run the orchestrator:**
   The orchestrator uses `bd ready` to find available tasks and spawns subagents for each phase.

3. **Each task goes through:**
   - Impl phase (write tests or code)
   - Review phase (fresh context verification)
   - Retry on failure (max 3 attempts)

## Key Principles

- **Outcome verification** - Tests verify DB/API state, not just responses
- **Fresh context review** - Reviewer can't see implementer's reasoning
- **Beads as audit trail** - All progress tracked via `bd comments add`

## References

Skills reference project-specific patterns in:
- `backend/CLAUDE.md` - pytest fixtures, templates
- `frontend/CLAUDE.md` - vitest patterns, RTL queries
- `e2e/CLAUDE.md` - playwright patterns, auth fixture

Methodology references (in skills):
- `references/outcome-verification.md` - How to write outcome tests

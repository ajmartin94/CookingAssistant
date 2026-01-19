# State of the Union: Test Enforcement Gaps

## Metadata
- **Date**: 2026-01-17
- **Author**: Claude (AI Assistant)
- **Trigger Type**: tech-debt

## Trigger Event

### What Happened
During a review of CI/CD infrastructure, we identified that while comprehensive test workflows exist, there is no mechanism to **enforce** test passage before PR merges. Tests run but don't block.

### Reference
- Session discussion on 2026-01-17
- Analysis of `.github/workflows/*.yml` files
- Review of GitHub repository settings

## Evidence

### Current CI Infrastructure

Three GitHub Actions workflows exist and run on PRs:

| Workflow | Tests Run | Blocking? |
|----------|-----------|-----------|
| `backend-ci.yml` | pytest, ruff, black, mypy | No |
| `frontend-ci.yml` | vitest, eslint, prettier, tsc | No |
| `e2e-tests.yml` | Playwright (smoke + full) | No |

### Code Evidence

**Backend CI** (`backend-ci.yml:47`):
```yaml
- name: Type check
  run: mypy app --ignore-missing-imports
  continue-on-error: true  # Explicitly non-blocking
```

**Frontend CI** (`frontend-ci.yml`):
- All steps run but workflow success doesn't block merges

**E2E Tests** (`e2e-tests.yml`):
- Smoke tests gate other E2E tests (good internal structure)
- But overall workflow doesn't block PR merges

### Current Documentation State

**CLAUDE.md** states:
> TDD-Enforced: Features and bugs require tests before code

**docs/TESTING.md** defines coverage targets:
- Critical paths: 90%+
- Service layer: 85%+
- API endpoints: 80%+
- UI components: 75%+

**Gap**: No mechanism enforces these targets or test passage.

### What's Missing

1. **GitHub Branch Protection Rules** — No required status checks configured
2. **Local Pre-commit Hooks** — No `.pre-commit-config.yaml` or husky
3. **Coverage Enforcement** — No minimum coverage gates
4. **Blocking Type Checks** — Backend mypy uses `continue-on-error: true`

### Observations

- The project claims "TDD-Enforced" but has no enforcement mechanism
- All quality checks are advisory, not blocking
- A developer could merge a PR with failing tests
- Coverage targets exist but aren't enforced
- The infrastructure is solid; only policy enforcement is missing

## Potentially Affected Documentation

- [ ] `CLAUDE.md` — Update TDD-Enforced section to reflect enforcement mechanism
- [ ] `docs/TESTING.md` — Add enforcement policy section
- [ ] `docs/CONTRIBUTING.md` — Create or update with PR requirements
- [ ] `backend/CLAUDE.md` — Reference enforcement requirements
- [ ] `frontend/CLAUDE.md` — Reference enforcement requirements
- [ ] `.github/workflows/backend-ci.yml` — Remove `continue-on-error` from mypy

## Gate 1 Evaluation
- **Decision**: YES
- **Evaluator**: User
- **Date**: 2026-01-17
- **AD Number**: AD-0101
- **Rationale**: Documentation claims TDD-enforced but no technical enforcement exists. This gap needs formal analysis and resolution.

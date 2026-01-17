# AD-0101: Test Enforcement Policy

## Status
Implemented

## Metadata
- **Author**: Claude (AI Assistant)
- **Date**: 2026-01-17
- **Evidence Reference**: [docs/decisions/evidence/2026-01-17-test-enforcement-gaps.md](../evidence/2026-01-17-test-enforcement-gaps.md)
- **Trigger Type**: tech-debt

## Context

The Cooking Assistant project has comprehensive CI infrastructure with three GitHub Actions workflows (backend-ci, frontend-ci, e2e-tests) that run linting, type checking, and tests on every PR. The project documentation claims "TDD-Enforced" as a core development principle, and defines specific coverage targets (90%+ for critical paths, 85%+ for services, etc.).

However, all these checks are purely informational. There is no mechanism preventing a developer from merging a PR with failing tests, type errors, or lint violations. The mypy type checker is explicitly configured with `continue-on-error: true`. No branch protection rules exist, and no local pre-commit hooks catch issues before push.

## Problem Statement

How do we ensure that the "TDD-Enforced" principle is actually enforced technically, not just socially? We need a policy that prevents PRs with failing tests from being merged while maintaining reasonable developer velocity.

## Decision

We will implement a **layered enforcement strategy** combining GitHub branch protection (primary enforcement) with optional local hooks (fast feedback). Required status checks will block PR merges when tests fail. Type checking will be made blocking. Local pre-commit hooks will be provided but not mandated, respecting developer workflow preferences.

## Alternatives Considered

### Option A: GitHub Branch Protection Only (Recommended)

**Description**: Configure GitHub branch protection rules on `main` and `develop` branches requiring specific status checks to pass before merge. Make backend mypy blocking by removing `continue-on-error`.

**Implementation**:
1. Configure branch protection rules:
   - Require `backend-ci` (Python 3.11) to pass
   - Require `frontend-ci` to pass
   - Require `e2e-tests` (chromium) to pass
   - Require branches to be up to date before merging
2. Remove `continue-on-error: true` from mypy step
3. Document enforcement policy

**Pros**:
- Absolute enforcement — cannot be bypassed without admin override
- Zero local tooling required — works for all contributors immediately
- Clear feedback in PR UI — developers see exactly what's blocking
- Minimal friction — only affects the merge step, not local development
- Already have the CI infrastructure — just need to make checks required

**Cons**:
- Feedback comes late (after push) rather than locally
- Requires GitHub repository admin access to configure
- Blocked PRs require another push cycle to fix

**Recommendation**: Selected — provides hard enforcement with minimal friction

### Option B: Local Hooks Only (Pre-commit + Husky)

**Description**: Add `.pre-commit-config.yaml` and/or husky to run linting and tests locally before commits/pushes. No GitHub enforcement.

**Implementation**:
1. Add `.pre-commit-config.yaml` with lint hooks
2. Configure husky for pre-push test runs
3. Document setup for contributors

**Pros**:
- Fast feedback — catch issues before they reach CI
- Saves CI resources — fewer failing builds
- Educational — developers learn patterns faster

**Cons**:
- Can be bypassed with `--no-verify`
- Requires local setup — new contributors may skip
- Slow local commits if running full test suite
- Still no hard enforcement — just speed bumps
- Doesn't help if someone uses GitHub web UI to edit

**Recommendation**: Not selected as primary — doesn't provide actual enforcement

### Option C: CI-Only with Coverage Gates

**Description**: Keep current advisory checks but add coverage threshold enforcement. Fail CI if coverage drops below defined targets.

**Implementation**:
1. Configure codecov/coverage tools with failure thresholds
2. Add coverage check as required status check
3. Keep other checks advisory

**Pros**:
- Ensures coverage doesn't regress
- Targets already defined in documentation

**Cons**:
- Coverage alone doesn't ensure quality
- Tests could pass with low-quality assertions
- Doesn't block PRs with failing tests (just coverage drops)
- Adds complexity without solving core problem

**Recommendation**: Not selected — coverage gates are useful but don't address test failure enforcement

### Option D: Status Quo

**Description**: Continue with current advisory-only checks. Rely on code review to catch test failures.

**Pros**:
- No configuration changes needed
- Maximum developer flexibility
- No false-positive blocking

**Cons**:
- "TDD-Enforced" claim is misleading
- Human reviewers can miss test failures
- Creates technical debt when tests are allowed to fail
- Undermines confidence in test suite

**Recommendation**: Not selected — contradicts documented principles

### Option E: Layered Enforcement (Branch Protection + Optional Local Hooks)

**Description**: Implement Option A (branch protection) as mandatory enforcement, plus provide Option B (local hooks) as opt-in fast feedback. This gives hard enforcement at the CI level while offering developers the option for faster local feedback.

**Implementation**:
1. All of Option A (branch protection, blocking mypy)
2. Add `.pre-commit-config.yaml` with lint-only hooks (fast)
3. Document local setup as recommended but not required
4. Add setup instructions to CONTRIBUTING.md

**Pros**:
- Hard enforcement via branch protection (cannot be bypassed)
- Optional fast feedback for developers who want it
- Respects developer autonomy on local workflow
- Clear separation: CI enforces, local hooks assist

**Cons**:
- More documentation to maintain
- Some developers may be confused by optional local setup
- Slightly more complex than pure branch protection

**Recommendation**: This is actually the best approach — combining hard enforcement with optional developer experience improvements

## Revised Decision

After analysis, **Option E (Layered Enforcement)** is the recommended approach. It provides:
1. **Hard enforcement** via GitHub branch protection (non-negotiable)
2. **Fast feedback** via optional local hooks (developer choice)
3. **Clear documentation** explaining both layers

## Consequences

### What Becomes Easier
- Confidence that merged code passes all tests
- "TDD-Enforced" claim becomes truthful
- New contributors understand quality bar immediately
- Test suite stays healthy — failures must be fixed

### What Becomes Harder
- Quick-fix PRs that "just need to merge" — must pass tests first
- Experimental branches may need more polish before PR
- Flaky tests become more painful (but this is good — forces fixing them)

### New Constraints
- Repository admins must configure branch protection (one-time)
- Flaky tests must be addressed promptly or quarantined
- CI must remain fast enough to not block development significantly

## Affected Documentation

| File | Section | Change Required |
|------|---------|-----------------|
| `CLAUDE.md` | Development Principles > TDD-Enforced | Add enforcement mechanism details |
| `docs/TESTING.md` | New section | Add "Enforcement Policy" section explaining branch protection |
| `docs/CONTRIBUTING.md` | Create file | Document PR requirements and optional local setup |
| `backend/CLAUDE.md` | Testing section | Reference enforcement policy |
| `frontend/CLAUDE.md` | Testing section | Reference enforcement policy |
| `.github/workflows/backend-ci.yml` | mypy step | Remove `continue-on-error: true` |
| `.pre-commit-config.yaml` | Create file | Add lint-only hooks (optional use) |

## Gate 2 Approval
- **Decision**: APPROVE
- **Approver**: User
- **Date**: 2026-01-17
- **Notes**: Decision approved for implementation

## Propagation

### Checklist

| File | Status | Change Summary |
|------|--------|----------------|
| `CLAUDE.md` | ✅ Complete | Added enforcement details under TDD-Enforced section |
| `docs/TESTING.md` | ✅ Complete | Added "Enforcement Policy" section with branch protection details |
| `docs/CONTRIBUTING.md` | ✅ Complete | Created new file with PR requirements and local setup |
| `backend/CLAUDE.md` | ✅ Complete | Added "Test Enforcement" section |
| `frontend/CLAUDE.md` | ✅ Complete | Added "Test Enforcement" section |
| `.github/workflows/backend-ci.yml` | ✅ Complete | Removed `continue-on-error: true` from mypy step |
| `.pre-commit-config.yaml` | ✅ Complete | Created with lint-only hooks (optional use) |

### Manual Step Required

**GitHub Branch Protection** must be configured manually by repository admin:

```
Repository Settings → Branches → Add rule
├── Branch name pattern: main
├── ☑ Require status checks to pass before merging
│   ├── backend-ci (3.11)
│   ├── frontend-ci
│   └── e2e-tests (chromium)
├── ☑ Require branches to be up to date
└── ☑ Do not allow bypassing (optional, for strict enforcement)

Repeat for: develop
```

### Propagation Metadata
- **Implementer**: Claude (AI Assistant)
- **Date**: 2026-01-17

## Gate 3 Approval
- **Decision**: APPROVE
- **Approver**: User
- **Date**: 2026-01-17
- **Notes**: Propagation complete. Manual GitHub branch protection configuration pending.

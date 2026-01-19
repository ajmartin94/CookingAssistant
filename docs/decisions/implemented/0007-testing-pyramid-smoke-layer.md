# AD-0007: Testing Pyramid with Smoke Layer Gatekeeper

## Status
Implemented

## Metadata
- **Author**: Claude (AI Assistant)
- **Date**: 2026-01-16 (retroactive documentation)
- **Original Decision Date**: 2024-2025 (evolved during development)
- **Trigger Type**: retroactive-documentation
- **Batch**: Retroactive-2026-01

## Retroactive Documentation Notice
This ADR documents a decision made during development and is being retroactively
recorded. The decision is already implemented in the codebase.

## Context

The Cooking Assistant requires a comprehensive testing strategy that ensures quality
while providing fast feedback. Initial testing revealed that traditional E2E tests
could pass even when critical functionality (like CSS loading or authentication)
was broken, leading to false confidence. The testing approach needed to catch
catastrophic failures early while still providing detailed coverage.

## Problem Statement

What testing strategy should we adopt to ensure quality, catch critical failures
fast, and provide confidence in deployments without excessive CI time?

## Decision

We will implement a testing pyramid with an additional smoke layer at the top that
acts as a gatekeeper. Smoke tests must pass before any other E2E tests run, with
coverage thresholds at 75% for critical paths.

## Alternatives Considered

### Option A: Testing Pyramid + Smoke Gatekeeper - SELECTED

**Description**: Traditional testing pyramid (unit → integration → E2E) plus a
smoke test layer that blocks all other tests if critical paths fail.

```
        ┌─────────────┐
        │   SMOKE     │  ← Blocks everything if it fails
        │  (6 tests)  │
        └─────────────┘
       ┌───────────────┐
       │     E2E       │
       └───────────────┘
      ┌─────────────────┐
      │  INTEGRATION    │
      └─────────────────┘
     ┌───────────────────┐
     │      UNIT         │
     └───────────────────┘
```

**Pros**:
- Smoke tests catch catastrophic failures immediately
- Saves CI time by failing fast
- Pyramid provides appropriate coverage at each level
- API response verification catches silent failures
- Computed style checks catch CSS loading issues

**Cons**:
- Additional test layer to maintain
- Smoke tests must be carefully chosen to not be flaky
- Requires understanding of test dependencies

**Recommendation**: Selected

### Option B: E2E-Heavy Testing

**Description**: Focus on end-to-end tests as the primary testing mechanism.

**Pros**:
- Tests real user workflows
- High confidence in deployed behavior
- Catches integration issues naturally

**Cons**:
- Slow feedback loop
- Flaky by nature
- Expensive to run in CI
- Difficult to pinpoint failures
- Can pass despite broken functionality

**Recommendation**: Not selected — E2E tests are necessary but insufficient without
faster feedback loops and smoke gatekeeper

### Option C: Unit-Only Testing

**Description**: Focus exclusively on unit tests for fast feedback.

**Pros**:
- Fast execution
- Easy to debug failures
- High coverage easy to achieve

**Cons**:
- Doesn't catch integration issues
- Can have 100% coverage with broken app
- False confidence in deployment

**Recommendation**: Not selected — unit tests are necessary but insufficient for
verifying actual user experience

### Status Quo: N/A (greenfield)

This was a greenfield project with no existing test strategy.

## Consequences

**Positive**:
- Catastrophic failures caught in seconds, not minutes
- Clear test organization by purpose
- CI time optimized (fail fast)
- Multiple layers catch different types of bugs
- 75% coverage threshold ensures meaningful coverage

**Negative**:
- More test infrastructure to maintain
- Smoke tests require careful selection
- Team must understand testing philosophy

**Constraints**:
- Smoke tests must verify API responses, not just URLs
- Smoke tests must check computed styles for CSS verification
- All E2E browser projects depend on smoke tests passing
- Coverage thresholds enforced in CI (75% for critical paths)

## Code Evidence

The following files demonstrate this decision:

- `docs/TESTING.md` — Full testing philosophy and pyramid documentation
- `e2e/tests/smoke/app-health.spec.ts` — Smoke test implementation
- `e2e/playwright.config.ts` — Smoke dependency configuration
- `.github/workflows/e2e-tests.yml` — CI workflow with smoke gatekeeper
- `frontend/vitest.config.ts` — Unit test configuration

Example from `docs/TESTING.md:13-30` (pyramid):
```
        ┌─────────────┐
        │   SMOKE     │  ← Blocks everything if it fails
        │  (6 tests)  │     "Is the app fundamentally working?"
        └─────────────┘
```

Example smoke test pattern from `docs/TESTING.md:431-442`:
```typescript
// ✅ GOOD: Verifies API actually succeeded
const responsePromise = page.waitForResponse(
  resp => resp.url().includes('/users/login') && resp.status() === 200
);
await loginPage.login(username, password);
await responsePromise;
```

Coverage thresholds from `docs/TESTING.md:503-506`:
```
- **Critical paths:** 90%+ (auth, recipe CRUD)
- **Service layer:** 85%+
- **API endpoints:** 80%+
- **UI components:** 75%+
```

## Gate 1 Evaluation
- **Decision**: YES
- **Evaluator**: User (batch approval)
- **Date**: 2026-01-16
- **Rationale**: Batch retroactive approval - foundational testing decision

## Gate 2 Approval
- **Decision**: APPROVE
- **Approver**: User (batch approval)
- **Date**: 2026-01-16
- **Notes**: Batch retroactive approval - decision validated through successful implementation

## Gate 3 Approval
- **Decision**: APPROVE
- **Approver**: User (batch approval)
- **Date**: 2026-01-16
- **Notes**: No propagation required - already implemented in codebase

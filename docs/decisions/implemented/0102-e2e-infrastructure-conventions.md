# AD-0102: E2E Infrastructure Conventions

## Status
Implemented

## Metadata
- **Author**: Claude (AI Assistant)
- **Date**: 2026-01-18
- **Evidence Reference**: [docs/decisions/evidence/2026-01-18-e2e-infrastructure-learnings.md](../evidence/2026-01-18-e2e-infrastructure-learnings.md)
- **Trigger Type**: code-change

## Context

The Cooking Assistant project uses Playwright for E2E testing across Chromium, Firefox, and WebKit browsers. During development on the `docs-alignment` branch, we accumulated 23 E2E-related commits and closed ~15 E2E beads, revealing systematic patterns that caused test failures:

1. **Port conflicts**: E2E tests failed locally when dev servers were running on ports 8000/5173
2. **Cross-browser differences**: WebKit handles network interception differently than Chromium/Firefox
3. **SPA navigation conflicts**: Using `window.location.href` for redirects caused Playwright navigation conflicts
4. **Strict mode violations**: Duplicate UI elements caused 21 test failures from a single duplicate button

These patterns are now implemented in code but not documented, creating knowledge gaps for future development.

## Problem Statement

How do we document E2E infrastructure conventions so developers understand:
1. Why E2E tests use different ports than dev servers
2. How to handle cross-browser differences in test code
3. Why SPA navigation patterns matter for E2E testability
4. How UI design decisions affect E2E test stability

## Decision

We will document four E2E infrastructure conventions as mandatory patterns in `docs/E2E_TESTING.md`. These conventions emerged from real failures and represent hard-won knowledge.

### Convention 1: Port Isolation

**Rule**: E2E tests MUST use isolated ports (8001 backend, 5174 frontend) separate from development servers (8000, 5173).

**Rationale**: Playwright's `reuseExistingServer` option can silently reuse a running dev server that lacks `E2E_TESTING=true`, causing tests to hit the wrong database.

**Implementation** (already in code):
- `playwright.config.ts`: webServer configs use ports 8001/5174
- `backend/app/main.py`: accepts `--port` CLI argument
- `e2e/global-setup.ts`: verifies correct ports

### Convention 2: Cross-Browser Network Patterns

**Rule**: When simulating network errors, use `route.abort()` with specific error types rather than holding requests.

**Rationale**: WebKit doesn't trigger axios timeouts when Playwright intercepts and holds requests at the browser level.

**Pattern**:
```typescript
// ✅ Works in all browsers
await page.route('**/api/**', route => route.abort('timedout'));

// ❌ WebKit: axios timeout never fires
await page.route('**/api/**', async route => {
  await new Promise(r => setTimeout(r, 60000));
  await route.continue();
});
```

### Convention 3: SPA Navigation Service

**Rule**: Use React Router navigation (via navigation service) for programmatic redirects, not `window.location.href`.

**Rationale**: Hard navigation with `window.location.href` causes conflicts with Playwright's `page.goto()`, leading to unpredictable test behavior.

**Implementation** (already in code):
- `frontend/src/services/navigationService.ts`: Provides `navigate()` outside React components
- `frontend/src/App.tsx`: `NavigationSetter` wires up React Router's navigate
- `frontend/src/services/api.ts`: Axios interceptor uses navigation service for 401 redirects

### Convention 4: UI Testability (Strict Mode)

**Rule**: Avoid duplicate interactive elements that match the same locator. If unavoidable, use explicit `.first()` in tests.

**Rationale**: Playwright's strict mode fails when locators match multiple elements. One duplicate button caused 21 test failures.

**Guideline**: When adding UI elements:
1. Check if similar elements exist elsewhere on the page
2. Use unique `data-testid` attributes for test targeting
3. Prefer removing duplicates over adding `.first()` to tests

## Alternatives Considered

### Option A: Document in E2E_TESTING.md (Recommended)

**Description**: Add these conventions to the existing E2E testing guide as a new "Infrastructure Conventions" section.

**Pros**:
- Single source of truth for E2E knowledge
- Developers already reference this file
- Natural home for this content

**Cons**:
- File is already long (900+ lines)

**Recommendation**: Selected — conventions belong with other E2E guidance

### Option B: Create Separate Infrastructure Doc

**Description**: Create `docs/E2E_INFRASTRUCTURE.md` for these patterns.

**Pros**:
- Focused document for infrastructure concerns
- Shorter, easier to maintain

**Cons**:
- Fragments E2E knowledge across files
- Developers may not find it

**Recommendation**: Not selected — fragmentation outweighs benefits

### Option C: Document in CLAUDE.md Files Only

**Description**: Add brief references to frontend/backend CLAUDE.md files without central documentation.

**Pros**:
- Context-specific guidance
- Visible in each subdirectory

**Cons**:
- No comprehensive explanation
- Duplicates content
- Hard to maintain consistency

**Recommendation**: Not selected — need central documentation, but can add references

## Consequences

### What Becomes Easier
- Onboarding new developers to E2E testing
- Debugging cross-browser failures
- Understanding why certain patterns exist in code
- Making UI design decisions with testability in mind

### What Becomes Harder
- Nothing significant — this is purely additive documentation

### New Constraints
- E2E_TESTING.md must be updated when infrastructure patterns change
- New cross-browser quirks should be added to the conventions section

## Affected Documentation

| File | Section | Change Required |
|------|---------|-----------------|
| `docs/E2E_TESTING.md` | Overview | Update ports from 8000/5173 to 8001/5174 |
| `docs/E2E_TESTING.md` | New section | Add "Infrastructure Conventions" with all 4 patterns |
| `docs/E2E_TESTING.md` | Troubleshooting | Add cross-browser section |
| `frontend/CLAUDE.md` | New section | Reference navigation service pattern |

## Gate 2 Approval
- **Decision**: APPROVE
- **Approver**: User
- **Date**: 2026-01-18
- **Notes**: Decision approved for propagation

## Propagation

### Checklist

| File | Status | Change Summary |
|------|--------|----------------|
| `docs/E2E_TESTING.md` | ✅ Complete | Updated ports (8000→8001, 5173→5174) in Overview |
| `docs/E2E_TESTING.md` | ✅ Complete | Added "Infrastructure Conventions" section with all 4 patterns |
| `docs/E2E_TESTING.md` | ✅ Complete | Added "Cross-Browser Differences" to Troubleshooting |
| `frontend/CLAUDE.md` | ✅ Complete | Added "Navigation Patterns" section referencing navigation service |

### Propagation Metadata
- **Implementer**: Claude (AI Assistant)
- **Date**: 2026-01-18

## Gate 3 Approval
- **Decision**: APPROVE
- **Approver**: User
- **Date**: 2026-01-18
- **Notes**: Propagation complete and verified

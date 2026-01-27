# Plan: E2E Testing Speed Optimization

**Issue:** #34 - Testing speed
**Branch:** testing-improvements
**Brainstorm:** [brainstorm.md](./brainstorm.md)

## Overview

Restructure the E2E test suite from 25 files across 3 browsers to ~10 files running Chromium-only in 3 tiers (Smoke, Core, Comprehensive).

This plan contains 6 features executed sequentially. Each feature is a checkpoint - CI must pass before proceeding to the next.

## Feature Order

1. **Audit** (no dependencies) - produces actionable report, requires approval
2. **Tier Infrastructure** (depends on Audit) - config, scripts, CI setup
3. **Smoke Tier** (depends on Infrastructure) - critical path tests
4. **Core Tier** (depends on Smoke) - user journey tests
5. **Comprehensive Tier** (depends on Core) - edge cases, error handling, responsive
6. **Cleanup & Documentation** (depends on Comprehensive) - delete old structure, update docs

---

## Feature 1: Audit

### Summary

Review all 25 E2E test files and categorize each test by the user experience it protects. Produce an audit report as a markdown table with verdicts (Essential/Consolidate/Convert/Delete) and tier assignments.

### Layers

- E2E (read-only analysis)

### Acceptance Criteria

- [ ] All 25 test files reviewed
- [ ] Each test has: name, user experience protected, verdict, target tier
- [ ] Uncategorized tests (chat, settings, sharing, feedback, home, navigation) assigned
- [ ] Error handling tests explicitly marked for Comprehensive tier
- [ ] Audit report saved to `.claude/plans/2026-01-26-testing-speed/audit-report.md`
- [ ] User approves audit before proceeding

### Audit Process

For each test, answer:
1. **What user experience breaks if this test is deleted?**
2. **Verdict:** Essential / Consolidate / Convert / Delete
3. **Target tier:** Smoke / Core / Comprehensive / N/A (if deleting)

### Output Format

```markdown
| File | Test Name | User Experience Protected | Verdict | Target Tier | Notes |
|------|-----------|---------------------------|---------|-------------|-------|
| auth/login.spec.ts | should login successfully | User can log in | Essential | Smoke | Already in smoke via app-health |
```

### Breaking Changes

- None (read-only analysis)

---

## Feature 2: Tier Infrastructure

### Summary

Set up the tiered test execution infrastructure: Playwright config with 3 projects, npm scripts for each tier, and CI workflow changes. All existing tests should still pass after this change (infrastructure only, no test moves yet).

### Layers

- E2E (configuration only)
- CI (workflow)

### Acceptance Criteria

- [ ] `playwright.config.ts` has 3 tier projects: smoke, core, comprehensive (Chromium only)
- [ ] Smoke project: `testDir: './e2e/tests/smoke'`
- [ ] Core project: `testDir: './e2e/tests/core'`, `dependencies: ['smoke']`
- [ ] Comprehensive project: `testDir: './e2e/tests/comprehensive'`, `dependencies: ['smoke']`
- [ ] Firefox and WebKit projects removed
- [ ] npm scripts exist in root `package.json`: `test:e2e:smoke`, `test:e2e:core`, `test:e2e:full`, `test:e2e`
- [ ] `npx playwright test --project=smoke` runs only smoke tests
- [ ] CI workflow updated: remove browser matrix, single Chromium job
- [ ] CI artifact naming updated (no browser suffix)
- [ ] Placeholder `core/` and `comprehensive/` directories created with `.gitkeep`
- [ ] All existing smoke tests still pass

### Implementation

**playwright.config.ts changes:**
```typescript
projects: [
  {
    name: 'smoke',
    testDir: './e2e/tests/smoke',
    use: { ...devices['Desktop Chrome'] },
  },
  {
    name: 'core',
    testDir: './e2e/tests/core',
    dependencies: ['smoke'],
    use: { ...devices['Desktop Chrome'] },
  },
  {
    name: 'comprehensive',
    testDir: './e2e/tests/comprehensive',
    dependencies: ['smoke'],
    use: { ...devices['Desktop Chrome'] },
  },
]
```

**npm scripts (root package.json):**
```json
{
  "test:e2e:smoke": "npx playwright test --project=smoke",
  "test:e2e:core": "npx playwright test --project=smoke --project=core",
  "test:e2e:full": "npx playwright test",
  "test:e2e": "npx playwright test --project=smoke --project=core"
}
```

**CI workflow changes (.github/workflows/e2e-tests.yml):**
- Remove `matrix.browser` strategy
- Single job running `npx playwright test`
- Update artifact names (remove browser suffix)

### Breaking Changes

- CI no longer tests Firefox/WebKit
- Developers must use new npm scripts for tier-specific runs
- Old `--project=chromium` / `--project=firefox` commands no longer work

---

## Feature 3: Smoke Tier Tests

### Summary

Verify and optimize smoke tier tests in `e2e/tests/smoke/`. Smoke tests verify the app fundamentally works: loads, CSS renders, auth works, basic navigation. The existing `app-health.spec.ts` is already comprehensive.

### Layers

- E2E

### Acceptance Criteria

- [ ] `e2e/tests/smoke/` contains only critical-path tests
- [ ] Existing `app-health.spec.ts` reviewed and optimized if needed
- [ ] Any redundant smoke tests consolidated or deleted per audit
- [ ] `npx playwright test --project=smoke` passes
- [ ] Smoke tier runs reasonably fast (aspirational: < 30 seconds)

### Implementation

Based on audit report:
1. Review existing `app-health.spec.ts` (6 tests)
2. Verify it covers: app loads, CSS applies, login works, auth tokens work
3. Delete any redundant smoke-level tests identified in audit
4. No new tests needed unless audit identifies gaps

### Breaking Changes

- Some existing test files may be deleted if audit marks them redundant

---

## Feature 4: Core Tier Tests

### Summary

Create/consolidate core tier tests in `e2e/tests/core/`. Core tests verify user journeys work: can create/edit/delete recipes and libraries, can complete workflows.

### Layers

- E2E

### Acceptance Criteria

- [ ] `e2e/tests/core/` contains user journey tests only
- [ ] Tests organized by domain: auth, recipes, libraries, workflows
- [ ] Each test protects a clear user outcome (not implementation details)
- [ ] Import paths updated for new location
- [ ] `npx playwright test --project=core` passes
- [ ] Core tier runs reasonably (aspirational: < 2 minutes)
- [ ] Tests deleted/consolidated per audit report

### Implementation

Based on audit report:
1. Create `core/auth.spec.ts` - consolidated auth tests (login, register, logout happy paths)
2. Create `core/recipes.spec.ts` - consolidated recipe CRUD (create, view, edit, delete)
3. Create `core/libraries.spec.ts` - consolidated library CRUD
4. Create `core/workflows.spec.ts` - end-to-end user journeys (or keep existing complete-recipe-journey)
5. Update all import paths (`../../fixtures/`, `../../pages/`, `../../utils/`)
6. Delete old individual CRUD files (create.spec.ts, edit.spec.ts, etc.)
7. Convert any implementation-detail tests to outcome tests

### Breaking Changes

- Many existing test files will be deleted/consolidated
- Old file paths (auth/login.spec.ts, recipes/create.spec.ts, etc.) no longer exist
- Any CI references to specific test files need updating

---

## Feature 5: Comprehensive Tier Tests

### Summary

Create/consolidate comprehensive tier tests in `e2e/tests/comprehensive/` for edge cases, error handling, and responsive tests.

### Layers

- E2E

### Acceptance Criteria

- [ ] `e2e/tests/comprehensive/` contains edge case tests only
- [ ] Error handling tests (`errors/network-errors.spec.ts`) preserved with unique coverage
- [ ] Responsive/viewport tests consolidated
- [ ] Validation edge case tests consolidated
- [ ] Remaining tests (chat, settings, sharing, feedback, home, navigation) placed per audit
- [ ] Import paths updated for new location
- [ ] `npx playwright test --project=comprehensive` passes
- [ ] Full tier runs reasonably (aspirational: < 5 minutes)

### Implementation

Based on audit report:
1. Create `comprehensive/errors.spec.ts` - network/server error handling (preserve unique coverage!)
2. Create `comprehensive/validation.spec.ts` - form validation edge cases
3. Create `comprehensive/responsive.spec.ts` - viewport tests
4. Create `comprehensive/features.spec.ts` - remaining features (chat, settings, sharing, etc.) or individual files
5. Update all import paths
6. Delete old directory structure files

### Breaking Changes

- Old file paths (errors/, responsive/, settings/, etc.) no longer exist
- Error handling tests must preserve unique coverage for: API failures, 500 errors, timeouts, 401 redirects, 404s, rate limiting

---

## Feature 6: Cleanup & Documentation

### Summary

Delete remaining old test structure and update all documentation to reflect the new organization.

### Layers

- E2E (cleanup)
- Documentation

### Acceptance Criteria

- [ ] No `.spec.ts` files exist outside `smoke/`, `core/`, `comprehensive/` directories
- [ ] Old directories deleted: `auth/`, `recipes/`, `libraries/`, `errors/`, `responsive/`, `settings/`, `sharing/`, `feedback/`, `home/`, `navigation/`, `workflows/`, `chat/`
- [ ] `docs/TESTING.md` updated with new tier structure
- [ ] `e2e/CLAUDE.md` updated with new organization
- [ ] Unused page object methods identified (cleanup optional)
- [ ] `npx playwright test` runs full suite successfully
- [ ] All acceptance criteria from Features 1-5 still pass

### Implementation

1. Verify all tests moved and passing
2. Delete empty old directories
3. Update `docs/TESTING.md`:
   - Update test structure diagram
   - Update "Running Tests" section with new npm scripts
   - Update E2E section with tier descriptions
4. Update `e2e/CLAUDE.md`:
   - Update project structure
   - Update running commands
   - Update test location guidance

### Breaking Changes

- Old directory structure completely removed
- Documentation references to old paths updated

---

## Open Questions

None - all resolved.

---

## Success Metrics

After all features complete:

| Metric | Before | After |
|--------|--------|-------|
| Test files | 25 | ~10 |
| Browsers | 3 | 1 |
| Full suite time | ~15 min | Significantly reduced |
| Every test protects user outcome | Partial | Yes |

**Note:** Timing targets (30s, 2min, 5min) are aspirational goals, not hard requirements.

---

## Migration Risks (from review)

| Risk | Mitigation |
|------|------------|
| Import path breakage | Update paths when moving files, test after each move |
| Coverage loss on error tests | Explicitly preserve `network-errors.spec.ts` unique coverage |
| CI artifact naming | Update artifact names when removing browser matrix |
| Test isolation | Preserve unique user/data patterns in consolidated tests |

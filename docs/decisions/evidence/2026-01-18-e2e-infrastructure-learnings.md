# State of the Union: E2E Test Infrastructure Learnings

## Metadata
- **Date**: 2026-01-18
- **Author**: Claude (AI Assistant)
- **Trigger Type**: code-change

## Trigger Event

### What Happened
The `docs-alignment` branch accumulated 23 E2E-related commits and ~15 closed E2E beads, revealing systematic patterns around test infrastructure that are not currently documented. These learnings emerged from debugging failures across Chromium, Firefox, and WebKit browsers.

### Reference
- Branch: `docs-alignment`
- Key beads: CookingAssistant-pqv, CookingAssistant-6fl, CookingAssistant-fcq, CookingAssistant-r27
- Commits: `33f684a`, `d1fbbca`, `adc35c9`, `af55507`

## Evidence

### Learning 1: E2E Port Isolation

**Code Changes**:
- File: `playwright.config.ts`
- File: `backend/app/main.py` (added `--port` CLI argument)
- File: `e2e/global-setup.ts`
- Commit: `33f684a`

**Summary**:
E2E tests now use ports 8001 (backend) and 5174 (frontend) instead of 8000/5173. This prevents test failures when dev servers are running, since Playwright's `reuseExistingServer` would reuse existing servers that lack `E2E_TESTING=true`.

**Root Cause** (from CookingAssistant-pqv investigation):
```
1. Playwright detects existing server on port 8000/5173
2. Reuses it instead of starting E2E-configured one
3. Existing server lacks E2E_TESTING=true
4. Uses production database instead of test database
5. Registration fails with 500 error
```

**Current Documentation State**:
- `docs/E2E_TESTING.md` line 33: "Backend API (FastAPI on port 8000)"
- `docs/E2E_TESTING.md` line 34: "Frontend UI (React on port 5173)"
- These are now incorrect

**Observations**:
- This was a confusing failure mode (tests pass in CI, fail locally)
- The fix required changes across 4 files
- Pattern: E2E tests should always use isolated ports

### Learning 2: Cross-Browser Network Interception Differences

**Code Changes**:
- File: `e2e/tests/errors/network-errors.spec.ts`
- Commit: `d1fbbca`

**Summary**:
WebKit handles Playwright network interception differently than Chromium/Firefox. When simulating network timeouts, WebKit doesn't trigger axios timeouts when Playwright holds the request at the browser level.

**Pattern**:
```typescript
// ❌ Doesn't work in WebKit - axios timeout never fires
await page.route('**/api/**', async route => {
  await new Promise(resolve => setTimeout(resolve, 60000));
  await route.continue();
});

// ✅ Works in all browsers
await page.route('**/api/**', async route => {
  await route.abort('timedout');
});
```

**Current Documentation State**:
- `docs/E2E_TESTING.md` has no cross-browser troubleshooting section
- No mention of browser-specific workarounds

**Observations**:
- WebKit (Safari) often needs different strategies
- This pattern will recur as we add more network error tests

### Learning 3: SPA Navigation vs window.location in E2E

**Code Changes**:
- File: `frontend/src/services/navigationService.ts` (new)
- File: `frontend/src/services/api.ts` (axios interceptor)
- File: `frontend/src/App.tsx` (NavigationSetter component)
- Commit: `adc35c9`

**Summary**:
Using `window.location.href` for 401 redirects causes conflicts with Playwright's `page.goto()`. The solution is to use React Router's navigate function via a navigation service.

**Pattern**:
```typescript
// ❌ Causes Playwright navigation conflicts
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      window.location.href = '/login';  // Hard navigation
    }
    return Promise.reject(error);
  }
);

// ✅ Works with Playwright
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      navigationService.navigate('/login');  // React Router navigation
    }
    return Promise.reject(error);
  }
);
```

**Current Documentation State**:
- Not documented anywhere
- This is a cross-cutting pattern for SPA + E2E testing

**Observations**:
- Required creating a navigation service to access React Router outside components
- This pattern applies to any SPA using React Router + Playwright

### Learning 4: Playwright Strict Mode and Duplicate Elements

**Code Changes**:
- File: `frontend/src/pages/RecipesPage.tsx`
- Multiple E2E test files (added `.first()` to locators)
- Commit: `af55507`

**Summary**:
Playwright's strict mode fails when locators match multiple elements. The UI had two "New Recipe" buttons visible simultaneously (sidebar + empty state), causing 21 test failures across all browsers.

**Pattern**:
```typescript
// ❌ Fails if multiple elements match
await page.locator('a[href="/recipes/create"]').click();

// ✅ Explicit about which element
await page.locator('a[href="/recipes/create"]').first().click();

// ✅ Better: ensure UI has unique elements
// Remove duplicate button from empty state
```

**Current Documentation State**:
- `docs/E2E_TESTING.md` mentions "Use Specific Locators" in best practices
- Does not mention strict mode explicitly or the pattern of UI design affecting testability

**Observations**:
- UI design decisions directly affect E2E testability
- 21 failures from one duplicate button is high blast radius
- Better to fix UI than add `.first()` everywhere

## Potentially Affected Documentation

- [ ] `docs/E2E_TESTING.md` — Update ports, add cross-browser section, add SPA navigation pattern
- [ ] `frontend/CLAUDE.md` — Reference navigation service pattern for redirects

## Gate 1 Evaluation
- **Decision**: YES
- **Evaluator**: User
- **Date**: 2026-01-18
- **AD Number**: AD-0102
- **Rationale**: All 4 learnings represent infrastructure conventions that should be formally documented to prevent future failures.

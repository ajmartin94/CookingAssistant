# E2E Testing Guide

**Stack:** Playwright
**Testing:** End-to-end user journeys

---

## Project Structure

```
e2e/
├── fixtures/
│   └── auth.fixture.ts       # Authenticated page fixture
├── pages/
│   └── *.page.ts             # Page objects
├── utils/
│   ├── api.ts                # APIHelper for direct API calls
│   └── test-data.ts          # Test data generators
├── tests/
│   └── {feature}/*.spec.ts   # Test files
├── global-setup.ts           # Setup before all tests
├── global-teardown.ts        # Cleanup after all tests
└── reports/                  # Test reports
```

---

## Key Principles

- **Verify outcomes via API** - Don't just check UI, verify DB/API state
- **Before/after pattern** - Capture state before action, compare after
- **No mocking backend** - Never use `page.route()` to mock our own API
- **User-goal names** - Test names describe what user wants, not implementation
- **Proper waits** - Use `waitForResponse`, `waitForURL`, not `waitForTimeout`

---

## Running Tests

```bash
# All tests
cd e2e && npx playwright test

# Specific file
npx playwright test tests/chat/create-recipe-via-chat.spec.ts

# With UI (debug)
npx playwright test --debug

# Multiple runs (check flakiness)
npx playwright test path/to/test.spec.ts --repeat-each=3

# Show report
npx playwright show-report
```

---

## Testing Patterns

### Using the Auth Fixture

```typescript
import { test, expect } from '../../fixtures/auth.fixture';

test('authenticated user action', async ({ authenticatedPage, testUser }) => {
  // authenticatedPage is already logged in
  // testUser has: username, email, password
});
```

### Using APIHelper for Outcome Verification

```typescript
import { test, expect } from '../../fixtures/auth.fixture';
import { APIHelper } from '../../utils/api';

test('user creates recipe', async ({ authenticatedPage, request }) => {
  const api = new APIHelper(request);
  const token = await authenticatedPage.evaluate(() =>
    localStorage.getItem('auth_token')
  );

  // Capture BEFORE state
  const before = await api.getRecipes(token!);

  // User action via UI
  // ...

  // Verify AFTER state via API
  const after = await api.getRecipes(token!);
  expect(after.length).toBe(before.length + 1);
});
```

### Page Objects

Use existing page objects:

```typescript
import { RecipesPage } from '../../pages/recipes.page';
import { CreateRecipePage } from '../../pages/create-recipe.page';

test('create recipe', async ({ authenticatedPage }) => {
  const recipesPage = new RecipesPage(authenticatedPage);
  const createPage = new CreateRecipePage(authenticatedPage);

  await recipesPage.goto();
  await recipesPage.clickCreateNew();
  await createPage.fillForm({ title: 'Test Recipe', ... });
  await createPage.submit();
});
```

### Waiting Patterns

#### Good: Wait for specific conditions

```typescript
// Wait for navigation
await page.waitForURL(/\/recipes\/[\w-]+$/);

// Wait for API response
await page.waitForResponse(resp =>
  resp.url().includes('/api/v1/recipes') && resp.status() === 201
);

// Wait for element
await expect(page.getByText('Success')).toBeVisible();
```

#### Bad: Hardcoded waits

```typescript
// DON'T DO THIS
await page.waitForTimeout(5000);
```

---

## Test Template

```typescript
import { test, expect } from '../../fixtures/auth.fixture';
import { APIHelper } from '../../utils/api';

test.describe('Feature: User Story Name', () => {
  test('user [action] and [outcome]', async ({ authenticatedPage, request }) => {
    const api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );

    // 1. BEFORE: Capture initial state
    const before = await api.getRecipes(token!);

    // 2. ACTION: User journey
    await authenticatedPage.goto('/recipes');
    // ... user actions

    // 3. AFTER: Verify outcome via API
    const after = await api.getRecipes(token!);
    expect(after.length).toBe(before.length + 1);

    // 4. OPTIONAL: Verify UI reflects outcome
    await expect(authenticatedPage.getByText('New Recipe')).toBeVisible();
  });
});
```

---

## File Location

```
e2e/tests/{feature}/{story}.spec.ts

Examples:
- e2e/tests/chat/create-recipe-via-chat.spec.ts
- e2e/tests/recipes/edit-recipe.spec.ts
- e2e/tests/libraries/add-recipe-to-library.spec.ts
```

---

## Common Selectors

```typescript
// Role-based (preferred)
page.getByRole('button', { name: 'Create Recipe' })
page.getByRole('textbox', { name: 'Title' })
page.getByRole('link', { name: 'Recipes' })

// Text-based
page.getByText('Success')
page.getByLabel('Recipe Title')

// Test ID (when needed)
page.getByTestId('recipe-list')
```

---

## Testing AI Features (E2E)

AI-powered features (chat, recipe generation, suggestions) are non-deterministic.
E2E tests verify the full user flow without asserting exact AI output:

```typescript
test('user creates recipe via AI chat', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/chat');

  // User sends a prompt
  await authenticatedPage.getByRole('textbox', { name: /message/i })
    .fill('Give me a quick pasta recipe');
  await authenticatedPage.getByRole('button', { name: /send/i }).click();

  // Verify: response appears (don't assert exact content)
  const response = authenticatedPage.locator('[data-testid="chat-response"]');
  await expect(response).toBeVisible({ timeout: 30000 });

  // Verify: response has expected structure (non-empty, contains recipe-like content)
  const text = await response.textContent();
  expect(text!.length).toBeGreaterThan(50);

  // Verify: user can act on the response (e.g., save as recipe)
  await authenticatedPage.getByRole('button', { name: /save/i }).click();
  await expect(authenticatedPage.getByText(/recipe saved/i)).toBeVisible();
});
```

**Principles for AI E2E tests:**
- Verify the flow works (prompt → response → action), not the content
- Use generous timeouts — AI responses are slower than DB queries
- Assert structure (non-empty, has expected elements) not exact text
- If using a stub AI backend for E2E, it must behave like the real one (latency, streaming, error shapes)
- Test error states: what does the user see when AI is unavailable?

## E2E Scope

E2E tests verify **user workflows**, not individual API endpoints:

- **DO test**: "User registers, creates a recipe, adds it to a library, shares it"
- **DON'T test**: "POST /api/v1/recipes returns 201" (that's a backend integration test)

If a scenario can be fully verified through a backend integration test, it doesn't need an E2E test.
E2E tests add value when they exercise the full stack together: UI → API → DB → UI feedback.

---

## Debugging

```bash
npx playwright test --debug          # Playwright Inspector (step-by-step)
npx playwright test --ui             # Interactive UI mode (recommended)
npx playwright test --headed         # Visible browser
npx playwright show-report           # View HTML report after run
npx playwright show-trace trace.zip  # View trace from CI artifacts
```

In-test debugging:
```typescript
await page.pause();  // Opens Inspector at this point

// Console/network logging
page.on('console', msg => console.log('Browser:', msg.text()));
page.on('request', req => console.log('>>', req.method(), req.url()));
page.on('response', res => console.log('<<', res.status(), res.url()));
```

---

## Infrastructure Conventions

### Port Isolation

| Service | Dev Server | E2E Tests |
|---------|------------|-----------|
| Backend | 8000 | 8001 |
| Frontend | 5173 | 5174 |

If tests fail mysteriously locally but pass in CI, check if dev servers are running on 8000/5173.
Playwright's `reuseExistingServer` can silently reuse a dev server that lacks `E2E_TESTING=true`.

### Cross-Browser Network Patterns

```typescript
// Works in all browsers (Chromium, Firefox, WebKit)
await page.route('**/api/**', route => route.abort('timedout'));
await page.route('**/api/**', route => route.abort('connectionrefused'));

// DON'T hold requests with setTimeout — WebKit won't trigger client-side timeouts
```

### SPA Navigation

Use React Router navigation, not `window.location.href`:
```typescript
// Works with Playwright
import { navigationService } from './services/navigationService';
navigationService.navigate('/login');

// Breaks Playwright (races with page.goto())
window.location.href = '/login';
```

### Strict Mode / Duplicate Elements

Playwright fails when locators match multiple elements:
```typescript
// Fails if duplicate "New Recipe" buttons exist
await page.locator('a[href="/recipes/create"]').click();

// Better: use unique data-testid
await page.locator('[data-testid="sidebar-new-recipe"]').click();
```

When adding UI elements: check if similar elements exist elsewhere on the page.

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| "Backend not available after 120000ms" | Dependencies or port conflict | `cd backend && pip install -r requirements.txt`, check port 8001 |
| "Frontend not available after 120000ms" | Missing node_modules | `cd frontend && npm install`, check port 5174 |
| "database is locked" | Stale test DB | `rm backend/cooking_assistant_test_e2e.db*` |
| Tests pass locally, fail in CI | Version mismatch or env vars | Check node/python versions, run with `CI=true` |
| Tests pass in Chromium, fail in WebKit | Browser quirks | See cross-browser patterns above; increase timeouts |
| Flaky tests | Race conditions or hard waits | Use `waitForResponse`, auto-waiting assertions, never `waitForTimeout` |
| Flaky after controlled refactor | Lifted state adds React render cycle | Use double-rAF (`requestAnimationFrame(() => requestAnimationFrame(...))`) instead of `waitForTimeout`; wait for DOM elements to be visible before interacting |
| Slow execution | Serial + multi-browser | `--workers=4`, `--project=chromium` for dev |

---

## Test Enforcement

All PRs must pass `e2e-ci` before merge. This includes:
- **Smoke tests**: Critical path verification
- **Full E2E suite**: All feature tests

See [docs/TESTING.md](../docs/TESTING.md#enforcement-policy) for full enforcement policy.

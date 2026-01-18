# E2E Testing Guide

**Framework:** Playwright
**Coverage:** Authentication, Recipe CRUD, Workflows, Error Handling

---

## 📋 Table of Contents

- [Overview](#overview)
- [Smoke Tests (Critical)](#smoke-tests-critical)
- [Quick Start](#quick-start)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Page Object Model](#page-object-model)
- [Debugging](#debugging)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

### What Are E2E Tests?

End-to-end (E2E) tests verify the entire application stack working together:
- **Backend API** (FastAPI on port 8000)
- **Frontend UI** (React on port 5173)
- **Database** (SQLite test database)
- **Browser** (Real browser automation)

### Why E2E Tests?

E2E tests catch issues that unit and integration tests miss:
- ✅ Server startup failures
- ✅ API contract mismatches
- ✅ Database persistence issues
- ✅ Multi-step user workflows
- ✅ Cross-browser compatibility
- ✅ CSS not loading (app renders unstyled)
- ✅ Authentication flow broken

### Test Coverage

E2E tests cover:
- **Smoke Tests:** Critical path verification (CSS loads, login works, API responds)
- **Authentication:** Registration, login, and logout flows
- **Recipe CRUD:** Create, list, detail, edit, and delete operations
- **Validation Errors:** Auth and recipe form validation
- **Network Errors:** API failure handling and retry behavior
- **Workflows:** Complete user journeys (e.g., registration → create recipe → edit → delete)

**Browsers:** Chromium, Firefox, WebKit (Safari)

---

## Smoke Tests (Critical)

Smoke tests are the **gatekeeper** of the test suite. They run FIRST, and if any fail, no other tests run.

### Location

`e2e/tests/smoke/app-health.spec.ts`

### What They Verify

| Test | What It Catches |
|------|-----------------|
| Frontend loads | React fails to mount, JS bundle broken |
| CSS loads correctly | Stylesheets missing, Tailwind not compiling |
| Backend API healthy | Server down, database connection failed |
| Login flow works | Auth API broken, form submission fails |
| Authenticated requests work | Token invalid, auth middleware broken |
| Unauthenticated redirect | Protected routes exposed |

### Why This Matters

Before smoke tests, we had situations where:
- ❌ App rendered completely unstyled → all tests passed
- ❌ Login was broken → all tests passed (because they only checked URL changes)

Smoke tests verify **the app fundamentally works** before wasting CI time on 50+ other tests.

### Running Smoke Tests

```bash
# Run smoke tests only
npx playwright test --project=smoke

# Full suite (smoke runs first automatically)
npm run test:e2e
```

### Configuration

In `playwright.config.ts`, browser projects depend on smoke:

```typescript
projects: [
  { name: 'smoke', testDir: './e2e/tests/smoke' },
  { name: 'chromium', dependencies: ['smoke'], ... },
  { name: 'firefox', dependencies: ['smoke'], ... },
]
```

---

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- Backend and frontend dependencies installed

### Installation

```bash
# Install Playwright and dependencies
npm install

# Install browsers (one-time setup)
npx playwright install chromium firefox webkit
```

### Run All Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run with visible browser
npm run test:e2e:headed

# Run in UI mode (recommended for development)
npm run test:e2e:ui
```

### Run Specific Tests

```bash
# Run only authentication tests
npx playwright test e2e/tests/auth/

# Run only recipe creation tests
npx playwright test e2e/tests/recipes/create.spec.ts

# Run tests for specific browser
npx playwright test --project=chromium
```

---

## Test Structure

### Directory Layout

```
e2e/
├── tests/                      # Test files
│   ├── auth/                   # Authentication tests
│   │   ├── register.spec.ts
│   │   ├── login.spec.ts
│   │   └── logout.spec.ts
│   ├── recipes/                # Recipe CRUD tests
│   │   ├── create.spec.ts
│   │   ├── list.spec.ts
│   │   ├── detail.spec.ts
│   │   ├── edit.spec.ts
│   │   └── delete.spec.ts
│   ├── workflows/              # Complete user journeys
│   │   └── complete-recipe-journey.spec.ts
│   └── errors/                 # Error handling tests
│       ├── network-errors.spec.ts
│       └── validation-errors.spec.ts
├── pages/                      # Page Object Models
│   ├── base.page.ts
│   ├── login.page.ts
│   ├── register.page.ts
│   ├── recipes.page.ts
│   ├── create-recipe.page.ts
│   └── recipe-detail.page.ts
├── fixtures/                   # Test fixtures
│   └── auth.fixture.ts
├── utils/                      # Helper utilities
│   ├── api.ts
│   └── test-data.ts
├── global-setup.ts            # Pre-test setup
└── global-teardown.ts         # Post-test cleanup
```

### Test File Naming

- `*.spec.ts` - Test files
- `*.page.ts` - Page Object Models
- `*.fixture.ts` - Test fixtures

---

## Running Tests

### Available npm Scripts

```bash
# Run all tests (headless, all browsers)
npm run test:e2e

# Run in UI mode (interactive debugging)
npm run test:e2e:ui

# Run with browser visible
npm run test:e2e:headed

# Run in debug mode
npm run test:e2e:debug

# Generate test code interactively
npm run test:e2e:codegen

# Open HTML report
npm run test:e2e:report
```

### Command Line Options

```bash
# Run tests in specific browser
npx playwright test --project=firefox

# Run tests in parallel (faster)
npx playwright test --workers=4

# Run in headed mode
npx playwright test --headed

# Run with specific timeout
npx playwright test --timeout=30000

# Run with retry on failure
npx playwright test --retries=2

# Run and update snapshots
npx playwright test --update-snapshots
```

### Filtering Tests

```bash
# Run tests matching pattern
npx playwright test login

# Run tests in specific file
npx playwright test e2e/tests/auth/login.spec.ts

# Run specific test by title
npx playwright test -g "should login with valid credentials"

# Run only failed tests from last run
npx playwright test --last-failed
```

---

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '../../fixtures/auth.fixture';
import { RecipesPage } from '../../pages/recipes.page';

test.describe('Recipe Feature', () => {
  test('should do something', async ({ authenticatedPage }) => {
    // Arrange - Set up test data
    const recipesPage = new RecipesPage(authenticatedPage);
    await recipesPage.goto();

    // Act - Perform action
    await recipesPage.createRecipeButton.click();

    // Assert - Verify result
    await expect(authenticatedPage).toHaveURL(/\/recipes\/create/);
  });
});
```

### Using the Auth Fixture

The auth fixture provides a pre-authenticated page:

```typescript
test('should access protected route', async ({ authenticatedPage, testUser }) => {
  // authenticatedPage is already logged in
  // testUser contains { username, email, password }

  const recipesPage = new RecipesPage(authenticatedPage);
  await recipesPage.goto();

  // Already authenticated - no login needed
  await expect(authenticatedPage).toHaveURL(/\/recipes/);
});
```

### Creating Test Data

```typescript
import { generateRecipeData, generateUniqueUsername } from '../../utils/test-data';

test('should create recipe', async ({ authenticatedPage, request }) => {
  const api = new APIHelper(request);
  const token = await authenticatedPage.evaluate(() => localStorage.getItem('token'));

  // Generate unique recipe data
  const recipeData = generateRecipeData({
    title: 'My Test Recipe',
    cuisine_type: 'Italian',
  });

  // Create recipe via API
  const recipe = await api.createRecipe(token!, recipeData);

  // Verify in UI
  await authenticatedPage.goto(`/recipes/${recipe.id}`);
  await expect(authenticatedPage.getByText('My Test Recipe')).toBeVisible();
});
```

### Using Page Objects

```typescript
test('should edit recipe', async ({ authenticatedPage, request }) => {
  const api = new APIHelper(request);
  const token = await authenticatedPage.evaluate(() => localStorage.getItem('token'));

  // Create recipe via API (fast setup)
  const recipe = await api.createRecipe(token!, generateRecipeData());

  // Use page objects for UI interactions
  const detailPage = new RecipeDetailPage(authenticatedPage);
  await detailPage.goto(recipe.id);

  await detailPage.editButton.click();

  const editPage = new CreateRecipePage(authenticatedPage);
  await editPage.titleInput.fill('Updated Title');
  await editPage.submit();

  // Verify change
  await expect(detailPage.recipeTitle).toHaveText('Updated Title');
});
```

---

## Page Object Model

### What is POM?

Page Object Model (POM) is a design pattern that:
- Encapsulates page elements and interactions
- Improves test maintainability
- Reduces code duplication
- Makes tests more readable

### Base Page

All page objects extend `BasePage`:

```typescript
// e2e/pages/base.page.ts
export class BasePage {
  constructor(protected page: Page) {}

  async goto(path: string) {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  async getAuthToken(): Promise<string | null> {
    return this.page.evaluate(() => localStorage.getItem('token'));
  }

  protected async waitForPageLoad() {
    await this.page.waitForLoadState('domcontentloaded');
  }
}
```

### Creating a Page Object

```typescript
// e2e/pages/recipes.page.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class RecipesPage extends BasePage {
  readonly createRecipeButton: Locator;
  readonly searchInput: Locator;
  readonly recipeCards: Locator;

  constructor(page: Page) {
    super(page);
    this.createRecipeButton = page.locator('a[href="/recipes/create"]');
    this.searchInput = page.locator('input[placeholder*="Search"]');
    this.recipeCards = page.locator('[data-testid="recipe-card"]');
  }

  async goto() {
    await super.goto('/recipes');
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500); // Debounce
  }

  async getRecipeCount(): Promise<number> {
    return this.recipeCards.count();
  }
}
```

### Using the Page Object

```typescript
test('should search recipes', async ({ authenticatedPage }) => {
  const recipesPage = new RecipesPage(authenticatedPage);

  await recipesPage.goto();
  await recipesPage.search('pasta');

  const count = await recipesPage.getRecipeCount();
  expect(count).toBeGreaterThan(0);
});
```

---

## Debugging

### UI Mode (Recommended)

```bash
npm run test:e2e:ui
```

Features:
- Visual test execution
- Step-by-step debugging
- Element picker
- Time-travel debugging

### Debug Mode

```bash
npm run test:e2e:debug
```

Opens Playwright Inspector for line-by-line debugging.

### Browser Visible

```bash
npm run test:e2e:headed
```

See the browser while tests run.

### Screenshots and Videos

Playwright automatically captures:
- **Screenshots** on failure
- **Videos** of failed tests
- **Traces** for debugging

Access in `test-results/` directory.

### Debug Specific Test

```typescript
test('my test', async ({ page }) => {
  await page.pause(); // Opens Playwright Inspector

  // Test continues after you resume
});
```

### Console Logs

```typescript
test('debug test', async ({ page }) => {
  // Listen to console logs
  page.on('console', msg => console.log('Browser log:', msg.text()));

  // Your test code
  await page.goto('/recipes');
});
```

### Network Debugging

```typescript
test('debug network', async ({ page }) => {
  // Log all network requests
  page.on('request', request => console.log('>>', request.method(), request.url()));
  page.on('response', response => console.log('<<', response.status(), response.url()));

  await page.goto('/recipes');
});
```

---

## CI/CD Integration

### GitHub Actions

E2E tests run automatically on:
- Push to `main`, `develop`, or `claude/**` branches
- Pull requests to `main` or `develop`

### Workflow Configuration

See `.github/workflows/e2e-tests.yml`:

```yaml
- name: Run E2E tests
  run: npx playwright test --project=${{ matrix.browser }}
  env:
    CI: true
    DATABASE_URL: sqlite+aiosqlite:///./cooking_assistant_test_e2e.db
```

### Test Artifacts

On failure, CI uploads:
- Test results (HTML report)
- Videos of failed tests
- Traces for debugging
- Screenshots

**Retention:** 7 days

### Viewing CI Results

1. Go to GitHub Actions tab
2. Click on failed workflow run
3. Download artifacts (videos, traces, reports)
4. Open trace: `npx playwright show-trace trace.zip`

---

## Best Practices

### 1. Verify API Responses, Not Just URLs

This is the most critical pattern. Tests that only check URL changes can pass when the feature is completely broken.

✅ **Good:**
```typescript
// Intercept the API response BEFORE the action
const loginResponse = page.waitForResponse(
  resp => resp.url().includes('/users/login') && resp.status() === 200
);

await loginPage.login(username, password);

// Verify the API actually succeeded
await loginResponse;
const body = await (await loginResponse).json();
expect(body.access_token).toBeTruthy();
```

❌ **Bad:**
```typescript
// Only checks if URL changed - login could be completely broken
await loginPage.login(username, password);
await expect(page).toHaveURL(/\/recipes/);
```

### 2. Verify CSS with Computed Styles

Don't just check if elements are visible. Verify styles are actually applied.

✅ **Good:**
```typescript
const styles = await button.evaluate(el => {
  const computed = window.getComputedStyle(el);
  return {
    backgroundColor: computed.backgroundColor,
    borderRadius: computed.borderRadius,
  };
});

// Verify not browser defaults
expect(styles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
expect(styles.borderRadius).not.toBe('0px');
```

❌ **Bad:**
```typescript
// Passes even when CSS completely fails to load
await expect(button).toBeVisible();
```

### 3. Use Specific Locators

Avoid ambiguous selectors that match multiple elements.

✅ **Good:**
```typescript
page.locator('h1:has-text("My Recipes")')
page.locator('button[type="submit"]')
page.locator('[data-testid="recipe-card"]').first()
```

❌ **Bad:**
```typescript
page.locator('text=My Recipes')  // Matches nav link AND heading
page.locator('button')           // Matches all buttons
```

### 4. Use Page Objects

✅ **Good:**
```typescript
const recipesPage = new RecipesPage(page);
await recipesPage.search('pasta');
```

❌ **Bad:**
```typescript
await page.locator('input[placeholder*="Search"]').fill('pasta');
```

### 5. Use API for Setup

✅ **Good:**
```typescript
// Fast: Create test data via API
const recipe = await api.createRecipe(token, recipeData);

// Then test the UI
await detailPage.goto(recipe.id);
```

❌ **Bad:**
```typescript
// Slow: Create test data through UI
await recipesPage.createRecipeButton.click();
await createPage.fillForm(recipeData);
await createPage.submit();
```

### 3. Use Fixtures

✅ **Good:**
```typescript
test('my test', async ({ authenticatedPage }) => {
  // Already logged in
});
```

❌ **Bad:**
```typescript
test('my test', async ({ page }) => {
  // Manually login every time
  await loginPage.login(username, password);
});
```

### 4. Use Meaningful Assertions

✅ **Good:**
```typescript
await expect(recipesPage.recipeCards).toHaveCount(3);
await expect(page.getByText('Recipe Title')).toBeVisible();
```

❌ **Bad:**
```typescript
expect(await recipesPage.getRecipeCount()).toBe(3);
```

### 5. Avoid Hard-Coded Waits

✅ **Good:**
```typescript
await expect(page.getByText('Success')).toBeVisible({ timeout: 5000 });
```

❌ **Bad:**
```typescript
await page.waitForTimeout(3000);
expect(await page.getByText('Success').isVisible()).toBe(true);
```

### 6. Use Unique Test Data

✅ **Good:**
```typescript
const username = generateUniqueUsername();
const email = generateUniqueEmail();
```

❌ **Bad:**
```typescript
const username = 'testuser'; // Will conflict with other tests
```

### 7. Clean Up Test Data

Tests should be independent:

```typescript
test.afterEach(async ({ request }) => {
  // Clean up created recipes
  await api.deleteRecipe(token, recipeId);
});
```

### 8. Test One Thing Per Test

✅ **Good:**
```typescript
test('should create recipe', async ({ authenticatedPage }) => {
  // Test only creation
});

test('should edit recipe', async ({ authenticatedPage }) => {
  // Test only editing
});
```

❌ **Bad:**
```typescript
test('should create and edit recipe', async ({ authenticatedPage }) => {
  // Testing too much in one test
});
```

---

## Troubleshooting

<!-- Per AD-0100 -->
### Windows Compatibility

E2E tests are cross-platform compatible. The Playwright config automatically detects Windows and uses the correct Python path:

- **Windows**: `venv\Scripts\python.exe`
- **Unix/Mac**: `source venv/bin/activate && python`

No manual configuration needed—just ensure your backend venv is set up correctly.

### Tests Fail Locally But Pass in CI

**Causes:**
- Different Node/Python versions
- Missing environment variables
- Port conflicts

**Solutions:**
```bash
# Check versions
node --version  # Should be 20+
python --version  # Should be 3.11+

# Kill processes on ports
npx kill-port 8000 5173

# Run with CI environment variables
CI=true npm run test:e2e
```

### Backend Fails to Start

**Error:** "Backend not available after 120000ms"

**Solutions:**
1. Check backend dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. Test backend manually:
   ```bash
   cd backend
   python -m app.main
   # Should start on http://localhost:8000
   ```

3. Check for port conflicts:
   ```bash
   lsof -i :8000  # macOS/Linux
   netstat -ano | findstr :8000  # Windows
   ```

### Frontend Fails to Start

**Error:** "Frontend not available after 120000ms"

**Solutions:**
1. Check frontend dependencies:
   ```bash
   npm install
   ```

2. Test frontend manually:
   ```bash
   cd frontend
   npm run dev
   # Should start on http://localhost:5173
   ```

### Flaky Tests

**Symptoms:** Tests pass sometimes, fail other times

**Common Causes:**
- Race conditions
- Hard-coded waits
- Network timeouts

**Solutions:**
```typescript
// Use auto-waiting assertions
await expect(element).toBeVisible({ timeout: 10000 });

// Use page.waitForResponse for API calls
await page.waitForResponse(resp => resp.url().includes('/api/v1/recipes'));

// Avoid page.waitForTimeout (use only for debounce)
```

### Database Lock Errors

**Error:** "database is locked"

**Solutions:**
```bash
# Remove test database and restart
rm backend/cooking_assistant_test_e2e.db
rm backend/cooking_assistant_test_e2e.db-journal

# Run tests again
npm run test:e2e
```

### Slow Test Execution

**Causes:**
- Running tests serially
- Too many browser instances
- Slow setup

**Solutions:**
```bash
# Run tests in parallel (4 workers)
npx playwright test --workers=4

# Run only one browser
npx playwright test --project=chromium

# Use API for test data setup (not UI)
```

---

## Additional Resources

### Official Documentation

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)

### Internal Documentation

- [README.md](../README.md) - Project overview
- [TESTING.md](TESTING.md) - All testing documentation
- [backend/CLAUDE.md](../backend/CLAUDE.md) - Backend guidelines
- [frontend/CLAUDE.md](../frontend/CLAUDE.md) - Frontend guidelines

### Getting Help

1. Check this documentation
2. Review test examples in `e2e/tests/`
3. Run `npx playwright test --help`
4. Open an issue on GitHub

---

## Summary

**E2E Testing Workflow:**
1. Write page objects for new pages
2. Create test data generators
3. Write tests using fixtures and page objects
4. Run tests locally: `npm run test:e2e:ui`
5. Fix failures with debug mode: `npm run test:e2e:debug`
6. Commit changes - CI runs tests automatically

**Key Principles:**
- ✅ Use Page Object Model
- ✅ Use API for test setup
- ✅ Use fixtures for authentication
- ✅ Test one thing per test
- ✅ Use auto-waiting assertions
- ✅ Generate unique test data
- ✅ Keep tests independent

**Remember:** E2E tests complement unit and integration tests. They catch real-world integration issues that other tests miss.

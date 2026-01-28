# Testing Guide

This document describes the testing strategy, infrastructure, and conventions for the Cooking Assistant project.

---

## Testing Philosophy

**Tests exist to protect user experiences, not to hit coverage metrics.**

### Test Tiers

| Tier | What It Tests | Mocks? | Question Answered |
|------|---------------|--------|-------------------|
| Unit | Pure logic only (parse, calculate, format, validate) | None — no dependencies | "Is the calculation correct?" |
| Integration (backend) | Service + DB + API together | None — real in-memory DB | "Does the API do what it should?" |
| Integration (frontend) | Page + hooks + API responses | MSW only (faithful to real API) | "Does the user see the right outcome?" |
| E2E | Full stack, real browser | None | "Can the user complete the workflow?" |
| Smoke | App loads, CSS renders, auth works | None | "Is the app fundamentally broken?" |

**Smoke tests run first and block everything else.**

### Critical Principles

1. **Smoke tests are the gatekeeper**: If the app doesn't load, CSS doesn't render, or login is broken, no other tests run.

2. **Verify API responses, not just URLs**: Always intercept and verify API responses. A redirect doesn't prove the API worked.

3. **Check computed styles for visual verification**: `toBeVisible()` passes even when CSS fails to load. Verify computed styles for critical visual elements.

4. **Test behavior, not implementation**: Tests verify what users see and experience, not internal state.

5. **No inter-layer mocking**: Backend tests hit the real database. Frontend integration tests use MSW handlers that faithfully mirror real API responses. E2E tests hit real everything. Never mock your own system's layers to avoid testing them.

6. **If it needs a mock, it's not a unit test**: Unit tests are for pure functions only (no DB, no API, no side effects). If you need to mock a dependency, promote the test to integration.

7. **No escape hatches**: If something is hard to test (AI, external APIs), test as far as you can. Test prompt construction, response parsing, error handling, the full path up to the external boundary. Never rationalize skipping tests because "I can't test the whole thing."

8. **MSW is a faithful proxy, not a convenience shortcut**: MSW handlers must return the same shape as the real API. When the backend changes response fields, MSW handlers update in the same PR. Handlers should include realistic error responses (401, 404, 422).

### Before Writing Any Test

Answer these questions:
1. What user experience are we protecting?
2. How would a user know if this broke?
3. What does "working" look like from the user's perspective?

If you can't answer these, the test isn't protecting anything meaningful.

---

## Test Infrastructure

### Backend Testing Stack

**Framework:** pytest with pytest-asyncio

**Key Dependencies:**
- `pytest` - Test framework
- `pytest-asyncio` - Async test support
- `pytest-cov` - Coverage reporting
- `httpx` - Async HTTP client for API testing
- `faker` - Test data generation

**Test Database:**
- In-memory SQLite (`sqlite+aiosqlite:///:memory:`)
- Complete isolation between tests
- No persistent state

**Fixtures (backend/tests/conftest.py):**
- `test_engine` - Async database engine
- `test_db` - Database session with auto-rollback
- `client` - AsyncClient for API testing
- `test_user` / `test_user2` - Pre-created users
- `auth_headers` / `auth_headers_user2` - JWT authentication headers
- `test_recipe`, `test_library` - Sample data fixtures

**Utilities:**
- `factories.py` - Faker-based data generators (not yet implemented)
- `helpers.py` - Common test functions
  - `create_test_user()` - Quick user creation
  - `create_test_recipe()` - Quick recipe creation
  - `create_test_library()` - Quick library creation
  - `generate_jwt_token()` - Create auth tokens

### Frontend Testing Stack

**Framework:** Vitest with React Testing Library

**Key Dependencies:**
- `vitest` - Test runner (Vite-native)
- `@testing-library/react` - Component testing utilities
- `@testing-library/user-event` - User interaction simulation
- `@testing-library/jest-dom` - DOM matchers
- `msw` (Mock Service Worker) - API mocking
- `jsdom` - DOM environment for Node

**Test Setup:**
- Custom render function with AuthProvider and Router
- MSW server for intercepting HTTP requests
- Automatic cleanup after each test
- Test mode environment variable to prevent navigation

**MSW Handlers (frontend/src/test/mocks/handlers.ts):**
- Auth endpoints (register, login, getCurrentUser, updateProfile)
- Recipe endpoints (CRUD operations)
- Library endpoints (CRUD operations)
- Dynamic response based on request data

**Test Utilities:**
- `test-utils.tsx` - Custom render with providers and userEvent
- `mocks/data.ts` - Mock data generators
- `mocks/server.ts` - MSW server configuration

### E2E Testing Stack

**Framework:** Playwright (TypeScript)

**Key Dependencies:**
- `@playwright/test` - Test framework and browser automation
- `playwright` - Chromium-only (Firefox/WebKit removed for speed)

**Test Environment:**
- **Real Backend:** FastAPI server on port 8000
- **Real Frontend:** Vite dev server on port 5173
- **Test Database:** SQLite (`cooking_assistant_test_e2e.db`)
- **Browser:** Chromium only

**3-Tier Test Structure:**
- **Smoke** (`e2e/tests/smoke/`) - Critical path verification; runs first, blocks all others
- **Core** (`e2e/tests/core/`) - Essential feature tests (auth, recipes, libraries, chat, etc.)
- **Comprehensive** (`e2e/tests/comprehensive/`) - Edge cases, error handling, responsive, feedback

**Configuration (playwright.config.ts):**
- **Smoke tests run first** - Core and comprehensive tiers depend on smoke tests passing
- Chromium-only for faster execution
- Parallel execution with workers
- Automatic server startup via `webServer` configuration
- Screenshots and videos on failure
- Trace collection for debugging
- Retry on failure (CI only)

**Smoke Tests (e2e/tests/smoke/):**
- `app-health.spec.ts` - Critical path verification that blocks all other tests
- Verifies: Frontend loads, CSS applies, backend healthy, login works, auth tokens valid

**Core Tests (e2e/tests/core/):**
- `auth.spec.ts`, `chat.spec.ts`, `home.spec.ts`, `libraries.spec.ts`
- `navigation.spec.ts`, `recipe-crud.spec.ts`, `settings.spec.ts`
- `sharing.spec.ts`, `workflows.spec.ts`

**Comprehensive Tests (e2e/tests/comprehensive/):**
- `chat-edge-cases.spec.ts`, `error-handling.spec.ts`, `feedback.spec.ts`
- `recipe-edge-cases.spec.ts`, `responsive.spec.ts`

**Page Object Model:**
- `BasePage` - Common functionality (navigation, auth)
- `LoginPage`, `RegisterPage` - Authentication pages
- `RecipesPage`, `CreateRecipePage`, `RecipeDetailPage` - Recipe pages
- All page objects extend BasePage for consistency

**Fixtures (e2e/fixtures/auth.fixture.ts):**
- `testUser` - Unique user credentials for each test
- `authenticatedPage` - Pre-authenticated browser page
- Automatic user registration and login

**Test Utilities:**
- `APIHelper` (e2e/utils/api.ts) - Direct API calls for test setup
- `generateRecipeData()` - Create unique recipe data
- `generateUniqueUsername()`, `generateUniqueEmail()` - Unique test data

**Global Setup/Teardown:**
- `global-setup.ts` - Wait for backend/frontend readiness, clean test DB
- `global-teardown.ts` - Remove test database

**CI/CD Integration:**
- GitHub Actions workflow (`.github/workflows/e2e-tests.yml`)
- Chromium-only (no browser matrix)
- Artifact uploads (reports, videos, traces)
- 7-day retention for debugging

**NPM Scripts (from project root):**
- `npm run test:e2e:smoke` - Run smoke tests only
- `npm run test:e2e:core` - Run core tests only
- `npm run test:e2e:full` - Run all tiers (smoke + core + comprehensive)
- `npm run test:e2e` - Alias for full suite

---

## Test Organization

### Backend Test Structure

```
backend/tests/
├── conftest.py              # Shared pytest fixtures
├── utils/
│   ├── factories.py         # Test data factories (future)
│   └── helpers.py           # Test helper functions
├── unit/                    # Unit tests
│   ├── test_auth_service.py
│   ├── test_recipe_service.py
│   ├── test_library_service.py
│   └── test_share_service.py
└── integration/             # Integration tests
    ├── test_users_api.py
    ├── test_recipes_api.py
    ├── test_libraries_api.py
    └── test_sharing_api.py
```

### Frontend Test Structure

```
frontend/src/
├── services/
│   └── authApi.test.ts
├── contexts/
│   └── AuthContext.test.tsx
└── test/
    ├── setup.ts                     # Global test setup
    ├── test-utils.tsx               # Custom render function
    └── mocks/
        ├── server.ts                # MSW server
        ├── handlers.ts              # API handlers
        └── data.ts                  # Mock data generators
```

### E2E Test Structure

```
e2e/
├── tests/                           # Test files (3-tier structure)
│   ├── smoke/                       # ⚠️ RUNS FIRST - blocks all others
│   │   └── app-health.spec.ts       # CSS, login, auth verification
│   ├── core/                        # Essential feature tests
│   │   ├── auth.spec.ts
│   │   ├── chat.spec.ts
│   │   ├── home.spec.ts
│   │   ├── libraries.spec.ts
│   │   ├── navigation.spec.ts
│   │   ├── recipe-crud.spec.ts
│   │   ├── settings.spec.ts
│   │   ├── sharing.spec.ts
│   │   └── workflows.spec.ts
│   └── comprehensive/               # Edge cases & non-critical paths
│       ├── chat-edge-cases.spec.ts
│       ├── error-handling.spec.ts
│       ├── feedback.spec.ts
│       ├── recipe-edge-cases.spec.ts
│       └── responsive.spec.ts
├── pages/                           # Page Object Models
│   ├── base.page.ts
│   ├── login.page.ts
│   ├── register.page.ts
│   ├── recipes.page.ts
│   ├── create-recipe.page.ts
│   └── recipe-detail.page.ts
├── fixtures/                        # Test fixtures
│   └── auth.fixture.ts
├── utils/                           # Test utilities
│   ├── api.ts
│   └── test-data.ts
├── global-setup.ts
├── global-teardown.ts
└── playwright.config.ts
```

**For detailed E2E testing documentation, see [e2e/CLAUDE.md](../e2e/CLAUDE.md)**

---

## Running Tests

### Backend

```bash
# Navigate to backend
cd backend

# Activate virtual environment
source venv/bin/activate  # Windows: venv\Scripts\activate

# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run with coverage report in terminal
pytest --cov=app --cov-report=term-missing

# Run specific test file
pytest tests/unit/test_auth_service.py

# Run specific test
pytest tests/unit/test_auth_service.py::test_hash_password

# Run with verbose output
pytest -v

# Run only fast tests (skip slow integration tests)
pytest -m "not slow"
```

### Frontend

```bash
# Navigate to frontend
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui

# Run specific test file
npm test -- authApi.test.ts

# Run in CI mode (no watch)
npm test -- --run
```

---

## Writing Tests

### Backend Test Patterns

#### Unit Test (pure functions only)
```python
def test_parse_ingredient_fraction():
    """Parsing '1/3 cup flour' extracts amount, unit, and name."""
    result = parse_ingredient("1/3 cup flour")

    assert result.amount == Fraction(1, 3)
    assert result.unit == "cup"
    assert result.name == "flour"

def test_scale_ingredient_amount():
    """Scaling 2.5 cups by factor 3 gives 7.5 cups."""
    assert scale_amount(2.5, factor=3) == 7.5
```

No mocks, no DB, no fixtures. Pure input → output.

#### Integration Test (the default — most tests are this)
```python
@pytest.mark.asyncio
async def test_create_recipe_api(client: AsyncClient, auth_headers, test_db):
    """User creates a recipe and it persists to the database."""
    before_count = await test_db.scalar(select(func.count(Recipe.id)))

    response = await client.post(
        "/api/v1/recipes",
        headers=auth_headers,
        json={
            "title": "New Recipe",
            "ingredients": [...],
            "instructions": [...],
            "servings": 4,
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "New Recipe"

    # Verify it actually persisted
    after_count = await test_db.scalar(select(func.count(Recipe.id)))
    assert after_count == before_count + 1
```

Real DB, real API, real outcome verification.

### Frontend Test Patterns

#### API Client Test Example
```typescript
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import * as authApi from './authApi';
import { server } from '../test/mocks/server';

describe('authApi', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('should login successfully', async () => {
    const result = await authApi.login({
      username: 'testuser',
      password: 'password123'
    });

    expect(result.access_token).toBeDefined();
    expect(result.token_type).toBe('bearer');
  });
});
```

#### Component Test Example
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/test-utils';
import { RecipeCard } from './RecipeCard';
import { mockRecipe } from '../test/mocks/data';

describe('RecipeCard', () => {
  it('displays recipe information', () => {
    const recipe = mockRecipe();
    render(<RecipeCard recipe={recipe} />);

    expect(screen.getByText(recipe.title)).toBeInTheDocument();
    expect(screen.getByText(recipe.cuisine_type)).toBeInTheDocument();
  });
});
```

---

## Best Practices

### General
1. **Follow AAA Pattern:** Arrange, Act, Assert
2. **One assertion per concept:** Don't test multiple unrelated things
3. **Clear test names:** Describe what user does and what outcome they see
4. **Isolate tests:** No shared state between tests
5. **Every test answers "what does the user see?":** If it doesn't connect to user experience, question whether it's needed

### Backend
1. **Use fixtures for setup:** Leverage pytest fixtures for common setup
2. **Test both success and failure:** Happy path and error cases
3. **Test edge cases:** Empty lists, boundary conditions, null values
4. **Keep tests fast:** Use in-memory database
5. **Prefer integration tests:** Test through the API with a real DB. Reserve unit tests for pure functions with meaningful logic (parsing, calculation, formatting)
6. **Never mock the database:** If your test needs data, use test fixtures and the real in-memory DB

### Frontend
1. **Test user behavior:** Not implementation details
2. **Query by role/label/text:** Use accessible queries
3. **Use custom render:** Always include necessary providers
4. **Verify user-visible outcomes:** After form submission, check for success messages or navigation — not whether a callback was invoked
5. **MSW handlers match reality:** Keep MSW response shapes in sync with real backend responses

### E2E (Critical Patterns)

1. **Verify API responses, not just URLs:**
```typescript
// ❌ BAD: Passes even when login is broken
await loginPage.login(username, password);
await expect(page).toHaveURL(/\/recipes/);

// ✅ GOOD: Verifies API actually succeeded
const responsePromise = page.waitForResponse(
  resp => resp.url().includes('/users/login') && resp.status() === 200
);
await loginPage.login(username, password);
await responsePromise;
```

2. **Verify CSS loads with computed styles:**
```typescript
// ❌ BAD: Passes even when CSS fails to load
await expect(button).toBeVisible();

// ✅ GOOD: Verifies styles are actually applied
const styles = await button.evaluate(el => ({
  backgroundColor: window.getComputedStyle(el).backgroundColor
}));
expect(styles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
```

3. **Use specific locators:**
```typescript
// ❌ BAD: Matches multiple elements, causes flaky tests
page.locator('text=My Recipes')

// ✅ GOOD: Specific to element type
page.locator('h1:has-text("My Recipes")')
```

---

## Debugging Tests

### Backend

```bash
# Run single test with output
pytest tests/unit/test_auth_service.py::test_hash_password -v -s

# Debug with pdb
pytest --pdb

# Show print statements
pytest -s

# Show local variables on failure
pytest -l
```

### Frontend

```bash
# Run with UI for interactive debugging
npm run test:ui

# Run specific test with console output
npm test -- authApi.test.ts --reporter=verbose

# Debug in VS Code
# Add breakpoint and run "Debug Current Test File"
```

---

## Coverage

Coverage metrics are informational, not goals. A test that inflates coverage without
protecting a user experience is technical debt.

Use coverage reports to find untested paths, not to hit numbers:

```bash
# Backend
pytest --cov=app --cov-report=term-missing

# Frontend
npm run test:coverage
```

If a function has low coverage, ask: "What user experience breaks if this fails?"
If the answer is clear, write that test. If you can't articulate one, the function
may not need its own test — it's already covered by an integration test above it.

### Testing External Services (AI, Third-Party APIs)

When a feature integrates with external services that can't be called in tests:

1. **Test prompt/request construction** — verify the right inputs are sent
2. **Test response parsing** — use canned responses to verify parsing logic
3. **Test error handling** — timeouts, malformed responses, rate limits, auth failures
4. **Test the full integration path up to the boundary** — everything except the actual HTTP call
5. **Use a stub client in tests** — returns predictable responses, verifies the rest of the system handles them correctly

The external service is non-deterministic. Everything around it is not. Test everything around it.

---

## Additional Resources

- [Backend Testing Guide](../backend/CLAUDE.md#testing-strategy)
- [Frontend Testing Guide](../frontend/CLAUDE.md#testing-strategy)
- [E2E Testing Guide](../e2e/CLAUDE.md)
- [pytest documentation](https://docs.pytest.org/)
- [Vitest documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [MSW (Mock Service Worker)](https://mswjs.io/)

---

<!-- Per AD-0101 -->
## Enforcement Policy

**Tests are not optional.** PRs cannot merge unless all CI checks pass.

### Branch Protection (Primary Enforcement)

GitHub branch protection rules on `main` and `develop` require these status checks:

| Required Check | What It Validates |
|----------------|-------------------|
| `Backend CI (3.11)` | Lint (ruff), format (black), types (mypy), tests (pytest) |
| `Frontend CI` | Lint (eslint), format (prettier), types (tsc), build, tests (vitest) |
| `E2E Tests (chromium)` | Smoke tests, full E2E suite |

**Merge is blocked** if any required check fails. No exceptions without admin override.

### What Gets Blocked

- Failing tests (unit, integration, or E2E)
- Lint violations (ruff, eslint, stylelint)
- Format violations (black, prettier)
- Type errors (mypy, tsc)
- Build failures
- Smoke test failures (app won't load, CSS broken, auth broken)

### Local Pre-commit Hooks (Optional)

For faster feedback, you can enable local hooks:

```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install

# Run manually
pre-commit run --all-files
```

Local hooks run lint checks only (fast). Full test suite runs in CI.

**Note**: Local hooks are opt-in. CI enforcement is the authoritative gate.

### Dealing with Flaky Tests

If a test is flaky (intermittently fails):
1. **Do not skip it** — fix the root cause
2. **Quarantine temporarily** — move to a separate job that doesn't block
3. **Track it** — create an issue to investigate and fix

Flaky tests undermine confidence in the entire suite.

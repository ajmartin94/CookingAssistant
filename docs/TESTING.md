# Testing Guide

This document describes the testing strategy, infrastructure, and conventions for the Cooking Assistant project.

---

## Testing Philosophy

**Tests exist to protect user experiences, not to hit coverage metrics.**

### The Testing Pyramid + Smoke Layer

```
        ┌─────────────┐
        │   SMOKE     │  ← Blocks everything if it fails
        │  (6 tests)  │     "Is the app fundamentally working?"
        └─────────────┘
       ┌───────────────┐
       │     E2E       │  ← User journeys across full stack
       │  (17 suites)  │     "Can users complete workflows?"
       └───────────────┘
      ┌─────────────────┐
      │  INTEGRATION    │  ← API contracts and data flow
      │  (backend API)  │     "Do systems communicate correctly?"
      └─────────────────┘
     ┌───────────────────┐
     │      UNIT         │  ← Isolated business logic
     │  (services/utils) │     "Is the calculation correct?"
     └───────────────────┘
```

### Critical Principles

1. **Smoke tests are the gatekeeper**: If the app doesn't load, CSS doesn't render, or login is broken, no other tests run. This saves CI time and immediately surfaces catastrophic failures.

2. **Verify API responses, not just URLs**: A test that only checks `expect(page).toHaveURL(/\/recipes/)` after login can pass even when authentication is completely broken. Always intercept and verify API responses.

3. **Check computed styles for visual verification**: A test that only checks `expect(button).toBeVisible()` passes even when CSS fails to load. Verify computed styles for critical visual elements.

4. **Test behavior, not implementation**: Tests should verify what users see and experience, not internal state or implementation details.

### Before Writing Any Test

Answer these questions:
1. What user experience are we protecting?
2. How would a user know if this broke?
3. What does "working" look like from the user's perspective?

See the `/test-planning` skill for the full UX-first test design workflow.

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
- `playwright` - Cross-browser support (Chromium, Firefox, WebKit)

**Test Environment:**
- **Real Backend:** FastAPI server on port 8000
- **Real Frontend:** Vite dev server on port 5173
- **Test Database:** SQLite (`cooking_assistant_test_e2e.db`)
- **Browsers:** Chromium, Firefox, WebKit (Safari)

**Configuration (playwright.config.ts):**
- **Smoke tests run first** - All browser projects depend on smoke tests passing
- Parallel execution with workers
- Automatic server startup via `webServer` configuration
- Screenshots and videos on failure
- Trace collection for debugging
- Retry on failure (CI only)

**Smoke Tests (e2e/tests/smoke/):**
- `app-health.spec.ts` - Critical path verification that blocks all other tests
- Verifies: Frontend loads, CSS applies, backend healthy, login works, auth tokens valid

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
- Matrix testing across browsers
- Artifact uploads (reports, videos, traces)
- 7-day retention for debugging

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
├── tests/                           # Test files
│   ├── smoke/                       # ⚠️ RUNS FIRST - blocks all others
│   │   └── app-health.spec.ts       # CSS, login, auth verification
│   ├── auth/                        # Authentication
│   │   ├── register.spec.ts
│   │   ├── login.spec.ts
│   │   └── logout.spec.ts
│   ├── recipes/                     # Recipe CRUD
│   │   ├── create.spec.ts
│   │   ├── list.spec.ts
│   │   ├── detail.spec.ts
│   │   ├── edit.spec.ts
│   │   └── delete.spec.ts
│   ├── workflows/                   # User journeys
│   │   └── complete-recipe-journey.spec.ts
│   └── errors/                      # Error handling
│       ├── network-errors.spec.ts
│       └── validation-errors.spec.ts
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

**For detailed E2E testing documentation, see [E2E_TESTING.md](E2E_TESTING.md)**

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

#### Unit Test Example
```python
@pytest.mark.asyncio
async def test_create_recipe_with_valid_data(test_db: AsyncSession, test_user):
    """Test creating a recipe with valid data."""
    # Arrange
    recipe_data = RecipeCreate(
        title="Test Recipe",
        description="A test recipe",
        ingredients=[...],
        instructions=[...],
        servings=4,
    )

    # Act
    result = await recipe_service.create_recipe(test_db, recipe_data, test_user)

    # Assert
    assert result.id is not None
    assert result.title == "Test Recipe"
    assert result.owner_id == test_user.id
```

#### Integration Test Example
```python
@pytest.mark.asyncio
async def test_create_recipe_api(client: AsyncClient, auth_headers):
    """Test recipe creation via API."""
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
```

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
3. **Clear test names:** Describe what is being tested and expected outcome
4. **Isolate tests:** No shared state between tests
5. **Mock external dependencies:** Don't call real APIs or databases in unit tests

### Backend
1. **Use fixtures for setup:** Leverage pytest fixtures for common setup
2. **Test both success and failure:** Happy path and error cases
3. **Test edge cases:** Empty lists, boundary conditions, null values
4. **Keep tests fast:** Use in-memory database
5. **Test business logic:** Focus on service layer, not just API endpoints

### Frontend
1. **Test user behavior:** Not implementation details
2. **Query by role/label/text:** Use accessible queries
3. **Use custom render:** Always include necessary providers
4. **Mock API calls:** Use MSW for consistent, testable responses
5. **Avoid testing internal state:** Test rendered output instead

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

## Coverage Goals

### Targets
- **Critical paths:** 90%+ (auth, recipe CRUD)
- **Service layer:** 85%+
- **API endpoints:** 80%+
- **UI components:** 75%+

Run coverage reports to measure progress:

```bash
# Backend
pytest --cov=app --cov-report=term-missing

# Frontend
npm run test:coverage
```

---

## Additional Resources

- [Backend Testing Guide](../backend/CLAUDE.md#testing-strategy)
- [Frontend Testing Guide](../frontend/CLAUDE.md#testing-strategy)
- [E2E Testing Guide](E2E_TESTING.md)
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
| `backend-ci` (3.11) | Lint (ruff), format (black), types (mypy), tests (pytest) |
| `frontend-ci` | Lint (eslint), format (prettier), types (tsc), build, tests (vitest) |
| `e2e-tests` (chromium) | Smoke tests, full E2E suite |

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
3. **Track in beads** — create an issue with priority

Flaky tests undermine confidence in the entire suite.

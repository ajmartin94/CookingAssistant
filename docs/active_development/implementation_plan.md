# Testing Infrastructure Implementation Plan

**Project:** Cooking Assistant
**Phase:** Comprehensive Testing Implementation
**Status:** Phase 1 Complete - Infrastructure & Core Unit Tests
**Last Updated:** 2026-01-03
**Branch:** `claude/plan-readme-features-aGPIu`

---

## Table of Contents

1. [Overview](#overview)
2. [Implementation Phases](#implementation-phases)
3. [Completed Work](#completed-work)
4. [Testing Patterns & Standards](#testing-patterns--standards)
5. [Remaining Work](#remaining-work)
6. [File Structure](#file-structure)
7. [How to Run Tests](#how-to-run-tests)
8. [Next Steps](#next-steps)

---

## Overview

### Goals
- Implement comprehensive test coverage across all layers: unit, integration, E2E
- Target: 80%+ overall code coverage
- Establish testing patterns and infrastructure for future development
- Both backend (pytest) and frontend (Vitest) testing suites

### Approach
- **Test-Driven Infrastructure**: Set up complete testing framework before implementing all tests
- **Pattern-First**: Establish clear testing patterns with initial tests
- **Comprehensive Coverage**: Target all layers (unit → integration → E2E)
- **Documentation**: Clear patterns for future test development

---

## Implementation Phases

### Phase 1: Testing Infrastructure Setup ✅ COMPLETE

**Backend Infrastructure:**
- [x] Create `backend/tests/conftest.py` with comprehensive pytest fixtures
- [x] Create test database fixtures (in-memory SQLite)
- [x] Create authentication fixtures (test users, JWT tokens)
- [x] Create sample data fixtures (recipes, libraries, etc.)
- [x] Create `backend/tests/utils/factories.py` with Faker-based data factories
- [x] Create `backend/tests/utils/helpers.py` with test helper functions
- [x] Add bcrypt to requirements.txt for password hashing

**Frontend Infrastructure:**
- [x] Install testing dependencies (Vitest, React Testing Library, MSW, jsdom)
- [x] Create `frontend/vitest.config.ts` with coverage configuration
- [x] Create `frontend/src/test/setup.ts` for test environment
- [x] Create `frontend/src/test/test-utils.tsx` with custom render function
- [x] Create MSW mock handlers (`frontend/src/test/mocks/handlers.ts`)
- [x] Create MSW server setup (`frontend/src/test/mocks/server.ts`)
- [x] Create mock data generators (`frontend/src/test/mocks/data.ts`)

### Phase 2: Core Unit Tests ✅ COMPLETE

**Backend Unit Tests (53 tests):**
- [x] `test_auth_service.py` - 24 tests covering:
  - Password hashing and verification (4 tests)
  - JWT token creation and validation (8 tests)
  - User database queries (4 tests)
  - User authentication flows (4 tests)
  - User creation (4 tests)

- [x] `test_recipe_service.py` - 29 tests covering:
  - Recipe retrieval (2 tests)
  - Recipe filtering and search (9 tests)
  - Pagination (3 tests)
  - Recipe creation (5 tests)
  - Recipe updates (6 tests)
  - Recipe deletion (1 test)
  - Ownership checks (2 tests)

**Test Results:**
- ✅ 56 total tests passing (53 new + 3 existing)
- ✅ 73% overall coverage
- ✅ 100% coverage on `auth_service.py`
- ✅ 100% coverage on `recipe_service.py`

### Phase 3: Integration Tests ⏳ PENDING

**Planned Integration Tests (~70 tests):**
- [ ] User API integration tests (~15 tests)
  - Registration, login, profile updates
  - Authentication error scenarios
  - Token validation

- [ ] Recipe API integration tests (~25 tests)
  - Full CRUD operations via HTTP
  - Filter and search endpoints
  - Pagination
  - Authorization checks

- [ ] Library API integration tests (~15 tests)
  - Library CRUD operations
  - Recipe-library associations
  - Ownership verification

- [ ] Share API integration tests (~15 tests)
  - Share creation with tokens
  - Public/private share access
  - Permission levels
  - Expiration handling

### Phase 4: E2E Tests ⏳ PENDING

**Planned E2E Tests (~10 tests):**
- [ ] Complete user registration → recipe creation workflow
- [ ] Full recipe management workflow (create → update → search → delete)
- [ ] Sharing workflow (create share → access → revoke)
- [ ] Library organization workflow
- [ ] Multi-user collaboration scenarios

### Phase 5: Frontend Tests ⏳ PENDING

**Planned Frontend Tests (~155 tests):**

**Component Tests:**
- [ ] AuthContext tests (~15 tests)
- [ ] RecipeForm tests (~25 tests)
- [ ] RecipeCard tests (~10 tests)
- [ ] LoginPage tests (~15 tests)
- [ ] Other component tests (~20 tests)

**API Client Tests:**
- [ ] authApi tests (~10 tests)
- [ ] recipeApi tests (~15 tests)
- [ ] libraryApi tests (~10 tests)

**Page Integration Tests:**
- [ ] RecipesPage tests (~15 tests)
- [ ] CreateRecipePage tests (~5 tests)
- [ ] EditRecipePage tests (~5 tests)
- [ ] RecipeDetailPage tests (~10 tests)

**E2E User Flow Tests:**
- [ ] Complete recipe creation flow (~5 tests)

### Phase 6: CI/CD & Polish ⏳ PENDING

- [ ] Update `.github/workflows/frontend-ci.yml` for proper test execution
- [ ] Add coverage reporting to CI/CD
- [ ] Run full test suite and verify coverage goals
- [ ] Documentation updates

---

## Completed Work

### Backend Testing Infrastructure

#### 1. Fixtures (`backend/tests/conftest.py`)

**Database Fixtures:**
```python
@pytest_asyncio.fixture
async def test_db() -> AsyncSession:
    """In-memory SQLite database, isolated per test"""
    # Creates fresh database for each test
    # Automatic rollback after test completion
```

**Authentication Fixtures:**
```python
@pytest_asyncio.fixture
async def test_user(test_db) -> User:
    """Pre-created test user with credentials:
    - username: testuser
    - password: testpassword123
    - email: test@example.com
    """

@pytest.fixture
def auth_headers(test_user) -> dict:
    """JWT Bearer token headers for authenticated requests"""
```

**Sample Data Fixtures:**
```python
@pytest_asyncio.fixture
async def test_recipe(test_db, test_user) -> Recipe:
    """Complete recipe with ingredients and instructions"""

@pytest_asyncio.fixture
async def test_library(test_db, test_user) -> RecipeLibrary:
    """Test recipe library"""

@pytest.fixture
def sample_ingredients() -> list[IngredientSchema]:
    """Sample ingredients for recipe creation"""

@pytest.fixture
def sample_instructions() -> list[InstructionSchema]:
    """Sample instructions for recipe creation"""
```

#### 2. Test Data Factories (`backend/tests/utils/factories.py`)

Uses Faker library to generate realistic test data:

- `UserFactory` - Generate random users with realistic names and emails
- `RecipeFactory` - Generate recipes with varied cuisines, difficulties, ingredients
- `LibraryFactory` - Generate recipe libraries
- `ShareFactory` - Generate recipe/library shares with tokens

**Example Usage:**
```python
from tests.utils.factories import RecipeFactory

# Create recipe data with overrides
recipe_data = RecipeFactory.create(
    owner_id=user.id,
    cuisine_type="Italian",
    difficulty_level="easy"
)
```

#### 3. Test Helper Functions (`backend/tests/utils/helpers.py`)

Convenience functions for common test operations:

```python
# Quick user creation
user = await create_test_user(db, username="john", email="john@example.com")

# Quick recipe creation
recipe = await create_test_recipe(db, owner=user, title="Pasta")

# Generate auth headers
headers = generate_auth_headers(user)

# Assertion helpers
assert_recipe_matches(actual, expected)
assert_library_matches(actual, expected)
```

### Frontend Testing Infrastructure

#### 1. Vitest Configuration (`frontend/vitest.config.ts`)

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      lines: 75,
      functions: 75,
      branches: 75,
      statements: 75,
    },
  },
});
```

#### 2. Test Environment Setup (`frontend/src/test/setup.ts`)

- Imports `@testing-library/jest-dom` matchers
- Configures MSW server with beforeAll/afterEach/afterAll hooks
- Automatic cleanup after each test

#### 3. Custom Render Utilities (`frontend/src/test/test-utils.tsx`)

```typescript
// Wraps components with all necessary providers
const AllTheProviders = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
);

// Custom render function
export { customRender as render };
```

**Usage:**
```typescript
import { render, screen } from '../test/test-utils';

test('component renders', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

#### 4. MSW Mock Handlers (`frontend/src/test/mocks/`)

Complete API mocking setup:

**handlers.ts:**
- Auth endpoints (register, login, getCurrentUser, updateProfile)
- Recipe endpoints (list, get, create, update, delete)
- Library endpoints (full CRUD)

**server.ts:**
- MSW server configuration for Node environment

**data.ts:**
- Mock data generators: `mockUser()`, `mockRecipe()`, `mockLibrary()`, `mockToken()`

---

## Testing Patterns & Standards

### Backend Testing Patterns

#### 1. AAA Pattern (Arrange-Act-Assert)

```python
@pytest.mark.asyncio
async def test_create_recipe_success(test_db, test_user, sample_ingredients, sample_instructions):
    # Arrange - Set up test data
    recipe_data = RecipeCreate(
        title="Test Recipe",
        ingredients=sample_ingredients,
        instructions=sample_instructions,
        # ... other fields
    )

    # Act - Execute the function
    recipe = await recipe_service.create_recipe(test_db, recipe_data, test_user)

    # Assert - Verify results
    assert recipe.id is not None
    assert recipe.title == "Test Recipe"
    assert recipe.owner_id == test_user.id
```

#### 2. Async Testing

All database operations use `@pytest.mark.asyncio`:

```python
@pytest.mark.asyncio
async def test_function_name(test_db, test_user):
    result = await some_async_function(test_db)
    assert result is not None
```

#### 3. Fixture Composition

Compose fixtures for complex scenarios:

```python
@pytest_asyncio.fixture
async def test_recipe_in_library(test_db, test_user, test_library):
    """Recipe that belongs to a library"""
    return await create_test_recipe(
        test_db,
        test_user,
        library=test_library
    )
```

#### 4. Exception Testing

Test error scenarios with pytest.raises:

```python
def test_check_ownership_not_owner_raises_403(test_recipe, test_user2):
    with pytest.raises(HTTPException) as exc_info:
        recipe_service.check_recipe_ownership(test_recipe, test_user2)

    assert exc_info.value.status_code == 403
```

### Frontend Testing Patterns (Planned)

#### 1. Component Testing Pattern

```typescript
import { render, screen, waitFor } from '../test/test-utils';
import userEvent from '@testing-library/user-event';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);

    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });
  });
});
```

#### 2. API Mocking Pattern

```typescript
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';

test('handles API error', async () => {
  // Override default handler for this test
  server.use(
    http.get('/api/v1/recipes', () => {
      return HttpResponse.json({ error: 'Server error' }, { status: 500 });
    })
  );

  render(<RecipeList />);

  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

### Test Naming Conventions

**Backend:**
- File: `test_<module_name>.py`
- Function: `test_<what_it_tests>_<expected_behavior>()`
- Examples:
  - `test_create_recipe_success()`
  - `test_get_recipes_filter_by_cuisine_type()`
  - `test_authenticate_user_wrong_password()`

**Frontend:**
- File: `<ComponentName>.test.tsx`
- Test: `test('describes the behavior')`
- Examples:
  - `test('renders recipe list correctly')`
  - `test('handles form submission')`
  - `test('shows error on API failure')`

### Coverage Goals

- **Overall:** 80%+ coverage
- **Critical paths (auth, recipe CRUD):** 90%+
- **Service layer:** 85%+
- **API endpoints:** 85%+
- **React components:** 75%+

---

## Remaining Work

### High Priority (Phase 3)

1. **Backend Integration Tests (~70 tests)**
   - User API: registration, login, profile updates
   - Recipe API: full CRUD via HTTP endpoints
   - Library API: library management
   - Share API: sharing workflows

2. **Backend Service Unit Tests (~30 tests)**
   - Library service unit tests
   - Share service unit tests

### Medium Priority (Phase 4-5)

3. **Backend E2E Tests (~10 tests)**
   - Complete user workflows
   - Multi-step operations
   - Cross-feature interactions

4. **Frontend Component Tests (~85 tests)**
   - AuthContext tests
   - RecipeForm tests
   - Page component tests

5. **Frontend API Client Tests (~35 tests)**
   - Auth API client
   - Recipe API client
   - Library API client

### Lower Priority (Phase 6)

6. **Frontend E2E Tests (~5 tests)**
   - Complete user flows through UI

7. **CI/CD Updates**
   - Fix frontend test execution in CI
   - Add coverage reporting

---

## File Structure

### Backend Test Structure

```
backend/tests/
├── __init__.py
├── conftest.py                    # Pytest fixtures (✅ Complete)
├── test_main.py                   # Basic app tests (✅ Existing)
├── utils/
│   ├── __init__.py               # (✅ Complete)
│   ├── factories.py              # Test data factories (✅ Complete)
│   └── helpers.py                # Helper functions (✅ Complete)
├── unit/
│   ├── __init__.py
│   ├── test_auth_service.py      # (✅ Complete - 24 tests)
│   ├── test_recipe_service.py    # (✅ Complete - 29 tests)
│   ├── test_library_service.py   # (⏳ Pending)
│   └── test_share_service.py     # (⏳ Pending)
├── integration/
│   ├── __init__.py
│   ├── test_users_api.py         # (⏳ Pending)
│   ├── test_recipes_api.py       # (⏳ Pending)
│   ├── test_libraries_api.py     # (⏳ Pending)
│   └── test_sharing_api.py       # (⏳ Pending)
└── e2e/
    ├── __init__.py
    └── test_user_journeys.py      # (⏳ Pending)
```

### Frontend Test Structure

```
frontend/src/
├── test/
│   ├── setup.ts                   # (✅ Complete)
│   ├── test-utils.tsx             # (✅ Complete)
│   ├── mocks/
│   │   ├── data.ts               # (✅ Complete)
│   │   ├── handlers.ts           # (✅ Complete)
│   │   └── server.ts             # (✅ Complete)
│   └── e2e/
│       └── user-flows.test.tsx   # (⏳ Pending)
├── contexts/
│   └── AuthContext.test.tsx      # (⏳ Pending)
├── components/
│   └── recipes/
│       ├── RecipeForm.test.tsx   # (⏳ Pending)
│       └── RecipeCard.test.tsx   # (⏳ Pending)
├── pages/
│   ├── RecipesPage.test.tsx      # (⏳ Pending)
│   ├── CreateRecipePage.test.tsx # (⏳ Pending)
│   ├── EditRecipePage.test.tsx   # (⏳ Pending)
│   └── RecipeDetailPage.test.tsx # (⏳ Pending)
└── services/
    ├── authApi.test.ts           # (⏳ Pending)
    ├── recipeApi.test.ts         # (⏳ Pending)
    └── libraryApi.test.ts        # (⏳ Pending)
```

---

## How to Run Tests

### Backend Tests

```bash
# Run all tests
cd backend
pytest tests/ -v

# Run specific test file
pytest tests/unit/test_auth_service.py -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html

# Run specific test
pytest tests/unit/test_auth_service.py::test_password_hash_is_different_from_plain_password -v

# Run tests matching pattern
pytest tests/ -k "auth" -v
```

### Frontend Tests

```bash
# Run all tests
cd frontend
npm test

# Run tests in watch mode
npm test -- --watch

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

### CI/CD

Tests automatically run on:
- Push to `main`, `develop`, or `claude/**` branches
- Pull requests to these branches

**Backend CI:**
- Linting (ruff)
- Formatting (black)
- Type checking (mypy)
- Tests with coverage

**Frontend CI:**
- Linting (ESLint)
- Type checking (tsc)
- Build verification
- Tests (needs implementation)

---

## Next Steps

### Immediate (Next Session)

1. **Implement Backend Integration Tests**
   - Start with User API tests (authentication flows)
   - Then Recipe API tests (most critical endpoints)
   - Follow patterns from unit tests

2. **Implement Library & Share Service Unit Tests**
   - Follow patterns from auth/recipe service tests
   - Use existing fixtures and helpers

### Short Term (Week 1-2)

3. **Implement Frontend Component Tests**
   - Start with AuthContext (critical for all features)
   - Then RecipeForm (most complex component)
   - Use established MSW mocks

4. **Update CI/CD Workflows**
   - Fix frontend test execution
   - Add coverage reporting
   - Ensure tests run on all PRs

### Medium Term (Week 3-4)

5. **Complete E2E Tests**
   - Backend user journey tests
   - Frontend user flow tests

6. **Coverage Analysis**
   - Identify gaps
   - Add targeted tests
   - Reach 80%+ overall coverage

---

## Success Metrics

### Completed ✅

- [x] Testing infrastructure fully set up
- [x] 56 backend tests passing
- [x] 73% overall backend coverage
- [x] 100% coverage on auth_service.py
- [x] 100% coverage on recipe_service.py
- [x] Clear testing patterns established
- [x] All changes committed and pushed

### In Progress / Pending ⏳

- [ ] 80%+ overall code coverage
- [ ] All critical paths tested (90%+ coverage)
- [ ] Integration tests for all API endpoints
- [ ] E2E tests for main user workflows
- [ ] Frontend component test coverage
- [ ] CI/CD running all tests successfully

---

## References

- **Comprehensive Plan:** `~/.claude/plans/cuddly-mapping-hopcroft.md`
- **Project Docs:** `README.md`, `CLAUDE.md`
- **Backend Tests:** `backend/tests/`
- **Frontend Test Setup:** `frontend/src/test/`
- **Coverage Reports:** `backend/htmlcov/index.html` (after running tests)

---

## Notes

### Key Decisions Made

1. **In-Memory SQLite for Tests:** Fast, isolated, no cleanup needed
2. **Faker for Test Data:** Realistic, varied data for comprehensive testing
3. **MSW for Frontend Mocking:** Industry standard, realistic API mocking
4. **AAA Pattern:** Clear, consistent test structure
5. **Async Throughout:** Proper async/await handling for all DB operations

### Lessons Learned

1. **Fixtures First:** Setting up comprehensive fixtures upfront made test writing much faster
2. **Pattern Establishment:** First tests establish patterns that make subsequent tests easier
3. **Helper Functions:** Utility functions significantly reduce test boilerplate
4. **Coverage Feedback:** Running tests with coverage immediately identifies gaps

### Common Pitfalls to Avoid

1. **Don't Skip Fixtures:** Always use proper fixtures instead of manual setup
2. **Avoid Timing Assertions:** Token expiration tests should check structure, not exact times
3. **Isolate Tests:** Each test should be independent (database rollback handles this)
4. **Test Behavior, Not Implementation:** Focus on what the code does, not how

---

**Last Updated:** 2026-01-03
**Status:** Phase 1 & 2 Complete - Ready for Phase 3 (Integration Tests)

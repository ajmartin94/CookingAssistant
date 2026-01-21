# Playwright Patterns for CookingAssistant

Project-specific patterns for E2E tests in this codebase.

## Project Structure

```
e2e/
├── fixtures/auth.fixture.ts    # Authenticated page fixture
├── pages/*.page.ts             # Page objects
├── utils/api.ts                # APIHelper for direct API calls
├── utils/test-data.ts          # Test data generators
└── tests/{feature}/*.spec.ts   # Test files
```

## Using the Auth Fixture

```typescript
import { test, expect } from '../../fixtures/auth.fixture';

test('authenticated user action', async ({ authenticatedPage, testUser }) => {
  // authenticatedPage is already logged in
  // testUser has: username, email, password
});
```

## Using APIHelper for Outcome Verification

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

## Page Objects

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

## Waiting Patterns

### Good: Wait for specific conditions

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

### Bad: Hardcoded waits

```typescript
// DON'T DO THIS
await page.waitForTimeout(5000);
```

## Test File Location

```
e2e/tests/{feature}/{story}.spec.ts

Examples:
- e2e/tests/chat/create-recipe-via-chat.spec.ts
- e2e/tests/recipes/edit-recipe.spec.ts
- e2e/tests/libraries/add-recipe-to-library.spec.ts
```

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
```

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

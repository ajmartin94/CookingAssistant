# Testing Strategy Reform Plan

> **Status:** Draft - Pending Review
> **Created:** 2026-01-21
> **Problem:** Tests pass but features don't work. TDD verifies implementation, not outcomes.

---

## Executive Summary

This plan has two parts:

**Part A: Fix Current Issues**
- Fix the broken chat tool execution (TODO in backend)
- Rewrite tests that don't verify outcomes
- Add missing database verification to integration tests

**Part B: Prevent Future Issues**
- Test Planning Skill — Forces outcome-first thinking
- Outcome Verification Helpers — Makes correct testing the default
- Review Checklist — Human gate for test quality

---

# PART A: FIX CURRENT ISSUES

---

## A1: Fix Chat Tool Execution (Critical)

### The Problem

`/backend/app/api/chat.py:325-336` has a TODO that prevents tool execution:

```python
if request.approved:
    executor.approve_tool_call(request.tool_call_id)

    # TODO: Register tool handlers and execute  <-- LINE 332
    return ToolConfirmResponse(
        status="approved",
        result={"message": "Tool approved (execution not yet implemented)"},
    )
```

When a user approves a tool call, nothing happens. The API returns "approved" but no recipe is created/edited.

### The Fix

1. Register tool handlers with the executor
2. Call `executor.execute_tool_call()` with db session and user context
3. Return actual execution result

```python
if request.approved:
    executor.approve_tool_call(request.tool_call_id)

    # Register handlers
    handlers = get_recipe_tool_handlers()
    for name, handler in handlers.items():
        executor.register_tool(name, handler)

    # Execute with context
    result = await executor.execute_tool_call(
        request.tool_call_id,
        db=db,
        user=current_user
    )

    return ToolConfirmResponse(
        status="approved",
        result=result,
    )
```

### Verification

After this fix, the E2E test `chat.createRecipeAndVerify()` should pass — a recipe should actually exist in the database after approval.

### Related Bead

`CookingAssistant-41z` — "Implement tool execution for chat create_recipe"

---

## A2: Fix E2E Tests That Don't Verify Outcomes

### Tests to Rewrite

| File | Test | Current Problem | Fix |
|------|------|-----------------|-----|
| `chat-flows.spec.ts` | `should execute tool when approved and show result` | Only checks `status === 'approved'` | Verify recipe count increased |
| `chat-flows.spec.ts` | `should create recipe via chat and verify tool approval flow` | Only checks approval status | Verify recipe exists in DB |
| `chat-flows.spec.ts` | `should show edit tool confirmation when requesting recipe edit` | Only checks approval status | Verify recipe was modified |

### Example Rewrite

**Before (Current):**
```typescript
test('should create recipe via chat and verify tool approval flow', async () => {
  await chatPage.sendMessage('Create a simple cake recipe for me');
  await chatPage.waitForToolConfirmation();
  await chatPage.approveTool();

  expect(confirmData.status).toBe('approved');  // ENDS HERE
});
```

**After (Fixed):**
```typescript
test('should create recipe via chat and verify recipe exists', async () => {
  // Capture initial state
  const initialRecipes = await api.getRecipes(token);
  const initialCount = initialRecipes.length;

  // User action
  await chatPage.sendMessage('Create a simple cake recipe for me');
  await chatPage.waitForToolConfirmation();
  await chatPage.approveTool();

  // Verify OUTCOME
  const finalRecipes = await api.getRecipes(token);
  expect(finalRecipes.length).toBe(initialCount + 1);

  // Verify recipe content
  const newRecipe = finalRecipes.find(r => !initialRecipes.some(ir => ir.id === r.id));
  expect(newRecipe).toBeDefined();
  expect(newRecipe.ingredients.length).toBeGreaterThan(0);
});
```

---

## A3: Add Database Verification to Integration Tests

### Tests to Fix

| File | Pattern | Fix |
|------|---------|-----|
| `test_recipes_api.py` | POST returns 201, checks response only | Query DB to verify recipe persisted |
| `test_recipes_api.py` | PUT returns 200, checks response only | Query DB to verify changes saved |
| `test_chat_api.py` | POST /confirm returns "approved" | Query DB to verify tool created data |
| `test_libraries_api.py` | POST returns 201, checks response only | Query DB to verify library persisted |

### Example Fix

**Before:**
```python
async def test_create_recipe_success(client, auth_headers, sample_ingredients):
    response = await client.post("/api/v1/recipes", headers=auth_headers, json={...})

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "New Recipe"  # Only checks response
```

**After:**
```python
async def test_create_recipe_success(client, auth_headers, sample_ingredients, test_db):
    response = await client.post("/api/v1/recipes", headers=auth_headers, json={...})

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "New Recipe"

    # ALSO verify database state
    recipe = await test_db.get(Recipe, data["id"])
    assert recipe is not None
    assert recipe.title == "New Recipe"
    assert len(recipe.ingredients) == len(sample_ingredients)
```

---

## A4: Reduce Mock-Heavy Unit Tests

### Problem Tests

| File | Issue |
|------|-------|
| `test_tool_executor.py` | Tests verify `mock_handler.assert_called_once()` — testing mocks, not code |
| `test_recipe_tools.py` | Every test mocks the recipe service — never tests actual handler logic |

### Strategy

Keep mocks for:
- External services (LLM provider)
- Database (in true unit tests)

Remove mocks for:
- Internal service calls (test the integration)
- Tool handlers (test with real recipe service against test DB)

### Example Fix

**Before:**
```python
async def test_execute_approved_tool_call(executor):
    mock_handler = AsyncMock(return_value={"recipe_id": "123"})
    executor.register_tool("create_recipe", mock_handler)

    result = await executor.execute_tool_call("call_123")

    mock_handler.assert_called_once()  # Testing the mock
```

**After:**
```python
async def test_execute_approved_tool_call(executor, test_db, test_user):
    # Use real handler
    executor.register_tool("create_recipe", create_recipe_handler)

    result = await executor.execute_tool_call("call_123", db=test_db, user=test_user)

    # Verify actual outcome
    assert result["success"] is True
    recipe = await test_db.get(Recipe, result["recipe_id"])
    assert recipe is not None
```

---

## A5: Fix Error Message Verification

### Tests to Fix

Integration tests that only check status codes should also verify error messages are helpful:

```python
# Before
async def test_create_recipe_missing_title(client, auth_headers):
    response = await client.post("/api/v1/recipes", json={...})
    assert response.status_code == 422  # Only status

# After
async def test_create_recipe_missing_title(client, auth_headers):
    response = await client.post("/api/v1/recipes", json={...})
    assert response.status_code == 422
    error = response.json()
    assert "title" in str(error["detail"]).lower()  # Verify helpful message
```

---

## A6: Summary of Current Issues to Fix

| Priority | Issue | Location | Fix |
|----------|-------|----------|-----|
| **Critical** | Tool execution not implemented | `backend/app/api/chat.py:332` | Wire up handlers and execute |
| **Critical** | Chat E2E tests don't verify outcomes | `e2e/tests/chat/chat-flows.spec.ts` | Add DB verification |
| **High** | Integration tests don't verify DB state | `backend/tests/integration/*.py` | Query DB after mutations |
| **High** | Unit tests mock too heavily | `backend/tests/unit/test_tool_*.py` | Use real handlers where possible |
| **Medium** | Error messages not verified | `backend/tests/integration/*.py` | Check error details |
| **Medium** | Ownership isolation incomplete | `backend/tests/integration/test_recipes_api.py` | Verify other user's data NOT returned |

---

# PART B: PREVENT FUTURE ISSUES

---

## B1: Test Planning Skill

### Purpose

A skill invoked before writing tests that forces articulation of what user experience we're protecting and what outcome proves it works.

### Workflow

```
Developer: "I need to write tests for the chat recipe creation feature"
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│  /test-planning skill activated                         │
│                                                         │
│  Questions:                                             │
│  1. What user action are we testing?                    │
│     → "User asks AI to create a recipe and approves"    │
│                                                         │
│  2. What does SUCCESS look like to the user?            │
│     → "A new recipe appears in their recipe list"       │
│                                                         │
│  3. What database/API state change proves it worked?    │
│     → "Recipe count increases by 1, new recipe exists"  │
│                                                         │
│  4. What should happen if it FAILS?                     │
│     → "Error message shown, no partial data created"    │
└─────────────────────────────────────────────────────────┘
     │
     ▼
Skill generates test skeleton with outcome verification built in
```

### Skill Output

The skill produces a test skeleton that includes outcome verification:

```typescript
/**
 * User Experience Being Protected:
 * User asks AI to create a recipe and approves the tool call.
 *
 * Success Criteria:
 * - New recipe appears in user's recipe list
 * - Recipe has expected content (title, ingredients, instructions)
 *
 * Failure Criteria:
 * - Error message displayed
 * - No partial/corrupt data in database
 */
test('user creates recipe via AI chat', async () => {
  // SETUP: Capture initial state
  const initialRecipes = await api.getRecipes(token);
  const initialCount = initialRecipes.length;

  // ACTION: User performs the journey
  await page.goto('/recipes');
  await chat.expandChat();
  await chat.sendMessage('Create a pancake recipe');
  await chat.waitForToolConfirmation();
  await chat.approveTool();

  // OUTCOME: Verify user-visible result
  const finalRecipes = await api.getRecipes(token);
  expect(finalRecipes.length).toBe(initialCount + 1);

  // OUTCOME: Verify data integrity
  const newRecipe = finalRecipes.find(r => !initialRecipes.some(ir => ir.id === r.id));
  expect(newRecipe).toBeDefined();
  expect(newRecipe.title.toLowerCase()).toContain('pancake');
  expect(newRecipe.ingredients.length).toBeGreaterThan(0);
  expect(newRecipe.instructions.length).toBeGreaterThan(0);

  // OUTCOME: Verify user can see it
  await page.goto('/recipes');
  await expect(page.getByText(newRecipe.title)).toBeVisible();
});
```

### Skill Location

```
.claude/skills/test-planning.md
```

### When to Invoke

- Before writing tests for any new feature
- Before writing tests for any bug fix
- When reviewing test coverage gaps

---

## B2: Outcome Verification Helpers

### Purpose

A library of helper functions that bundle user actions with outcome verification. Using these helpers makes it impossible to write a test that doesn't verify outcomes.

### Directory Structure

```
e2e/
├── helpers/
│   ├── index.ts           # Re-exports all helpers
│   ├── chat.helpers.ts    # Chat/AI interaction helpers
│   ├── recipe.helpers.ts  # Recipe CRUD helpers
│   ├── auth.helpers.ts    # Authentication helpers
│   ├── library.helpers.ts # Library management helpers
│   └── base.helpers.ts    # Shared utilities (API client, DB queries)
├── tests/
│   └── ... (test files use helpers)
└── ...
```

### Helper Design Pattern

Each helper follows this pattern:

```typescript
async function [action]AndVerify(params): Promise<Result> {
  // 1. Capture state BEFORE
  const before = await getRelevantState();

  // 2. Perform the user action
  await performAction(params);

  // 3. Capture state AFTER
  const after = await getRelevantState();

  // 4. Assert outcome (THROWS if not met)
  assertOutcome(before, after);

  // 5. Return result for further assertions
  return extractResult(after);
}
```

### Chat Helpers

```typescript
// e2e/helpers/chat.helpers.ts

import { Page } from '@playwright/test';
import { APIHelper } from '../utils/api';
import { Recipe } from '../types';

export class ChatHelpers {
  constructor(
    private page: Page,
    private api: APIHelper,
    private token: string
  ) {}

  /**
   * Sends a message requesting recipe creation, approves the tool,
   * and verifies a recipe was actually created.
   *
   * @throws Error if recipe count doesn't increase
   * @returns The newly created recipe
   */
  async createRecipeAndVerify(message: string): Promise<Recipe> {
    // 1. Capture state BEFORE
    const beforeRecipes = await this.api.getRecipes(this.token);
    const beforeCount = beforeRecipes.length;

    // 2. Perform the user action
    await this.expandChat();
    await this.sendMessage(message);
    await this.waitForToolConfirmation();
    await this.approveTool();

    // 3. Capture state AFTER (with retry for async processing)
    const afterRecipes = await this.waitForRecipeCount(beforeCount + 1);

    // 4. Find the new recipe
    const newRecipe = afterRecipes.find(
      r => !beforeRecipes.some(br => br.id === r.id)
    );

    if (!newRecipe) {
      throw new Error(
        'Recipe count increased but could not identify new recipe. ' +
        'This may indicate a test isolation issue.'
      );
    }

    return newRecipe;
  }

  /**
   * Sends a message requesting recipe edit, approves the tool,
   * and verifies the recipe was actually modified.
   *
   * @throws Error if recipe wasn't updated
   * @returns The updated recipe
   */
  async editRecipeAndVerify(
    recipeId: string,
    message: string,
    expectedChanges: Partial<Recipe>
  ): Promise<Recipe> {
    // 1. Capture state BEFORE
    const beforeRecipe = await this.api.getRecipe(this.token, recipeId);

    // 2. Perform the user action
    await this.expandChat();
    await this.sendMessage(message);
    await this.waitForToolConfirmation();
    await this.approveTool();

    // 3. Capture state AFTER
    const afterRecipe = await this.api.getRecipe(this.token, recipeId);

    // 4. Verify changes were applied
    for (const [key, expectedValue] of Object.entries(expectedChanges)) {
      if (afterRecipe[key] !== expectedValue) {
        throw new Error(
          `Expected recipe.${key} to be "${expectedValue}" but got "${afterRecipe[key]}". ` +
          `Recipe edit may have failed.`
        );
      }
    }

    // 5. Verify something actually changed
    if (JSON.stringify(beforeRecipe) === JSON.stringify(afterRecipe)) {
      throw new Error(
        'Recipe was not modified. Tool execution may have failed.'
      );
    }

    return afterRecipe;
  }

  /**
   * Sends a message, approves tool if needed, and verifies
   * no data was created or modified (for read-only operations).
   */
  async queryAndVerifyNoSideEffects(message: string): Promise<string> {
    // 1. Capture state BEFORE
    const beforeRecipes = await this.api.getRecipes(this.token);

    // 2. Perform the action
    await this.expandChat();
    await this.sendMessage(message);
    await this.waitForResponse();

    // 3. Capture state AFTER
    const afterRecipes = await this.api.getRecipes(this.token);

    // 4. Verify no side effects
    if (beforeRecipes.length !== afterRecipes.length) {
      throw new Error(
        `Recipe count changed from ${beforeRecipes.length} to ${afterRecipes.length}. ` +
        `Read-only operation had side effects.`
      );
    }

    return await this.getLastAssistantMessage();
  }

  // --- Low-level methods (still available but not recommended for tests) ---

  async expandChat(): Promise<void> { /* ... */ }
  async sendMessage(message: string): Promise<void> { /* ... */ }
  async waitForToolConfirmation(): Promise<void> { /* ... */ }
  async approveTool(): Promise<void> { /* ... */ }
  async rejectTool(): Promise<void> { /* ... */ }
  async waitForResponse(): Promise<void> { /* ... */ }

  // --- Private helpers ---

  private async waitForRecipeCount(expected: number, timeoutMs = 5000): Promise<Recipe[]> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const recipes = await this.api.getRecipes(this.token);
      if (recipes.length === expected) {
        return recipes;
      }
      await this.page.waitForTimeout(100);
    }
    const actual = await this.api.getRecipes(this.token);
    throw new Error(
      `Timed out waiting for recipe count to be ${expected}. ` +
      `Current count: ${actual.length}. Tool execution may have failed.`
    );
  }
}
```

### Recipe Helpers

```typescript
// e2e/helpers/recipe.helpers.ts

export class RecipeHelpers {
  constructor(
    private page: Page,
    private api: APIHelper,
    private token: string
  ) {}

  /**
   * Creates a recipe via the UI form and verifies it exists in database.
   */
  async createViaFormAndVerify(data: RecipeFormData): Promise<Recipe> {
    const beforeCount = (await this.api.getRecipes(this.token)).length;

    await this.page.goto('/recipes/create');
    await this.fillForm(data);
    await this.submitForm();

    // Wait for redirect to detail page
    await this.page.waitForURL(/\/recipes\/[\w-]+$/);

    // Verify database state
    const afterRecipes = await this.api.getRecipes(this.token);
    if (afterRecipes.length !== beforeCount + 1) {
      throw new Error(
        `Expected recipe count to increase from ${beforeCount} to ${beforeCount + 1}. ` +
        `Form submission may have failed.`
      );
    }

    // Extract ID from URL and fetch full recipe
    const id = this.page.url().split('/').pop()!;
    return await this.api.getRecipe(this.token, id);
  }

  /**
   * Edits a recipe via the UI form and verifies changes persisted.
   */
  async editViaFormAndVerify(
    recipeId: string,
    changes: Partial<RecipeFormData>
  ): Promise<Recipe> {
    const before = await this.api.getRecipe(this.token, recipeId);

    await this.page.goto(`/recipes/${recipeId}/edit`);
    await this.fillForm(changes);
    await this.submitForm();

    // Wait for redirect
    await this.page.waitForURL(`/recipes/${recipeId}`);

    // Verify changes persisted
    const after = await this.api.getRecipe(this.token, recipeId);

    for (const [key, value] of Object.entries(changes)) {
      if (after[key] !== value) {
        throw new Error(
          `Expected ${key} to be "${value}" but got "${after[key]}". ` +
          `Edit may not have persisted.`
        );
      }
    }

    return after;
  }

  /**
   * Deletes a recipe via UI and verifies it no longer exists.
   */
  async deleteViaUIAndVerify(recipeId: string): Promise<void> {
    // Verify recipe exists before
    await this.api.getRecipe(this.token, recipeId); // Throws if not found

    await this.page.goto(`/recipes/${recipeId}`);
    await this.page.getByRole('button', { name: /delete/i }).click();
    await this.page.getByRole('button', { name: /confirm/i }).click();

    // Wait for redirect to list
    await this.page.waitForURL('/recipes');

    // Verify recipe is gone
    try {
      await this.api.getRecipe(this.token, recipeId);
      throw new Error(
        `Recipe ${recipeId} still exists after deletion. Delete may have failed.`
      );
    } catch (e) {
      if (!e.message.includes('404')) {
        throw e; // Re-throw unexpected errors
      }
      // 404 is expected - recipe was deleted
    }
  }
}
```

### Auth Helpers

```typescript
// e2e/helpers/auth.helpers.ts

export class AuthHelpers {
  constructor(private page: Page, private api: APIHelper) {}

  /**
   * Registers a new user and verifies they can authenticate.
   */
  async registerAndVerify(
    email: string,
    password: string,
    username: string
  ): Promise<{ user: User; token: string }> {
    await this.page.goto('/register');
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Username').fill(username);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: /register/i }).click();

    // Wait for redirect (indicates success)
    await this.page.waitForURL('/recipes');

    // Verify token was stored
    const token = await this.page.evaluate(() => localStorage.getItem('auth_token'));
    if (!token) {
      throw new Error('Registration appeared successful but no auth token stored.');
    }

    // Verify user can fetch their profile
    const user = await this.api.getCurrentUser(token);
    if (user.email !== email) {
      throw new Error(
        `Expected user email to be "${email}" but got "${user.email}".`
      );
    }

    return { user, token };
  }

  /**
   * Logs in and verifies authentication works.
   */
  async loginAndVerify(
    username: string,
    password: string
  ): Promise<{ user: User; token: string }> {
    await this.page.goto('/login');
    await this.page.getByLabel('Username').fill(username);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: /login/i }).click();

    await this.page.waitForURL('/recipes');

    const token = await this.page.evaluate(() => localStorage.getItem('auth_token'));
    if (!token) {
      throw new Error('Login appeared successful but no auth token stored.');
    }

    // Verify token actually works
    const user = await this.api.getCurrentUser(token);

    return { user, token };
  }

  /**
   * Logs out and verifies session is terminated.
   */
  async logoutAndVerify(): Promise<void> {
    await this.page.getByRole('button', { name: /logout/i }).click();

    // Verify token removed
    const token = await this.page.evaluate(() => localStorage.getItem('auth_token'));
    if (token) {
      throw new Error('Logout appeared successful but auth token still present.');
    }

    // Verify redirect to login
    await this.page.waitForURL('/login');

    // Verify protected routes redirect
    await this.page.goto('/recipes');
    await this.page.waitForURL('/login');
  }
}
```

### Usage in Tests

```typescript
// e2e/tests/chat/chat-create-recipe.spec.ts

import { test, expect } from '../../fixtures/auth.fixture';
import { ChatHelpers } from '../../helpers/chat.helpers';
import { APIHelper } from '../../utils/api';

test.describe('Chat - Recipe Creation', () => {
  let chat: ChatHelpers;
  let api: APIHelper;

  test.beforeEach(async ({ authenticatedPage, request }) => {
    api = new APIHelper(request);
    const token = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );
    chat = new ChatHelpers(authenticatedPage, api, token!);
  });

  test('user creates recipe via AI chat', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');

    // Helper verifies outcome automatically - test fails if recipe not created
    const recipe = await chat.createRecipeAndVerify(
      'Create a simple pancake recipe'
    );

    // Additional assertions about the created recipe
    expect(recipe.title.toLowerCase()).toContain('pancake');
    expect(recipe.ingredients.length).toBeGreaterThan(0);
    expect(recipe.instructions.length).toBeGreaterThan(0);
  });

  test('user edits recipe via AI chat', async ({ authenticatedPage }) => {
    // Setup: create a recipe first
    const original = await api.createRecipe(token, { title: 'Test Recipe', ... });

    await authenticatedPage.goto(`/recipes/${original.id}`);

    // Helper verifies the edit actually happened
    const updated = await chat.editRecipeAndVerify(
      original.id,
      'Change the title to "Updated Recipe"',
      { title: 'Updated Recipe' }
    );

    expect(updated.title).toBe('Updated Recipe');
  });
});
```

---

## B3: Review Checklist

### Purpose

A human verification gate ensuring tests actually verify outcomes, even if helpers weren't used.

### PR Template Addition

```markdown
<!-- .github/PULL_REQUEST_TEMPLATE.md -->

## Test Coverage

### For each new/modified test, answer:

| Test Name | User Experience Protected | How User Knows If Broken | Outcome Verified |
|-----------|---------------------------|--------------------------|------------------|
| `test('...')` | _What does user want?_ | _What would user see?_ | _DB/API check?_ |

### Checklist

- [ ] E2E tests verify **outcomes** (database state, data exists), not just UI states
- [ ] E2E tests do **not** use `page.route()` to mock our own backend
- [ ] Integration tests verify database state after mutations
- [ ] Used outcome helpers where applicable (`createAndVerify`, etc.)
- [ ] Test names describe **user goal**, not implementation detail
```

### Reviewer Checklist

```markdown
<!-- Added to repo's CODEOWNERS or review guidelines -->

## Test Review Checklist

When reviewing tests, verify:

1. **Outcome Verification**
   - [ ] After create: Test queries API/DB to confirm data exists
   - [ ] After update: Test queries API/DB to confirm changes persisted
   - [ ] After delete: Test queries API/DB to confirm data is gone

2. **No False Positives**
   - [ ] Tests would FAIL if the feature was broken
   - [ ] Tests don't just check response status codes
   - [ ] Tests don't just check UI elements appeared

3. **Helper Usage**
   - [ ] Used `*AndVerify` helpers for common operations
   - [ ] If not using helpers, manually verifies outcomes

4. **User Focus**
   - [ ] Test name describes what user is trying to do
   - [ ] Test comments explain what user experience is protected
```

---

# IMPLEMENTATION PLAN

---

## Phase 1: Fix Critical Issues (Immediate)

**Goal:** Make the app actually work. Fix the broken feature first.

| Task | Owner | Deliverable |
|------|-------|-------------|
| 1.1 Fix tool execution TODO | Dev | `backend/app/api/chat.py` wires up handlers |
| 1.2 Write outcome-verifying E2E test | Dev | Test that fails without 1.1, passes with it |
| 1.3 Close bead CookingAssistant-41z | Dev | Bead marked complete with commit ref |

**Exit Criteria:** User can ask AI to create a recipe, approve it, and see the recipe in their list.

---

## Phase 2: Build Prevention Infrastructure (Week 1-2)

**Goal:** Create the tools that make good testing easy.

| Task | Owner | Deliverable |
|------|-------|-------------|
| 2.1 Create outcome helper library | Dev | `e2e/helpers/*.ts` with `*AndVerify` pattern |
| 2.2 Create test-planning skill | Dev | `.claude/skills/test-planning.md` |
| 2.3 Update PR template | Dev | `.github/PULL_REQUEST_TEMPLATE.md` |
| 2.4 Document in TESTING.md | Dev | Updated docs with helper usage examples |

**Exit Criteria:** New tests can use helpers; skill generates proper test skeletons.

---

## Phase 3: Fix Existing Test Gaps (Week 2-3)

**Goal:** Bring existing tests up to standard.

| Task | Owner | Deliverable |
|------|-------|-------------|
| 3.1 Rewrite chat E2E tests | Dev | All chat tests use helpers, verify outcomes |
| 3.2 Add DB verification to integration tests | Dev | CRUD tests query DB after mutations |
| 3.3 Reduce mock-heavy unit tests | Dev | Tool executor tests use real handlers |
| 3.4 Add error message verification | Dev | Integration tests check error details |

**Exit Criteria:** All tests in audit "needs work" category are fixed.

---

## Phase 4: Enforcement (Ongoing)

**Goal:** Ensure new code follows the standard.

| Task | Owner | Deliverable |
|------|-------|-------------|
| 4.1 Reviewer training | Team | Team knows what to look for |
| 4.2 Review checklist enforcement | Reviewers | PRs blocked without outcome verification |
| 4.3 Monitor and iterate | Team | Track bugs caught vs. missed |

**Exit Criteria:** Zero "tests pass but feature broken" incidents for 30 days.

---

## Success Criteria

### How We Know This Worked

1. **No more "tests pass but feature broken"** — The TODO in chat.py would have been caught immediately

2. **Tests catch real regressions** — When something breaks, tests fail with clear error messages

3. **Test names describe user goals** — Reading test names tells you what users can do

4. **Helpers used consistently** — New tests use `*AndVerify` helpers by default

### Metrics to Track

| Metric | Current | Target |
|--------|---------|--------|
| E2E tests verifying outcomes | ~30% | 100% |
| Tests using outcome helpers | 0% | 80%+ |
| "Tests pass, feature broken" incidents | Recent | Zero |

---

# APPENDIX: TEST QUALITY ANTI-PATTERNS

### Anti-Pattern 1: UI-Only Verification

```typescript
// BAD: Only checks UI
await chatPage.approveTool();
expect(confirmData.status).toBe('approved');

// GOOD: Verifies outcome
await chatPage.approveTool();
const recipes = await api.getRecipes(token);
expect(recipes.length).toBe(initialCount + 1);
```

### Anti-Pattern 2: Mocking Own Backend in E2E

```typescript
// BAD: Mocks our own API
await page.route('**/api/v1/recipes', route =>
  route.fulfill({ body: JSON.stringify([mockRecipe]) })
);

// GOOD: Hits real backend
const recipes = await api.getRecipes(token);
```

### Anti-Pattern 3: Testing Mocks in Unit Tests

```typescript
// BAD: Tests that mock was called
const mockHandler = AsyncMock();
executor.register_tool('create_recipe', mockHandler);
await executor.execute('call_123');
mockHandler.assert_called_once();  // Testing the mock

// GOOD: Tests actual behavior
const handler = create_recipe_handler;
executor.register_tool('create_recipe', handler);
const result = await executor.execute('call_123');
const recipe = await db.get(Recipe, result.recipe_id);
expect(recipe).toBeDefined();  // Testing real outcome
```

### Anti-Pattern 4: Status Code Only

```typescript
// BAD: Only checks status
const response = await client.post('/api/v1/recipes', { json: data });
expect(response.status).toBe(201);

// GOOD: Verifies data persisted
const response = await client.post('/api/v1/recipes', { json: data });
expect(response.status).toBe(201);
const recipe = await db.get(Recipe, response.json().id);
expect(recipe.title).toBe(data.title);
```

---
name: e2e-red-review
description: Review E2E tests for outcome verification. Fresh context review - you cannot see implementation reasoning. Use when orchestrator requests e2e-red review.
---

# E2E Test Review (RED Phase)

Review E2E tests with **fresh context**. You don't know why the implementer made their choices - only evaluate the artifact.

## Input

From orchestrator:
- Test file paths to review
- Acceptance criteria from bead

## Review Checklist

Apply each criterion. Fail the review if ANY critical item fails.

### Critical (must pass)

- [ ] **Outcome verification**: Test verifies DB/API state after action, not just UI
- [ ] **Would fail if broken**: Test would catch a broken implementation
- [ ] **No self-mocking**: Does NOT use `page.route()` to mock our own backend
- [ ] **Before/after pattern**: Captures state before action, compares after

### Important (should pass)

- [ ] **User-goal naming**: Test name describes user intent, not implementation
- [ ] **Realistic journey**: Test follows actual user flow, not API shortcuts
- [ ] **Acceptance covered**: Test verifies the acceptance criteria from the bead

### Warning (note but don't fail)

- [ ] **Hardcoded waits**: Uses `waitForTimeout()` instead of proper waits
- [ ] **Overly specific selectors**: Uses fragile selectors that may break

## Verification Questions

Ask these about each test:

1. "If the feature was broken, would this test fail?"
2. "Does this test actually query the database/API for the result?"
3. "Could this test pass with a stub that returns success but does nothing?"

## Review Process

1. Read each test file
2. For each test, check:
   - Does it capture state BEFORE the action?
   - Does it verify state via API/DB AFTER?
   - Would it fail if the backend was broken but returned 200?
3. Check for `page.route()` calls mocking our API (auto-fail)
4. Verify test names describe user goals

## Output Format

```
STATUS: PASS|FAIL
CRITERIA_MET:
  - <list items that passed>
CRITERIA_FAILED:
  - <list items that failed with file:line and specifics>
FEEDBACK:
  <if FAIL, specific actionable changes needed>
```

## Examples

### PASS Example

```typescript
// Good: Verifies outcome via API
test('user creates recipe via chat', async ({ page }) => {
  const before = await api.getRecipes(token);
  await chat.sendMessage('Create pancake recipe');
  await chat.approveTool();
  const after = await api.getRecipes(token);
  expect(after.length).toBe(before.length + 1);  // ✓ Outcome verified
});
```

### FAIL Example

```typescript
// Bad: Only checks UI
test('user creates recipe via chat', async ({ page }) => {
  await chat.sendMessage('Create pancake recipe');
  await chat.approveTool();
  await expect(page.getByText('approved')).toBeVisible();  // ✗ No outcome verification
});
```

### FAIL Example (Self-mocking)

```typescript
// Bad: Mocks our own backend
test('user creates recipe', async ({ page }) => {
  await page.route('/api/v1/recipes', route => {
    route.fulfill({ json: { id: '123' } });  // ✗ Testing the mock
  });
  // ...
});
```

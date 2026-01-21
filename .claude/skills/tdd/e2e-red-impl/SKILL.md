---
name: e2e-red-impl
description: Design E2E tests verifying user outcomes using Playwright. Use when orchestrator assigns an e2e-red task. Outputs tests that verify DB/API state, not just UI.
---

# E2E Test Design (RED Phase)

Design Playwright E2E tests that verify **outcomes**, not process.

## Input

From orchestrator:
- Bead ID and title
- Acceptance criteria (what outcome to verify)

## Process

1. Read acceptance criteria from bead
2. Identify the user journey
3. Write Playwright test following outcome pattern (see references/outcome-verification.md)
4. Run test to confirm it FAILS (RED state)

## Test Structure

```typescript
test('user [action] and [outcome]', async ({ page }) => {
  // 1. SETUP: Capture state before
  const before = await api.getResources(token);

  // 2. ACTION: User journey
  await page.goto('/path');
  await page.getByRole('button', { name: 'Action' }).click();
  // ... complete the journey

  // 3. OUTCOME: Verify via API/DB (not UI)
  const after = await api.getResources(token);
  expect(after.length).toBe(before.length + 1);

  // 4. OPTIONAL: Verify UI reflects outcome
  await expect(page.getByText('Success')).toBeVisible();
});
```

## Key Rules

1. **Verify via API/DB** - Don't just check UI elements
2. **Capture before state** - Compare before/after
3. **No mocking backend** - Never use `page.route()` to mock our own API
4. **User-goal names** - Test names describe what user wants, not implementation

## File Location

```
e2e/tests/{feature}/{story}.spec.ts
```

## Output Format

```
STATUS: COMPLETE|FAILED
SUMMARY: <what tests were written>
FILES: <files created>
OUTCOME: <what user outcome this verifies>
TEST_COUNT: <number of tests>
```

## Verification

Run the test - it MUST fail (we haven't implemented yet):

```bash
cd e2e && npx playwright test path/to/test.spec.ts
```

If test passes, something is wrong - either:
- Feature already exists
- Test doesn't verify the right outcome
- Test is checking the wrong thing

## References

- See references/outcome-verification.md for outcome patterns
- See e2e/CLAUDE.md for project-specific Playwright patterns and fixtures

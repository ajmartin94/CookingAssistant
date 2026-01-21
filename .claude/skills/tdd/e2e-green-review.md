---
name: e2e-green-review
description: Review E2E test results for acceptance. Verify tests pass reliably with no workarounds. Use when orchestrator requests e2e-green review.
---

# E2E Verification Review (GREEN Phase)

Review the E2E test results. This is the **acceptance gate** for the feature.

## Input

From orchestrator:
- Test file path
- Test run output
- Any fixes applied during impl

## Review Checklist

### Critical (must pass)

- [ ] **Test passes**: E2E test passes consistently
- [ ] **No flakiness**: Passes on multiple runs (3+)
- [ ] **No test changes**: Test wasn't modified to make it pass
- [ ] **Real verification**: Test still verifies outcomes via API/DB

### Important (should pass)

- [ ] **No workarounds**: No artificial waits, retries, or hacks added
- [ ] **Clean output**: No warnings or deprecation notices
- [ ] **Reasonable speed**: Test completes in reasonable time (<30s typical)

### Warning (note but don't fail)

- [ ] **Screenshot on fail**: Test captures screenshot if it fails
- [ ] **Trace enabled**: Trace capture available for debugging

## Review Process

1. **Run the test yourself** (3 times):
   ```bash
   cd e2e && npx playwright test path/to/test.spec.ts --repeat-each=3
   ```

2. **Check for modifications**:
   ```bash
   git diff e2e/tests/
   ```
   If test file changed since RED phase, verify changes are legitimate.

3. **Verify outcome still tested**:
   Read the test - does it still verify DB/API state?

4. **Check for workarounds**:
   - `waitForTimeout()` with hardcoded values
   - Try/catch swallowing errors
   - Overly loose assertions

## Output Format

```
STATUS: PASS|FAIL
TEST_RUNS: <X/3 passed>
CRITERIA_MET:
  - <list items that passed>
CRITERIA_FAILED:
  - <list items that failed with specifics>
FEEDBACK:
  <if FAIL, what needs to change>
```

## Common Review Failures

### Test was modified

```diff
- expect(recipes.length).toBe(beforeCount + 1);
+ expect(recipes.length).toBeGreaterThan(0);  // ✗ Weakened assertion
```
**Action**: Revert test change, fix implementation instead.

### Hardcoded waits added

```typescript
await page.waitForTimeout(5000);  // ✗ Hardcoded wait
```
**Action**: Use proper wait conditions (`waitForResponse`, `waitForSelector`).

### Flaky results

```
Run 1: PASS
Run 2: FAIL - timeout
Run 3: PASS
```
**Action**: Fix the flakiness before accepting.

## Acceptance

When this review passes, the user story is **functionally complete**. The E2E test proves the feature works end-to-end.

---
name: e2e-green-impl
description: Verify E2E tests pass after backend/frontend implementation. The acceptance gate for outside-in TDD. Use when orchestrator assigns an e2e-green task.
---

# E2E Verification (GREEN Phase)

This is the **acceptance gate**. Backend and frontend are implemented - verify the E2E test now passes.

## Input

From orchestrator:
- Bead ID and title
- E2E test file path (from e2e-red phase)
- Acceptance criteria

## Process

1. Identify the E2E test file from e2e-red phase
2. Run the test
3. If PASS: done
4. If FAIL: diagnose and fix integration issues

## Running Tests

```bash
cd e2e && npx playwright test path/to/test.spec.ts
```

## If Test Fails

The E2E test was written in RED phase and should now pass. If it fails:

### 1. Check the error

```bash
npx playwright test path/to/test.spec.ts --reporter=line
```

### 2. Common issues

| Error | Likely cause | Fix |
|-------|--------------|-----|
| Timeout waiting for element | Frontend not rendering | Check component state, API calls |
| Expected X but got Y | Backend returning wrong data | Check API response, DB state |
| Network error | Backend not running or route wrong | Check server logs, API routes |
| Element not found | Selector changed or element missing | Update selector or fix component |

### 3. Debug interactively

```bash
npx playwright test path/to/test.spec.ts --debug
```

### 4. Fix integration issues

If backend/frontend work individually but not together:
- Check API contract (request/response format)
- Check authentication flow
- Check CORS/headers
- Verify database state after operations

## Output Format

```
STATUS: COMPLETE|FAILED
SUMMARY: <test result summary>
TEST_FILE: <path to test>
RESULT: PASS|FAIL
FAILURES: <if any, describe what failed>
FIX_APPLIED: <if fixed, what was changed>
```

## Success Criteria

The E2E test passes consistently:
- Run 3 times to verify no flakiness
- All assertions pass
- No hardcoded waits or workarounds

```bash
npx playwright test path/to/test.spec.ts --repeat-each=3
```

## This Phase Does NOT

- Write new tests (that was e2e-red)
- Implement features (that was backend-green/frontend-green)
- Change tests to make them pass (that defeats the purpose)

If the test needs to change, go back to e2e-red phase.

# Review Criteria

Criteria for reviewing TDD phase outputs. Apply the relevant section based on phase.

## RED Phase (Test Design)

### Must Pass

- [ ] **Outcome verification**: Test verifies DB/API state, not just response codes
- [ ] **Would fail if broken**: Test would catch a broken implementation
- [ ] **No self-mocking**: Does not mock our own backend/services
- [ ] **User-goal naming**: Test name describes what user is trying to do

### Must Not Have

- [ ] Only checking `response.status === 200`
- [ ] Only checking UI elements exist
- [ ] Mocking internal services (external APIs OK)
- [ ] Implementation-focused names ("test handler calls service")

### Verification Questions

1. "If the feature was broken, would this test fail?"
2. "Does this test actually query the database/API for the result?"
3. "Could this test pass with a stub that returns success but does nothing?"

## GREEN Phase (Implementation)

### Must Pass

- [ ] **Tests pass**: All relevant tests now pass
- [ ] **Minimal changes**: Only changed what's needed to pass tests
- [ ] **No test modification**: Didn't change tests to make them pass
- [ ] **No obvious shortcuts**: Implementation actually does the work

### Must Not Have

- [ ] Hardcoded values that only work for test data
- [ ] Commented-out code or TODOs for core functionality
- [ ] Tests modified to be less strict
- [ ] Side effects not covered by tests

### Verification Questions

1. "Do all the RED phase tests now pass?"
2. "Would this implementation work with different valid inputs?"
3. "Is there a TODO or stub where real logic should be?"

## E2E Specific Criteria

### RED Phase

- [ ] Captures state before user action
- [ ] Performs realistic user journey (not API shortcuts)
- [ ] Verifies state via API after action (not just UI)
- [ ] Does NOT use `page.route()` to mock backend

### GREEN Phase

- [ ] E2E test passes end-to-end
- [ ] No flakiness (passes consistently)
- [ ] Reasonable timeout (not artificially long waits)

## Backend Specific Criteria

### RED Phase

- [ ] Tests both success and error cases
- [ ] Tests verify database state after mutations
- [ ] Tests check error message content, not just status

### GREEN Phase

- [ ] All endpoint tests pass
- [ ] Database operations are transactional
- [ ] Error handling returns helpful messages

## Frontend Specific Criteria

### RED Phase

- [ ] Tests user behavior, not implementation details
- [ ] Tests accessibility where relevant
- [ ] Does not test internal state directly

### GREEN Phase

- [ ] All component tests pass
- [ ] No accessibility violations
- [ ] Works with keyboard navigation where applicable

## Review Output Format

```
STATUS: PASS|FAIL
CRITERIA_MET:
  - [list items that passed]
CRITERIA_FAILED:
  - [list items that failed with specifics]
FEEDBACK:
  [if FAIL, specific actionable feedback for retry]
```

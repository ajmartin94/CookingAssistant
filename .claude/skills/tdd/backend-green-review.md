---
name: backend-green-review
description: Review backend implementation for quality and test compliance. Fresh context review. Use when orchestrator requests backend-green review.
---

# Backend Implementation Review (GREEN Phase)

Review implementation with **fresh context**. Verify tests pass and code is acceptable.

## Input

From orchestrator:
- Implementation file paths
- Test file paths
- Test run output

## Review Checklist

### Critical (must pass)

- [ ] **Tests pass**: All backend-red tests now pass
- [ ] **No test changes**: Tests weren't modified to pass
- [ ] **Minimal implementation**: Only implemented what tests require
- [ ] **No shortcuts**: No hardcoded values, TODOs, or stubs

### Important (should pass)

- [ ] **Follows patterns**: Matches existing project patterns
- [ ] **Error handling**: Appropriate error responses
- [ ] **No regressions**: Full test suite still passes
- [ ] **Type hints**: Functions have proper type annotations

### Warning (note but don't fail)

- [ ] **Documentation**: Complex logic has comments
- [ ] **Logging**: Appropriate log statements

## Review Process

1. **Run tests yourself**:
   ```bash
   cd backend && pytest tests/integration/test_{feature}.py -v
   ```

2. **Check for test modifications**:
   ```bash
   git diff backend/tests/
   ```
   If tests changed, verify changes are legitimate (not weakening assertions).

3. **Review implementation**:
   - Does it do more than tests require?
   - Are there hardcoded values or TODOs?
   - Does it follow project patterns?

4. **Run full suite**:
   ```bash
   cd backend && pytest --tb=short
   ```

## Output Format

```
STATUS: PASS|FAIL
TESTS_RESULT: <X/Y passed>
CRITERIA_MET:
  - <list items that passed>
CRITERIA_FAILED:
  - <list items that failed with specifics>
FEEDBACK:
  <if FAIL, what needs to change>
```

## Common Review Failures

### Tests modified to pass

```diff
# Bad: Weakened assertion
- assert recipe.ingredients == expected_ingredients
+ assert len(recipe.ingredients) > 0  # ✗ Less strict
```
**Action**: Revert test change, fix implementation.

### Hardcoded values

```python
# Bad: Only works for test data
async def create_recipe(...):
    return {"id": "test-123", "title": "Test Recipe"}  # ✗ Hardcoded
```
**Action**: Implement actual logic.

### Over-implementation

```python
# Bad: Tests don't require these features
@router.get("/recipes/{id}/similar")  # ✗ Not tested
@router.get("/recipes/trending")      # ✗ Not tested
```
**Action**: Remove untested code, or add tests first.

### TODO or stub

```python
async def execute_tool(self, tool_call_id: str):
    # TODO: Implement actual execution  # ✗ Stub
    return {"status": "approved"}
```
**Action**: Implement or fail the review.

## References

- See references/review-criteria.md for detailed criteria
- See backend/CLAUDE.md for backend conventions

---
name: backend-red-review
description: Review backend tests for outcome verification. Fresh context review - evaluate artifact only. Use when orchestrator requests backend-red review.
---

# Backend Test Review (RED Phase)

Review pytest tests with **fresh context**. Evaluate the artifact, not the reasoning.

## Input

From orchestrator:
- Test file paths to review
- Acceptance criteria from bead

## Review Checklist

### Critical (must pass)

- [ ] **Database verification**: Tests query DB after mutations, not just response
- [ ] **Would fail if broken**: Tests would catch broken implementation
- [ ] **No over-mocking**: Internal services not mocked (external APIs OK)
- [ ] **Realistic data**: Uses meaningful test data, not empty/minimal

### Important (should pass)

- [ ] **Both paths tested**: Success and error cases covered
- [ ] **Error messages checked**: Error responses verified for helpfulness
- [ ] **User-goal naming**: Test names describe what user wants
- [ ] **Acceptance covered**: Tests verify the bead's acceptance criteria

### Warning (note but don't fail)

- [ ] **Fixtures overused**: Too many fixtures hiding test intent
- [ ] **Assertions unclear**: Multiple assertions without context

## Review Process

1. Read each test file
2. For each test, verify:
   - Does it query `test_db` after mutations?
   - Would it fail if the endpoint returned 200 but didn't save data?
   - Is the service layer being mocked? (fail if yes)
3. Check test names describe user goals

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

```python
# Good: Verifies database state
async def test_create_recipe_persists_to_database(client, auth_headers, test_db):
    response = await client.post("/api/v1/recipes", ...)
    assert response.status_code == 201

    # ✓ Queries database directly
    recipe = await test_db.get(Recipe, response.json()["id"])
    assert recipe is not None
    assert recipe.title == "Test Recipe"
```

### FAIL Example

```python
# Bad: Only checks response
async def test_create_recipe(client, auth_headers):
    response = await client.post("/api/v1/recipes", ...)
    assert response.status_code == 201
    assert response.json()["title"] == "Test Recipe"  # ✗ No DB verification
```

### FAIL Example (Over-mocking)

```python
# Bad: Mocks internal service
async def test_create_recipe(client, auth_headers, mocker):
    mock_service = mocker.patch("app.services.recipe_service.create")
    mock_service.return_value = {"id": "123", ...}  # ✗ Testing the mock

    response = await client.post("/api/v1/recipes", ...)
    mock_service.assert_called_once()  # ✗ Verifying mock, not outcome
```

## References

- See references/review-criteria.md for detailed criteria
- See references/pytest-patterns.md for pytest specifics

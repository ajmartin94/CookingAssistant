---
name: backend-red-impl
description: Design backend tests (pytest) verifying API outcomes. Use when orchestrator assigns a backend-red task. Outputs tests that verify database state, not just response codes.
---

# Backend Test Design (RED Phase)

Design pytest tests that verify **outcomes** - database state changes, not just HTTP status codes.

## Input

From orchestrator:
- Bead ID and title
- Acceptance criteria
- Related E2E test (from e2e-red phase)

## Process

1. Read acceptance criteria and E2E test
2. Identify what backend functionality is needed
3. Write pytest tests following outcome pattern (see references/outcome-verification.md)
4. Run tests to confirm they FAIL (RED state)

## Test Structure

```python
async def test_user_action_creates_expected_outcome(
    client: AsyncClient,
    auth_headers: dict,
    test_db: AsyncSession,
):
    """User [action] should [outcome]."""
    # 1. SETUP: Capture state before
    before_count = await test_db.scalar(select(func.count(Recipe.id)))

    # 2. ACTION: API call
    response = await client.post(
        "/api/v1/recipes",
        headers=auth_headers,
        json=recipe_data,
    )

    # 3. VERIFY: Response
    assert response.status_code == 201
    data = response.json()

    # 4. OUTCOME: Verify database state
    after_count = await test_db.scalar(select(func.count(Recipe.id)))
    assert after_count == before_count + 1

    # Verify the actual record
    recipe = await test_db.get(Recipe, data["id"])
    assert recipe is not None
    assert recipe.title == recipe_data["title"]
```

## Key Rules

1. **Verify database state** - Don't just check response JSON
2. **Use test_db fixture** - Query DB directly after mutations
3. **Test both success and error cases** - Include validation errors
4. **Check error messages** - Verify error responses are helpful

## File Location

```
backend/tests/integration/test_{feature}.py
backend/tests/unit/test_{component}.py
```

## Output Format

```
STATUS: COMPLETE|FAILED
SUMMARY: <what tests were written>
FILES: <files created>
OUTCOME: <what database state this verifies>
TEST_COUNT: <number of tests>
```

## Verification

Run the tests - they MUST fail:

```bash
cd backend && pytest tests/integration/test_{feature}.py -v
```

## When to Use Unit vs Integration Tests

| Test Type | Use For | Mocking |
|-----------|---------|---------|
| Unit | Pure logic, utilities, validators | Mock external deps |
| Integration | API endpoints, DB operations | Real DB, mock external APIs only |

Prefer integration tests for outcome verification.

## References

- See references/outcome-verification.md for outcome patterns
- See backend/CLAUDE.md for project-specific pytest patterns and fixtures

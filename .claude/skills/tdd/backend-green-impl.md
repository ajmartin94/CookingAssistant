---
name: backend-green-impl
description: Implement backend code to pass tests. Use when orchestrator assigns a backend-green task. Write minimal code to make RED tests pass.
---

# Backend Implementation (GREEN Phase)

Implement backend code to make the RED phase tests pass. Write **minimal code** - just enough to pass.

## Input

From orchestrator:
- Bead ID and title
- Test file path (from backend-red phase)
- Failing test output

## Process

1. Read the failing tests
2. Understand what functionality is needed
3. Implement the minimal code to pass
4. Run tests to confirm PASS

## Implementation Guidelines

### 1. Read Tests First

```bash
cd backend && pytest tests/integration/test_{feature}.py -v
```

Understand exactly what the tests expect.

### 2. Implement Minimally

```python
# If test expects POST /api/v1/recipes to create a recipe:
# - Add the route
# - Add the handler
# - Add the service method
# - Add the DB operation

# DON'T:
# - Add extra endpoints not tested
# - Add features not required by tests
# - Refactor unrelated code
```

### 3. Follow Project Patterns

Check existing code for patterns:
- `backend/app/api/` for route patterns
- `backend/app/services/` for service patterns
- `backend/app/models/` for model patterns

### 4. Run Tests

```bash
cd backend && pytest tests/integration/test_{feature}.py -v
```

All tests must pass.

## Output Format

```
STATUS: COMPLETE|FAILED
SUMMARY: <what was implemented>
FILES: <files created/modified>
TESTS_PASSING: <X/Y tests pass>
```

## Common Patterns

### Adding an Endpoint

```python
# backend/app/api/{feature}.py
@router.post("/", response_model=FeatureResponse, status_code=201)
async def create_feature(
    data: FeatureCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = FeatureService(db)
    result = await service.create(data, current_user.id)
    return result
```

### Adding a Service

```python
# backend/app/services/{feature}_service.py
class FeatureService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: FeatureCreate, user_id: str) -> Feature:
        feature = Feature(**data.dict(), owner_id=user_id)
        self.db.add(feature)
        await self.db.commit()
        await self.db.refresh(feature)
        return feature
```

## What This Phase Does NOT Do

- Add tests (that was backend-red)
- Add features beyond what tests require
- Refactor existing code
- Change tests to make them pass

If tests need to change, go back to backend-red phase.

## Verification

```bash
# All backend tests should pass
cd backend && pytest tests/integration/test_{feature}.py -v

# Also run full test suite to check for regressions
cd backend && pytest --tb=short
```

## References

- See references/pytest-patterns.md for project patterns
- See backend/CLAUDE.md for backend conventions

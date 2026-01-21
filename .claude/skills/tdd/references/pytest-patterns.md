# Pytest Patterns for CookingAssistant

Project-specific patterns for backend tests.

## Project Structure

```
backend/tests/
├── conftest.py              # Shared fixtures
├── unit/                    # Service/model tests
├── integration/             # API endpoint tests
├── e2e/                     # User journey tests (backend only)
└── utils/
    ├── factories.py         # Test data factories
    └── helpers.py           # Test helpers
```

## Key Fixtures (from conftest.py)

| Fixture | Provides | Use For |
|---------|----------|---------|
| `test_db` | `AsyncSession` | Direct DB queries |
| `client` | `AsyncClient` | HTTP requests |
| `test_user` | `User` | Authenticated user (testuser/testpassword123) |
| `test_user2` | `User` | Second user for ownership tests |
| `auth_headers` | `dict` | Auth headers for test_user |
| `auth_headers_user2` | `dict` | Auth headers for test_user2 |
| `test_recipe` | `Recipe` | Pre-created recipe |
| `test_library` | `RecipeLibrary` | Pre-created library |
| `sample_ingredients` | `list[IngredientSchema]` | Sample ingredient data |
| `sample_instructions` | `list[InstructionSchema]` | Sample instruction data |

## Test Template

```python
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.recipe import Recipe


class TestFeatureName:
    """Tests for feature description."""

    async def test_user_action_creates_outcome(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_db: AsyncSession,
    ):
        """User [action] should [outcome]."""
        # 1. SETUP: Capture state before
        before_count = await test_db.scalar(
            select(func.count(Recipe.id))
        )

        # 2. ACTION: API call
        response = await client.post(
            "/api/v1/recipes",
            headers=auth_headers,
            json={
                "title": "Test Recipe",
                "description": "Test description",
                "ingredients": [...],
                "instructions": [...],
            },
        )

        # 3. VERIFY: Response
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Test Recipe"

        # 4. OUTCOME: Verify database state
        after_count = await test_db.scalar(
            select(func.count(Recipe.id))
        )
        assert after_count == before_count + 1

        # Verify the actual record
        recipe = await test_db.get(Recipe, data["id"])
        assert recipe is not None
        assert recipe.title == "Test Recipe"
```

## Querying Database in Tests

```python
from sqlalchemy import select, func
from app.models.recipe import Recipe

# Count records
count = await test_db.scalar(select(func.count(Recipe.id)))

# Get by ID
recipe = await test_db.get(Recipe, recipe_id)

# Query with filter
result = await test_db.execute(
    select(Recipe).where(Recipe.owner_id == user_id)
)
recipes = result.scalars().all()

# Check record exists
exists = await test_db.scalar(
    select(Recipe.id).where(Recipe.id == recipe_id)
)
assert exists is not None
```

## Testing Error Cases

```python
async def test_create_recipe_without_auth(self, client: AsyncClient):
    """Unauthenticated request should return 401."""
    response = await client.post(
        "/api/v1/recipes",
        json={"title": "Test"},
    )
    assert response.status_code == 401

async def test_create_recipe_invalid_data(
    self,
    client: AsyncClient,
    auth_headers: dict,
):
    """Invalid data should return 422 with helpful message."""
    response = await client.post(
        "/api/v1/recipes",
        headers=auth_headers,
        json={"title": ""},  # Empty title
    )
    assert response.status_code == 422
    error = response.json()
    assert "title" in str(error["detail"]).lower()
```

## Testing Ownership

```python
async def test_user_cannot_access_other_user_recipe(
    self,
    client: AsyncClient,
    auth_headers_user2: dict,  # Different user
    test_recipe: Recipe,        # Owned by test_user
):
    """User should not access another user's recipe."""
    response = await client.get(
        f"/api/v1/recipes/{test_recipe.id}",
        headers=auth_headers_user2,
    )
    assert response.status_code == 404  # Or 403
```

## Running Tests

```bash
# All backend tests
cd backend && pytest

# Specific file
pytest tests/integration/test_recipes_api.py -v

# Specific test
pytest tests/integration/test_recipes_api.py::TestCreateRecipe::test_user_action -v

# With output
pytest -v -s

# Stop on first failure
pytest -x

# Run tests matching pattern
pytest -k "create_recipe"
```

## File Naming

```
tests/
├── integration/
│   └── test_{resource}_api.py    # test_recipes_api.py
└── unit/
    └── test_{service}_service.py # test_recipe_service.py
```

## When to Use Unit vs Integration

| Test Type | Use For | Database |
|-----------|---------|----------|
| Unit | Pure logic, validators, utils | Mocked or none |
| Integration | API endpoints, services with DB | Real test DB |

**Prefer integration tests** for outcome verification - they test the full stack.

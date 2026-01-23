# Backend Development Guide

**Stack:** FastAPI, SQLAlchemy (async), Pydantic v2, SQLite
**Testing:** pytest, pytest-asyncio

---

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI entry point
│   ├── config.py            # Configuration
│   ├── database.py          # DB connection/session
│   ├── models/              # SQLAlchemy ORM models
│   ├── schemas/             # Pydantic request/response
│   ├── api/v1/              # Route handlers
│   ├── services/            # Business logic
│   ├── ai/                  # AI integration (prompts, client)
│   └── utils/               # Helpers
├── migrations/              # Alembic migrations
├── tests/
│   ├── conftest.py          # Shared fixtures
│   ├── unit/                # Service/model tests
│   ├── integration/         # API endpoint tests
│   └── e2e/                 # User journey tests
└── requirements.txt
```

---

## Key Principles

- **Async everywhere**: Use `async/await` for I/O (DB, HTTP)
- **Type hints**: All functions, arguments, returns
- **Thin routes**: Business logic in `services/`, not `api/`
- **Pydantic validation**: All request/response data
- **FastAPI DI**: Use `Depends()` for DB sessions

---

## Running Tests

```bash
# All tests
pytest

# Specific file
pytest tests/unit/test_recipe_service.py -v

# With coverage
pytest --cov=app tests/

# Watch mode
pytest-watch
```

---

## Common Commands

```bash
# Start dev server
uvicorn app.main:app --reload --port 8000

# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one
alembic downgrade -1

# Type check
mypy app/

# Format
black app/ tests/

# Lint
ruff check app/ tests/
```

---

## Database Conventions

- **UUIDs** for primary keys (string(36))
- **Timestamps**: `created_at`, `updated_at` on all tables
- **JSON columns** for structured data (ingredients, instructions)
- **Foreign keys** for referential integrity
- **Index** frequently queried columns

---

<!-- Per AD-0100 -->
## API Response Conventions

- All API responses use **snake_case** (Python convention)
- Frontend handles transformation to camelCase
- Example: `prep_time_minutes`, `cook_time_minutes`, `dietary_tags`

---

## Adding New Features

1. Define Pydantic schema in `app/schemas/`
2. Create model in `app/models/` (if DB needed)
3. Add service function in `app/services/`
4. Create route in `app/api/v1/`
5. Write tests: integration tests through the API (unit tests only for pure logic)

**Pattern reference**: Read existing files in `app/services/` and `tests/` for conventions.

---

## Testing Patterns

### Key Fixtures (from conftest.py)

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

### Test Template

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

### Querying Database in Tests

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

### Testing Error Cases

```python
async def test_create_recipe_without_auth(self, client: AsyncClient):
    """Unauthenticated request should return 401."""
    response = await client.post("/api/v1/recipes", json={"title": "Test"})
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

### Testing Ownership

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

### File Naming

```
tests/
├── integration/
│   └── test_{resource}_api.py    # test_recipes_api.py
└── unit/
    └── test_{service}_service.py # test_recipe_service.py
```

### Unit vs Integration

| Test Type | Use For | Database | Example |
|-----------|---------|----------|---------|
| Unit | Pure functions: parsing, formatting, calculation, validation | None — no dependencies | `test_scale_amount()`, `test_parse_ingredient()` |
| Integration | Everything else: API endpoints, services, DB operations | Real in-memory DB | `test_create_recipe_api()`, `test_login_returns_token()` |

**Integration tests are the default.** Most tests should hit the real DB through the API.
Unit tests are only for pure functions with meaningful logic — if it needs a DB or mock, it's integration.

**Never mock the database.** Do not mock `AsyncSession`, `test_db`, or any SQLAlchemy objects.
If your test needs data, use fixtures and the real in-memory DB.

### Testing AI Services

The `app/ai/` layer integrates with external LLMs. Test everything except the actual API call:

```python
@pytest.mark.asyncio
async def test_recipe_prompt_includes_user_preferences(test_db, test_user):
    """Prompt construction includes user's dietary restrictions."""
    # Setup: user has dietary preferences
    test_user.dietary_tags = ["vegetarian", "gluten-free"]

    # Build the prompt (don't call the LLM)
    prompt = build_recipe_prompt(user=test_user, request="dinner ideas")

    assert "vegetarian" in prompt
    assert "gluten-free" in prompt

@pytest.mark.asyncio
async def test_parse_ai_recipe_response():
    """Parsing a well-formed AI response extracts recipe fields."""
    canned_response = '{"title": "Pasta", "ingredients": [...], "instructions": [...]}'

    result = parse_ai_recipe_response(canned_response)

    assert result.title == "Pasta"
    assert len(result.ingredients) > 0

@pytest.mark.asyncio
async def test_ai_client_handles_timeout(client, auth_headers):
    """AI endpoint returns helpful error when LLM times out."""
    # Use a stub client that simulates timeout
    response = await client.post(
        "/api/v1/ai/generate-recipe",
        headers=auth_headers,
        json={"prompt": "quick dinner"},
    )

    # Even on timeout, user gets a meaningful response
    assert response.status_code in [200, 503]
```

The LLM is non-deterministic. Everything around it is not. Test everything around it.

---

<!-- Per AD-0101 -->
## Test Enforcement

All PRs must pass `backend-ci` before merge. This includes:
- **Lint**: `ruff check .`
- **Format**: `black --check .`
- **Types**: `mypy app` (errors block merge)
- **Tests**: `pytest` (failures block merge)

See [docs/TESTING.md](../docs/TESTING.md#enforcement-policy) for full enforcement policy.

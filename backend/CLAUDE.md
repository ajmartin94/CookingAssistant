# CLAUDE.md - Backend Development Guide

**Last Updated:** 2026-01-03
**Focus:** FastAPI Backend Development Standards

This guide covers backend-specific conventions, coding standards, and procedures. For general project guidance, see [../CLAUDE.md](../CLAUDE.md).

---

## 📋 Table of Contents

1. [Backend Project Structure](#backend-project-structure)
2. [Python Coding Standards](#python-coding-standards)
3. [Code Organization](#code-organization)
4. [Database Design](#database-design)
5. [Testing Strategy](#testing-strategy)
6. [Common Backend Tasks](#common-backend-tasks)

---

## 📁 Backend Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI application entry point
│   ├── config.py                # Configuration management
│   ├── database.py              # Database connection and session management
│   ├── models/                  # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── recipe.py
│   │   ├── library.py
│   │   └── share.py
│   ├── schemas/                 # Pydantic request/response schemas
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── recipe.py
│   │   ├── library.py
│   │   └── share.py
│   ├── api/                     # API route handlers
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── users.py
│   │   │   ├── recipes.py
│   │   │   ├── libraries.py
│   │   │   ├── sharing.py
│   │   │   └── ai.py
│   │   └── dependencies.py
│   ├── services/                # Business logic layer
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── recipe_service.py
│   │   ├── library_service.py
│   │   ├── share_service.py
│   │   └── ai_service.py
│   ├── ai/                      # AI integration modules
│   │   ├── __init__.py
│   │   ├── prompts.py
│   │   └── client.py
│   └── utils/                   # Helper functions
│       ├── __init__.py
│       └── helpers.py
├── migrations/                  # Alembic database migrations
├── tests/                       # Test suite
│   ├── __init__.py
│   ├── conftest.py              # Shared pytest fixtures
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   ├── e2e/                     # End-to-end tests
│   └── utils/                   # Test utilities
│       ├── factories.py         # Faker-based data factories
│       └── helpers.py           # Test helper functions
├── requirements.txt             # Python dependencies
├── pytest.ini                   # Pytest configuration
├── .env.example                 # Environment variables template
└── CLAUDE.md                    # This file
```

---

## 💻 Python Coding Standards

### Style Guide

- **Follow PEP 8** with line length max of 100 characters
- **Use type hints** for all function arguments and return types
- **Use async/await** for I/O operations (database, external APIs)
- **Format code** with `black`
- **Lint code** with `ruff`
- **Type check** with `mypy`

### Code Style Example

```python
from typing import List, Optional, AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select

from app.models.recipe import Recipe
from app.schemas.recipe import RecipeCreate, RecipeResponse
from app.database import get_db


async def create_recipe(
    db: AsyncSession,
    recipe: RecipeCreate,
    user_id: str
) -> RecipeResponse:
    """
    Create a new recipe in the database.

    Args:
        db: Database session
        recipe: Recipe creation data
        user_id: ID of the user creating the recipe

    Returns:
        Created recipe with generated ID

    Raises:
        ValueError: If recipe data is invalid
    """
    db_recipe = Recipe(
        **recipe.model_dump(exclude_unset=True),
        owner_id=user_id
    )
    db.add(db_recipe)
    await db.commit()
    await db.refresh(db_recipe)
    return RecipeResponse.model_validate(db_recipe)


async def get_recipes(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 10,
    owner_id: Optional[str] = None,
    search: Optional[str] = None
) -> tuple[List[RecipeResponse], int]:
    """
    Retrieve recipes with optional filtering and pagination.

    Args:
        db: Database session
        skip: Number of records to skip (pagination)
        limit: Maximum records to return
        owner_id: Filter by recipe owner
        search: Search query for title/description

    Returns:
        Tuple of (recipes list, total count)
    """
    query = select(Recipe)

    if owner_id:
        query = query.where(Recipe.owner_id == owner_id)

    if search:
        search_term = f"%{search.lower()}%"
        query = query.where(
            (Recipe.title.ilike(search_term)) |
            (Recipe.description.ilike(search_term))
        )

    # Get total count before pagination
    total = await db.scalar(select(func.count()).select_from(Recipe))

    # Apply pagination
    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    recipes = result.scalars().all()

    return [RecipeResponse.model_validate(r) for r in recipes], total
```

### Key Principles

- **Async/await for I/O**: Database queries, HTTP calls, etc.
- **Dependency injection**: Use FastAPI's `Depends()` for database sessions
- **Pydantic for validation**: All request/response data
- **Error handling**: Use FastAPI's `HTTPException` for API errors
- **Business logic in services**: Keep routes thin, logic in `services/`
- **Database queries in services**: Not in routes
- **Type hints everywhere**: Arguments, returns, and variables

---

## 📂 Code Organization

### Models (`app/models/`)

SQLAlchemy ORM models representing database tables:

```python
# models/recipe.py
from sqlalchemy import Column, String, Text, Integer, JSON, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    ingredients = Column(JSON, nullable=False)  # List[dict]
    instructions = Column(JSON, nullable=False)  # List[dict]
    prep_time_minutes = Column(Integer)
    cook_time_minutes = Column(Integer)
    total_time_minutes = Column(Integer)
    servings = Column(Integer, default=4)
    cuisine_type = Column(String(100), index=True)
    dietary_tags = Column(JSON)  # List[str]
    difficulty_level = Column(String(50))
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    library_id = Column(String(36), ForeignKey("libraries.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="recipes")
    library = relationship("RecipeLibrary", back_populates="recipes")
```

### Schemas (`app/schemas/`)

Pydantic models for request/response validation:

```python
# schemas/recipe.py
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class IngredientSchema(BaseModel):
    name: str
    amount: str
    unit: str
    notes: Optional[str] = None


class InstructionSchema(BaseModel):
    step_number: int
    instruction: str
    duration_minutes: Optional[int] = None


class RecipeCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    ingredients: List[IngredientSchema]
    instructions: List[InstructionSchema]
    prep_time_minutes: Optional[int] = Field(None, ge=0)
    cook_time_minutes: Optional[int] = Field(None, ge=0)
    servings: int = Field(default=4, ge=1)
    cuisine_type: Optional[str] = None
    dietary_tags: Optional[List[str]] = None
    difficulty_level: Optional[str] = None
    library_id: Optional[str] = None


class RecipeResponse(RecipeCreate):
    id: str
    owner_id: str
    total_time_minutes: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
```

### Services (`app/services/`)

Business logic layer - all domain logic here, not in routes:

```python
# services/recipe_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional, Tuple

from app.models.recipe import Recipe
from app.models.user import User
from app.schemas.recipe import RecipeCreate, RecipeUpdate


async def create_recipe(
    db: AsyncSession,
    recipe: RecipeCreate,
    user: User
) -> Recipe:
    """Create a new recipe."""
    db_recipe = Recipe(
        **recipe.model_dump(exclude={"ingredients", "instructions"}),
        ingredients=[ing.model_dump() for ing in recipe.ingredients],
        instructions=[inst.model_dump() for inst in recipe.instructions],
        total_time_minutes=(recipe.prep_time_minutes or 0) + (recipe.cook_time_minutes or 0),
        owner_id=user.id
    )
    db.add(db_recipe)
    await db.commit()
    await db.refresh(db_recipe)
    return db_recipe


def check_recipe_ownership(recipe: Recipe, user: User) -> None:
    """Verify user owns the recipe. Raises HTTPException if not."""
    if recipe.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this recipe")
```

### API Routes (`app/api/`)

Route handlers - keep thin, delegate to services:

```python
# api/v1/recipes.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app import recipes_service
from app.schemas.recipe import RecipeCreate, RecipeResponse
from app.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User


router = APIRouter(prefix="/recipes", tags=["recipes"])


@router.post("/", response_model=RecipeResponse, status_code=201)
async def create_recipe(
    recipe: RecipeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> RecipeResponse:
    """Create a new recipe."""
    return await recipe_service.create_recipe(db, recipe, current_user)


@router.get("/", response_model=dict)
async def list_recipes(
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    owner_id: Optional[str] = None,
    search: Optional[str] = None
) -> dict:
    """List recipes with optional filtering."""
    recipes, total = await recipe_service.get_recipes(
        db, skip=skip, limit=limit, owner_id=owner_id, search=search
    )
    return {
        "recipes": recipes,
        "total": total,
        "page": skip // limit + 1,
        "page_size": limit
    }
```

---

## 🗄️ Database Design

### Principles

- **Use UUIDs** for primary keys (string(36))
- **Include timestamps** (created_at, updated_at) on all tables
- **Foreign key constraints** for referential integrity
- **Index frequently queried columns** (usernames, emails, recipe titles)
- **Store structured data as JSON** (ingredients, instructions)
- **Use appropriate column types** (String, Integer, Boolean, JSON, DateTime)

### Migration Management

```bash
# Create a new migration
cd backend
alembic revision --autogenerate -m "add recipe model"

# Review the generated migration file in migrations/versions/

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

Always review auto-generated migrations before committing!

---

## 🧪 Testing Strategy

### Test Structure

```
tests/
├── conftest.py              # Shared fixtures
├── unit/                    # Unit tests (services, models)
│   ├── test_auth_service.py
│   ├── test_recipe_service.py
│   └── ...
├── integration/             # Integration tests (API endpoints)
│   ├── test_recipes_api.py
│   ├── test_users_api.py
│   └── ...
├── e2e/                     # End-to-end tests (user journeys)
│   └── test_user_journeys.py
└── utils/
    ├── factories.py         # Test data factories
    └── helpers.py           # Test helper functions
```

### Running Tests

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/unit/test_auth_service.py

# Run with coverage report
pytest --cov=app tests/

# Run in watch mode (auto-run on file changes)
pytest-watch

# Run only fast tests (skip slow/integration)
pytest -m "not slow"
```

### Testing Best Practices

1. **Isolate each test** - Use fixtures for test data
2. **Test behavior, not implementation** - Focus on what the function does
3. **Use descriptive test names** - `test_create_recipe_with_valid_data`, not `test_recipe`
4. **Follow AAA pattern** - Arrange, Act, Assert
5. **Mock external dependencies** - Don't call real APIs in tests
6. **Test error cases** - Invalid input, missing data, auth failures
7. **Test edge cases** - Empty lists, boundary conditions, race conditions

### Async Test Example

```python
# tests/unit/test_recipe_service.py
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.services import recipe_service
from app.schemas.recipe import RecipeCreate
from tests.utils.helpers import create_test_recipe, create_test_user


@pytest.mark.asyncio
async def test_create_recipe_with_valid_data(test_db: AsyncSession, test_user):
    """Test creating a recipe with valid data."""
    recipe_data = RecipeCreate(
        title="Test Recipe",
        description="A test recipe",
        ingredients=[...],
        instructions=[...],
        prep_time_minutes=10,
        cook_time_minutes=20,
        servings=4,
    )

    result = await recipe_service.create_recipe(test_db, recipe_data, test_user)

    assert result.id is not None
    assert result.title == "Test Recipe"
    assert result.owner_id == test_user.id
    assert result.total_time_minutes == 30
```

### Test Fixtures (conftest.py)

Fixtures provide reusable test setup:

```python
# tests/conftest.py
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.database import Base
from app.models.user import User
from app.services.auth_service import get_password_hash


TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture(scope="function")
async def test_engine():
    """Create a test database engine."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def test_db(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    AsyncTestSession = async_sessionmaker(test_engine, class_=AsyncSession)
    async with AsyncTestSession() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def test_user(test_db: AsyncSession) -> User:
    """Create a test user."""
    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password=get_password_hash("testpassword123"),
        is_active=True,
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    return user
```

---

## 🛠️ Common Backend Tasks

### Adding a New API Endpoint

1. **Define Pydantic schema** in `app/schemas/`
2. **Create database model** in `app/models/` (if needed)
3. **Add service function** in `app/services/`
4. **Create route handler** in `app/api/v1/`
5. **Write tests**:
   - Unit tests for service in `tests/unit/`
   - Integration tests for API in `tests/integration/`
6. **Update OpenAPI docs** if needed

### Updating Database Schema

1. **Modify model** in `app/models/`
2. **Create migration**: `alembic revision --autogenerate -m "description"`
3. **Review migration** file in `migrations/versions/`
4. **Test migration**: `alembic upgrade head`
5. **Update related services/schemas**
6. **Update tests**

### Adding an AI Feature

1. **Define prompt** in `app/ai/prompts.py`
2. **Add LLM call** in `app/ai/client.py`
3. **Create service wrapper** in `app/services/ai_service.py`
4. **Create API endpoint** in `app/api/v1/`
5. **Add error handling** for LLM failures
6. **Write comprehensive tests** (mock LLM responses)

---

## 🔄 Development Workflow

### Typical Backend Development Session

```bash
# 1. Create feature branch
git checkout -b feature/add-recipe-sharing

# 2. Install dependencies (if changed)
pip install -r requirements.txt

# 3. Make your changes (models, services, routes)
# Follow the patterns in Code Organization section

# 4. Run tests frequently
pytest

# 5. Check code style
black app/ tests/
ruff check app/ tests/

# 6. Type check (optional but recommended)
mypy app/

# 7. Commit your changes
git add .
git commit -m "feat(recipes): add recipe sharing functionality"

# 8. Push and create PR
git push origin feature/add-recipe-sharing
```

---

## 📚 References

- **FastAPI:** https://fastapi.tiangolo.com/
- **SQLAlchemy Async:** https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html
- **Pydantic v2:** https://docs.pydantic.dev/latest/
- **pytest async:** https://pytest-asyncio.readthedocs.io/
- **Alembic:** https://alembic.sqlalchemy.org/

---

## 💡 Questions?

Refer to:
1. [../CLAUDE.md](../CLAUDE.md) - General project guidance
2. [../../docs/CLAUDE.md](../../docs/CLAUDE.md) - Documentation practices
3. Code examples in `app/` directory - Follow established patterns
4. Test files in `tests/` - Examples of testing patterns

Remember: Keep routes thin, logic in services, types everywhere!

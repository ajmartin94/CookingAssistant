"""
Test Configuration and Fixtures

Provides shared test fixtures for the Cooking Assistant test suite.
"""

import pytest
import asyncio
from typing import AsyncGenerator, Generator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool
from httpx import AsyncClient

from app.database import Base, get_db
from app.main import app
from app.models.user import User
from app.models.recipe import Recipe, DifficultyLevel
from app.models.library import RecipeLibrary
from app.models.share import RecipeShare, SharePermission
from app.services.auth_service import get_password_hash, create_access_token


# Test database URL - using in-memory SQLite for tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def test_engine():
    """Create test database engine"""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest.fixture
async def test_db(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create test database session"""
    async_session = async_sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def client(test_db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create test HTTP client"""
    async def override_get_db():
        yield test_db

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
async def test_user(test_db: AsyncSession) -> User:
    """Create a test user"""
    user = User(
        username="testuser",
        email="test@example.com",
        full_name="Test User",
        hashed_password=get_password_hash("testpassword123"),
        is_active=True,
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    return user


@pytest.fixture
async def test_user2(test_db: AsyncSession) -> User:
    """Create a second test user for sharing tests"""
    user = User(
        username="testuser2",
        email="test2@example.com",
        full_name="Test User 2",
        hashed_password=get_password_hash("testpassword456"),
        is_active=True,
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    return user


@pytest.fixture
def auth_headers(test_user: User) -> dict:
    """Generate auth headers with JWT token"""
    access_token = create_access_token(
        data={"sub": test_user.username, "user_id": test_user.id}
    )
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture
def auth_headers_user2(test_user2: User) -> dict:
    """Generate auth headers with JWT token for user2"""
    access_token = create_access_token(
        data={"sub": test_user2.username, "user_id": test_user2.id}
    )
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture
async def test_recipe(test_db: AsyncSession, test_user: User) -> Recipe:
    """Create a test recipe"""
    recipe = Recipe(
        title="Test Recipe",
        description="A delicious test recipe",
        ingredients=[
            {"name": "flour", "amount": "2", "unit": "cups", "notes": "all-purpose"},
            {"name": "sugar", "amount": "1", "unit": "cup", "notes": ""},
        ],
        instructions=[
            {"step_number": 1, "instruction": "Mix flour and sugar", "duration_minutes": 5},
            {"step_number": 2, "instruction": "Bake at 350°F", "duration_minutes": 30},
        ],
        prep_time_minutes=10,
        cook_time_minutes=30,
        total_time_minutes=40,
        servings=4,
        cuisine_type="American",
        dietary_tags=["vegetarian"],
        difficulty_level=DifficultyLevel.EASY,
        owner_id=test_user.id,
    )
    test_db.add(recipe)
    await test_db.commit()
    await test_db.refresh(recipe)
    return recipe


@pytest.fixture
async def test_recipe2(test_db: AsyncSession, test_user: User) -> Recipe:
    """Create a second test recipe"""
    recipe = Recipe(
        title="Italian Pasta",
        description="Classic Italian pasta dish",
        ingredients=[
            {"name": "pasta", "amount": "500", "unit": "g", "notes": "penne"},
            {"name": "tomato sauce", "amount": "400", "unit": "ml", "notes": ""},
        ],
        instructions=[
            {"step_number": 1, "instruction": "Boil pasta", "duration_minutes": 10},
            {"step_number": 2, "instruction": "Add sauce", "duration_minutes": 5},
        ],
        prep_time_minutes=5,
        cook_time_minutes=15,
        total_time_minutes=20,
        servings=2,
        cuisine_type="Italian",
        dietary_tags=["vegetarian", "vegan"],
        difficulty_level=DifficultyLevel.EASY,
        owner_id=test_user.id,
    )
    test_db.add(recipe)
    await test_db.commit()
    await test_db.refresh(recipe)
    return recipe


@pytest.fixture
async def test_library(test_db: AsyncSession, test_user: User) -> RecipeLibrary:
    """Create a test library"""
    library = RecipeLibrary(
        name="My Favorites",
        description="My favorite recipes collection",
        owner_id=test_user.id,
        is_public=False,
    )
    test_db.add(library)
    await test_db.commit()
    await test_db.refresh(library)
    return library


@pytest.fixture
async def test_library2(test_db: AsyncSession, test_user: User) -> RecipeLibrary:
    """Create a second test library"""
    library = RecipeLibrary(
        name="Quick Meals",
        description="Fast and easy recipes",
        owner_id=test_user.id,
        is_public=True,
    )
    test_db.add(library)
    await test_db.commit()
    await test_db.refresh(library)
    return library


@pytest.fixture
async def test_recipe_in_library(
    test_db: AsyncSession, test_user: User, test_library: RecipeLibrary
) -> Recipe:
    """Create a recipe that's in a library"""
    recipe = Recipe(
        title="Library Recipe",
        description="A recipe in a library",
        ingredients=[{"name": "eggs", "amount": "2", "unit": "whole", "notes": ""}],
        instructions=[{"step_number": 1, "instruction": "Cook eggs", "duration_minutes": 5}],
        servings=1,
        owner_id=test_user.id,
        library_id=test_library.id,
    )
    test_db.add(recipe)
    await test_db.commit()
    await test_db.refresh(recipe)
    return recipe


@pytest.fixture
async def test_share(
    test_db: AsyncSession, test_recipe: Recipe, test_user: User, test_user2: User
) -> RecipeShare:
    """Create a test share"""
    share = RecipeShare(
        recipe_id=test_recipe.id,
        shared_by_id=test_user.id,
        shared_with_id=test_user2.id,
        permission=SharePermission.VIEW,
    )
    test_db.add(share)
    await test_db.commit()
    await test_db.refresh(share)
    return share


@pytest.fixture
async def test_public_share(
    test_db: AsyncSession, test_recipe: Recipe, test_user: User
) -> RecipeShare:
    """Create a test public share"""
    share = RecipeShare(
        recipe_id=test_recipe.id,
        shared_by_id=test_user.id,
        shared_with_id=None,  # Public share
        permission=SharePermission.VIEW,
    )
    test_db.add(share)
    await test_db.commit()
    await test_db.refresh(share)
    return share

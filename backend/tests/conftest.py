"""
Test Configuration and Fixtures

Provides pytest fixtures for database sessions, HTTP clients,
authentication, and test data creation.
"""

import pytest
import pytest_asyncio
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from httpx import AsyncClient
from datetime import timedelta

from app.database import Base, get_db
from app.main import app
from app.models.user import User
from app.models.recipe import Recipe
from app.models.library import RecipeLibrary
from app.services.auth_service import create_access_token, get_password_hash
from app.schemas.recipe import IngredientSchema, InstructionSchema


# Test database URL (in-memory SQLite)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture(scope="function")
async def test_engine():
    """Create a test database engine"""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        future=True,
    )

    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    # Drop all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def test_db(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """
    Create a test database session.

    Each test gets a clean database session that is rolled back after the test.
    """
    AsyncTestSession = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    async with AsyncTestSession() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(test_db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    Create a test HTTP client with database dependency override.

    The client automatically uses the test database instead of the production database.
    """

    async def override_get_db():
        yield test_db

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(app=app, base_url="http://test") as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_user(test_db: AsyncSession) -> User:
    """
    Create a test user with known credentials.

    Credentials:
    - username: testuser
    - password: testpassword123
    - email: test@example.com
    """
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


@pytest_asyncio.fixture
async def test_user2(test_db: AsyncSession) -> User:
    """
    Create a second test user for testing sharing and ownership.

    Credentials:
    - username: testuser2
    - password: testpassword456
    - email: test2@example.com
    """
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
    """
    Generate authentication headers for the test user.

    Returns:
        dict: Headers with Bearer token for authenticated requests
    """
    token = create_access_token(
        data={"sub": test_user.username, "user_id": test_user.id},
        expires_delta=timedelta(minutes=30),
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers_user2(test_user2: User) -> dict:
    """
    Generate authentication headers for the second test user.

    Returns:
        dict: Headers with Bearer token for authenticated requests
    """
    token = create_access_token(
        data={"sub": test_user2.username, "user_id": test_user2.id},
        expires_delta=timedelta(minutes=30),
    )
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def test_recipe(test_db: AsyncSession, test_user: User) -> Recipe:
    """
    Create a test recipe owned by test_user.

    Returns a complete recipe with ingredients and instructions.
    """
    recipe = Recipe(
        title="Test Recipe",
        description="A delicious test recipe",
        ingredients=[
            {
                "name": "flour",
                "amount": "2",
                "unit": "cups",
                "notes": "",
            },
            {
                "name": "sugar",
                "amount": "1",
                "unit": "cup",
                "notes": "",
            },
        ],
        instructions=[
            {
                "step_number": 1,
                "instruction": "Mix ingredients",
                "duration_minutes": 5,
            },
            {
                "step_number": 2,
                "instruction": "Bake at 350°F",
                "duration_minutes": 30,
            },
        ],
        prep_time_minutes=10,
        cook_time_minutes=30,
        total_time_minutes=40,
        servings=4,
        cuisine_type="American",
        dietary_tags=["vegetarian"],
        difficulty_level="easy",
        owner_id=test_user.id,
    )
    test_db.add(recipe)
    await test_db.commit()
    await test_db.refresh(recipe)
    return recipe


@pytest_asyncio.fixture
async def test_library(test_db: AsyncSession, test_user: User) -> RecipeLibrary:
    """
    Create a test recipe library owned by test_user.
    """
    library = RecipeLibrary(
        name="Test Library",
        description="A test recipe library",
        is_public=False,
        owner_id=test_user.id,
    )
    test_db.add(library)
    await test_db.commit()
    await test_db.refresh(library)
    return library


@pytest_asyncio.fixture
async def test_recipe_in_library(
    test_db: AsyncSession, test_user: User, test_library: RecipeLibrary
) -> Recipe:
    """
    Create a test recipe that belongs to a library.
    """
    recipe = Recipe(
        title="Library Recipe",
        description="A recipe in a library",
        ingredients=[
            {
                "name": "pasta",
                "amount": "200",
                "unit": "g",
                "notes": "",
            }
        ],
        instructions=[
            {
                "step_number": 1,
                "instruction": "Boil pasta",
                "duration_minutes": 10,
            }
        ],
        prep_time_minutes=5,
        cook_time_minutes=10,
        total_time_minutes=15,
        servings=2,
        cuisine_type="Italian",
        difficulty_level="easy",
        owner_id=test_user.id,
        library_id=test_library.id,
    )
    test_db.add(recipe)
    await test_db.commit()
    await test_db.refresh(recipe)
    return recipe


@pytest.fixture
def sample_ingredients() -> list[IngredientSchema]:
    """
    Sample ingredients data for testing recipe creation.
    """
    return [
        IngredientSchema(name="flour", amount="2", unit="cups", notes="all-purpose"),
        IngredientSchema(name="eggs", amount="3", unit="whole", notes="large"),
        IngredientSchema(name="milk", amount="1", unit="cup", notes="whole milk"),
    ]


@pytest.fixture
def sample_instructions() -> list[InstructionSchema]:
    """
    Sample instructions data for testing recipe creation.
    """
    return [
        InstructionSchema(
            step_number=1,
            instruction="Mix flour and eggs in a large bowl",
            duration_minutes=5,
        ),
        InstructionSchema(
            step_number=2,
            instruction="Gradually add milk while stirring",
            duration_minutes=3,
        ),
        InstructionSchema(
            step_number=3, instruction="Cook on medium heat for 10 minutes", duration_minutes=10
        ),
    ]

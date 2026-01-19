"""
Test Helper Functions

Utility functions for common testing operations.
"""

from datetime import timedelta
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.recipe import Recipe
from app.models.library import RecipeLibrary
from app.services.auth_service import create_access_token, get_password_hash


async def create_test_user(
    db: AsyncSession,
    username: str = "testuser",
    email: str = "test@example.com",
    password: str = "testpassword123",
    **kwargs,
) -> User:
    """
    Create a test user and save to database.

    Args:
        db: Database session
        username: Username
        email: Email address
        password: Plain text password
        **kwargs: Additional user fields

    Returns:
        User: Created user instance
    """
    user = User(
        username=username,
        email=email,
        hashed_password=get_password_hash(password),
        full_name=kwargs.get("full_name", "Test User"),
        is_active=kwargs.get("is_active", True),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def create_test_recipe(
    db: AsyncSession,
    owner: User,
    title: str = "Test Recipe",
    library: Optional[RecipeLibrary] = None,
    **kwargs,
) -> Recipe:
    """
    Create a test recipe and save to database.

    Args:
        db: Database session
        owner: User who owns the recipe
        title: Recipe title
        library: Optional library to add recipe to
        **kwargs: Additional recipe fields

    Returns:
        Recipe: Created recipe instance
    """
    prep_time = kwargs.get("prep_time_minutes", 10)
    cook_time = kwargs.get("cook_time_minutes", 30)

    recipe = Recipe(
        title=title,
        description=kwargs.get("description", "A test recipe description"),
        ingredients=kwargs.get(
            "ingredients",
            [
                {"name": "ingredient1", "amount": "1", "unit": "cup", "notes": ""},
                {"name": "ingredient2", "amount": "2", "unit": "tbsp", "notes": ""},
            ],
        ),
        instructions=kwargs.get(
            "instructions",
            [
                {"step_number": 1, "instruction": "Step 1", "duration_minutes": 5},
                {"step_number": 2, "instruction": "Step 2", "duration_minutes": 10},
            ],
        ),
        prep_time_minutes=prep_time,
        cook_time_minutes=cook_time,
        total_time_minutes=kwargs.get("total_time_minutes", prep_time + cook_time),
        servings=kwargs.get("servings", 4),
        cuisine_type=kwargs.get("cuisine_type", "American"),
        dietary_tags=kwargs.get("dietary_tags", []),
        difficulty_level=kwargs.get("difficulty_level", "medium"),
        source_url=kwargs.get("source_url"),
        source_name=kwargs.get("source_name"),
        notes=kwargs.get("notes"),
        image_url=kwargs.get("image_url"),
        owner_id=owner.id,
        library_id=library.id if library else kwargs.get("library_id"),
    )
    db.add(recipe)
    await db.commit()
    await db.refresh(recipe)
    return recipe


async def create_test_library(
    db: AsyncSession,
    owner: User,
    name: str = "Test Library",
    **kwargs,
) -> RecipeLibrary:
    """
    Create a test library and save to database.

    Args:
        db: Database session
        owner: User who owns the library
        name: Library name
        **kwargs: Additional library fields

    Returns:
        RecipeLibrary: Created library instance
    """
    library = RecipeLibrary(
        name=name,
        description=kwargs.get("description", "A test library description"),
        is_public=kwargs.get("is_public", False),
        owner_id=owner.id,
    )
    db.add(library)
    await db.commit()
    await db.refresh(library)
    return library


def generate_auth_headers(user: User, expires_minutes: int = 30) -> dict:
    """
    Generate authentication headers for a user.

    Args:
        user: User to generate token for
        expires_minutes: Token expiration time in minutes

    Returns:
        dict: Headers with Authorization Bearer token
    """
    token = create_access_token(
        data={"sub": user.username, "user_id": user.id},
        expires_delta=timedelta(minutes=expires_minutes),
    )
    return {"Authorization": f"Bearer {token}"}


def assert_recipe_matches(actual: Recipe, expected: dict, check_owner: bool = True):
    """
    Assert that a recipe matches expected values.

    Args:
        actual: Recipe instance to check
        expected: Dictionary of expected values
        check_owner: Whether to check owner_id
    """
    assert actual.title == expected.get("title", actual.title)
    assert actual.description == expected.get("description", actual.description)
    assert actual.servings == expected.get("servings", actual.servings)
    assert actual.cuisine_type == expected.get("cuisine_type", actual.cuisine_type)
    assert actual.difficulty_level == expected.get(
        "difficulty_level", actual.difficulty_level
    )

    if check_owner:
        assert actual.owner_id == expected.get("owner_id")

    # Check ingredients count if provided
    if "ingredients" in expected:
        assert len(actual.ingredients) == len(expected["ingredients"])

    # Check instructions count if provided
    if "instructions" in expected:
        assert len(actual.instructions) == len(expected["instructions"])


def assert_library_matches(
    actual: RecipeLibrary, expected: dict, check_owner: bool = True
):
    """
    Assert that a library matches expected values.

    Args:
        actual: Library instance to check
        expected: Dictionary of expected values
        check_owner: Whether to check owner_id
    """
    assert actual.name == expected.get("name", actual.name)
    assert actual.description == expected.get("description", actual.description)
    assert actual.is_public == expected.get("is_public", actual.is_public)

    if check_owner:
        assert actual.owner_id == expected.get("owner_id")


def assert_user_matches(actual: User, expected: dict):
    """
    Assert that a user matches expected values.

    Args:
        actual: User instance to check
        expected: Dictionary of expected values
    """
    assert actual.username == expected.get("username", actual.username)
    assert actual.email == expected.get("email", actual.email)
    assert actual.full_name == expected.get("full_name", actual.full_name)
    assert actual.is_active == expected.get("is_active", actual.is_active)

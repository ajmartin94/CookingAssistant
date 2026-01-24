"""
Integration Tests for User Preferences API

Tests for PATCH /api/v1/users/me/preferences endpoint.
Covers preference updates, validation, partial updates, and auth.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


PREFERENCES_URL = "/api/v1/users/me/preferences"

ALLOWED_DIETARY_TAGS = [
    "vegetarian",
    "vegan",
    "gluten-free",
    "dairy-free",
    "keto",
    "paleo",
    "low-carb",
    "nut-free",
    "soy-free",
]

ALLOWED_SKILL_LEVELS = ["beginner", "intermediate", "advanced"]


@pytest.mark.asyncio
async def test_patch_preferences_updates_user_record(
    client: AsyncClient,
    auth_headers: dict,
    test_user: User,
    test_db: AsyncSession,
):
    """PATCH preferences should update the user record in the database."""
    # 1. SETUP: Define preference data
    preferences_data = {
        "dietary_restrictions": ["vegetarian", "gluten-free"],
        "skill_level": "intermediate",
        "default_servings": 4,
    }

    # 2. ACTION: PATCH preferences
    response = await client.patch(
        PREFERENCES_URL,
        headers=auth_headers,
        json=preferences_data,
    )

    # 3. VERIFY: Response is successful with updated data
    assert response.status_code == 200
    data = response.json()
    assert data["dietary_restrictions"] == ["vegetarian", "gluten-free"]
    assert data["skill_level"] == "intermediate"
    assert data["default_servings"] == 4

    # 4. OUTCOME: Verify database was updated
    await test_db.refresh(test_user)
    assert test_user.dietary_restrictions == ["vegetarian", "gluten-free"]
    assert test_user.skill_level == "intermediate"
    assert test_user.default_servings == 4


@pytest.mark.asyncio
async def test_get_me_returns_preference_fields(
    client: AsyncClient,
    auth_headers: dict,
    test_user: User,
    test_db: AsyncSession,
):
    """GET /api/v1/users/me should include preference fields in response."""
    # 1. SETUP: Set preferences via PATCH first
    await client.patch(
        PREFERENCES_URL,
        headers=auth_headers,
        json={
            "dietary_restrictions": ["vegan"],
            "skill_level": "beginner",
            "default_servings": 2,
        },
    )

    # 2. ACTION: GET current user
    response = await client.get("/api/v1/users/me", headers=auth_headers)

    # 3. VERIFY: Response includes preference fields
    assert response.status_code == 200
    data = response.json()
    assert "dietary_restrictions" in data
    assert "skill_level" in data
    assert "default_servings" in data
    assert data["dietary_restrictions"] == ["vegan"]
    assert data["skill_level"] == "beginner"
    assert data["default_servings"] == 2


@pytest.mark.asyncio
async def test_partial_update_leaves_other_fields_unchanged(
    client: AsyncClient,
    auth_headers: dict,
    test_user: User,
    test_db: AsyncSession,
):
    """Partial update (only dietary_restrictions) leaves other fields unchanged."""
    # 1. SETUP: Set all preferences first
    await client.patch(
        PREFERENCES_URL,
        headers=auth_headers,
        json={
            "dietary_restrictions": ["vegetarian"],
            "skill_level": "advanced",
            "default_servings": 6,
        },
    )

    # 2. ACTION: Update only dietary_restrictions
    response = await client.patch(
        PREFERENCES_URL,
        headers=auth_headers,
        json={
            "dietary_restrictions": ["keto", "dairy-free"],
        },
    )

    # 3. VERIFY: Only dietary_restrictions changed
    assert response.status_code == 200
    data = response.json()
    assert data["dietary_restrictions"] == ["keto", "dairy-free"]
    assert data["skill_level"] == "advanced"
    assert data["default_servings"] == 6

    # 4. OUTCOME: Verify database reflects partial update
    await test_db.refresh(test_user)
    assert test_user.skill_level == "advanced"
    assert test_user.default_servings == 6


@pytest.mark.asyncio
async def test_invalid_skill_level_returns_422(
    client: AsyncClient,
    auth_headers: dict,
):
    """Invalid skill_level value should return 422 validation error."""
    # 1. SETUP: Prepare invalid data
    invalid_data = {
        "skill_level": "expert",  # Not in allowed values
    }

    # 2. ACTION: Attempt to update with invalid skill_level
    response = await client.patch(
        PREFERENCES_URL,
        headers=auth_headers,
        json=invalid_data,
    )

    # 3. VERIFY: Returns 422 with validation error
    assert response.status_code == 422
    error = response.json()
    assert "detail" in error


@pytest.mark.asyncio
async def test_dietary_restrictions_validates_allowed_tags(
    client: AsyncClient,
    auth_headers: dict,
):
    """dietary_restrictions should validate against allowed tag values."""
    # 1. SETUP: Prepare data with invalid tag
    invalid_data = {
        "dietary_restrictions": ["vegetarian", "sugar-free"],  # sugar-free not allowed
    }

    # 2. ACTION: Attempt to update with invalid tag
    response = await client.patch(
        PREFERENCES_URL,
        headers=auth_headers,
        json=invalid_data,
    )

    # 3. VERIFY: Returns 422 with validation error
    assert response.status_code == 422
    error = response.json()
    assert "detail" in error


@pytest.mark.asyncio
async def test_dietary_restrictions_rejects_duplicates(
    client: AsyncClient,
    auth_headers: dict,
):
    """dietary_restrictions should reject duplicate values."""
    # 1. SETUP: Prepare data with duplicate tag
    invalid_data = {
        "dietary_restrictions": ["vegetarian", "vegetarian"],
    }

    # 2. ACTION: Attempt to update with duplicate tags
    response = await client.patch(
        PREFERENCES_URL,
        headers=auth_headers,
        json=invalid_data,
    )

    # 3. VERIFY: Returns 422 with validation error
    assert response.status_code == 422
    error = response.json()
    assert "detail" in error


@pytest.mark.asyncio
async def test_default_servings_validates_minimum(
    client: AsyncClient,
    auth_headers: dict,
):
    """default_servings below 1 should return 422."""
    # 1. SETUP: Prepare data with out-of-range servings
    invalid_data = {
        "default_servings": 0,  # Below minimum of 1
    }

    # 2. ACTION: Attempt to update with invalid servings
    response = await client.patch(
        PREFERENCES_URL,
        headers=auth_headers,
        json=invalid_data,
    )

    # 3. VERIFY: Returns 422 with validation error
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_default_servings_validates_maximum(
    client: AsyncClient,
    auth_headers: dict,
):
    """default_servings above 100 should return 422."""
    # 1. SETUP: Prepare data with out-of-range servings
    invalid_data = {
        "default_servings": 101,  # Above maximum of 100
    }

    # 2. ACTION: Attempt to update with invalid servings
    response = await client.patch(
        PREFERENCES_URL,
        headers=auth_headers,
        json=invalid_data,
    )

    # 3. VERIFY: Returns 422 with validation error
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_unauthenticated_request_returns_401(
    client: AsyncClient,
):
    """Unauthenticated request to preferences should return 401."""
    # 1. ACTION: Send request without auth headers
    response = await client.patch(
        PREFERENCES_URL,
        json={
            "skill_level": "beginner",
        },
    )

    # 2. VERIFY: Returns 401 Unauthorized
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_updated_at_bumped_after_preferences_update(
    client: AsyncClient,
    auth_headers: dict,
    test_user: User,
    test_db: AsyncSession,
):
    """updated_at timestamp should be bumped after preferences update."""
    # 1. SETUP: Record original updated_at
    original_updated_at = test_user.updated_at

    # 2. ACTION: Update preferences
    response = await client.patch(
        PREFERENCES_URL,
        headers=auth_headers,
        json={
            "skill_level": "advanced",
        },
    )

    # 3. VERIFY: Response is successful
    assert response.status_code == 200

    # 4. OUTCOME: Verify updated_at was bumped
    await test_db.refresh(test_user)
    assert test_user.updated_at > original_updated_at

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


@pytest.mark.asyncio
async def test_patch_preferences_returns_200_and_updates_user_record(
    client: AsyncClient,
    auth_headers: dict,
    test_user: User,
    test_db: AsyncSession,
):
    """PATCH /api/v1/users/me/preferences with valid data returns 200, updates user record."""
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
    """GET /api/v1/users/me returns preference fields in response."""
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
    """Invalid skill_level returns 422."""
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
async def test_invalid_dietary_tag_returns_422(
    client: AsyncClient,
    auth_headers: dict,
):
    """Invalid dietary tag returns 422."""
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
async def test_unauthenticated_request_returns_401(
    client: AsyncClient,
):
    """Unauthenticated request returns 401."""
    # 1. ACTION: Send request without auth headers
    response = await client.patch(
        PREFERENCES_URL,
        json={
            "skill_level": "beginner",
        },
    )

    # 2. VERIFY: Returns 401 Unauthorized
    assert response.status_code == 401

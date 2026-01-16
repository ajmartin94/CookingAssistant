"""
Integration Tests for Favorites API

Tests for adding/removing recipe favorites and listing favorites.
"""

import pytest
from httpx import AsyncClient


# Add Favorite Tests


@pytest.mark.asyncio
async def test_add_favorite_success(
    client: AsyncClient, auth_headers, test_user, test_db
):
    """Test successfully adding a recipe to favorites"""
    from tests.utils.helpers import create_test_recipe

    recipe = await create_test_recipe(test_db, test_user, "Favorite Recipe")

    response = await client.post(
        f"/api/v1/recipes/{recipe.id}/favorite", headers=auth_headers
    )

    assert response.status_code == 201
    data = response.json()
    assert data["recipe_id"] == recipe.id
    assert "message" in data


@pytest.mark.asyncio
async def test_add_favorite_recipe_not_found(client: AsyncClient, auth_headers):
    """Test adding a non-existent recipe to favorites"""
    response = await client.post(
        "/api/v1/recipes/non-existent-id/favorite", headers=auth_headers
    )

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_add_favorite_already_favorited(
    client: AsyncClient, auth_headers, test_user, test_db
):
    """Test adding a recipe that's already favorited"""
    from tests.utils.helpers import create_test_recipe

    recipe = await create_test_recipe(test_db, test_user, "Already Favorite")

    # First favorite
    await client.post(f"/api/v1/recipes/{recipe.id}/favorite", headers=auth_headers)

    # Try to favorite again
    response = await client.post(
        f"/api/v1/recipes/{recipe.id}/favorite", headers=auth_headers
    )

    assert response.status_code == 409
    assert "already" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_add_favorite_unauthenticated(client: AsyncClient, test_user, test_db):
    """Test adding favorite without authentication"""
    from tests.utils.helpers import create_test_recipe

    recipe = await create_test_recipe(test_db, test_user, "Some Recipe")

    response = await client.post(f"/api/v1/recipes/{recipe.id}/favorite")

    assert response.status_code == 401


# Remove Favorite Tests


@pytest.mark.asyncio
async def test_remove_favorite_success(
    client: AsyncClient, auth_headers, test_user, test_db
):
    """Test successfully removing a recipe from favorites"""
    from tests.utils.helpers import create_test_recipe

    recipe = await create_test_recipe(test_db, test_user, "Remove Favorite")

    # First add to favorites
    await client.post(f"/api/v1/recipes/{recipe.id}/favorite", headers=auth_headers)

    # Then remove
    response = await client.delete(
        f"/api/v1/recipes/{recipe.id}/favorite", headers=auth_headers
    )

    assert response.status_code == 204


@pytest.mark.asyncio
async def test_remove_favorite_not_in_favorites(
    client: AsyncClient, auth_headers, test_user, test_db
):
    """Test removing a recipe that's not in favorites"""
    from tests.utils.helpers import create_test_recipe

    recipe = await create_test_recipe(test_db, test_user, "Not Favorited")

    response = await client.delete(
        f"/api/v1/recipes/{recipe.id}/favorite", headers=auth_headers
    )

    assert response.status_code == 404
    assert "not in favorites" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_remove_favorite_unauthenticated(client: AsyncClient, test_user, test_db):
    """Test removing favorite without authentication"""
    from tests.utils.helpers import create_test_recipe

    recipe = await create_test_recipe(test_db, test_user, "Some Recipe")

    response = await client.delete(f"/api/v1/recipes/{recipe.id}/favorite")

    assert response.status_code == 401


# List Favorites Tests


@pytest.mark.asyncio
async def test_list_favorites_empty(client: AsyncClient, auth_headers):
    """Test listing favorites when user has none"""
    response = await client.get("/api/v1/recipes/favorites", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["recipes"] == []


@pytest.mark.asyncio
async def test_list_favorites_with_items(
    client: AsyncClient, auth_headers, test_user, test_db
):
    """Test listing favorites with items"""
    from tests.utils.helpers import create_test_recipe

    recipe1 = await create_test_recipe(test_db, test_user, "Favorite 1")
    recipe2 = await create_test_recipe(test_db, test_user, "Favorite 2")

    # Add both to favorites
    await client.post(f"/api/v1/recipes/{recipe1.id}/favorite", headers=auth_headers)
    await client.post(f"/api/v1/recipes/{recipe2.id}/favorite", headers=auth_headers)

    response = await client.get("/api/v1/recipes/favorites", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert len(data["recipes"]) == 2


@pytest.mark.asyncio
async def test_list_favorites_pagination(
    client: AsyncClient, auth_headers, test_user, test_db
):
    """Test favorites pagination"""
    from tests.utils.helpers import create_test_recipe

    # Create and favorite 5 recipes
    for i in range(5):
        recipe = await create_test_recipe(test_db, test_user, f"Paginated {i}")
        await client.post(f"/api/v1/recipes/{recipe.id}/favorite", headers=auth_headers)

    # Get first page
    response = await client.get(
        "/api/v1/recipes/favorites",
        headers=auth_headers,
        params={"page": 1, "page_size": 2},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 5
    assert len(data["recipes"]) == 2
    assert data["page"] == 1
    assert data["total_pages"] == 3


@pytest.mark.asyncio
async def test_list_favorites_unauthenticated(client: AsyncClient):
    """Test listing favorites without authentication"""
    response = await client.get("/api/v1/recipes/favorites")

    assert response.status_code == 401


# Cross-user Tests


@pytest.mark.asyncio
async def test_favorite_another_users_recipe(
    client: AsyncClient, auth_headers, test_db
):
    """Test that a user can favorite another user's recipe"""
    from tests.utils.helpers import create_test_recipe, create_test_user

    # Create another user with their recipe
    other_user = await create_test_user(test_db, "other@example.com", "otheruser")
    recipe = await create_test_recipe(test_db, other_user, "Other's Recipe")

    # Current user favorites the other user's recipe
    response = await client.post(
        f"/api/v1/recipes/{recipe.id}/favorite", headers=auth_headers
    )

    assert response.status_code == 201

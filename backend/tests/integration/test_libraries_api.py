"""
Integration Tests for Libraries API

Tests for library CRUD operations and ownership checks.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_libraries_authenticated(
    client: AsyncClient, auth_headers, test_library
):
    """Test listing libraries when authenticated"""
    response = await client.get("/api/v1/libraries", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_list_libraries_unauthenticated(client: AsyncClient):
    """Test listing libraries without authentication"""
    response = await client.get("/api/v1/libraries")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_library_success(client: AsyncClient, auth_headers):
    """Test successful library creation"""
    response = await client.post(
        "/api/v1/libraries",
        headers=auth_headers,
        json={"name": "My Cookbook", "description": "My recipes", "is_public": False},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "My Cookbook"
    assert "id" in data


@pytest.mark.asyncio
async def test_create_library_unauthenticated(client: AsyncClient):
    """Test creating library without authentication"""
    response = await client.post(
        "/api/v1/libraries",
        json={"name": "Test"},
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_library_success(client: AsyncClient, auth_headers, test_library):
    """Test getting library details"""
    response = await client.get(
        f"/api/v1/libraries/{test_library.id}", headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_library.id


@pytest.mark.asyncio
async def test_get_library_not_found(client: AsyncClient, auth_headers):
    """Test getting non-existent library"""
    response = await client.get("/api/v1/libraries/nonexistent", headers=auth_headers)

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_library_wrong_owner(
    client: AsyncClient, auth_headers_user2, test_library
):
    """Test getting library owned by different user"""
    response = await client.get(
        f"/api/v1/libraries/{test_library.id}", headers=auth_headers_user2
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_library_success(client: AsyncClient, auth_headers, test_library):
    """Test successful library update"""
    response = await client.put(
        f"/api/v1/libraries/{test_library.id}",
        headers=auth_headers,
        json={"name": "Updated Name"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"


@pytest.mark.asyncio
async def test_update_library_wrong_owner(
    client: AsyncClient, auth_headers_user2, test_library
):
    """Test updating library owned by different user"""
    response = await client.put(
        f"/api/v1/libraries/{test_library.id}",
        headers=auth_headers_user2,
        json={"name": "Hacked"},
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_delete_library_success(
    client: AsyncClient, auth_headers, test_db, test_user
):
    """Test successful library deletion"""
    from tests.utils.helpers import create_test_library

    library = await create_test_library(test_db, test_user, "To Delete")

    response = await client.delete(
        f"/api/v1/libraries/{library.id}", headers=auth_headers
    )

    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_library_wrong_owner(
    client: AsyncClient, auth_headers_user2, test_library
):
    """Test deleting library owned by different user"""
    response = await client.delete(
        f"/api/v1/libraries/{test_library.id}", headers=auth_headers_user2
    )

    assert response.status_code == 403


# --- Recipe Management Tests ---


@pytest.mark.asyncio
async def test_add_recipe_to_library_success(
    client: AsyncClient, auth_headers, test_library, test_recipe
):
    """Test successfully adding a recipe to a library"""
    response = await client.post(
        f"/api/v1/libraries/{test_library.id}/recipes/{test_recipe.id}",
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_recipe.id
    assert data["library_id"] == test_library.id


@pytest.mark.asyncio
async def test_add_recipe_to_library_unauthenticated(
    client: AsyncClient, test_library, test_recipe
):
    """Test adding recipe without authentication"""
    response = await client.post(
        f"/api/v1/libraries/{test_library.id}/recipes/{test_recipe.id}"
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_add_recipe_to_library_not_found(
    client: AsyncClient, auth_headers, test_recipe
):
    """Test adding recipe to non-existent library"""
    response = await client.post(
        f"/api/v1/libraries/nonexistent/recipes/{test_recipe.id}",
        headers=auth_headers,
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_add_recipe_to_library_recipe_not_found(
    client: AsyncClient, auth_headers, test_library
):
    """Test adding non-existent recipe to library"""
    response = await client.post(
        f"/api/v1/libraries/{test_library.id}/recipes/nonexistent",
        headers=auth_headers,
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_add_recipe_to_library_wrong_library_owner(
    client: AsyncClient, auth_headers_user2, test_library, test_recipe
):
    """Test adding recipe to library owned by different user"""
    response = await client.post(
        f"/api/v1/libraries/{test_library.id}/recipes/{test_recipe.id}",
        headers=auth_headers_user2,
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_add_recipe_to_library_wrong_recipe_owner(
    client: AsyncClient, auth_headers, test_library, test_db, test_user2
):
    """Test adding recipe owned by different user to library"""
    from tests.utils.helpers import create_test_recipe

    other_recipe = await create_test_recipe(test_db, test_user2, "Other User Recipe")

    response = await client.post(
        f"/api/v1/libraries/{test_library.id}/recipes/{other_recipe.id}",
        headers=auth_headers,
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_remove_recipe_from_library_success(
    client: AsyncClient, auth_headers, test_library, test_recipe_in_library
):
    """Test successfully removing a recipe from a library"""
    response = await client.delete(
        f"/api/v1/libraries/{test_library.id}/recipes/{test_recipe_in_library.id}",
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_recipe_in_library.id
    assert data["library_id"] is None


@pytest.mark.asyncio
async def test_remove_recipe_from_library_unauthenticated(
    client: AsyncClient, test_library, test_recipe_in_library
):
    """Test removing recipe without authentication"""
    response = await client.delete(
        f"/api/v1/libraries/{test_library.id}/recipes/{test_recipe_in_library.id}"
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_remove_recipe_from_library_not_found(
    client: AsyncClient, auth_headers, test_recipe_in_library
):
    """Test removing recipe from non-existent library"""
    response = await client.delete(
        f"/api/v1/libraries/nonexistent/recipes/{test_recipe_in_library.id}",
        headers=auth_headers,
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_remove_recipe_from_library_recipe_not_found(
    client: AsyncClient, auth_headers, test_library
):
    """Test removing non-existent recipe from library"""
    response = await client.delete(
        f"/api/v1/libraries/{test_library.id}/recipes/nonexistent",
        headers=auth_headers,
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_remove_recipe_from_library_wrong_owner(
    client: AsyncClient, auth_headers_user2, test_library, test_recipe_in_library
):
    """Test removing recipe from library owned by different user"""
    response = await client.delete(
        f"/api/v1/libraries/{test_library.id}/recipes/{test_recipe_in_library.id}",
        headers=auth_headers_user2,
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_remove_recipe_not_in_library(
    client: AsyncClient, auth_headers, test_library, test_recipe
):
    """Test removing recipe that isn't in the library"""
    response = await client.delete(
        f"/api/v1/libraries/{test_library.id}/recipes/{test_recipe.id}",
        headers=auth_headers,
    )

    assert response.status_code == 400

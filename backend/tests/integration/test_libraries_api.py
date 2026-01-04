"""
Integration Tests for Libraries API

Tests for library CRUD operations and ownership checks.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_libraries_authenticated(client: AsyncClient, auth_headers, test_library):
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
    response = await client.get(f"/api/v1/libraries/{test_library.id}", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_library.id


@pytest.mark.asyncio
async def test_get_library_not_found(client: AsyncClient, auth_headers):
    """Test getting non-existent library"""
    response = await client.get("/api/v1/libraries/nonexistent", headers=auth_headers)

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_library_wrong_owner(client: AsyncClient, auth_headers_user2, test_library):
    """Test getting library owned by different user"""
    response = await client.get(f"/api/v1/libraries/{test_library.id}", headers=auth_headers_user2)

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
async def test_update_library_wrong_owner(client: AsyncClient, auth_headers_user2, test_library):
    """Test updating library owned by different user"""
    response = await client.put(
        f"/api/v1/libraries/{test_library.id}",
        headers=auth_headers_user2,
        json={"name": "Hacked"},
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_delete_library_success(client: AsyncClient, auth_headers, test_db, test_user):
    """Test successful library deletion"""
    from tests.utils.helpers import create_test_library

    library = await create_test_library(test_db, test_user, "To Delete")

    response = await client.delete(f"/api/v1/libraries/{library.id}", headers=auth_headers)

    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_library_wrong_owner(client: AsyncClient, auth_headers_user2, test_library):
    """Test deleting library owned by different user"""
    response = await client.delete(
        f"/api/v1/libraries/{test_library.id}", headers=auth_headers_user2
    )

    assert response.status_code == 403

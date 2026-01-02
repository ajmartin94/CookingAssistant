"""
Integration Tests for Libraries API

Tests library CRUD operations and recipe organization endpoints.
"""

import pytest
from httpx import AsyncClient
from fastapi import status

from app.models.user import User
from app.models.library import RecipeLibrary
from app.models.recipe import Recipe


class TestLibraryListEndpoint:
    """Test library list endpoint"""

    @pytest.mark.asyncio
    async def test_list_libraries_success(
        self, client: AsyncClient, auth_headers: dict, test_library: RecipeLibrary
    ):
        """Test listing libraries"""
        response = await client.get("/api/v1/libraries", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    @pytest.mark.asyncio
    async def test_list_libraries_unauthorized(self, client: AsyncClient):
        """Test listing libraries without authentication"""
        response = await client.get("/api/v1/libraries")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    async def test_list_libraries_pagination(
        self, client: AsyncClient, auth_headers: dict, test_library: RecipeLibrary, test_library2: RecipeLibrary
    ):
        """Test library pagination"""
        response = await client.get("/api/v1/libraries?skip=0&limit=1", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1

    @pytest.mark.asyncio
    async def test_list_libraries_empty(self, client: AsyncClient, auth_headers_user2: dict):
        """Test listing libraries when user has none"""
        # User2 has no libraries by default
        response = await client.get("/api/v1/libraries", headers=auth_headers_user2)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)


class TestLibraryCreateEndpoint:
    """Test library creation endpoint"""

    @pytest.mark.asyncio
    async def test_create_library_success(self, client: AsyncClient, auth_headers: dict):
        """Test successful library creation"""
        library_data = {
            "name": "My New Library",
            "description": "A test library",
            "is_public": False,
        }

        response = await client.post("/api/v1/libraries", json=library_data, headers=auth_headers)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["name"] == "My New Library"
        assert data["description"] == "A test library"
        assert data["is_public"] is False
        assert "id" in data

    @pytest.mark.asyncio
    async def test_create_library_unauthorized(self, client: AsyncClient):
        """Test creating library without authentication"""
        library_data = {"name": "Unauthorized Library"}

        response = await client.post("/api/v1/libraries", json=library_data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    async def test_create_library_missing_name(self, client: AsyncClient, auth_headers: dict):
        """Test creating library without name"""
        library_data = {"description": "No name"}

        response = await client.post("/api/v1/libraries", json=library_data, headers=auth_headers)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.asyncio
    async def test_create_public_library(self, client: AsyncClient, auth_headers: dict):
        """Test creating a public library"""
        library_data = {
            "name": "Public Library",
            "is_public": True,
        }

        response = await client.post("/api/v1/libraries", json=library_data, headers=auth_headers)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["is_public"] is True


class TestLibraryDetailEndpoint:
    """Test library detail endpoint"""

    @pytest.mark.asyncio
    async def test_get_library_success(
        self, client: AsyncClient, auth_headers: dict, test_library: RecipeLibrary
    ):
        """Test getting library details"""
        response = await client.get(f"/api/v1/libraries/{test_library.id}", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == test_library.id
        assert data["name"] == test_library.name

    @pytest.mark.asyncio
    async def test_get_library_with_recipes(
        self, client: AsyncClient, auth_headers: dict, test_recipe_in_library: Recipe, test_library: RecipeLibrary
    ):
        """Test getting library with recipes"""
        response = await client.get(f"/api/v1/libraries/{test_library.id}", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "recipes" in data
        assert len(data["recipes"]) >= 1

    @pytest.mark.asyncio
    async def test_get_library_not_found(self, client: AsyncClient, auth_headers: dict):
        """Test getting non-existent library"""
        response = await client.get("/api/v1/libraries/nonexistent-id", headers=auth_headers)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.asyncio
    async def test_get_library_wrong_owner(
        self, client: AsyncClient, auth_headers_user2: dict, test_library: RecipeLibrary
    ):
        """Test getting library owned by different user"""
        response = await client.get(f"/api/v1/libraries/{test_library.id}", headers=auth_headers_user2)

        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestLibraryUpdateEndpoint:
    """Test library update endpoint"""

    @pytest.mark.asyncio
    async def test_update_library_name(
        self, client: AsyncClient, auth_headers: dict, test_library: RecipeLibrary
    ):
        """Test updating library name"""
        update_data = {"name": "Updated Library Name"}

        response = await client.put(
            f"/api/v1/libraries/{test_library.id}",
            json=update_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "Updated Library Name"

    @pytest.mark.asyncio
    async def test_update_library_visibility(
        self, client: AsyncClient, auth_headers: dict, test_library: RecipeLibrary
    ):
        """Test updating library visibility"""
        update_data = {"is_public": True}

        response = await client.put(
            f"/api/v1/libraries/{test_library.id}",
            json=update_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["is_public"] is True

    @pytest.mark.asyncio
    async def test_update_library_not_found(self, client: AsyncClient, auth_headers: dict):
        """Test updating non-existent library"""
        update_data = {"name": "New Name"}

        response = await client.put(
            "/api/v1/libraries/nonexistent-id",
            json=update_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.asyncio
    async def test_update_library_wrong_owner(
        self, client: AsyncClient, auth_headers_user2: dict, test_library: RecipeLibrary
    ):
        """Test updating library owned by different user"""
        update_data = {"name": "Hacked Name"}

        response = await client.put(
            f"/api/v1/libraries/{test_library.id}",
            json=update_data,
            headers=auth_headers_user2
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestLibraryDeleteEndpoint:
    """Test library deletion endpoint"""

    @pytest.mark.asyncio
    async def test_delete_library_success(
        self, client: AsyncClient, auth_headers: dict, test_library: RecipeLibrary
    ):
        """Test successful library deletion"""
        library_id = test_library.id

        response = await client.delete(f"/api/v1/libraries/{library_id}", headers=auth_headers)

        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Verify library is deleted
        get_response = await client.get(f"/api/v1/libraries/{library_id}", headers=auth_headers)
        assert get_response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.asyncio
    async def test_delete_library_recipes_preserved(
        self, client: AsyncClient, auth_headers: dict, test_recipe_in_library: Recipe, test_library: RecipeLibrary
    ):
        """Test that deleting library preserves recipes"""
        recipe_id = test_recipe_in_library.id
        library_id = test_library.id

        # Delete library
        delete_response = await client.delete(f"/api/v1/libraries/{library_id}", headers=auth_headers)
        assert delete_response.status_code == status.HTTP_204_NO_CONTENT

        # Verify recipe still exists
        recipe_response = await client.get(f"/api/v1/recipes/{recipe_id}", headers=auth_headers)
        assert recipe_response.status_code == status.HTTP_200_OK

    @pytest.mark.asyncio
    async def test_delete_library_wrong_owner(
        self, client: AsyncClient, auth_headers_user2: dict, test_library: RecipeLibrary
    ):
        """Test deleting library owned by different user"""
        response = await client.delete(
            f"/api/v1/libraries/{test_library.id}",
            headers=auth_headers_user2
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

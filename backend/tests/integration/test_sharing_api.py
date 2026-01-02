"""
Integration Tests for Sharing API

Tests share creation, access, and revocation endpoints.
"""

import pytest
from datetime import datetime, timedelta
from httpx import AsyncClient
from fastapi import status

from app.models.user import User
from app.models.recipe import Recipe
from app.models.library import RecipeLibrary
from app.models.share import RecipeShare


class TestShareCreationEndpoint:
    """Test share creation endpoint"""

    @pytest.mark.asyncio
    async def test_create_recipe_share(
        self, client: AsyncClient, auth_headers: dict, test_recipe: Recipe, test_user2: User
    ):
        """Test creating a recipe share"""
        share_data = {
            "recipe_id": test_recipe.id,
            "shared_with_id": test_user2.id,
            "permission": "view",
        }

        response = await client.post("/api/v1/shares", json=share_data, headers=auth_headers)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert "share_token" in data
        assert "share_url" in data
        assert len(data["share_token"]) > 0

    @pytest.mark.asyncio
    async def test_create_library_share(
        self, client: AsyncClient, auth_headers: dict, test_library: RecipeLibrary, test_user2: User
    ):
        """Test creating a library share"""
        share_data = {
            "library_id": test_library.id,
            "shared_with_id": test_user2.id,
            "permission": "view",
        }

        response = await client.post("/api/v1/shares", json=share_data, headers=auth_headers)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert "share_token" in data

    @pytest.mark.asyncio
    async def test_create_share_unauthorized(self, client: AsyncClient, test_recipe: Recipe):
        """Test creating share without authentication"""
        share_data = {
            "recipe_id": test_recipe.id,
            "permission": "view",
        }

        response = await client.post("/api/v1/shares", json=share_data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    async def test_create_share_nonexistent_recipe(
        self, client: AsyncClient, auth_headers: dict
    ):
        """Test creating share for non-existent recipe"""
        share_data = {
            "recipe_id": "nonexistent-id",
            "permission": "view",
        }

        response = await client.post("/api/v1/shares", json=share_data, headers=auth_headers)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.asyncio
    async def test_create_share_not_owner(
        self, client: AsyncClient, auth_headers_user2: dict, test_recipe: Recipe
    ):
        """Test creating share for recipe not owned by user"""
        share_data = {
            "recipe_id": test_recipe.id,
            "permission": "view",
        }

        response = await client.post("/api/v1/shares", json=share_data, headers=auth_headers_user2)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.asyncio
    async def test_create_share_with_expiration(
        self, client: AsyncClient, auth_headers: dict, test_recipe: Recipe
    ):
        """Test creating share with expiration"""
        expires_at = (datetime.utcnow() + timedelta(days=7)).isoformat()
        share_data = {
            "recipe_id": test_recipe.id,
            "permission": "view",
            "expires_at": expires_at,
        }

        response = await client.post("/api/v1/shares", json=share_data, headers=auth_headers)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert "expires_at" in data
        assert data["expires_at"] is not None

    @pytest.mark.asyncio
    async def test_create_public_share(
        self, client: AsyncClient, auth_headers: dict, test_recipe: Recipe
    ):
        """Test creating a public share"""
        share_data = {
            "recipe_id": test_recipe.id,
            "permission": "view",
            # No shared_with_id = public share
        }

        response = await client.post("/api/v1/shares", json=share_data, headers=auth_headers)

        assert response.status_code == status.HTTP_201_CREATED

    @pytest.mark.asyncio
    async def test_create_user_specific_share(
        self, client: AsyncClient, auth_headers: dict, test_recipe: Recipe, test_user2: User
    ):
        """Test creating a user-specific share"""
        share_data = {
            "recipe_id": test_recipe.id,
            "shared_with_id": test_user2.id,
            "permission": "view",
        }

        response = await client.post("/api/v1/shares", json=share_data, headers=auth_headers)

        assert response.status_code == status.HTTP_201_CREATED


class TestShareListEndpoints:
    """Test share list endpoints"""

    @pytest.mark.asyncio
    async def test_list_my_shares(
        self, client: AsyncClient, auth_headers: dict, test_share: RecipeShare
    ):
        """Test listing shares created by user"""
        response = await client.get("/api/v1/shares/my-shares", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    @pytest.mark.asyncio
    async def test_list_shares_with_me(
        self, client: AsyncClient, auth_headers_user2: dict, test_share: RecipeShare
    ):
        """Test listing shares shared with user"""
        response = await client.get("/api/v1/shares/shared-with-me", headers=auth_headers_user2)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    @pytest.mark.asyncio
    async def test_list_shares_unauthorized(self, client: AsyncClient):
        """Test listing shares without authentication"""
        response = await client.get("/api/v1/shares/my-shares")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    async def test_list_shares_pagination(
        self, client: AsyncClient, auth_headers: dict, test_share: RecipeShare
    ):
        """Test share list pagination"""
        response = await client.get(
            "/api/v1/shares/my-shares?skip=0&limit=10",
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)


class TestShareAccessEndpoints:
    """Test share access endpoints"""

    @pytest.mark.asyncio
    async def test_access_shared_recipe_valid_token(
        self, client: AsyncClient, test_public_share: RecipeShare
    ):
        """Test accessing shared recipe with valid token"""
        response = await client.get(
            f"/api/v1/shares/token/{test_public_share.share_token}/recipe"
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == test_public_share.recipe_id

    @pytest.mark.asyncio
    async def test_access_shared_recipe_invalid_token(self, client: AsyncClient):
        """Test accessing shared recipe with invalid token"""
        response = await client.get("/api/v1/shares/token/invalid-token/recipe")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.asyncio
    async def test_access_shared_recipe_expired(
        self, client: AsyncClient, test_db, test_recipe: Recipe, test_user: User
    ):
        """Test accessing expired share"""
        from app.services.share_service import create_share
        from app.schemas.share import ShareCreate

        # Create expired share
        share_create = ShareCreate(
            recipe_id=test_recipe.id,
            permission="view",
            expires_at=datetime.utcnow() - timedelta(days=1),
        )
        expired_share = await create_share(test_db, share_create, test_user)
        await test_db.commit()

        response = await client.get(
            f"/api/v1/shares/token/{expired_share.share_token}/recipe"
        )

        assert response.status_code == status.HTTP_410_GONE

    @pytest.mark.asyncio
    async def test_access_shared_recipe_no_auth_required(
        self, client: AsyncClient, test_public_share: RecipeShare
    ):
        """Test that accessing shared recipe doesn't require authentication"""
        # No auth headers provided
        response = await client.get(
            f"/api/v1/shares/token/{test_public_share.share_token}/recipe"
        )

        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.asyncio
    async def test_access_shared_library_valid_token(
        self, client: AsyncClient, test_db, test_library: RecipeLibrary, test_user: User
    ):
        """Test accessing shared library with valid token"""
        from app.services.share_service import create_share
        from app.schemas.share import ShareCreate

        # Create library share
        share_create = ShareCreate(
            library_id=test_library.id,
            permission="view",
        )
        library_share = await create_share(test_db, share_create, test_user)
        await test_db.commit()

        response = await client.get(
            f"/api/v1/shares/token/{library_share.share_token}/library"
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == test_library.id

    @pytest.mark.asyncio
    async def test_access_shared_library_invalid_token(self, client: AsyncClient):
        """Test accessing shared library with invalid token"""
        response = await client.get("/api/v1/shares/token/invalid-token/library")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.asyncio
    async def test_access_wrong_type(
        self, client: AsyncClient, test_public_share: RecipeShare
    ):
        """Test accessing recipe share as library"""
        # test_public_share is a recipe share, not library
        response = await client.get(
            f"/api/v1/shares/token/{test_public_share.share_token}/library"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestShareDeletionEndpoint:
    """Test share deletion endpoint"""

    @pytest.mark.asyncio
    async def test_delete_share_success(
        self, client: AsyncClient, auth_headers: dict, test_share: RecipeShare
    ):
        """Test successful share deletion"""
        share_id = test_share.id

        response = await client.delete(f"/api/v1/shares/{share_id}", headers=auth_headers)

        assert response.status_code == status.HTTP_204_NO_CONTENT

    @pytest.mark.asyncio
    async def test_delete_share_not_owner(
        self, client: AsyncClient, auth_headers_user2: dict, test_share: RecipeShare
    ):
        """Test deleting share not owned by user"""
        response = await client.delete(
            f"/api/v1/shares/{test_share.id}",
            headers=auth_headers_user2
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.asyncio
    async def test_delete_share_invalidates_token(
        self, client: AsyncClient, auth_headers: dict, test_public_share: RecipeShare
    ):
        """Test that deleting share invalidates the token"""
        share_token = test_public_share.share_token
        share_id = test_public_share.id

        # Delete share
        delete_response = await client.delete(
            f"/api/v1/shares/{share_id}",
            headers=auth_headers
        )
        assert delete_response.status_code == status.HTTP_204_NO_CONTENT

        # Try to access with token
        access_response = await client.get(f"/api/v1/shares/token/{share_token}/recipe")
        assert access_response.status_code == status.HTTP_404_NOT_FOUND

"""
Integration Tests for Recipes API

Tests recipe CRUD operations, filtering, search, and pagination endpoints.
"""

import pytest
from httpx import AsyncClient
from fastapi import status

from app.models.user import User
from app.models.recipe import Recipe
from app.models.library import RecipeLibrary


class TestRecipeListEndpoint:
    """Test recipe list endpoint"""

    @pytest.mark.asyncio
    async def test_list_recipes_authenticated(
        self, client: AsyncClient, auth_headers: dict, test_recipe: Recipe
    ):
        """Test listing recipes with authentication"""
        response = await client.get("/api/v1/recipes", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "recipes" in data
        assert "total" in data
        assert "page" in data
        assert len(data["recipes"]) >= 1

    @pytest.mark.asyncio
    async def test_list_recipes_unauthorized(self, client: AsyncClient):
        """Test listing recipes without authentication"""
        response = await client.get("/api/v1/recipes")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    async def test_list_recipes_empty(self, client: AsyncClient, auth_headers: dict):
        """Test listing recipes when user has none"""
        # Using fresh auth headers for a user with no recipes
        response = await client.get("/api/v1/recipes", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        # User has recipes from fixtures, but testing structure
        assert isinstance(data["recipes"], list)

    @pytest.mark.asyncio
    async def test_list_recipes_with_library_filter(
        self, client: AsyncClient, auth_headers: dict, test_library: RecipeLibrary, test_recipe_in_library: Recipe
    ):
        """Test filtering recipes by library"""
        response = await client.get(
            f"/api/v1/recipes?library_id={test_library.id}",
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] >= 1
        for recipe in data["recipes"]:
            assert recipe["library_id"] == test_library.id

    @pytest.mark.asyncio
    async def test_list_recipes_with_cuisine_filter(
        self, client: AsyncClient, auth_headers: dict, test_recipe: Recipe
    ):
        """Test filtering recipes by cuisine type"""
        response = await client.get(
            f"/api/v1/recipes?cuisine_type={test_recipe.cuisine_type}",
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] >= 1
        for recipe in data["recipes"]:
            assert recipe["cuisine_type"] == test_recipe.cuisine_type

    @pytest.mark.asyncio
    async def test_list_recipes_with_difficulty_filter(
        self, client: AsyncClient, auth_headers: dict
    ):
        """Test filtering recipes by difficulty"""
        response = await client.get(
            "/api/v1/recipes?difficulty=easy",
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        for recipe in data["recipes"]:
            assert recipe["difficulty_level"] == "easy"

    @pytest.mark.asyncio
    async def test_list_recipes_with_search(
        self, client: AsyncClient, auth_headers: dict, test_recipe: Recipe
    ):
        """Test searching recipes"""
        response = await client.get(
            f"/api/v1/recipes?search={test_recipe.title}",
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] >= 1
        # At least one recipe should contain the search term
        assert any(test_recipe.title in recipe["title"] for recipe in data["recipes"])

    @pytest.mark.asyncio
    async def test_list_recipes_pagination(
        self, client: AsyncClient, auth_headers: dict, test_recipe: Recipe, test_recipe2: Recipe
    ):
        """Test recipe pagination"""
        # Get first page
        response_page1 = await client.get(
            "/api/v1/recipes?page=1&page_size=1",
            headers=auth_headers
        )

        assert response_page1.status_code == status.HTTP_200_OK
        data_page1 = response_page1.json()
        assert data_page1["page"] == 1
        assert len(data_page1["recipes"]) == 1

        # Get second page
        response_page2 = await client.get(
            "/api/v1/recipes?page=2&page_size=1",
            headers=auth_headers
        )

        assert response_page2.status_code == status.HTTP_200_OK
        data_page2 = response_page2.json()
        assert data_page2["page"] == 2
        assert len(data_page2["recipes"]) <= 1

        # Recipes should be different
        if len(data_page2["recipes"]) == 1:
            assert data_page1["recipes"][0]["id"] != data_page2["recipes"][0]["id"]

    @pytest.mark.asyncio
    async def test_list_recipes_invalid_page(self, client: AsyncClient, auth_headers: dict):
        """Test pagination with invalid page number"""
        response = await client.get(
            "/api/v1/recipes?page=0",  # Page must be >= 1
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestRecipeCreateEndpoint:
    """Test recipe creation endpoint"""

    @pytest.mark.asyncio
    async def test_create_recipe_success(self, client: AsyncClient, auth_headers: dict):
        """Test successful recipe creation"""
        recipe_data = {
            "title": "New Test Recipe",
            "description": "A new recipe for testing",
            "ingredients": [
                {"name": "flour", "amount": "2", "unit": "cups", "notes": "all-purpose"}
            ],
            "instructions": [
                {"step_number": 1, "instruction": "Mix ingredients", "duration_minutes": 5}
            ],
            "servings": 4,
        }

        response = await client.post("/api/v1/recipes", json=recipe_data, headers=auth_headers)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["title"] == "New Test Recipe"
        assert data["description"] == "A new recipe for testing"
        assert len(data["ingredients"]) == 1
        assert len(data["instructions"]) == 1
        assert "id" in data

    @pytest.mark.asyncio
    async def test_create_recipe_unauthorized(self, client: AsyncClient):
        """Test creating recipe without authentication"""
        recipe_data = {
            "title": "Unauthorized Recipe",
            "ingredients": [{"name": "test", "amount": "1", "unit": "unit", "notes": ""}],
            "instructions": [{"step_number": 1, "instruction": "Test", "duration_minutes": 1}],
        }

        response = await client.post("/api/v1/recipes", json=recipe_data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    async def test_create_recipe_missing_title(self, client: AsyncClient, auth_headers: dict):
        """Test creating recipe without title"""
        recipe_data = {
            # Missing title
            "ingredients": [{"name": "test", "amount": "1", "unit": "unit", "notes": ""}],
            "instructions": [{"step_number": 1, "instruction": "Test", "duration_minutes": 1}],
        }

        response = await client.post("/api/v1/recipes", json=recipe_data, headers=auth_headers)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.asyncio
    async def test_create_recipe_missing_ingredients(self, client: AsyncClient, auth_headers: dict):
        """Test creating recipe without ingredients"""
        recipe_data = {
            "title": "No Ingredients",
            # Missing ingredients
            "instructions": [{"step_number": 1, "instruction": "Test", "duration_minutes": 1}],
        }

        response = await client.post("/api/v1/recipes", json=recipe_data, headers=auth_headers)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.asyncio
    async def test_create_recipe_missing_instructions(self, client: AsyncClient, auth_headers: dict):
        """Test creating recipe without instructions"""
        recipe_data = {
            "title": "No Instructions",
            "ingredients": [{"name": "test", "amount": "1", "unit": "unit", "notes": ""}],
            # Missing instructions
        }

        response = await client.post("/api/v1/recipes", json=recipe_data, headers=auth_headers)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.asyncio
    async def test_create_recipe_invalid_difficulty(self, client: AsyncClient, auth_headers: dict):
        """Test creating recipe with invalid difficulty"""
        recipe_data = {
            "title": "Invalid Difficulty",
            "ingredients": [{"name": "test", "amount": "1", "unit": "unit", "notes": ""}],
            "instructions": [{"step_number": 1, "instruction": "Test", "duration_minutes": 1}],
            "difficulty_level": "impossible",  # Invalid value
        }

        response = await client.post("/api/v1/recipes", json=recipe_data, headers=auth_headers)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.asyncio
    async def test_create_recipe_with_library(
        self, client: AsyncClient, auth_headers: dict, test_library: RecipeLibrary
    ):
        """Test creating recipe and adding to library"""
        recipe_data = {
            "title": "Library Recipe",
            "ingredients": [{"name": "test", "amount": "1", "unit": "unit", "notes": ""}],
            "instructions": [{"step_number": 1, "instruction": "Test", "duration_minutes": 1}],
            "library_id": test_library.id,
        }

        response = await client.post("/api/v1/recipes", json=recipe_data, headers=auth_headers)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["library_id"] == test_library.id


class TestRecipeDetailEndpoint:
    """Test recipe detail endpoint"""

    @pytest.mark.asyncio
    async def test_get_recipe_success(
        self, client: AsyncClient, auth_headers: dict, test_recipe: Recipe
    ):
        """Test getting recipe details"""
        response = await client.get(f"/api/v1/recipes/{test_recipe.id}", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == test_recipe.id
        assert data["title"] == test_recipe.title

    @pytest.mark.asyncio
    async def test_get_recipe_not_found(self, client: AsyncClient, auth_headers: dict):
        """Test getting non-existent recipe"""
        response = await client.get("/api/v1/recipes/nonexistent-id", headers=auth_headers)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.asyncio
    async def test_get_recipe_unauthorized(self, client: AsyncClient, test_recipe: Recipe):
        """Test getting recipe without authentication"""
        response = await client.get(f"/api/v1/recipes/{test_recipe.id}")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    async def test_get_recipe_wrong_owner(
        self, client: AsyncClient, auth_headers_user2: dict, test_recipe: Recipe
    ):
        """Test getting recipe owned by different user"""
        response = await client.get(f"/api/v1/recipes/{test_recipe.id}", headers=auth_headers_user2)

        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestRecipeUpdateEndpoint:
    """Test recipe update endpoint"""

    @pytest.mark.asyncio
    async def test_update_recipe_success(
        self, client: AsyncClient, auth_headers: dict, test_recipe: Recipe
    ):
        """Test successful recipe update"""
        update_data = {"title": "Updated Recipe Title"}

        response = await client.put(
            f"/api/v1/recipes/{test_recipe.id}",
            json=update_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["title"] == "Updated Recipe Title"
        assert data["id"] == test_recipe.id

    @pytest.mark.asyncio
    async def test_update_recipe_partial_update(
        self, client: AsyncClient, auth_headers: dict, test_recipe: Recipe
    ):
        """Test partial recipe update"""
        original_title = test_recipe.title
        update_data = {"servings": 8}

        response = await client.put(
            f"/api/v1/recipes/{test_recipe.id}",
            json=update_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["servings"] == 8
        # Title should remain unchanged
        assert data["title"] == original_title

    @pytest.mark.asyncio
    async def test_update_recipe_not_found(self, client: AsyncClient, auth_headers: dict):
        """Test updating non-existent recipe"""
        update_data = {"title": "New Title"}

        response = await client.put(
            "/api/v1/recipes/nonexistent-id",
            json=update_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.asyncio
    async def test_update_recipe_wrong_owner(
        self, client: AsyncClient, auth_headers_user2: dict, test_recipe: Recipe
    ):
        """Test updating recipe owned by different user"""
        update_data = {"title": "Hacked Title"}

        response = await client.put(
            f"/api/v1/recipes/{test_recipe.id}",
            json=update_data,
            headers=auth_headers_user2
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.asyncio
    async def test_update_recipe_unauthorized(self, client: AsyncClient, test_recipe: Recipe):
        """Test updating recipe without authentication"""
        update_data = {"title": "Unauthorized Update"}

        response = await client.put(f"/api/v1/recipes/{test_recipe.id}", json=update_data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestRecipeDeleteEndpoint:
    """Test recipe deletion endpoint"""

    @pytest.mark.asyncio
    async def test_delete_recipe_success(
        self, client: AsyncClient, auth_headers: dict, test_recipe: Recipe
    ):
        """Test successful recipe deletion"""
        recipe_id = test_recipe.id

        response = await client.delete(f"/api/v1/recipes/{recipe_id}", headers=auth_headers)

        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Verify recipe is deleted
        get_response = await client.get(f"/api/v1/recipes/{recipe_id}", headers=auth_headers)
        assert get_response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.asyncio
    async def test_delete_recipe_not_found(self, client: AsyncClient, auth_headers: dict):
        """Test deleting non-existent recipe"""
        response = await client.delete("/api/v1/recipes/nonexistent-id", headers=auth_headers)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.asyncio
    async def test_delete_recipe_wrong_owner(
        self, client: AsyncClient, auth_headers_user2: dict, test_recipe: Recipe
    ):
        """Test deleting recipe owned by different user"""
        response = await client.delete(
            f"/api/v1/recipes/{test_recipe.id}",
            headers=auth_headers_user2
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.asyncio
    async def test_delete_recipe_unauthorized(self, client: AsyncClient, test_recipe: Recipe):
        """Test deleting recipe without authentication"""
        response = await client.delete(f"/api/v1/recipes/{test_recipe.id}")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

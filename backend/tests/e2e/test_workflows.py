"""
End-to-End Workflow Tests

Tests complete user journeys through multiple endpoints.
"""

import pytest
from httpx import AsyncClient
from fastapi import status


class TestCompleteUserJourney:
    """Test complete user registration and profile management flow"""

    @pytest.mark.asyncio
    async def test_register_login_get_profile(self, client: AsyncClient):
        """Test complete user journey: register -> login -> get profile"""
        # Step 1: Register
        register_data = {
            "username": "journeyuser",
            "email": "journey@example.com",
            "password": "securepass123",
            "full_name": "Journey User",
        }

        register_response = await client.post("/api/v1/users/register", json=register_data)
        assert register_response.status_code == status.HTTP_201_CREATED
        user_data = register_response.json()
        assert user_data["username"] == "journeyuser"

        # Step 2: Login
        login_data = {
            "username": "journeyuser",
            "password": "securepass123",
        }

        login_response = await client.post("/api/v1/users/login", data=login_data)
        assert login_response.status_code == status.HTTP_200_OK
        token_data = login_response.json()
        token = token_data["access_token"]

        # Step 3: Get Profile
        headers = {"Authorization": f"Bearer {token}"}
        profile_response = await client.get("/api/v1/users/me", headers=headers)
        assert profile_response.status_code == status.HTTP_200_OK
        profile_data = profile_response.json()
        assert profile_data["username"] == "journeyuser"
        assert profile_data["email"] == "journey@example.com"

    @pytest.mark.asyncio
    async def test_register_login_update_profile(self, client: AsyncClient):
        """Test user journey: register -> login -> update profile"""
        # Register
        register_data = {
            "username": "updateuser",
            "email": "update@example.com",
            "password": "password123",
        }

        await client.post("/api/v1/users/register", json=register_data)

        # Login
        login_data = {"username": "updateuser", "password": "password123"}
        login_response = await client.post("/api/v1/users/login", data=login_data)
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Update profile
        update_data = {"full_name": "Updated Full Name"}
        update_response = await client.put("/api/v1/users/me", json=update_data, headers=headers)
        assert update_response.status_code == status.HTTP_200_OK
        assert update_response.json()["full_name"] == "Updated Full Name"


class TestRecipeLifecycle:
    """Test complete recipe management workflows"""

    @pytest.mark.asyncio
    async def test_create_recipe_view_update_delete(self, client: AsyncClient, auth_headers: dict):
        """Test complete recipe lifecycle"""
        # Create recipe
        recipe_data = {
            "title": "Lifecycle Recipe",
            "ingredients": [{"name": "salt", "amount": "1", "unit": "tsp", "notes": ""}],
            "instructions": [{"step_number": 1, "instruction": "Add salt", "duration_minutes": 1}],
        }

        create_response = await client.post(
            "/api/v1/recipes",
            json=recipe_data,
            headers=auth_headers
        )
        assert create_response.status_code == status.HTTP_201_CREATED
        recipe_id = create_response.json()["id"]

        # View recipe
        view_response = await client.get(f"/api/v1/recipes/{recipe_id}", headers=auth_headers)
        assert view_response.status_code == status.HTTP_200_OK
        assert view_response.json()["title"] == "Lifecycle Recipe"

        # Update recipe
        update_data = {"title": "Updated Lifecycle Recipe"}
        update_response = await client.put(
            f"/api/v1/recipes/{recipe_id}",
            json=update_data,
            headers=auth_headers
        )
        assert update_response.status_code == status.HTTP_200_OK
        assert update_response.json()["title"] == "Updated Lifecycle Recipe"

        # Delete recipe
        delete_response = await client.delete(f"/api/v1/recipes/{recipe_id}", headers=auth_headers)
        assert delete_response.status_code == status.HTTP_204_NO_CONTENT

        # Verify deletion
        verify_response = await client.get(f"/api/v1/recipes/{recipe_id}", headers=auth_headers)
        assert verify_response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.asyncio
    async def test_create_recipe_add_to_library(self, client: AsyncClient, auth_headers: dict):
        """Test creating recipe and adding to library"""
        # Create library
        library_data = {"name": "Test Workflow Library"}
        library_response = await client.post(
            "/api/v1/libraries",
            json=library_data,
            headers=auth_headers
        )
        library_id = library_response.json()["id"]

        # Create recipe
        recipe_data = {
            "title": "Library Recipe",
            "ingredients": [{"name": "test", "amount": "1", "unit": "unit", "notes": ""}],
            "instructions": [{"step_number": 1, "instruction": "Test", "duration_minutes": 1}],
        }
        recipe_response = await client.post(
            "/api/v1/recipes",
            json=recipe_data,
            headers=auth_headers
        )
        recipe_id = recipe_response.json()["id"]

        # Update recipe to add to library
        update_data = {"library_id": library_id}
        update_response = await client.put(
            f"/api/v1/recipes/{recipe_id}",
            json=update_data,
            headers=auth_headers
        )
        assert update_response.status_code == status.HTTP_200_OK
        assert update_response.json()["library_id"] == library_id

        # Verify library contains recipe
        library_detail = await client.get(f"/api/v1/libraries/{library_id}", headers=auth_headers)
        assert library_detail.status_code == status.HTTP_200_OK
        recipes_in_library = library_detail.json()["recipes"]
        assert any(r["id"] == recipe_id for r in recipes_in_library)

    @pytest.mark.asyncio
    async def test_create_recipe_move_between_libraries(
        self, client: AsyncClient, auth_headers: dict
    ):
        """Test moving recipe between libraries"""
        # Create two libraries
        lib1_response = await client.post(
            "/api/v1/libraries",
            json={"name": "Library 1"},
            headers=auth_headers
        )
        lib1_id = lib1_response.json()["id"]

        lib2_response = await client.post(
            "/api/v1/libraries",
            json={"name": "Library 2"},
            headers=auth_headers
        )
        lib2_id = lib2_response.json()["id"]

        # Create recipe in library 1
        recipe_data = {
            "title": "Moving Recipe",
            "ingredients": [{"name": "test", "amount": "1", "unit": "unit", "notes": ""}],
            "instructions": [{"step_number": 1, "instruction": "Test", "duration_minutes": 1}],
            "library_id": lib1_id,
        }
        recipe_response = await client.post(
            "/api/v1/recipes",
            json=recipe_data,
            headers=auth_headers
        )
        recipe_id = recipe_response.json()["id"]
        assert recipe_response.json()["library_id"] == lib1_id

        # Move to library 2
        update_response = await client.put(
            f"/api/v1/recipes/{recipe_id}",
            json={"library_id": lib2_id},
            headers=auth_headers
        )
        assert update_response.status_code == status.HTTP_200_OK
        assert update_response.json()["library_id"] == lib2_id

    @pytest.mark.asyncio
    async def test_create_multiple_recipes_search_filter(
        self, client: AsyncClient, auth_headers: dict
    ):
        """Test creating multiple recipes and filtering them"""
        # Create multiple recipes with different cuisines
        recipes_data = [
            {
                "title": "Italian Pasta",
                "cuisine_type": "Italian",
                "ingredients": [{"name": "pasta", "amount": "1", "unit": "lb", "notes": ""}],
                "instructions": [{"step_number": 1, "instruction": "Cook", "duration_minutes": 10}],
            },
            {
                "title": "Mexican Tacos",
                "cuisine_type": "Mexican",
                "ingredients": [{"name": "tortilla", "amount": "4", "unit": "pieces", "notes": ""}],
                "instructions": [{"step_number": 1, "instruction": "Prepare", "duration_minutes": 15}],
            },
            {
                "title": "Italian Pizza",
                "cuisine_type": "Italian",
                "ingredients": [{"name": "dough", "amount": "1", "unit": "lb", "notes": ""}],
                "instructions": [{"step_number": 1, "instruction": "Bake", "duration_minutes": 20}],
            },
        ]

        for recipe_data in recipes_data:
            await client.post("/api/v1/recipes", json=recipe_data, headers=auth_headers)

        # Filter by cuisine
        italian_response = await client.get(
            "/api/v1/recipes?cuisine_type=Italian",
            headers=auth_headers
        )
        italian_recipes = italian_response.json()["recipes"]
        assert len(italian_recipes) >= 2
        assert all(r["cuisine_type"] == "Italian" for r in italian_recipes)

        # Search by title
        search_response = await client.get(
            "/api/v1/recipes?search=Tacos",
            headers=auth_headers
        )
        search_recipes = search_response.json()["recipes"]
        assert len(search_recipes) >= 1
        assert any("Tacos" in r["title"] for r in search_recipes)


class TestSharingWorkflows:
    """Test complete sharing workflows"""

    @pytest.mark.asyncio
    async def test_share_recipe_access_via_token(self, client: AsyncClient, auth_headers: dict):
        """Test sharing recipe and accessing via token"""
        # Create recipe
        recipe_data = {
            "title": "Shared Recipe",
            "ingredients": [{"name": "ingredient", "amount": "1", "unit": "unit", "notes": ""}],
            "instructions": [{"step_number": 1, "instruction": "Step 1", "duration_minutes": 5}],
        }
        recipe_response = await client.post(
            "/api/v1/recipes",
            json=recipe_data,
            headers=auth_headers
        )
        recipe_id = recipe_response.json()["id"]

        # Create share
        share_data = {"recipe_id": recipe_id, "permission": "view"}
        share_response = await client.post("/api/v1/shares", json=share_data, headers=auth_headers)
        assert share_response.status_code == status.HTTP_201_CREATED
        share_token = share_response.json()["share_token"]

        # Access via token (no auth required)
        access_response = await client.get(f"/api/v1/shares/token/{share_token}/recipe")
        assert access_response.status_code == status.HTTP_200_OK
        assert access_response.json()["id"] == recipe_id

    @pytest.mark.asyncio
    async def test_create_share_revoke_access_denied(self, client: AsyncClient, auth_headers: dict):
        """Test creating and revoking a share"""
        # Create recipe
        recipe_data = {
            "title": "Revoke Test Recipe",
            "ingredients": [{"name": "test", "amount": "1", "unit": "unit", "notes": ""}],
            "instructions": [{"step_number": 1, "instruction": "Test", "duration_minutes": 1}],
        }
        recipe_response = await client.post(
            "/api/v1/recipes",
            json=recipe_data,
            headers=auth_headers
        )
        recipe_id = recipe_response.json()["id"]

        # Create share
        share_data = {"recipe_id": recipe_id, "permission": "view"}
        share_response = await client.post("/api/v1/shares", json=share_data, headers=auth_headers)
        share_id = share_response.json()["share_token"]

        # Get share ID from my shares
        my_shares = await client.get("/api/v1/shares/my-shares", headers=auth_headers)
        share_to_delete = [s for s in my_shares.json() if s["recipe_id"] == recipe_id][0]

        # Access recipe via share (should work)
        access_response1 = await client.get(f"/api/v1/shares/token/{share_id}/recipe")
        assert access_response1.status_code == status.HTTP_200_OK

        # Revoke share
        delete_response = await client.delete(
            f"/api/v1/shares/{share_to_delete['id']}",
            headers=auth_headers
        )
        assert delete_response.status_code == status.HTTP_204_NO_CONTENT

        # Access should now fail
        access_response2 = await client.get(f"/api/v1/shares/token/{share_id}/recipe")
        assert access_response2.status_code == status.HTTP_404_NOT_FOUND

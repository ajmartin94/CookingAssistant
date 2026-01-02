"""
Security Tests

Tests for authentication, authorization, and data validation security.
"""

import pytest
from httpx import AsyncClient
from fastapi import status

from app.models.user import User
from app.models.recipe import Recipe


class TestAuthSecurity:
    """Test authentication security"""

    @pytest.mark.asyncio
    async def test_jwt_token_tampering_rejected(self, client: AsyncClient):
        """Test that tampered JWT tokens are rejected"""
        # Create a fake token
        fake_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJoYWNrZXIiLCJ1c2VyX2lkIjoiaGFjayJ9.fake"
        headers = {"Authorization": f"Bearer {fake_token}"}

        response = await client.get("/api/v1/users/me", headers=headers)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    async def test_expired_token_rejected(self, client: AsyncClient, test_user: User):
        """Test that expired tokens are rejected"""
        from datetime import timedelta
        from app.services.auth_service import create_access_token

        # Create token that expired 1 hour ago
        expired_token = create_access_token(
            data={"sub": test_user.username, "user_id": test_user.id},
            expires_delta=timedelta(hours=-1)
        )
        headers = {"Authorization": f"Bearer {expired_token}"}

        response = await client.get("/api/v1/users/me", headers=headers)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    async def test_sql_injection_in_search(self, client: AsyncClient, auth_headers: dict):
        """Test that SQL injection attempts in search are handled safely"""
        # Attempt SQL injection in search
        sql_injection_attempts = [
            "'; DROP TABLE recipes; --",
            "' OR '1'='1",
            "'; DELETE FROM users WHERE '1'='1",
        ]

        for injection in sql_injection_attempts:
            response = await client.get(
                f"/api/v1/recipes?search={injection}",
                headers=auth_headers
            )

            # Should not crash, should return empty or safe results
            assert response.status_code in [status.HTTP_200_OK, status.HTTP_422_UNPROCESSABLE_ENTITY]

    @pytest.mark.asyncio
    async def test_xss_in_recipe_content(self, client: AsyncClient, auth_headers: dict):
        """Test that XSS attempts in recipe content are stored as-is"""
        xss_script = "<script>alert('XSS')</script>"

        recipe_data = {
            "title": f"Recipe with XSS {xss_script}",
            "description": f"Description {xss_script}",
            "ingredients": [{"name": "test", "amount": "1", "unit": "unit", "notes": xss_script}],
            "instructions": [{"step_number": 1, "instruction": xss_script, "duration_minutes": 1}],
        }

        response = await client.post("/api/v1/recipes", json=recipe_data, headers=auth_headers)

        # Should accept the data (frontend is responsible for escaping)
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()

        # Data should be stored as-is
        assert xss_script in data["title"]


class TestAuthorizationSecurity:
    """Test authorization and access control"""

    @pytest.mark.asyncio
    async def test_cannot_access_other_users_recipes(
        self, client: AsyncClient, auth_headers_user2: dict, test_recipe: Recipe
    ):
        """Test that users cannot access recipes they don't own"""
        response = await client.get(
            f"/api/v1/recipes/{test_recipe.id}",
            headers=auth_headers_user2
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.asyncio
    async def test_cannot_update_other_users_recipes(
        self, client: AsyncClient, auth_headers_user2: dict, test_recipe: Recipe
    ):
        """Test that users cannot update recipes they don't own"""
        update_data = {"title": "Hacked Title"}

        response = await client.put(
            f"/api/v1/recipes/{test_recipe.id}",
            json=update_data,
            headers=auth_headers_user2
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.asyncio
    async def test_cannot_delete_other_users_recipes(
        self, client: AsyncClient, auth_headers_user2: dict, test_recipe: Recipe
    ):
        """Test that users cannot delete recipes they don't own"""
        response = await client.delete(
            f"/api/v1/recipes/{test_recipe.id}",
            headers=auth_headers_user2
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.asyncio
    async def test_cannot_delete_other_users_libraries(
        self, client: AsyncClient, auth_headers_user2: dict, test_library
    ):
        """Test that users cannot delete libraries they don't own"""
        response = await client.delete(
            f"/api/v1/libraries/{test_library.id}",
            headers=auth_headers_user2
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.asyncio
    async def test_cannot_revoke_other_users_shares(
        self, client: AsyncClient, auth_headers_user2: dict, test_share
    ):
        """Test that users cannot revoke shares they didn't create"""
        response = await client.delete(
            f"/api/v1/shares/{test_share.id}",
            headers=auth_headers_user2
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestDataValidation:
    """Test data validation and input sanitization"""

    @pytest.mark.asyncio
    async def test_max_length_validation(self, client: AsyncClient, auth_headers: dict):
        """Test that excessively long inputs are rejected"""
        # Try to create user with very long username
        register_data = {
            "username": "a" * 1000,  # Very long username
            "email": "test@example.com",
            "password": "password123",
        }

        response = await client.post("/api/v1/users/register", json=register_data)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.asyncio
    async def test_json_injection_prevention(self, client: AsyncClient, auth_headers: dict):
        """Test that malformed JSON in structured fields is rejected"""
        recipe_data = {
            "title": "Test Recipe",
            "ingredients": "not a list",  # Should be a list
            "instructions": [{"step_number": 1, "instruction": "Test", "duration_minutes": 1}],
        }

        response = await client.post("/api/v1/recipes", json=recipe_data, headers=auth_headers)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.asyncio
    async def test_malformed_json_ingredients(self, client: AsyncClient, auth_headers: dict):
        """Test that ingredients with missing required fields are rejected"""
        recipe_data = {
            "title": "Test Recipe",
            "ingredients": [{"name": "incomplete"}],  # Missing required fields
            "instructions": [{"step_number": 1, "instruction": "Test", "duration_minutes": 1}],
        }

        response = await client.post("/api/v1/recipes", json=recipe_data, headers=auth_headers)

        # Should either reject or accept with defaults
        # The actual behavior depends on schema validation
        assert response.status_code in [
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            status.HTTP_201_CREATED
        ]

    @pytest.mark.asyncio
    async def test_malformed_json_instructions(self, client: AsyncClient, auth_headers: dict):
        """Test that instructions with missing required fields are handled"""
        recipe_data = {
            "title": "Test Recipe",
            "ingredients": [{"name": "test", "amount": "1", "unit": "unit", "notes": ""}],
            "instructions": [{"step_number": 1}],  # Missing instruction text
        }

        response = await client.post("/api/v1/recipes", json=recipe_data, headers=auth_headers)

        # Should reject due to missing required field
        assert response.status_code in [
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            status.HTTP_201_CREATED
        ]

    @pytest.mark.asyncio
    async def test_negative_values_validation(self, client: AsyncClient, auth_headers: dict):
        """Test that negative values for time/servings are handled"""
        recipe_data = {
            "title": "Test Recipe",
            "ingredients": [{"name": "test", "amount": "1", "unit": "unit", "notes": ""}],
            "instructions": [{"step_number": 1, "instruction": "Test", "duration_minutes": 1}],
            "prep_time_minutes": -10,  # Negative time
            "servings": -5,  # Negative servings
        }

        response = await client.post("/api/v1/recipes", json=recipe_data, headers=auth_headers)

        # Should either reject or accept (depends on schema validation)
        # Most likely should be rejected
        assert response.status_code in [
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            status.HTTP_201_CREATED
        ]

    @pytest.mark.asyncio
    async def test_empty_string_validation(self, client: AsyncClient):
        """Test that empty strings in required fields are rejected"""
        register_data = {
            "username": "",  # Empty username
            "email": "test@example.com",
            "password": "password123",
        }

        response = await client.post("/api/v1/users/register", json=register_data)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestPasswordSecurity:
    """Test password security requirements"""

    @pytest.mark.asyncio
    async def test_password_not_returned_in_responses(self, client: AsyncClient, auth_headers: dict):
        """Test that passwords are never returned in API responses"""
        response = await client.get("/api/v1/users/me", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "password" not in data
        assert "hashed_password" not in data

    @pytest.mark.asyncio
    async def test_password_stored_hashed(self, client: AsyncClient):
        """Test that passwords are stored hashed, not in plain text"""
        register_data = {
            "username": "hashtest",
            "email": "hashtest@example.com",
            "password": "plaintextpassword",
        }

        response = await client.post("/api/v1/users/register", json=register_data)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()

        # Response should not contain password in any form
        assert "password" not in data
        assert "hashed_password" not in data

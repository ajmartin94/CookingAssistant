"""
Integration Tests for Users API

Tests user registration, login, and profile management endpoints.
"""

import pytest
from httpx import AsyncClient
from fastapi import status

from app.models.user import User


class TestUserRegistration:
    """Test user registration endpoint"""

    @pytest.mark.asyncio
    async def test_register_user_success(self, client: AsyncClient):
        """Test successful user registration"""
        user_data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "securepass123",
            "full_name": "New User",
        }

        response = await client.post("/api/v1/users/register", json=user_data)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["username"] == "newuser"
        assert data["email"] == "newuser@example.com"
        assert data["full_name"] == "New User"
        assert "id" in data
        assert "hashed_password" not in data  # Password should not be returned

    @pytest.mark.asyncio
    async def test_register_duplicate_username(self, client: AsyncClient, test_user: User):
        """Test registration with duplicate username"""
        user_data = {
            "username": test_user.username,  # Duplicate
            "email": "different@example.com",
            "password": "password123",
        }

        response = await client.post("/api/v1/users/register", json=user_data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "already registered" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, client: AsyncClient, test_user: User):
        """Test registration with duplicate email"""
        user_data = {
            "username": "differentuser",
            "email": test_user.email,  # Duplicate
            "password": "password123",
        }

        response = await client.post("/api/v1/users/register", json=user_data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "already registered" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_register_invalid_email(self, client: AsyncClient):
        """Test registration with invalid email"""
        user_data = {
            "username": "testuser",
            "email": "not-an-email",
            "password": "password123",
        }

        response = await client.post("/api/v1/users/register", json=user_data)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.asyncio
    async def test_register_weak_password(self, client: AsyncClient):
        """Test registration with weak password"""
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "weak",  # Too short
        }

        response = await client.post("/api/v1/users/register", json=user_data)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.asyncio
    async def test_register_missing_required_fields(self, client: AsyncClient):
        """Test registration with missing required fields"""
        user_data = {
            "username": "testuser",
            # Missing email and password
        }

        response = await client.post("/api/v1/users/register", json=user_data)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestUserLogin:
    """Test user login endpoint"""

    @pytest.mark.asyncio
    async def test_login_success(self, client: AsyncClient, test_user: User):
        """Test successful login"""
        login_data = {
            "username": test_user.username,
            "password": "testpassword123",
        }

        response = await client.post("/api/v1/users/login", data=login_data)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert len(data["access_token"]) > 0

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client: AsyncClient, test_user: User):
        """Test login with wrong password"""
        login_data = {
            "username": test_user.username,
            "password": "wrongpassword",
        }

        response = await client.post("/api/v1/users/login", data=login_data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "incorrect" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self, client: AsyncClient):
        """Test login for non-existent user"""
        login_data = {
            "username": "nonexistent",
            "password": "password123",
        }

        response = await client.post("/api/v1/users/login", data=login_data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    async def test_login_returns_valid_jwt(self, client: AsyncClient, test_user: User):
        """Test that login returns a valid JWT token"""
        login_data = {
            "username": test_user.username,
            "password": "testpassword123",
        }

        response = await client.post("/api/v1/users/login", data=login_data)

        assert response.status_code == status.HTTP_200_OK
        token = response.json()["access_token"]

        # Try to use the token
        headers = {"Authorization": f"Bearer {token}"}
        profile_response = await client.get("/api/v1/users/me", headers=headers)

        assert profile_response.status_code == status.HTTP_200_OK


class TestUserProfile:
    """Test user profile endpoints"""

    @pytest.mark.asyncio
    async def test_get_current_user(self, client: AsyncClient, test_user: User, auth_headers: dict):
        """Test getting current user profile"""
        response = await client.get("/api/v1/users/me", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == test_user.id
        assert data["username"] == test_user.username
        assert data["email"] == test_user.email
        assert "hashed_password" not in data

    @pytest.mark.asyncio
    async def test_get_current_user_unauthorized(self, client: AsyncClient):
        """Test getting profile without authentication"""
        response = await client.get("/api/v1/users/me")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    async def test_get_current_user_invalid_token(self, client: AsyncClient):
        """Test getting profile with invalid token"""
        headers = {"Authorization": "Bearer invalid-token"}
        response = await client.get("/api/v1/users/me", headers=headers)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    async def test_update_profile_email(
        self, client: AsyncClient, test_user: User, auth_headers: dict
    ):
        """Test updating user email"""
        update_data = {"email": "newemail@example.com"}

        response = await client.put("/api/v1/users/me", json=update_data, headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == "newemail@example.com"

    @pytest.mark.asyncio
    async def test_update_profile_full_name(
        self, client: AsyncClient, test_user: User, auth_headers: dict
    ):
        """Test updating user full name"""
        update_data = {"full_name": "Updated Name"}

        response = await client.put("/api/v1/users/me", json=update_data, headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["full_name"] == "Updated Name"

    @pytest.mark.asyncio
    async def test_update_profile_password(
        self, client: AsyncClient, test_user: User, auth_headers: dict
    ):
        """Test updating user password"""
        update_data = {"password": "newsecurepassword123"}

        response = await client.put("/api/v1/users/me", json=update_data, headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK

        # Test login with new password
        login_data = {
            "username": test_user.username,
            "password": "newsecurepassword123",
        }
        login_response = await client.post("/api/v1/users/login", data=login_data)
        assert login_response.status_code == status.HTTP_200_OK

    @pytest.mark.asyncio
    async def test_update_profile_duplicate_email(
        self, client: AsyncClient, test_user: User, test_user2: User, auth_headers: dict
    ):
        """Test updating email to one that's already in use"""
        update_data = {"email": test_user2.email}

        response = await client.put("/api/v1/users/me", json=update_data, headers=auth_headers)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "already in use" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_update_profile_unauthorized(self, client: AsyncClient):
        """Test updating profile without authentication"""
        update_data = {"full_name": "Hacker"}

        response = await client.put("/api/v1/users/me", json=update_data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

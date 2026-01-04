"""
Integration Tests for Users API

Tests for user registration, authentication, profile retrieval, and updates.
"""

import pytest
from httpx import AsyncClient


# Registration Tests


@pytest.mark.asyncio
async def test_register_user_success(client: AsyncClient):
    """Test successful user registration"""
    response = await client.post(
        "/api/v1/users/register",
        json={
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "securepassword123",
            "full_name": "New User",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "newuser"
    assert data["email"] == "newuser@example.com"
    assert data["full_name"] == "New User"
    assert data["is_active"] is True
    assert "id" in data
    assert "hashed_password" not in data  # Should not expose password


@pytest.mark.asyncio
async def test_register_user_without_full_name(client: AsyncClient):
    """Test registration without optional full_name field"""
    response = await client.post(
        "/api/v1/users/register",
        json={
            "username": "minimaluser",
            "email": "minimal@example.com",
            "password": "password123",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "minimaluser"
    assert data["full_name"] is None


@pytest.mark.asyncio
async def test_register_duplicate_username(client: AsyncClient, test_user):
    """Test registration with existing username fails"""
    response = await client.post(
        "/api/v1/users/register",
        json={
            "username": test_user.username,  # Duplicate
            "email": "different@example.com",
            "password": "password123",
        },
    )

    assert response.status_code == 400
    assert "username already registered" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient, test_user):
    """Test registration with existing email fails"""
    response = await client.post(
        "/api/v1/users/register",
        json={
            "username": "differentuser",
            "email": test_user.email,  # Duplicate
            "password": "password123",
        },
    )

    assert response.status_code == 400
    assert "email already registered" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_register_invalid_email(client: AsyncClient):
    """Test registration with invalid email format"""
    response = await client.post(
        "/api/v1/users/register",
        json={
            "username": "testuser",
            "email": "not-an-email",
            "password": "password123",
        },
    )

    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_register_password_too_short(client: AsyncClient):
    """Test registration with password shorter than minimum"""
    response = await client.post(
        "/api/v1/users/register",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "short",  # Too short
        },
    )

    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_register_username_too_short(client: AsyncClient):
    """Test registration with username shorter than minimum"""
    response = await client.post(
        "/api/v1/users/register",
        json={
            "username": "ab",  # Too short (minimum 3)
            "email": "test@example.com",
            "password": "password123",
        },
    )

    assert response.status_code == 422  # Validation error


# Login Tests


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, test_user):
    """Test successful user login"""
    response = await client.post(
        "/api/v1/users/login",
        data={  # OAuth2 uses form data, not JSON
            "username": "testuser",
            "password": "testpassword123",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert len(data["access_token"]) > 0


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, test_user):
    """Test login with incorrect password"""
    response = await client.post(
        "/api/v1/users/login",
        data={
            "username": "testuser",
            "password": "wrongpassword",
        },
    )

    assert response.status_code == 401
    assert "incorrect username or password" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: AsyncClient):
    """Test login with non-existent username"""
    response = await client.post(
        "/api/v1/users/login",
        data={
            "username": "nonexistent",
            "password": "password123",
        },
    )

    assert response.status_code == 401
    assert "incorrect username or password" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_login_missing_credentials(client: AsyncClient):
    """Test login with missing credentials"""
    response = await client.post(
        "/api/v1/users/login",
        data={},
    )

    assert response.status_code == 422  # Validation error


# Get Current User Tests


@pytest.mark.asyncio
async def test_get_current_user_authenticated(client: AsyncClient, auth_headers, test_user):
    """Test getting current user profile when authenticated"""
    response = await client.get("/api/v1/users/me", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_user.id
    assert data["username"] == test_user.username
    assert data["email"] == test_user.email
    assert "hashed_password" not in data


@pytest.mark.asyncio
async def test_get_current_user_no_token(client: AsyncClient):
    """Test getting current user without authentication token"""
    response = await client.get("/api/v1/users/me")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user_invalid_token(client: AsyncClient):
    """Test getting current user with invalid token"""
    response = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": "Bearer invalid-token-here"},
    )

    assert response.status_code == 401


# Update Profile Tests


@pytest.mark.asyncio
async def test_update_profile_email(client: AsyncClient, auth_headers, test_user):
    """Test updating user email"""
    response = await client.put(
        "/api/v1/users/me",
        headers=auth_headers,
        json={
            "email": "newemail@example.com",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "newemail@example.com"
    assert data["username"] == test_user.username  # Unchanged


@pytest.mark.asyncio
async def test_update_profile_full_name(client: AsyncClient, auth_headers, test_user):
    """Test updating user full name"""
    response = await client.put(
        "/api/v1/users/me",
        headers=auth_headers,
        json={
            "full_name": "Updated Name",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Updated Name"


@pytest.mark.asyncio
async def test_update_profile_password(client: AsyncClient, auth_headers, test_user):
    """Test updating user password"""
    response = await client.put(
        "/api/v1/users/me",
        headers=auth_headers,
        json={
            "password": "newpassword123",
        },
    )

    assert response.status_code == 200

    # Verify can login with new password
    login_response = await client.post(
        "/api/v1/users/login",
        data={
            "username": test_user.username,
            "password": "newpassword123",
        },
    )
    assert login_response.status_code == 200


@pytest.mark.asyncio
async def test_update_profile_multiple_fields(client: AsyncClient, auth_headers):
    """Test updating multiple profile fields at once"""
    response = await client.put(
        "/api/v1/users/me",
        headers=auth_headers,
        json={
            "email": "multi@example.com",
            "full_name": "Multi Update",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "multi@example.com"
    assert data["full_name"] == "Multi Update"


@pytest.mark.asyncio
async def test_update_profile_duplicate_email(client: AsyncClient, auth_headers, test_user2):
    """Test updating email to one already in use"""
    response = await client.put(
        "/api/v1/users/me",
        headers=auth_headers,
        json={
            "email": test_user2.email,  # Already used by test_user2
        },
    )

    assert response.status_code == 400
    assert "email already in use" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_update_profile_unauthenticated(client: AsyncClient):
    """Test updating profile without authentication"""
    response = await client.put(
        "/api/v1/users/me",
        json={
            "email": "test@example.com",
        },
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_profile_empty_update(client: AsyncClient, auth_headers, test_user):
    """Test updating profile with no changes"""
    response = await client.put(
        "/api/v1/users/me",
        headers=auth_headers,
        json={},
    )

    assert response.status_code == 200
    data = response.json()
    # Should return user unchanged
    assert data["username"] == test_user.username
    assert data["email"] == test_user.email

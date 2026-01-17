"""
Unit Tests for Authentication Service

Tests for password hashing, JWT token management, user queries,
and authentication logic.
"""

import pytest
from datetime import timedelta
from jose import jwt

from app.services import auth_service
from app.schemas.user import UserCreate, TokenData
from app.config import settings


# Password Hashing Tests


def test_password_hash_is_different_from_plain_password():
    """Test that hashed password is different from plain password"""
    plain_password = "testpassword123"
    hashed = auth_service.get_password_hash(plain_password)

    assert hashed != plain_password
    assert len(hashed) > len(plain_password)
    assert hashed.startswith("$2b$")  # bcrypt hash prefix


def test_verify_password_with_correct_password():
    """Test password verification with correct password"""
    plain_password = "testpassword123"
    hashed = auth_service.get_password_hash(plain_password)

    assert auth_service.verify_password(plain_password, hashed) is True


def test_verify_password_with_wrong_password():
    """Test password verification with wrong password"""
    plain_password = "testpassword123"
    wrong_password = "wrongpassword"
    hashed = auth_service.get_password_hash(plain_password)

    assert auth_service.verify_password(wrong_password, hashed) is False


def test_same_password_generates_different_hashes():
    """Test that hashing the same password twice generates different hashes"""
    plain_password = "testpassword123"
    hash1 = auth_service.get_password_hash(plain_password)
    hash2 = auth_service.get_password_hash(plain_password)

    # Hashes should be different (bcrypt uses random salt)
    assert hash1 != hash2
    # But both should verify correctly
    assert auth_service.verify_password(plain_password, hash1) is True
    assert auth_service.verify_password(plain_password, hash2) is True


# JWT Token Creation Tests


def test_create_access_token_default_expiration():
    """Test JWT token creation with default expiration"""
    data = {"sub": "testuser", "user_id": "123"}
    token = auth_service.create_access_token(data)

    # Decode token to verify contents
    payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])

    assert payload["sub"] == "testuser"
    assert payload["user_id"] == "123"
    assert "exp" in payload
    assert isinstance(payload["exp"], int)  # Expiration is a timestamp


def test_create_access_token_custom_expiration():
    """Test JWT token creation with custom expiration"""
    data = {"sub": "testuser", "user_id": "123"}
    custom_delta = timedelta(minutes=60)
    token = auth_service.create_access_token(data, expires_delta=custom_delta)

    payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])

    assert "exp" in payload
    assert isinstance(payload["exp"], int)  # Expiration is a timestamp


def test_token_contains_username_and_user_id():
    """Test that token payload contains expected fields"""
    username = "testuser"
    user_id = "user-123"
    data = {"sub": username, "user_id": user_id}

    token = auth_service.create_access_token(data)
    payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])

    assert payload["sub"] == username
    assert payload["user_id"] == user_id


# JWT Token Decoding Tests


def test_decode_valid_token():
    """Test decoding a valid JWT token"""
    username = "testuser"
    user_id = "123"
    data = {"sub": username, "user_id": user_id}

    token = auth_service.create_access_token(data)
    token_data = auth_service.decode_access_token(token)

    assert token_data is not None
    assert isinstance(token_data, TokenData)
    assert token_data.username == username
    assert token_data.user_id == user_id


def test_decode_expired_token():
    """Test decoding an expired JWT token"""
    data = {"sub": "testuser", "user_id": "123"}
    # Create token that expires immediately
    token = auth_service.create_access_token(data, expires_delta=timedelta(seconds=-1))

    token_data = auth_service.decode_access_token(token)

    assert token_data is None


def test_decode_invalid_token():
    """Test decoding an invalid JWT token"""
    invalid_token = "invalid.jwt.token"

    token_data = auth_service.decode_access_token(invalid_token)

    assert token_data is None


def test_decode_token_with_wrong_secret():
    """Test that token signed with wrong secret fails to decode"""
    data = {"sub": "testuser", "user_id": "123"}
    # Create token with wrong secret
    wrong_token = jwt.encode(data, "wrong-secret-key", algorithm=settings.algorithm)

    token_data = auth_service.decode_access_token(wrong_token)

    assert token_data is None


def test_decode_token_missing_username():
    """Test decoding token without required 'sub' field"""
    # Create token without 'sub' field
    data = {"user_id": "123"}
    token = jwt.encode(data, settings.secret_key, algorithm=settings.algorithm)

    token_data = auth_service.decode_access_token(token)

    assert token_data is None


# User Query Tests


@pytest.mark.asyncio
async def test_get_user_by_username_exists(test_db, test_user):
    """Test retrieving existing user by username"""
    user = await auth_service.get_user_by_username(test_db, test_user.username)

    assert user is not None
    assert user.id == test_user.id
    assert user.username == test_user.username
    assert user.email == test_user.email


@pytest.mark.asyncio
async def test_get_user_by_username_not_found(test_db):
    """Test retrieving non-existent user by username"""
    user = await auth_service.get_user_by_username(test_db, "nonexistent")

    assert user is None


@pytest.mark.asyncio
async def test_get_user_by_email_exists(test_db, test_user):
    """Test retrieving existing user by email"""
    user = await auth_service.get_user_by_email(test_db, test_user.email)

    assert user is not None
    assert user.id == test_user.id
    assert user.email == test_user.email
    assert user.username == test_user.username


@pytest.mark.asyncio
async def test_get_user_by_email_not_found(test_db):
    """Test retrieving non-existent user by email"""
    user = await auth_service.get_user_by_email(test_db, "nonexistent@example.com")

    assert user is None


# User Authentication Tests


@pytest.mark.asyncio
async def test_authenticate_user_success(test_db, test_user):
    """Test successful user authentication"""
    # testuser fixture has password "testpassword123"
    user = await auth_service.authenticate_user(test_db, "testuser", "testpassword123")

    assert user is not None
    assert user.id == test_user.id
    assert user.username == test_user.username


@pytest.mark.asyncio
async def test_authenticate_user_wrong_password(test_db, test_user):
    """Test authentication with wrong password"""
    user = await auth_service.authenticate_user(test_db, "testuser", "wrongpassword")

    assert user is None


@pytest.mark.asyncio
async def test_authenticate_user_nonexistent_user(test_db):
    """Test authentication with non-existent username"""
    user = await auth_service.authenticate_user(test_db, "nonexistent", "password")

    assert user is None


@pytest.mark.asyncio
async def test_authenticate_user_case_sensitive_username(test_db, test_user):
    """Test that username is case-sensitive"""
    # Try with uppercase version
    user = await auth_service.authenticate_user(test_db, "TESTUSER", "testpassword123")

    # Should not find user (usernames are case-sensitive)
    assert user is None


# User Creation Tests


@pytest.mark.asyncio
async def test_create_user_success(test_db):
    """Test successful user creation"""
    user_data = UserCreate(
        username="newuser",
        email="newuser@example.com",
        password="newpassword123",
        full_name="New User",
    )

    user = await auth_service.create_user(test_db, user_data)

    assert user.id is not None
    assert user.username == "newuser"
    assert user.email == "newuser@example.com"
    assert user.full_name == "New User"
    assert user.is_active is True
    assert user.hashed_password != "newpassword123"  # Should be hashed


@pytest.mark.asyncio
async def test_create_user_hashes_password(test_db):
    """Test that user creation hashes the password"""
    plain_password = "mypassword123"
    user_data = UserCreate(
        username="testuser3",
        email="test3@example.com",
        password=plain_password,
    )

    user = await auth_service.create_user(test_db, user_data)

    # Password should be hashed
    assert user.hashed_password != plain_password
    assert user.hashed_password.startswith("$2b$")

    # Verify the hashed password works
    assert auth_service.verify_password(plain_password, user.hashed_password) is True


@pytest.mark.asyncio
async def test_create_user_with_all_fields(test_db):
    """Test user creation with all optional fields"""
    user_data = UserCreate(
        username="fulluser",
        email="full@example.com",
        password="password123",
        full_name="Full Name User",
    )

    user = await auth_service.create_user(test_db, user_data)

    assert user.username == "fulluser"
    assert user.email == "full@example.com"
    assert user.full_name == "Full Name User"
    assert user.is_active is True


@pytest.mark.asyncio
async def test_create_user_without_full_name(test_db):
    """Test user creation without optional full_name"""
    user_data = UserCreate(
        username="noname",
        email="noname@example.com",
        password="password123",
    )

    user = await auth_service.create_user(test_db, user_data)

    assert user.username == "noname"
    assert user.email == "noname@example.com"
    assert user.full_name is None

"""
Unit Tests for Authentication Service

Tests password hashing, JWT token generation/validation, and user authentication.
"""

import pytest
from datetime import datetime, timedelta
from jose import jwt

from app.services.auth_service import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token,
    get_user_by_username,
    get_user_by_email,
    authenticate_user,
    create_user,
)
from app.schemas.user import UserCreate
from app.config import settings


class TestPasswordHashing:
    """Test password hashing and verification"""

    def test_password_hash_generation(self):
        """Test that password hashing generates a hash"""
        password = "testpassword123"
        hashed = get_password_hash(password)

        assert hashed is not None
        assert hashed != password
        assert len(hashed) > 0

    def test_password_verification_success(self):
        """Test successful password verification"""
        password = "testpassword123"
        hashed = get_password_hash(password)

        assert verify_password(password, hashed) is True

    def test_password_verification_failure(self):
        """Test failed password verification with wrong password"""
        password = "testpassword123"
        wrong_password = "wrongpassword"
        hashed = get_password_hash(password)

        assert verify_password(wrong_password, hashed) is False

    def test_different_passwords_different_hashes(self):
        """Test that different passwords produce different hashes"""
        password1 = "password1"
        password2 = "password2"

        hash1 = get_password_hash(password1)
        hash2 = get_password_hash(password2)

        assert hash1 != hash2

    def test_same_password_different_hashes(self):
        """Test that the same password produces different hashes (salt)"""
        password = "testpassword123"

        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)

        # Different hashes due to salting
        assert hash1 != hash2

        # But both should verify correctly
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True


class TestJWTTokens:
    """Test JWT token creation and validation"""

    def test_create_access_token(self):
        """Test creating an access token"""
        data = {"sub": "testuser", "user_id": "123"}
        token = create_access_token(data)

        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0

    def test_create_token_with_custom_expiration(self):
        """Test creating a token with custom expiration"""
        data = {"sub": "testuser"}
        expires_delta = timedelta(minutes=15)
        token = create_access_token(data, expires_delta)

        # Decode without verification to check expiration
        decoded = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        exp_timestamp = decoded["exp"]
        exp_datetime = datetime.fromtimestamp(exp_timestamp)

        # Check expiration is roughly 15 minutes from now (allow 1 minute tolerance)
        expected_exp = datetime.utcnow() + timedelta(minutes=15)
        time_diff = abs((exp_datetime - expected_exp).total_seconds())
        assert time_diff < 60  # Less than 1 minute difference

    def test_decode_valid_token(self):
        """Test decoding a valid token"""
        data = {"sub": "testuser", "user_id": "user-123"}
        token = create_access_token(data)

        token_data = decode_access_token(token)

        assert token_data is not None
        assert token_data.username == "testuser"
        assert token_data.user_id == "user-123"

    def test_decode_expired_token(self):
        """Test decoding an expired token"""
        data = {"sub": "testuser"}
        # Create token that expired 1 hour ago
        expires_delta = timedelta(hours=-1)
        token = create_access_token(data, expires_delta)

        token_data = decode_access_token(token)

        # Should return None for expired token
        assert token_data is None

    def test_decode_invalid_token(self):
        """Test decoding an invalid token"""
        invalid_token = "invalid.token.here"

        token_data = decode_access_token(invalid_token)

        assert token_data is None

    def test_decode_token_with_missing_claims(self):
        """Test decoding a token with missing required claims"""
        # Create token without 'sub' claim
        data = {"user_id": "123"}
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        token = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)

        token_data = decode_access_token(token)

        # Should return None because 'sub' is missing
        assert token_data is None

    def test_decode_token_with_tampered_signature(self):
        """Test decoding a token with tampered signature"""
        data = {"sub": "testuser", "user_id": "123"}
        token = create_access_token(data)

        # Tamper with the token
        tampered_token = token[:-10] + "xxxxxxxxxx"

        token_data = decode_access_token(tampered_token)

        assert token_data is None


class TestUserRetrieval:
    """Test user retrieval functions"""

    @pytest.mark.asyncio
    async def test_get_user_by_username_exists(self, test_db, test_user):
        """Test retrieving an existing user by username"""
        user = await get_user_by_username(test_db, test_user.username)

        assert user is not None
        assert user.id == test_user.id
        assert user.username == test_user.username
        assert user.email == test_user.email

    @pytest.mark.asyncio
    async def test_get_user_by_username_not_found(self, test_db):
        """Test retrieving a non-existent user by username"""
        user = await get_user_by_username(test_db, "nonexistent")

        assert user is None

    @pytest.mark.asyncio
    async def test_get_user_by_email_exists(self, test_db, test_user):
        """Test retrieving an existing user by email"""
        user = await get_user_by_email(test_db, test_user.email)

        assert user is not None
        assert user.id == test_user.id
        assert user.email == test_user.email

    @pytest.mark.asyncio
    async def test_get_user_by_email_not_found(self, test_db):
        """Test retrieving a non-existent user by email"""
        user = await get_user_by_email(test_db, "nonexistent@example.com")

        assert user is None

    @pytest.mark.asyncio
    async def test_authenticate_user_success(self, test_db, test_user):
        """Test successful user authentication"""
        user = await authenticate_user(test_db, test_user.username, "testpassword123")

        assert user is not None
        assert user.id == test_user.id
        assert user.username == test_user.username

    @pytest.mark.asyncio
    async def test_authenticate_user_wrong_password(self, test_db, test_user):
        """Test authentication with wrong password"""
        user = await authenticate_user(test_db, test_user.username, "wrongpassword")

        assert user is None

    @pytest.mark.asyncio
    async def test_authenticate_user_nonexistent_user(self, test_db):
        """Test authentication for non-existent user"""
        user = await authenticate_user(test_db, "nonexistent", "password")

        assert user is None


class TestUserCreation:
    """Test user creation"""

    @pytest.mark.asyncio
    async def test_create_user_success(self, test_db):
        """Test creating a new user"""
        user_create = UserCreate(
            username="newuser",
            email="newuser@example.com",
            password="securepassword123",
            full_name="New User",
        )

        user = await create_user(test_db, user_create)

        assert user is not None
        assert user.id is not None
        assert user.username == "newuser"
        assert user.email == "newuser@example.com"
        assert user.full_name == "New User"
        assert user.is_active is True

        # Password should be hashed, not stored in plain text
        assert user.hashed_password != "securepassword123"
        assert verify_password("securepassword123", user.hashed_password) is True

    @pytest.mark.asyncio
    async def test_create_user_without_full_name(self, test_db):
        """Test creating a user without full name"""
        user_create = UserCreate(
            username="newuser2",
            email="newuser2@example.com",
            password="password123",
        )

        user = await create_user(test_db, user_create)

        assert user is not None
        assert user.full_name is None

"""
Unit Tests for Share Service

Tests for share creation, retrieval, expiration checks, and ownership validation.
"""

import pytest
from datetime import datetime, timedelta
from fastapi import HTTPException

from app.services import share_service
from app.schemas.share import ShareCreate
from app.models.share import RecipeShare, SharePermission


# Get Share by Token Tests


@pytest.mark.asyncio
async def test_get_share_by_token_found(test_db, test_user, test_user2, test_recipe):
    """Test retrieving existing share by token"""
    # Create a share
    share_data = ShareCreate(
        recipe_id=test_recipe.id,
        shared_with_id=test_user2.id,
        permission=SharePermission.VIEW,
    )
    share = await share_service.create_share(test_db, share_data, test_user)

    # Retrieve by token
    found = await share_service.get_share_by_token(test_db, share.share_token)

    assert found is not None
    assert found.id == share.id
    assert found.share_token == share.share_token


@pytest.mark.asyncio
async def test_get_share_by_token_not_found(test_db):
    """Test retrieving non-existent share by token"""
    share = await share_service.get_share_by_token(test_db, "nonexistent-token")

    assert share is None


# Get User Shares Tests


@pytest.mark.asyncio
async def test_get_user_shares(test_db, test_user, test_user2, test_recipe):
    """Test getting shares created by a user"""
    # Create shares
    share_data1 = ShareCreate(
        recipe_id=test_recipe.id,
        shared_with_id=test_user2.id,
        permission=SharePermission.VIEW,
    )
    share_data2 = ShareCreate(
        recipe_id=test_recipe.id,
        shared_with_id=test_user2.id,
        permission=SharePermission.EDIT,
    )

    await share_service.create_share(test_db, share_data1, test_user)
    await share_service.create_share(test_db, share_data2, test_user)

    # Get shares created by test_user
    shares = await share_service.get_user_shares(test_db, test_user.id)

    assert len(shares) >= 2
    assert all(s.shared_by_id == test_user.id for s in shares)


@pytest.mark.asyncio
async def test_get_user_shares_pagination(test_db, test_user, test_user2, test_recipe):
    """Test pagination of user shares"""
    # Create 10 shares
    for i in range(10):
        share_data = ShareCreate(
            recipe_id=test_recipe.id,
            shared_with_id=test_user2.id,
            permission=SharePermission.VIEW,
        )
        await share_service.create_share(test_db, share_data, test_user)

    # Get first 5
    shares = await share_service.get_user_shares(test_db, test_user.id, skip=0, limit=5)

    assert len(shares) == 5


@pytest.mark.asyncio
async def test_get_user_shares_empty(test_db):
    """Test getting shares for user with no shares"""
    shares = await share_service.get_user_shares(test_db, "nonexistent-user")

    assert len(shares) == 0


# Get Shares With User Tests


@pytest.mark.asyncio
async def test_get_shares_with_user(test_db, test_user, test_user2, test_recipe):
    """Test getting shares that were shared with a user"""
    # Create share from user1 to user2
    share_data = ShareCreate(
        recipe_id=test_recipe.id,
        shared_with_id=test_user2.id,
        permission=SharePermission.VIEW,
    )
    await share_service.create_share(test_db, share_data, test_user)

    # Get shares with user2
    shares = await share_service.get_shares_with_user(test_db, test_user2.id)

    assert len(shares) >= 1
    assert all(s.shared_with_id == test_user2.id for s in shares)


@pytest.mark.asyncio
async def test_get_shares_with_user_empty(test_db):
    """Test getting shares for user with no incoming shares"""
    shares = await share_service.get_shares_with_user(test_db, "nonexistent-user")

    assert len(shares) == 0


# Create Share Tests


@pytest.mark.asyncio
async def test_create_recipe_share_success(test_db, test_user, test_user2, test_recipe):
    """Test successful recipe share creation"""
    share_data = ShareCreate(
        recipe_id=test_recipe.id,
        shared_with_id=test_user2.id,
        permission=SharePermission.VIEW,
    )

    share = await share_service.create_share(test_db, share_data, test_user)

    assert share.id is not None
    assert share.recipe_id == test_recipe.id
    assert share.shared_by_id == test_user.id
    assert share.shared_with_id == test_user2.id
    assert share.permission == SharePermission.VIEW
    assert share.share_token is not None
    assert len(share.share_token) > 0


@pytest.mark.asyncio
async def test_create_library_share_success(test_db, test_user, test_user2, test_library):
    """Test successful library share creation"""
    share_data = ShareCreate(
        library_id=test_library.id,
        shared_with_id=test_user2.id,
        permission=SharePermission.EDIT,
    )

    share = await share_service.create_share(test_db, share_data, test_user)

    assert share.library_id == test_library.id
    assert share.permission == SharePermission.EDIT


@pytest.mark.asyncio
async def test_create_share_with_expiration(test_db, test_user, test_user2, test_recipe):
    """Test creating share with expiration date"""
    expires_at = datetime.utcnow() + timedelta(days=7)
    share_data = ShareCreate(
        recipe_id=test_recipe.id,
        shared_with_id=test_user2.id,
        permission=SharePermission.VIEW,
        expires_at=expires_at,
    )

    share = await share_service.create_share(test_db, share_data, test_user)

    assert share.expires_at is not None
    # Check it's close to our expected expiration (within 1 minute)
    assert abs((share.expires_at - expires_at).total_seconds()) < 60


# Delete Share Tests


@pytest.mark.asyncio
async def test_delete_share_success(test_db, test_user, test_user2, test_recipe):
    """Test successful share deletion"""
    share_data = ShareCreate(
        recipe_id=test_recipe.id,
        shared_with_id=test_user2.id,
        permission=SharePermission.VIEW,
    )
    share = await share_service.create_share(test_db, share_data, test_user)
    share_token = share.share_token

    await share_service.delete_share(test_db, share)

    # Verify deletion
    deleted = await share_service.get_share_by_token(test_db, share_token)
    assert deleted is None


# Ownership Check Tests


def test_check_share_ownership_creator(test_user, test_user2, test_recipe):
    """Test ownership check when user created the share"""
    share = RecipeShare(
        recipe_id=test_recipe.id,
        shared_by_id=test_user.id,
        shared_with_id=test_user2.id,
        permission=SharePermission.VIEW,
    )

    # Should not raise exception
    share_service.check_share_ownership(share, test_user)


def test_check_share_ownership_not_creator_raises_403(test_user, test_user2, test_recipe):
    """Test ownership check when user didn't create the share"""
    share = RecipeShare(
        recipe_id=test_recipe.id,
        shared_by_id=test_user.id,
        shared_with_id=test_user2.id,
        permission=SharePermission.VIEW,
    )

    with pytest.raises(HTTPException) as exc_info:
        share_service.check_share_ownership(share, test_user2)

    assert exc_info.value.status_code == 403
    assert "not authorized" in exc_info.value.detail.lower()


# Share Validity Tests


def test_check_share_validity_not_expired(test_user, test_user2, test_recipe):
    """Test validity check for non-expired share"""
    share = RecipeShare(
        recipe_id=test_recipe.id,
        shared_by_id=test_user.id,
        shared_with_id=test_user2.id,
        permission=SharePermission.VIEW,
        expires_at=datetime.utcnow() + timedelta(days=7),  # Future
    )

    # Should not raise exception
    share_service.check_share_validity(share)


def test_check_share_validity_no_expiration(test_user, test_user2, test_recipe):
    """Test validity check for share with no expiration"""
    share = RecipeShare(
        recipe_id=test_recipe.id,
        shared_by_id=test_user.id,
        shared_with_id=test_user2.id,
        permission=SharePermission.VIEW,
        expires_at=None,  # No expiration
    )

    # Should not raise exception
    share_service.check_share_validity(share)


def test_check_share_validity_expired_raises_410(test_user, test_user2, test_recipe):
    """Test validity check for expired share"""
    share = RecipeShare(
        recipe_id=test_recipe.id,
        shared_by_id=test_user.id,
        shared_with_id=test_user2.id,
        permission=SharePermission.VIEW,
        expires_at=datetime.utcnow() - timedelta(days=1),  # Past
    )

    with pytest.raises(HTTPException) as exc_info:
        share_service.check_share_validity(share)

    assert exc_info.value.status_code == 410  # Gone
    assert "expired" in exc_info.value.detail.lower()

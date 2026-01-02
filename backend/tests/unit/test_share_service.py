"""
Unit Tests for Share Service

Tests share creation, validation, permissions, and expiration logic.
"""

import pytest
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.services.share_service import (
    get_share_by_token,
    get_user_shares,
    get_shares_with_user,
    create_share,
    delete_share,
    check_share_ownership,
    check_share_validity,
)
from app.schemas.share import ShareCreate
from app.models.share import RecipeShare, SharePermission
from app.models.recipe import Recipe
from app.models.library import RecipeLibrary
from app.models.user import User


class TestShareCreation:
    """Test share creation"""

    @pytest.mark.asyncio
    async def test_create_recipe_share(
        self, test_db: AsyncSession, test_recipe: Recipe, test_user: User, test_user2: User
    ):
        """Test creating a recipe share"""
        share_create = ShareCreate(
            recipe_id=test_recipe.id,
            shared_with_id=test_user2.id,
            permission=SharePermission.VIEW,
        )

        share = await create_share(test_db, share_create, test_user)

        assert share is not None
        assert share.id is not None
        assert share.recipe_id == test_recipe.id
        assert share.library_id is None
        assert share.shared_by_id == test_user.id
        assert share.shared_with_id == test_user2.id
        assert share.permission == SharePermission.VIEW
        assert share.share_token is not None
        assert len(share.share_token) > 0

    @pytest.mark.asyncio
    async def test_create_library_share(
        self, test_db: AsyncSession, test_library: RecipeLibrary, test_user: User, test_user2: User
    ):
        """Test creating a library share"""
        share_create = ShareCreate(
            library_id=test_library.id,
            shared_with_id=test_user2.id,
            permission=SharePermission.EDIT,
        )

        share = await create_share(test_db, share_create, test_user)

        assert share.library_id == test_library.id
        assert share.recipe_id is None
        assert share.permission == SharePermission.EDIT

    @pytest.mark.asyncio
    async def test_create_public_share(
        self, test_db: AsyncSession, test_recipe: Recipe, test_user: User
    ):
        """Test creating a public share (no specific user)"""
        share_create = ShareCreate(
            recipe_id=test_recipe.id,
            shared_with_id=None,  # Public share
            permission=SharePermission.VIEW,
        )

        share = await create_share(test_db, share_create, test_user)

        assert share.shared_with_id is None
        assert share.share_token is not None

    @pytest.mark.asyncio
    async def test_create_user_specific_share(
        self, test_db: AsyncSession, test_recipe: Recipe, test_user: User, test_user2: User
    ):
        """Test creating a user-specific share"""
        share_create = ShareCreate(
            recipe_id=test_recipe.id,
            shared_with_id=test_user2.id,
            permission=SharePermission.VIEW,
        )

        share = await create_share(test_db, share_create, test_user)

        assert share.shared_with_id == test_user2.id

    @pytest.mark.asyncio
    async def test_create_share_with_expiration(
        self, test_db: AsyncSession, test_recipe: Recipe, test_user: User
    ):
        """Test creating a share with expiration"""
        expires_at = datetime.utcnow() + timedelta(days=7)
        share_create = ShareCreate(
            recipe_id=test_recipe.id,
            permission=SharePermission.VIEW,
            expires_at=expires_at,
        )

        share = await create_share(test_db, share_create, test_user)

        assert share.expires_at is not None
        # Allow small time difference due to processing
        time_diff = abs((share.expires_at - expires_at).total_seconds())
        assert time_diff < 5

    @pytest.mark.asyncio
    async def test_share_token_uniqueness(
        self, test_db: AsyncSession, test_recipe: Recipe, test_recipe2: Recipe, test_user: User
    ):
        """Test that each share gets a unique token"""
        share_create1 = ShareCreate(
            recipe_id=test_recipe.id,
            permission=SharePermission.VIEW,
        )
        share_create2 = ShareCreate(
            recipe_id=test_recipe2.id,
            permission=SharePermission.VIEW,
        )

        share1 = await create_share(test_db, share_create1, test_user)
        share2 = await create_share(test_db, share_create2, test_user)

        assert share1.share_token != share2.share_token


class TestShareRetrieval:
    """Test share retrieval functions"""

    @pytest.mark.asyncio
    async def test_get_share_by_token(
        self, test_db: AsyncSession, test_share: RecipeShare
    ):
        """Test retrieving a share by token"""
        share = await get_share_by_token(test_db, test_share.share_token)

        assert share is not None
        assert share.id == test_share.id
        assert share.share_token == test_share.share_token

    @pytest.mark.asyncio
    async def test_get_share_invalid_token(self, test_db: AsyncSession):
        """Test retrieving a share with invalid token"""
        share = await get_share_by_token(test_db, "invalid-token-123")

        assert share is None

    @pytest.mark.asyncio
    async def test_get_user_shares(
        self, test_db: AsyncSession, test_user: User, test_share: RecipeShare
    ):
        """Test retrieving shares created by a user"""
        shares = await get_user_shares(test_db, test_user.id)

        assert len(shares) >= 1
        for share in shares:
            assert share.shared_by_id == test_user.id

    @pytest.mark.asyncio
    async def test_get_shares_with_user(
        self, test_db: AsyncSession, test_user2: User, test_share: RecipeShare
    ):
        """Test retrieving shares shared with a user"""
        shares = await get_shares_with_user(test_db, test_user2.id)

        assert len(shares) >= 1
        for share in shares:
            assert share.shared_with_id == test_user2.id

    @pytest.mark.asyncio
    async def test_get_shares_pagination(
        self, test_db: AsyncSession, test_user: User, test_recipe: Recipe, test_recipe2: Recipe
    ):
        """Test share pagination"""
        # Create multiple shares
        share_create1 = ShareCreate(recipe_id=test_recipe.id, permission=SharePermission.VIEW)
        share_create2 = ShareCreate(recipe_id=test_recipe2.id, permission=SharePermission.VIEW)

        await create_share(test_db, share_create1, test_user)
        await create_share(test_db, share_create2, test_user)

        # Get first page
        shares_page1 = await get_user_shares(test_db, test_user.id, skip=0, limit=1)
        assert len(shares_page1) == 1

        # Get second page
        shares_page2 = await get_user_shares(test_db, test_user.id, skip=1, limit=1)
        assert len(shares_page2) >= 1


class TestShareValidation:
    """Test share validation logic"""

    @pytest.mark.asyncio
    async def test_check_share_validity_active(self, test_share: RecipeShare):
        """Test checking validity of an active share"""
        # Should not raise exception for non-expired share
        check_share_validity(test_share)

    @pytest.mark.asyncio
    async def test_check_share_validity_expired(
        self, test_db: AsyncSession, test_recipe: Recipe, test_user: User
    ):
        """Test checking validity of an expired share"""
        # Create expired share
        share_create = ShareCreate(
            recipe_id=test_recipe.id,
            permission=SharePermission.VIEW,
            expires_at=datetime.utcnow() - timedelta(days=1),  # Expired yesterday
        )
        expired_share = await create_share(test_db, share_create, test_user)

        with pytest.raises(HTTPException) as exc_info:
            check_share_validity(expired_share)

        assert exc_info.value.status_code == 410  # Gone

    @pytest.mark.asyncio
    async def test_check_share_validity_no_expiration(self, test_share: RecipeShare):
        """Test that shares without expiration are always valid"""
        # Remove expiration
        test_share.expires_at = None

        # Should not raise exception
        check_share_validity(test_share)

    def test_check_share_ownership(self, test_share: RecipeShare, test_user: User):
        """Test checking share ownership"""
        # Should not raise exception for owner
        check_share_ownership(test_share, test_user)

    def test_check_share_ownership_failure(self, test_share: RecipeShare, test_user2: User):
        """Test failed share ownership check"""
        with pytest.raises(HTTPException) as exc_info:
            check_share_ownership(test_share, test_user2)

        assert exc_info.value.status_code == 403


class TestSharePermissions:
    """Test share permission levels"""

    @pytest.mark.asyncio
    async def test_view_permission(
        self, test_db: AsyncSession, test_recipe: Recipe, test_user: User
    ):
        """Test creating a share with VIEW permission"""
        share_create = ShareCreate(
            recipe_id=test_recipe.id,
            permission=SharePermission.VIEW,
        )

        share = await create_share(test_db, share_create, test_user)

        assert share.permission == SharePermission.VIEW

    @pytest.mark.asyncio
    async def test_edit_permission(
        self, test_db: AsyncSession, test_recipe: Recipe, test_user: User
    ):
        """Test creating a share with EDIT permission"""
        share_create = ShareCreate(
            recipe_id=test_recipe.id,
            permission=SharePermission.EDIT,
        )

        share = await create_share(test_db, share_create, test_user)

        assert share.permission == SharePermission.EDIT


class TestShareDeletion:
    """Test share deletion"""

    @pytest.mark.asyncio
    async def test_delete_share(
        self, test_db: AsyncSession, test_share: RecipeShare
    ):
        """Test deleting a share"""
        from sqlalchemy import select

        share_id = test_share.id

        await delete_share(test_db, test_share)
        await test_db.commit()

        # Verify share is deleted
        result = await test_db.execute(select(RecipeShare).where(RecipeShare.id == share_id))
        deleted_share = result.scalar_one_or_none()
        assert deleted_share is None

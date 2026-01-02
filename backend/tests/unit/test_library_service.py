"""
Unit Tests for Library Service

Tests library CRUD operations, recipe associations, and ownership validation.
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.services.library_service import (
    get_library,
    get_libraries,
    create_library,
    update_library,
    delete_library,
    check_library_ownership,
)
from app.schemas.library import LibraryCreate, LibraryUpdate
from app.models.library import RecipeLibrary
from app.models.user import User
from app.models.recipe import Recipe


class TestLibraryCRUD:
    """Test library CRUD operations"""

    @pytest.mark.asyncio
    async def test_create_library(self, test_db: AsyncSession, test_user: User):
        """Test creating a library"""
        library_create = LibraryCreate(
            name="My New Library",
            description="A test library",
            is_public=False,
        )

        library = await create_library(test_db, library_create, test_user)

        assert library is not None
        assert library.id is not None
        assert library.name == "My New Library"
        assert library.description == "A test library"
        assert library.is_public is False
        assert library.owner_id == test_user.id

    @pytest.mark.asyncio
    async def test_create_public_library(self, test_db: AsyncSession, test_user: User):
        """Test creating a public library"""
        library_create = LibraryCreate(
            name="Public Library",
            is_public=True,
        )

        library = await create_library(test_db, library_create, test_user)

        assert library.is_public is True

    @pytest.mark.asyncio
    async def test_get_library_by_id(self, test_db: AsyncSession, test_library: RecipeLibrary):
        """Test retrieving a library by ID"""
        library = await get_library(test_db, test_library.id)

        assert library is not None
        assert library.id == test_library.id
        assert library.name == test_library.name

    @pytest.mark.asyncio
    async def test_get_library_not_found(self, test_db: AsyncSession):
        """Test retrieving a non-existent library"""
        library = await get_library(test_db, "nonexistent-id")

        assert library is None

    @pytest.mark.asyncio
    async def test_get_library_with_recipes(
        self, test_db: AsyncSession, test_recipe_in_library: Recipe, test_library: RecipeLibrary
    ):
        """Test retrieving a library with its recipes"""
        library = await get_library(test_db, test_library.id, include_recipes=True)

        assert library is not None
        assert hasattr(library, 'recipes')
        assert len(library.recipes) >= 1
        assert library.recipes[0].library_id == test_library.id

    @pytest.mark.asyncio
    async def test_get_libraries_for_user(
        self, test_db: AsyncSession, test_user: User, test_library: RecipeLibrary
    ):
        """Test retrieving all libraries for a user"""
        libraries = await get_libraries(test_db, owner_id=test_user.id)

        assert len(libraries) >= 1
        for library in libraries:
            assert library.owner_id == test_user.id

    @pytest.mark.asyncio
    async def test_get_libraries_pagination(
        self, test_db: AsyncSession, test_user: User, test_library: RecipeLibrary, test_library2: RecipeLibrary
    ):
        """Test library pagination"""
        # Get first page
        libraries_page1 = await get_libraries(test_db, owner_id=test_user.id, skip=0, limit=1)
        assert len(libraries_page1) == 1

        # Get second page
        libraries_page2 = await get_libraries(test_db, owner_id=test_user.id, skip=1, limit=1)
        assert len(libraries_page2) == 1

        # Should be different libraries
        assert libraries_page1[0].id != libraries_page2[0].id

    @pytest.mark.asyncio
    async def test_update_library_name(
        self, test_db: AsyncSession, test_library: RecipeLibrary
    ):
        """Test updating library name"""
        library_update = LibraryUpdate(name="Updated Library Name")

        updated_library = await update_library(test_db, test_library, library_update)

        assert updated_library.name == "Updated Library Name"
        assert updated_library.id == test_library.id

    @pytest.mark.asyncio
    async def test_update_library_visibility(
        self, test_db: AsyncSession, test_library: RecipeLibrary
    ):
        """Test updating library visibility"""
        original_visibility = test_library.is_public
        library_update = LibraryUpdate(is_public=not original_visibility)

        updated_library = await update_library(test_db, test_library, library_update)

        assert updated_library.is_public == (not original_visibility)

    @pytest.mark.asyncio
    async def test_update_library_description(
        self, test_db: AsyncSession, test_library: RecipeLibrary
    ):
        """Test updating library description"""
        library_update = LibraryUpdate(description="New description")

        updated_library = await update_library(test_db, test_library, library_update)

        assert updated_library.description == "New description"

    @pytest.mark.asyncio
    async def test_delete_library_keeps_recipes(
        self, test_db: AsyncSession, test_recipe_in_library: Recipe, test_library: RecipeLibrary
    ):
        """Test that deleting a library doesn't delete its recipes"""
        from sqlalchemy import select
        from app.models.recipe import Recipe

        recipe_id = test_recipe_in_library.id
        library_id = test_library.id

        # Delete library
        await delete_library(test_db, test_library)
        await test_db.commit()

        # Verify library is deleted
        deleted_library = await get_library(test_db, library_id)
        assert deleted_library is None

        # Verify recipe still exists
        result = await test_db.execute(select(Recipe).where(Recipe.id == recipe_id))
        recipe = result.scalar_one_or_none()
        assert recipe is not None

    @pytest.mark.asyncio
    async def test_delete_library_removes_recipe_association(
        self, test_db: AsyncSession, test_recipe_in_library: Recipe, test_library: RecipeLibrary
    ):
        """Test that deleting a library removes recipe associations"""
        from sqlalchemy import select
        from app.models.recipe import Recipe

        recipe_id = test_recipe_in_library.id

        # Delete library
        await delete_library(test_db, test_library)
        await test_db.commit()

        # Verify recipe's library_id is set to None
        result = await test_db.execute(select(Recipe).where(Recipe.id == recipe_id))
        recipe = result.scalar_one_or_none()
        assert recipe is not None
        assert recipe.library_id is None


class TestLibraryOwnership:
    """Test library ownership checks"""

    def test_check_library_ownership_success(
        self, test_library: RecipeLibrary, test_user: User
    ):
        """Test successful library ownership check"""
        # Should not raise exception
        check_library_ownership(test_library, test_user)

    def test_check_library_ownership_failure(
        self, test_library: RecipeLibrary, test_user2: User
    ):
        """Test failed library ownership check"""
        with pytest.raises(HTTPException) as exc_info:
            check_library_ownership(test_library, test_user2)

        assert exc_info.value.status_code == 403

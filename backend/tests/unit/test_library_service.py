"""
Unit Tests for Library Service

Tests for library CRUD operations, queries, and ownership checks.
"""

import pytest
from fastapi import HTTPException

from app.services import library_service
from app.schemas.library import LibraryCreate, LibraryUpdate
from tests.utils.helpers import create_test_library, create_test_recipe


# Get Library Tests


@pytest.mark.asyncio
async def test_get_library_by_id_found(test_db, test_library):
    """Test retrieving existing library by ID"""
    library = await library_service.get_library(test_db, test_library.id)

    assert library is not None
    assert library.id == test_library.id
    assert library.name == test_library.name


@pytest.mark.asyncio
async def test_get_library_by_id_not_found(test_db):
    """Test retrieving non-existent library by ID"""
    library = await library_service.get_library(test_db, "nonexistent-id")

    assert library is None


@pytest.mark.asyncio
async def test_get_library_with_recipes(test_db, test_user, test_library):
    """Test retrieving library with recipes loaded"""
    # Add some recipes to the library
    await create_test_recipe(test_db, test_user, "Recipe 1", library=test_library)
    await create_test_recipe(test_db, test_user, "Recipe 2", library=test_library)

    library = await library_service.get_library(
        test_db, test_library.id, include_recipes=True
    )

    assert library is not None
    assert len(library.recipes) >= 2


# Get Libraries Tests


@pytest.mark.asyncio
async def test_get_libraries_no_filters(test_db, test_user):
    """Test getting all libraries without filters"""
    await create_test_library(test_db, test_user, "Library 1")
    await create_test_library(test_db, test_user, "Library 2")

    libraries = await library_service.get_libraries(test_db)

    assert len(libraries) >= 2


@pytest.mark.asyncio
async def test_get_libraries_filter_by_owner(test_db, test_user, test_user2):
    """Test filtering libraries by owner"""
    await create_test_library(test_db, test_user, "User1 Library")
    await create_test_library(test_db, test_user2, "User2 Library")

    libraries = await library_service.get_libraries(test_db, owner_id=test_user.id)

    assert len(libraries) >= 1
    assert all(lib.owner_id == test_user.id for lib in libraries)


@pytest.mark.asyncio
async def test_get_libraries_pagination(test_db, test_user):
    """Test library pagination"""
    for i in range(10):
        await create_test_library(test_db, test_user, f"Library {i}")

    # Get first 5
    libraries = await library_service.get_libraries(test_db, skip=0, limit=5)

    assert len(libraries) == 5


@pytest.mark.asyncio
async def test_get_libraries_empty_result(test_db):
    """Test getting libraries when none exist"""
    libraries = await library_service.get_libraries(test_db, owner_id="nonexistent")

    assert len(libraries) == 0


# Create Library Tests


@pytest.mark.asyncio
async def test_create_library_success(test_db, test_user):
    """Test successful library creation"""
    library_data = LibraryCreate(
        name="New Library", description="A test library", is_public=False
    )

    library = await library_service.create_library(test_db, library_data, test_user)

    assert library.id is not None
    assert library.name == "New Library"
    assert library.description == "A test library"
    assert library.is_public is False
    assert library.owner_id == test_user.id


@pytest.mark.asyncio
async def test_create_library_public(test_db, test_user):
    """Test creating a public library"""
    library_data = LibraryCreate(
        name="Public Library", description="Public collection", is_public=True
    )

    library = await library_service.create_library(test_db, library_data, test_user)

    assert library.is_public is True


@pytest.mark.asyncio
async def test_create_library_without_description(test_db, test_user):
    """Test creating library without optional description"""
    library_data = LibraryCreate(name="No Description Library", is_public=False)

    library = await library_service.create_library(test_db, library_data, test_user)

    assert library.name == "No Description Library"
    assert library.description is None


# Update Library Tests


@pytest.mark.asyncio
async def test_update_library_name(test_db, test_library):
    """Test updating library name"""
    update_data = LibraryUpdate(name="Updated Name")

    updated = await library_service.update_library(test_db, test_library, update_data)

    assert updated.name == "Updated Name"
    assert updated.description == test_library.description  # Unchanged


@pytest.mark.asyncio
async def test_update_library_description(test_db, test_library):
    """Test updating library description"""
    update_data = LibraryUpdate(description="Updated description")

    updated = await library_service.update_library(test_db, test_library, update_data)

    assert updated.description == "Updated description"


@pytest.mark.asyncio
async def test_update_library_is_public(test_db, test_library):
    """Test updating library public status"""
    update_data = LibraryUpdate(is_public=True)

    updated = await library_service.update_library(test_db, test_library, update_data)

    assert updated.is_public is True


@pytest.mark.asyncio
async def test_update_library_multiple_fields(test_db, test_library):
    """Test updating multiple library fields"""
    update_data = LibraryUpdate(
        name="Multi Update", description="New description", is_public=True
    )

    updated = await library_service.update_library(test_db, test_library, update_data)

    assert updated.name == "Multi Update"
    assert updated.description == "New description"
    assert updated.is_public is True


# Delete Library Tests


@pytest.mark.asyncio
async def test_delete_library_success(test_db, test_user):
    """Test successful library deletion"""
    library = await create_test_library(test_db, test_user, "To Delete")
    library_id = library.id

    await library_service.delete_library(test_db, library)

    # Verify deletion
    deleted = await library_service.get_library(test_db, library_id)
    assert deleted is None


# Ownership Check Tests


def test_check_library_ownership_owner(test_library, test_user):
    """Test ownership check when user owns the library"""
    # Should not raise exception
    library_service.check_library_ownership(test_library, test_user)


def test_check_library_ownership_not_owner_raises_403(test_library, test_user2):
    """Test ownership check when user doesn't own the library"""
    with pytest.raises(HTTPException) as exc_info:
        library_service.check_library_ownership(test_library, test_user2)

    assert exc_info.value.status_code == 403
    assert "not authorized" in exc_info.value.detail.lower()

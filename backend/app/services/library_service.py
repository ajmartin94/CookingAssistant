"""
Library Service

Business logic for recipe library management.
"""

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.library import RecipeLibrary
from app.models.user import User
from app.schemas.library import LibraryCreate, LibraryUpdate


async def get_library(
    db: AsyncSession, library_id: str, include_recipes: bool = False
) -> Optional[RecipeLibrary]:
    """
    Get a library by ID

    Args:
        db: Database session
        library_id: Library ID
        include_recipes: Whether to load recipes

    Returns:
        Library or None
    """
    query = select(RecipeLibrary).where(RecipeLibrary.id == library_id)

    if include_recipes:
        query = query.options(selectinload(RecipeLibrary.recipes))

    result = await db.execute(query)
    return result.scalar_one_or_none()


async def get_libraries(
    db: AsyncSession, owner_id: Optional[str] = None, skip: int = 0, limit: int = 50
) -> list[RecipeLibrary]:
    """
    Get libraries with optional filtering and pagination

    Args:
        db: Database session
        owner_id: Filter by owner
        skip: Number of records to skip
        limit: Maximum number of records to return

    Returns:
        List of libraries
    """
    query = select(RecipeLibrary)

    if owner_id:
        query = query.where(RecipeLibrary.owner_id == owner_id)

    query = query.offset(skip).limit(limit).order_by(RecipeLibrary.created_at.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


async def create_library(
    db: AsyncSession, library_create: LibraryCreate, user: User
) -> RecipeLibrary:
    """
    Create a new library

    Args:
        db: Database session
        library_create: Library creation data
        user: Owner of the library

    Returns:
        Created library
    """
    db_library = RecipeLibrary(
        name=library_create.name,
        description=library_create.description,
        is_public=library_create.is_public,
        owner_id=user.id,
    )

    db.add(db_library)
    await db.commit()
    await db.refresh(db_library)
    return db_library


async def update_library(
    db: AsyncSession, library: RecipeLibrary, library_update: LibraryUpdate
) -> RecipeLibrary:
    """
    Update a library

    Args:
        db: Database session
        library: Existing library to update
        library_update: Updated library data

    Returns:
        Updated library
    """
    update_data = library_update.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(library, key, value)

    await db.commit()
    await db.refresh(library)
    return library


async def delete_library(db: AsyncSession, library: RecipeLibrary) -> None:
    """
    Delete a library

    Args:
        db: Database session
        library: Library to delete
    """
    await db.delete(library)
    await db.commit()


def check_library_ownership(library: RecipeLibrary, user: User) -> None:
    """
    Check if user owns the library

    Args:
        library: Library to check
        user: User to check ownership

    Raises:
        HTTPException: If user doesn't own the library
    """
    if library.owner_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this library",
        )

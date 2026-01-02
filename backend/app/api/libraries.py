"""
Libraries API

API endpoints for recipe library management.
"""

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.library import LibraryCreate, LibraryResponse, LibraryUpdate, LibraryDetailResponse
from app.services.library_service import (
    get_library,
    get_libraries,
    create_library,
    update_library,
    delete_library,
    check_library_ownership,
)
from app.utils.dependencies import CurrentUser

router = APIRouter(prefix="/libraries", tags=["libraries"])


@router.get("", response_model=list[LibraryResponse])
async def list_libraries(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: CurrentUser,
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of items to return"),
):
    """
    List user's recipe libraries

    - **skip**: Number of items to skip for pagination
    - **limit**: Maximum number of items to return (1-100)
    """
    libraries = await get_libraries(
        db=db,
        owner_id=current_user.id,
        skip=skip,
        limit=limit,
    )
    return libraries


@router.post("", response_model=LibraryResponse, status_code=status.HTTP_201_CREATED)
async def create_new_library(
    library_create: LibraryCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Create a new recipe library

    - **name**: Library name (required)
    - **description**: Library description
    - **is_public**: Whether library is publicly visible (default: false)
    """
    library = await create_library(db, library_create, current_user)
    return library


@router.get("/{library_id}", response_model=LibraryDetailResponse)
async def get_library_detail(
    library_id: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Get library details including all recipes

    Returns library information with full list of recipes in the library.
    """
    library = await get_library(db, library_id, include_recipes=True)
    if not library:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Library not found",
        )

    # Verify ownership
    check_library_ownership(library, current_user)
    return library


@router.put("/{library_id}", response_model=LibraryResponse)
async def update_existing_library(
    library_id: str,
    library_update: LibraryUpdate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Update a library

    All fields are optional. Only provided fields will be updated.
    """
    library = await get_library(db, library_id)
    if not library:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Library not found",
        )

    # Verify ownership
    check_library_ownership(library, current_user)

    updated_library = await update_library(db, library, library_update)
    return updated_library


@router.delete("/{library_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_library(
    library_id: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Delete a library

    Permanently deletes the library. Recipes in the library will not be deleted,
    but will be removed from the library. This action cannot be undone.
    """
    library = await get_library(db, library_id)
    if not library:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Library not found",
        )

    # Verify ownership
    check_library_ownership(library, current_user)

    await delete_library(db, library)
    return None

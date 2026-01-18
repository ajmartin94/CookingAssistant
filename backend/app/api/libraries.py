"""
Libraries API

API endpoints for recipe library management.
"""

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.library import (
    LibraryCreate,
    LibraryResponse,
    LibraryUpdate,
    LibraryDetailResponse,
)
from app.schemas.recipe import RecipeResponse
from app.services.library_service import (
    get_library,
    get_libraries,
    create_library,
    update_library,
    delete_library,
    check_library_ownership,
    get_recipe,
    add_recipe_to_library,
    remove_recipe_from_library,
)
from app.utils.dependencies import CurrentUser

router = APIRouter(prefix="/libraries", tags=["libraries"])


@router.get("", response_model=list[LibraryResponse])
async def list_libraries(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: CurrentUser,
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(
        50, ge=1, le=100, description="Maximum number of items to return"
    ),
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


@router.post("/{library_id}/recipes/{recipe_id}", response_model=RecipeResponse)
async def add_recipe_to_library_endpoint(
    library_id: str,
    recipe_id: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Add a recipe to a library

    Both the library and recipe must be owned by the current user.
    """
    library = await get_library(db, library_id)
    if not library:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Library not found",
        )

    # Verify library ownership
    check_library_ownership(library, current_user)

    recipe = await get_recipe(db, recipe_id)
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found",
        )

    # Verify recipe ownership
    if recipe.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this recipe",
        )

    updated_recipe = await add_recipe_to_library(db, library, recipe)
    return updated_recipe


@router.delete("/{library_id}/recipes/{recipe_id}", response_model=RecipeResponse)
async def remove_recipe_from_library_endpoint(
    library_id: str,
    recipe_id: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Remove a recipe from a library

    The library and recipe must be owned by the current user,
    and the recipe must currently be in the specified library.
    """
    library = await get_library(db, library_id)
    if not library:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Library not found",
        )

    # Verify library ownership
    check_library_ownership(library, current_user)

    recipe = await get_recipe(db, recipe_id)
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found",
        )

    # Verify recipe is in this library
    if recipe.library_id != library_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recipe is not in this library",
        )

    updated_recipe = await remove_recipe_from_library(db, recipe)
    return updated_recipe

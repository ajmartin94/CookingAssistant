"""
Favorites API

API endpoints for managing recipe favorites.
"""

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from math import ceil

from app.database import get_db
from app.schemas.recipe import RecipeListResponse
from app.services.recipe_service import get_recipe
from app.services.favorite_service import (
    get_favorite,
    add_favorite,
    remove_favorite,
    get_user_favorites,
)
from app.utils.dependencies import CurrentUser

router = APIRouter(prefix="/recipes", tags=["favorites"])


@router.post("/{recipe_id}/favorite", status_code=status.HTTP_201_CREATED)
async def favorite_recipe(
    recipe_id: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Add a recipe to favorites

    Adds the specified recipe to the current user's favorites list.
    Returns 409 if the recipe is already favorited.
    """
    # Check if recipe exists
    recipe = await get_recipe(db, recipe_id)
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found",
        )

    # Check if already favorited
    existing = await get_favorite(db, current_user.id, recipe_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Recipe is already in favorites",
        )

    await add_favorite(db, current_user, recipe)
    return {"message": "Recipe added to favorites", "recipe_id": recipe_id}


@router.delete("/{recipe_id}/favorite", status_code=status.HTTP_204_NO_CONTENT)
async def unfavorite_recipe(
    recipe_id: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Remove a recipe from favorites

    Removes the specified recipe from the current user's favorites list.
    Returns 404 if the recipe is not in favorites.
    """
    # Check if favorited
    favorite = await get_favorite(db, current_user.id, recipe_id)
    if not favorite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not in favorites",
        )

    await remove_favorite(db, favorite)
    return None


@router.get("/favorites", response_model=RecipeListResponse)
async def list_favorites(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
):
    """
    List user's favorite recipes

    Returns a paginated list of the current user's favorite recipes,
    ordered by when they were favorited (most recent first).
    """
    skip = (page - 1) * page_size

    recipes, total = await get_user_favorites(
        db=db,
        user_id=current_user.id,
        skip=skip,
        limit=page_size,
    )

    total_pages = ceil(total / page_size) if total > 0 else 0

    return RecipeListResponse(
        recipes=recipes,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )

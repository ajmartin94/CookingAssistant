"""
Recipes API

API endpoints for recipe CRUD operations.
"""

from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.recipe import RecipeCreate, RecipeResponse, RecipeUpdate, RecipeListResponse
from app.services.recipe_service import (
    get_recipe,
    get_recipes,
    create_recipe,
    update_recipe,
    delete_recipe,
    check_recipe_ownership,
)
from app.utils.dependencies import CurrentUser
from math import ceil

router = APIRouter(prefix="/recipes", tags=["recipes"])


@router.get("", response_model=RecipeListResponse)
async def list_recipes(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: CurrentUser,
    library_id: Optional[str] = Query(None, description="Filter by library ID"),
    cuisine_type: Optional[str] = Query(None, description="Filter by cuisine type"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty level"),
    search: Optional[str] = Query(None, description="Search in title and description"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
):
    """
    List user's recipes with optional filters and pagination

    - **library_id**: Filter recipes by library
    - **cuisine_type**: Filter by cuisine type
    - **difficulty**: Filter by difficulty (easy, medium, hard)
    - **search**: Search term for title and description
    - **page**: Page number (starts at 1)
    - **page_size**: Number of items per page (1-100)
    """
    skip = (page - 1) * page_size

    recipes, total = await get_recipes(
        db=db,
        owner_id=current_user.id,
        library_id=library_id,
        cuisine_type=cuisine_type,
        difficulty=difficulty,
        search=search,
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


@router.post("", response_model=RecipeResponse, status_code=status.HTTP_201_CREATED)
async def create_new_recipe(
    recipe_create: RecipeCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Create a new recipe

    - **title**: Recipe title (required)
    - **description**: Recipe description
    - **ingredients**: List of ingredients with amounts and units
    - **instructions**: Step-by-step cooking instructions
    - **prep_time_minutes**: Preparation time in minutes
    - **cook_time_minutes**: Cooking time in minutes
    - **servings**: Number of servings (default: 4)
    - **cuisine_type**: Type of cuisine
    - **dietary_tags**: Dietary restriction tags
    - **difficulty_level**: easy, medium, or hard
    - **source_url**: Original recipe URL
    - **source_name**: Source name/attribution
    - **notes**: Personal notes
    - **image_url**: Recipe image URL
    - **library_id**: Optional library to add recipe to
    """
    recipe = await create_recipe(db, recipe_create, current_user)
    return recipe


@router.get("/{recipe_id}", response_model=RecipeResponse)
async def get_recipe_detail(
    recipe_id: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Get recipe details by ID

    Returns full recipe information including all ingredients and instructions.
    """
    recipe = await get_recipe(db, recipe_id)
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found",
        )

    # Verify ownership
    check_recipe_ownership(recipe, current_user)
    return recipe


@router.put("/{recipe_id}", response_model=RecipeResponse)
async def update_existing_recipe(
    recipe_id: str,
    recipe_update: RecipeUpdate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Update a recipe

    All fields are optional. Only provided fields will be updated.
    """
    recipe = await get_recipe(db, recipe_id)
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found",
        )

    # Verify ownership
    check_recipe_ownership(recipe, current_user)

    updated_recipe = await update_recipe(db, recipe, recipe_update)
    return updated_recipe


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_recipe(
    recipe_id: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Delete a recipe

    Permanently deletes the recipe. This action cannot be undone.
    """
    recipe = await get_recipe(db, recipe_id)
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found",
        )

    # Verify ownership
    check_recipe_ownership(recipe, current_user)

    await delete_recipe(db, recipe)
    return None

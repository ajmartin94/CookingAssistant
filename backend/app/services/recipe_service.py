"""
Recipe Service

Business logic for recipe management.
"""

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from fastapi import HTTPException, status

from app.models.recipe import Recipe
from app.models.user import User
from app.schemas.recipe import RecipeCreate, RecipeUpdate


async def get_recipe(db: AsyncSession, recipe_id: str) -> Optional[Recipe]:
    """Get a recipe by ID"""
    result = await db.execute(select(Recipe).where(Recipe.id == recipe_id))
    return result.scalar_one_or_none()


async def get_recipes(
    db: AsyncSession,
    owner_id: Optional[str] = None,
    library_id: Optional[str] = None,
    cuisine_type: Optional[str] = None,
    dietary_tags: Optional[list[str]] = None,
    difficulty: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[Recipe], int]:
    """
    Get recipes with optional filters and pagination

    Args:
        db: Database session
        owner_id: Filter by recipe owner
        library_id: Filter by library
        cuisine_type: Filter by cuisine type
        dietary_tags: Filter by dietary tags
        difficulty: Filter by difficulty level
        search: Search in title and description
        skip: Number of records to skip
        limit: Maximum number of records to return

    Returns:
        Tuple of (recipes list, total count)
    """
    query = select(Recipe)

    # Apply filters
    if owner_id:
        query = query.where(Recipe.owner_id == owner_id)
    if library_id:
        query = query.where(Recipe.library_id == library_id)
    if cuisine_type:
        query = query.where(Recipe.cuisine_type == cuisine_type)
    if difficulty:
        query = query.where(Recipe.difficulty_level == difficulty)
    if search:
        query = query.where(
            or_(
                Recipe.title.ilike(f"%{search}%"),
                Recipe.description.ilike(f"%{search}%"),
            )
        )
    # Note: Dietary tags filtering would need JSON operator support

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply pagination and execute
    query = query.offset(skip).limit(limit).order_by(Recipe.created_at.desc())
    result = await db.execute(query)
    recipes = list(result.scalars().all())

    return recipes, total


async def create_recipe(
    db: AsyncSession, recipe_create: RecipeCreate, user: User
) -> Recipe:
    """
    Create a new recipe

    Args:
        db: Database session
        recipe_create: Recipe creation data
        user: Owner of the recipe

    Returns:
        Created recipe
    """
    # Calculate total time if both prep and cook times are provided
    total_time = None
    if recipe_create.prep_time_minutes and recipe_create.cook_time_minutes:
        total_time = recipe_create.prep_time_minutes + recipe_create.cook_time_minutes

    # Convert Pydantic models to dicts for JSON fields
    ingredients_data = [ing.model_dump() for ing in recipe_create.ingredients]
    instructions_data = [inst.model_dump() for inst in recipe_create.instructions]

    db_recipe = Recipe(
        title=recipe_create.title,
        description=recipe_create.description,
        ingredients=ingredients_data,
        instructions=instructions_data,
        prep_time_minutes=recipe_create.prep_time_minutes,
        cook_time_minutes=recipe_create.cook_time_minutes,
        total_time_minutes=total_time,
        servings=recipe_create.servings,
        cuisine_type=recipe_create.cuisine_type,
        dietary_tags=recipe_create.dietary_tags,
        difficulty_level=recipe_create.difficulty_level,
        source_url=recipe_create.source_url,
        source_name=recipe_create.source_name,
        notes=recipe_create.notes,
        image_url=recipe_create.image_url,
        owner_id=user.id,
        library_id=recipe_create.library_id,
    )

    db.add(db_recipe)
    await db.commit()
    await db.refresh(db_recipe)
    return db_recipe


async def update_recipe(
    db: AsyncSession, recipe: Recipe, recipe_update: RecipeUpdate
) -> Recipe:
    """
    Update a recipe

    Args:
        db: Database session
        recipe: Existing recipe to update
        recipe_update: Updated recipe data

    Returns:
        Updated recipe
    """
    update_data = recipe_update.model_dump(exclude_unset=True)

    # Convert Pydantic models to dicts for JSON fields
    if "ingredients" in update_data and recipe_update.ingredients:
        update_data["ingredients"] = [
            ing.model_dump() for ing in recipe_update.ingredients
        ]
    if "instructions" in update_data and recipe_update.instructions:
        update_data["instructions"] = [
            inst.model_dump() for inst in recipe_update.instructions
        ]

    # Recalculate total time if prep or cook time updated
    prep_time = update_data.get("prep_time_minutes", recipe.prep_time_minutes)
    cook_time = update_data.get("cook_time_minutes", recipe.cook_time_minutes)
    if prep_time and cook_time:
        update_data["total_time_minutes"] = prep_time + cook_time

    for key, value in update_data.items():
        setattr(recipe, key, value)

    await db.commit()
    await db.refresh(recipe)
    return recipe


async def delete_recipe(db: AsyncSession, recipe: Recipe) -> None:
    """
    Delete a recipe

    Args:
        db: Database session
        recipe: Recipe to delete
    """
    await db.delete(recipe)
    await db.commit()


def check_recipe_ownership(recipe: Recipe, user: User) -> None:
    """
    Check if user owns the recipe

    Args:
        recipe: Recipe to check
        user: User to check ownership

    Raises:
        HTTPException: If user doesn't own the recipe
    """
    if recipe.owner_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this recipe",
        )

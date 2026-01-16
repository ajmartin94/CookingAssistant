"""
Favorite Service

Business logic for recipe favorites management.
"""

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.favorite import RecipeFavorite
from app.models.recipe import Recipe
from app.models.user import User


async def get_favorite(
    db: AsyncSession, user_id: str, recipe_id: str
) -> Optional[RecipeFavorite]:
    """Get a favorite by user and recipe ID"""
    result = await db.execute(
        select(RecipeFavorite).where(
            RecipeFavorite.user_id == user_id,
            RecipeFavorite.recipe_id == recipe_id,
        )
    )
    return result.scalar_one_or_none()


async def is_recipe_favorited(db: AsyncSession, user_id: str, recipe_id: str) -> bool:
    """Check if a recipe is favorited by a user"""
    favorite = await get_favorite(db, user_id, recipe_id)
    return favorite is not None


async def add_favorite(
    db: AsyncSession, user: User, recipe: Recipe
) -> RecipeFavorite:
    """
    Add a recipe to user's favorites

    Args:
        db: Database session
        user: The user adding the favorite
        recipe: The recipe to favorite

    Returns:
        Created favorite record
    """
    favorite = RecipeFavorite(user_id=user.id, recipe_id=recipe.id)
    db.add(favorite)
    await db.commit()
    await db.refresh(favorite)
    return favorite


async def remove_favorite(db: AsyncSession, favorite: RecipeFavorite) -> None:
    """
    Remove a recipe from user's favorites

    Args:
        db: Database session
        favorite: The favorite record to remove
    """
    await db.delete(favorite)
    await db.commit()


async def get_user_favorites(
    db: AsyncSession,
    user_id: str,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[Recipe], int]:
    """
    Get user's favorite recipes with pagination

    Args:
        db: Database session
        user_id: The user's ID
        skip: Number of records to skip
        limit: Maximum number of records to return

    Returns:
        Tuple of (recipes list, total count)
    """
    # Get favorite recipes through join
    query = (
        select(Recipe)
        .join(RecipeFavorite, Recipe.id == RecipeFavorite.recipe_id)
        .where(RecipeFavorite.user_id == user_id)
    )

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Apply pagination and order by when favorited
    query = (
        query.order_by(RecipeFavorite.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(query)
    recipes = result.scalars().all()

    return recipes, total


async def get_favorite_recipe_ids(db: AsyncSession, user_id: str) -> set[str]:
    """
    Get set of recipe IDs that user has favorited

    Useful for checking multiple recipes at once.

    Args:
        db: Database session
        user_id: The user's ID

    Returns:
        Set of favorited recipe IDs
    """
    result = await db.execute(
        select(RecipeFavorite.recipe_id).where(RecipeFavorite.user_id == user_id)
    )
    return set(result.scalars().all())

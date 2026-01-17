"""
Share Service

Business logic for recipe and library sharing.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.share import RecipeShare
from app.models.user import User
from app.schemas.share import ShareCreate


async def get_share_by_token(
    db: AsyncSession, share_token: str
) -> Optional[RecipeShare]:
    """
    Get a share by its token

    Args:
        db: Database session
        share_token: Share token

    Returns:
        Share or None
    """
    result = await db.execute(
        select(RecipeShare).where(RecipeShare.share_token == share_token)
    )
    return result.scalar_one_or_none()


async def get_user_shares(
    db: AsyncSession, user_id: str, skip: int = 0, limit: int = 50
) -> list[RecipeShare]:
    """
    Get shares created by a user

    Args:
        db: Database session
        user_id: User ID
        skip: Number of records to skip
        limit: Maximum number of records to return

    Returns:
        List of shares
    """
    query = (
        select(RecipeShare)
        .where(RecipeShare.shared_by_id == user_id)
        .offset(skip)
        .limit(limit)
        .order_by(RecipeShare.created_at.desc())
    )

    result = await db.execute(query)
    return list(result.scalars().all())


async def get_shares_with_user(
    db: AsyncSession, user_id: str, skip: int = 0, limit: int = 50
) -> list[RecipeShare]:
    """
    Get shares that were shared with a user

    Args:
        db: Database session
        user_id: User ID
        skip: Number of records to skip
        limit: Maximum number of records to return

    Returns:
        List of shares
    """
    query = (
        select(RecipeShare)
        .where(RecipeShare.shared_with_id == user_id)
        .offset(skip)
        .limit(limit)
        .order_by(RecipeShare.created_at.desc())
    )

    result = await db.execute(query)
    return list(result.scalars().all())


async def create_share(
    db: AsyncSession, share_create: ShareCreate, user: User
) -> RecipeShare:
    """
    Create a new share

    Args:
        db: Database session
        share_create: Share creation data
        user: User creating the share

    Returns:
        Created share
    """
    db_share = RecipeShare(
        recipe_id=share_create.recipe_id,
        library_id=share_create.library_id,
        shared_by_id=user.id,
        shared_with_id=share_create.shared_with_id,
        permission=share_create.permission,
        expires_at=share_create.expires_at,
    )

    db.add(db_share)
    await db.commit()
    await db.refresh(db_share)
    return db_share


async def delete_share(db: AsyncSession, share: RecipeShare) -> None:
    """
    Delete a share

    Args:
        db: Database session
        share: Share to delete
    """
    await db.delete(share)
    await db.commit()


def check_share_ownership(share: RecipeShare, user: User) -> None:
    """
    Check if user created the share

    Args:
        share: Share to check
        user: User to check ownership

    Raises:
        HTTPException: If user didn't create the share
    """
    if share.shared_by_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to manage this share",
        )


def check_share_validity(share: RecipeShare) -> None:
    """
    Check if share is still valid (not expired)

    Args:
        share: Share to check

    Raises:
        HTTPException: If share has expired
    """
    if share.expires_at and share.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This share has expired",
        )

"""
Sharing API

API endpoints for sharing recipes and libraries.
"""

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.share import ShareCreate, ShareResponse, ShareTokenResponse
from app.schemas.recipe import RecipeResponse
from app.schemas.library import LibraryDetailResponse
from app.services.share_service import (
    get_share_by_token,
    get_user_shares,
    get_shares_with_user,
    create_share,
    delete_share,
    check_share_ownership,
    check_share_validity,
)
from app.services.recipe_service import get_recipe
from app.services.library_service import get_library
from app.utils.dependencies import CurrentUser
from app.config import settings

router = APIRouter(prefix="/shares", tags=["sharing"])


@router.post("", response_model=ShareTokenResponse, status_code=status.HTTP_201_CREATED)
async def create_new_share(
    share_create: ShareCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Create a new share for a recipe or library

    - **recipe_id**: ID of recipe to share (either recipe_id or library_id required)
    - **library_id**: ID of library to share (either recipe_id or library_id required)
    - **shared_with_id**: User ID to share with (optional, null for public shares)
    - **permission**: "view" or "edit" permission level
    - **expires_at**: Optional expiration datetime for the share

    Returns a share token that can be used to access the shared content.
    """
    # Verify the recipe or library exists and user owns it
    if share_create.recipe_id:
        recipe = await get_recipe(db, share_create.recipe_id)
        if not recipe:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recipe not found",
            )
        if recipe.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to share this recipe",
            )
    elif share_create.library_id:
        library = await get_library(db, share_create.library_id)
        if not library:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Library not found",
            )
        if library.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to share this library",
            )

    share = await create_share(db, share_create, current_user)

    # Generate share URL (this would need to be the frontend URL in production)
    share_url = f"/shared/{share.share_token}"

    return ShareTokenResponse(
        share_token=share.share_token,
        share_url=share_url,
        expires_at=share.expires_at,
    )


@router.get("/my-shares", response_model=list[ShareResponse])
async def list_my_shares(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of items to return"),
):
    """
    List shares created by the current user

    Returns all shares that you have created.
    """
    shares = await get_user_shares(db, current_user.id, skip, limit)
    return shares


@router.get("/shared-with-me", response_model=list[ShareResponse])
async def list_shares_with_me(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of items to return"),
):
    """
    List content shared with the current user

    Returns all recipes and libraries that have been shared with you.
    """
    shares = await get_shares_with_user(db, current_user.id, skip, limit)
    return shares


@router.get("/token/{share_token}/recipe", response_model=RecipeResponse)
async def get_shared_recipe(
    share_token: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Access a shared recipe via token

    Public endpoint - no authentication required.
    """
    share = await get_share_by_token(db, share_token)
    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share not found",
        )

    # Check if share has expired
    check_share_validity(share)

    # Verify this is a recipe share
    if not share.recipe_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This share is for a library, not a recipe",
        )

    recipe = await get_recipe(db, share.recipe_id)
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found",
        )

    return recipe


@router.get("/token/{share_token}/library", response_model=LibraryDetailResponse)
async def get_shared_library(
    share_token: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Access a shared library via token

    Public endpoint - no authentication required.
    """
    share = await get_share_by_token(db, share_token)
    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share not found",
        )

    # Check if share has expired
    check_share_validity(share)

    # Verify this is a library share
    if not share.library_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This share is for a recipe, not a library",
        )

    library = await get_library(db, share.library_id, include_recipes=True)
    if not library:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Library not found",
        )

    return library


@router.delete("/{share_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_share(
    share_id: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Revoke a share

    Deletes the share and prevents further access via the share token.
    """
    # Get the share
    from sqlalchemy import select
    from app.models.share import RecipeShare

    result = await db.execute(select(RecipeShare).where(RecipeShare.id == share_id))
    share = result.scalar_one_or_none()

    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share not found",
        )

    # Verify ownership
    check_share_ownership(share, current_user)

    await delete_share(db, share)
    return None

"""
Shopping Lists API

API endpoints for shopping list CRUD operations and AI-powered generation.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.llm_client import LLMClient
from app.config import settings
from app.database import get_db
from app.schemas.shopping_list import (
    GenerateShoppingListRequest,
    ShoppingListCreate,
    ShoppingListResponse,
    ShoppingListItemCreate,
)
from app.services.shopping_list_service import (
    create_shopping_list,
    get_shopping_lists,
    get_shopping_list,
    add_item,
    delete_item,
    get_item,
    delete_shopping_list,
    generate_shopping_list,
    EmptyMealPlanError,
)
from app.utils.dependencies import CurrentUser

router = APIRouter(prefix="/shopping-lists", tags=["shopping-lists"])


@router.post(
    "", response_model=ShoppingListResponse, status_code=status.HTTP_201_CREATED
)
async def create_list(
    data: ShoppingListCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a new shopping list."""
    shopping_list = await create_shopping_list(db, data, current_user)
    return shopping_list


@router.post(
    "/generate",
    response_model=ShoppingListResponse,
    status_code=status.HTTP_201_CREATED,
)
async def generate_list(
    data: GenerateShoppingListRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Generate a shopping list from a meal plan using AI consolidation."""
    try:
        shopping_list = await generate_shopping_list(
            db=db,
            user=current_user,
            week_start_date=data.week_start_date,
            name=data.name,
            settings=settings,
            llm_client_class=LLMClient,
        )
    except EmptyMealPlanError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return shopping_list


@router.get("", response_model=list[ShoppingListResponse])
async def list_lists(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List all shopping lists for the current user."""
    return await get_shopping_lists(db, current_user.id)


@router.get("/{list_id}", response_model=ShoppingListResponse)
async def get_list(
    list_id: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a shopping list by ID."""
    shopping_list = await get_shopping_list(db, list_id)
    if not shopping_list or shopping_list.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Shopping list not found"
        )
    return shopping_list


@router.delete("/{list_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_list(
    list_id: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Delete a shopping list."""
    shopping_list = await get_shopping_list(db, list_id)
    if not shopping_list or shopping_list.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Shopping list not found"
        )
    await delete_shopping_list(db, shopping_list)
    return None


@router.post(
    "/{list_id}/items",
    response_model=ShoppingListResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_list_item(
    list_id: str,
    data: ShoppingListItemCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Add an item to a shopping list."""
    shopping_list = await get_shopping_list(db, list_id)
    if not shopping_list or shopping_list.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Shopping list not found"
        )
    updated = await add_item(db, shopping_list, data)
    return updated


@router.delete("/{list_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_list_item(
    list_id: str,
    item_id: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Delete an item from a shopping list."""
    shopping_list = await get_shopping_list(db, list_id)
    if not shopping_list or shopping_list.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Shopping list not found"
        )
    item = await get_item(db, item_id)
    if not item or item.list_id != list_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Item not found"
        )
    await delete_item(db, item)
    return None

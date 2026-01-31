"""
Shopping List Service

Business logic for shopping list management.
"""

import json
import logging
import re
from datetime import date
from typing import Any, Optional, Type

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.ai.schemas import ChatMessage
from app.models.meal_plan import MealPlan, MealPlanEntry
from app.models.shopping_list import ShoppingList, ShoppingListItem
from app.models.user import User
from app.schemas.shopping_list import ShoppingListCreate, ShoppingListItemCreate
from app.services.meal_plan_service import snap_to_monday

logger = logging.getLogger(__name__)


class EmptyMealPlanError(Exception):
    """Raised when a meal plan has no recipes with ingredients."""

    pass


async def create_shopping_list(
    db: AsyncSession, data: ShoppingListCreate, user: User
) -> ShoppingList:
    """Create a new shopping list."""
    shopping_list = ShoppingList(
        name=data.name,
        week_start_date=data.week_start_date,
        user_id=user.id,
    )
    db.add(shopping_list)
    await db.commit()
    await db.refresh(shopping_list)
    # Eager load items
    result = await db.execute(
        select(ShoppingList)
        .where(ShoppingList.id == shopping_list.id)
        .options(selectinload(ShoppingList.items))
    )
    return result.scalar_one()


async def get_shopping_lists(db: AsyncSession, user_id: str) -> list[ShoppingList]:
    """Get all shopping lists for a user."""
    result = await db.execute(
        select(ShoppingList)
        .where(ShoppingList.user_id == user_id)
        .options(selectinload(ShoppingList.items))
        .order_by(ShoppingList.created_at.desc())
    )
    return list(result.scalars().all())


async def get_shopping_list(db: AsyncSession, list_id: str) -> Optional[ShoppingList]:
    """Get a shopping list by ID with items."""
    result = await db.execute(
        select(ShoppingList)
        .where(ShoppingList.id == list_id)
        .options(selectinload(ShoppingList.items))
        .execution_options(populate_existing=True)
    )
    return result.scalar_one_or_none()


async def add_item(
    db: AsyncSession, shopping_list: ShoppingList, data: ShoppingListItemCreate
) -> ShoppingList:
    """Add an item to a shopping list."""
    item = ShoppingListItem(
        list_id=shopping_list.id,
        name=data.name,
        amount=data.amount,
        unit=data.unit,
        category=data.category,
        source_recipe_id=data.source_recipe_id,
        sort_order=data.sort_order,
    )
    db.add(item)
    await db.commit()
    await db.refresh(shopping_list)
    # Re-fetch with items using populate_existing to bypass identity map cache
    result = await db.execute(
        select(ShoppingList)
        .where(ShoppingList.id == shopping_list.id)
        .options(selectinload(ShoppingList.items))
        .execution_options(populate_existing=True)
    )
    return result.scalar_one()


async def delete_item(db: AsyncSession, item: ShoppingListItem) -> None:
    """Delete a shopping list item."""
    await db.delete(item)
    await db.commit()


async def get_item(db: AsyncSession, item_id: str) -> Optional[ShoppingListItem]:
    """Get a shopping list item by ID."""
    result = await db.execute(
        select(ShoppingListItem).where(ShoppingListItem.id == item_id)
    )
    return result.scalar_one_or_none()


async def delete_shopping_list(db: AsyncSession, shopping_list: ShoppingList) -> None:
    """Delete a shopping list and its items."""
    await db.delete(shopping_list)
    await db.commit()


def _extract_json_from_response(text: str) -> Any:
    """Extract JSON from an LLM response that may contain markdown code blocks."""
    # Try to find JSON in code blocks first
    match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
    if match:
        return json.loads(match.group(1).strip())
    # Try parsing the whole text as JSON
    return json.loads(text)


def _build_raw_fallback_items(all_ingredients: list[dict]) -> list[dict]:
    """Build raw items from ingredients when LLM fails."""
    return [
        {
            "name": ing.get("name", "Unknown"),
            "amount": ing.get("amount"),
            "unit": ing.get("unit"),
            "category": "Other",
        }
        for ing in all_ingredients
    ]


async def generate_shopping_list(
    db: AsyncSession,
    user: User,
    week_start_date: str,
    name: Optional[str],
    settings: Any,
    llm_client_class: Type,
) -> ShoppingList:
    """Generate a shopping list from a meal plan using AI consolidation."""
    # Fetch the meal plan
    monday = snap_to_monday(date.fromisoformat(week_start_date))

    result = await db.execute(
        select(MealPlan)
        .options(selectinload(MealPlan.entries).joinedload(MealPlanEntry.recipe))
        .where(MealPlan.user_id == user.id, MealPlan.week_start_date == monday)
    )
    plan = result.scalar_one_or_none()

    # Collect all ingredients from recipes
    all_ingredients: list[dict] = []
    if plan:
        for entry in plan.entries:
            if entry.recipe and entry.recipe.ingredients:
                all_ingredients.extend(entry.recipe.ingredients)

    if not all_ingredients:
        raise EmptyMealPlanError(
            "Meal plan has no recipes with ingredients for this week."
        )

    # Build LLM prompt
    ingredients_text = json.dumps(all_ingredients, indent=2)
    prompt = (
        "You are a shopping list assistant. Given these raw recipe ingredients, "
        "consolidate duplicates (combine amounts for the same ingredient), "
        "normalize units, and categorize each item into a grocery store category.\n\n"
        f"Ingredients:\n{ingredients_text}\n\n"
        "Rules:\n"
        "- Combine duplicate ingredients (e.g., garlic from 2 recipes = 1 entry with combined amount)\n"
        "- Each item MUST have a non-empty category from: Produce, Meat, Dairy, Bakery, Pantry, Frozen, Beverages, Spices, Other\n"
        "- Return ONLY a single JSON object (no extra text) with an 'items' array\n"
        '- Each item: {"name": string, "amount": string, "unit": string, "category": string}\n\n'
        "Example response:\n"
        '{"items": [{"name": "Garlic", "amount": "5", "unit": "cloves", "category": "Produce"}]}'
    )

    # Call LLM
    consolidated_items: list[dict] | None = None
    try:
        llm_client = llm_client_class(
            model=settings.llm_model,
            temperature=settings.llm_temperature,
            max_tokens=settings.llm_max_tokens,
            timeout=max(settings.llm_timeout, 60),
        )
        response_text = await llm_client.complete(
            [ChatMessage(role="user", content=prompt)]
        )
        parsed = _extract_json_from_response(response_text)
        if isinstance(parsed, dict) and "items" in parsed:
            items = parsed["items"]
            # Ensure every item has a non-empty category
            for item in items:
                if not item.get("category"):
                    item["category"] = "Other"
            consolidated_items = items
    except (json.JSONDecodeError, ValueError, KeyError, TypeError) as e:
        logger.warning(
            "LLM consolidation failed, falling back to raw ingredients: %s", e
        )
    except Exception:
        logger.warning(
            "LLM consolidation failed unexpectedly, falling back to raw ingredients",
            exc_info=True,
        )

    # Fallback to raw ingredients
    if consolidated_items is None:
        consolidated_items = _build_raw_fallback_items(all_ingredients)

    # Create the shopping list
    list_name = name or f"Shopping List - Week of {monday.isoformat()}"
    shopping_list = ShoppingList(
        name=list_name,
        week_start_date=monday.isoformat(),
        user_id=user.id,
    )
    db.add(shopping_list)
    await db.flush()

    # Add items
    for i, item_data in enumerate(consolidated_items):
        item = ShoppingListItem(
            list_id=shopping_list.id,
            name=item_data.get("name", "Unknown"),
            amount=item_data.get("amount"),
            unit=item_data.get("unit"),
            category=item_data.get("category"),
            sort_order=i,
        )
        db.add(item)

    await db.commit()

    # Re-fetch with items
    result = await db.execute(
        select(ShoppingList)
        .where(ShoppingList.id == shopping_list.id)
        .options(selectinload(ShoppingList.items))
    )
    return result.scalar_one()

"""
Meal Plans API

API endpoints for meal plan operations.
"""

from typing import Annotated
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.recipe import Recipe
from app.schemas.meal_plan import (
    MealPlanResponse,
    MealPlanEntryResponse,
    MealPlanEntryUpsert,
    RecipeRef,
)
from app.services.meal_plan_service import (
    get_or_create_meal_plan,
    get_plan_by_id,
    upsert_meal_plan_entry,
    delete_meal_plan_entry,
    VALID_MEAL_TYPES,
)
from app.utils.dependencies import CurrentUser

router = APIRouter(prefix="/meal-plans", tags=["meal-plans"])


def _build_entry_response(e: object) -> MealPlanEntryResponse:
    """Build a MealPlanEntryResponse from a MealPlanEntry model instance."""
    from app.models.meal_plan import MealPlanEntry as MealPlanEntryModel

    assert isinstance(e, MealPlanEntryModel)
    return MealPlanEntryResponse(
        id=e.id,
        day_of_week=e.day_of_week,
        meal_type=e.meal_type,
        recipe=(
            RecipeRef(
                id=e.recipe.id,
                title=e.recipe.title,
                cook_time_minutes=e.recipe.cook_time_minutes,
            )
            if e.recipe
            else None
        ),
    )


def _build_response(plan: object) -> MealPlanResponse:
    """Build a MealPlanResponse from a MealPlan model instance."""
    from app.models.meal_plan import MealPlan as MealPlanModel

    assert isinstance(plan, MealPlanModel)

    entries = [_build_entry_response(e) for e in plan.entries]

    return MealPlanResponse(
        id=plan.id,
        week_start=str(plan.week_start_date),
        entries=entries,
        created_at=plan.created_at.isoformat(),
        updated_at=plan.updated_at.isoformat(),
    )


@router.get("/current", response_model=MealPlanResponse)
async def get_current_meal_plan(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: CurrentUser,
) -> MealPlanResponse:
    """Get meal plan for the current week, auto-creating if none exists."""
    today = date.today()
    plan = await get_or_create_meal_plan(db, current_user.id, today)
    return _build_response(plan)


@router.get("", response_model=MealPlanResponse)
async def get_meal_plan(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: CurrentUser,
    week_start: date = Query(..., description="Week start date (YYYY-MM-DD)"),
) -> MealPlanResponse:
    """Get meal plan for a given week, auto-creating if none exists."""
    plan = await get_or_create_meal_plan(db, current_user.id, week_start)
    return _build_response(plan)


@router.put("/{plan_id}/entries", response_model=MealPlanEntryResponse)
async def upsert_entry(
    plan_id: str,
    body: MealPlanEntryUpsert,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: CurrentUser,
) -> MealPlanEntryResponse:
    """Upsert a meal plan entry (assign recipe to a meal slot)."""
    # Validate meal_type
    if body.meal_type not in VALID_MEAL_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid meal_type '{body.meal_type}'. Must be one of: {sorted(VALID_MEAL_TYPES)}",
        )

    # Find plan
    plan = await get_plan_by_id(db, plan_id)
    if plan is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Meal plan not found"
        )

    # Ownership check
    if plan.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not your meal plan"
        )

    # Parse and validate date is within the plan's week
    try:
        entry_date = date.fromisoformat(body.date)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid date format",
        )

    week_start = plan.week_start_date
    week_end = week_start + timedelta(days=6)
    if entry_date < week_start or entry_date > week_end:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Date {body.date} is outside the plan week ({week_start} to {week_end})",
        )

    # Validate recipe exists
    recipe = await db.get(Recipe, body.recipe_id)
    if recipe is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Recipe not found",
        )

    day_of_week = (entry_date - week_start).days
    entry = await upsert_meal_plan_entry(
        db, plan, day_of_week, body.meal_type, body.recipe_id
    )
    return _build_entry_response(entry)


@router.delete("/{plan_id}/entries/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_entry(
    plan_id: str,
    entry_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: CurrentUser,
) -> Response:
    """Delete a meal plan entry."""
    plan = await get_plan_by_id(db, plan_id)
    if plan is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Meal plan not found"
        )

    if plan.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not your meal plan"
        )

    entry = await delete_meal_plan_entry(db, plan, entry_id)
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found"
        )

    return Response(status_code=status.HTTP_204_NO_CONTENT)

"""
Meal Plan Service

Business logic for meal plan operations.
"""

from datetime import date, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.meal_plan import MealPlan, MealPlanEntry


VALID_MEAL_TYPES = {"breakfast", "lunch", "dinner", "snack"}


def snap_to_monday(d: date) -> date:
    """Snap a date to the previous Monday (or itself if already Monday)."""
    return d - timedelta(days=d.weekday())


async def get_or_create_meal_plan(
    db: AsyncSession, user_id: str, week_start: date
) -> MealPlan:
    """Get existing meal plan or create a new empty one."""
    monday = snap_to_monday(week_start)

    result = await db.execute(
        select(MealPlan)
        .options(selectinload(MealPlan.entries).joinedload(MealPlanEntry.recipe))
        .where(MealPlan.user_id == user_id, MealPlan.week_start_date == monday)
    )
    plan = result.scalar_one_or_none()

    if plan is None:
        plan = MealPlan(user_id=user_id, week_start_date=monday)
        db.add(plan)
        await db.flush()
        # Re-fetch with eager loading to avoid lazy load issues
        result = await db.execute(
            select(MealPlan)
            .options(selectinload(MealPlan.entries).joinedload(MealPlanEntry.recipe))
            .where(MealPlan.id == plan.id)
        )
        plan = result.scalar_one()

    return plan


async def get_plan_by_id(db: AsyncSession, plan_id: str) -> MealPlan | None:
    """Get a meal plan by ID with entries eagerly loaded."""
    result = await db.execute(
        select(MealPlan)
        .options(selectinload(MealPlan.entries).joinedload(MealPlanEntry.recipe))
        .where(MealPlan.id == plan_id)
    )
    return result.scalar_one_or_none()


async def upsert_meal_plan_entry(
    db: AsyncSession,
    plan: MealPlan,
    day_of_week: int,
    meal_type: str,
    recipe_id: str,
) -> MealPlanEntry:
    """Create or update a meal plan entry for a given day/meal slot."""
    # Check for existing entry with same day_of_week + meal_type
    result = await db.execute(
        select(MealPlanEntry).where(
            MealPlanEntry.meal_plan_id == plan.id,
            MealPlanEntry.day_of_week == day_of_week,
            MealPlanEntry.meal_type == meal_type,
        )
    )
    entry = result.scalar_one_or_none()

    if entry is not None:
        entry.recipe_id = recipe_id
    else:
        entry = MealPlanEntry(
            meal_plan_id=plan.id,
            day_of_week=day_of_week,
            meal_type=meal_type,
            recipe_id=recipe_id,
        )
        db.add(entry)

    await db.flush()

    # Re-fetch with recipe joined
    from sqlalchemy.orm import joinedload

    result = await db.execute(
        select(MealPlanEntry)
        .options(joinedload(MealPlanEntry.recipe))
        .where(MealPlanEntry.id == entry.id)
    )
    entry = result.scalar_one()
    return entry


async def delete_meal_plan_entry(
    db: AsyncSession, plan: MealPlan, entry_id: str
) -> MealPlanEntry | None:
    """Delete a meal plan entry. Returns the entry if found, None otherwise."""
    result = await db.execute(
        select(MealPlanEntry).where(
            MealPlanEntry.id == entry_id,
            MealPlanEntry.meal_plan_id == plan.id,
        )
    )
    entry = result.scalar_one_or_none()
    if entry is not None:
        await db.delete(entry)
        await db.flush()
        # Expire all cached objects so collections are refreshed on next access
        db.expire_all()
    return entry

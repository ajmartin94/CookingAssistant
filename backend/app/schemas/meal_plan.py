"""
Meal Plan Schemas

Pydantic schemas for meal plan data validation and serialization.
"""

from pydantic import BaseModel, ConfigDict
from typing import Optional


class RecipeRef(BaseModel):
    """Minimal recipe reference within a meal plan entry."""

    id: str
    title: str
    cook_time_minutes: Optional[int] = None


class MealPlanEntryResponse(BaseModel):
    """Response schema for a meal plan entry."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    day_of_week: int
    meal_type: str
    recipe: Optional[RecipeRef] = None


class MealPlanEntryUpsert(BaseModel):
    """Request schema for upserting a meal plan entry."""

    date: str
    meal_type: str
    recipe_id: str


class MealPlanResponse(BaseModel):
    """Response schema for a meal plan."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    week_start: str
    entries: list[MealPlanEntryResponse]
    created_at: str
    updated_at: str

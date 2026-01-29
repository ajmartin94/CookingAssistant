"""
Database Models

Import all models here to ensure they're registered with SQLAlchemy.
"""

from app.models.user import User
from app.models.recipe import Recipe, DifficultyLevel
from app.models.library import RecipeLibrary
from app.models.share import RecipeShare, SharePermission
from app.models.feedback import Feedback
from app.models.meal_plan import MealPlan, MealPlanEntry

__all__ = [
    "User",
    "Recipe",
    "DifficultyLevel",
    "RecipeLibrary",
    "RecipeShare",
    "SharePermission",
    "Feedback",
    "MealPlan",
    "MealPlanEntry",
]

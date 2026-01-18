"""
Recipe Schemas

Pydantic schemas for recipe data validation and serialization.
"""

from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional
from app.models.recipe import DifficultyLevel


class IngredientSchema(BaseModel):
    """Schema for a single ingredient"""

    name: str = Field(..., min_length=1, max_length=255)
    amount: str = Field(..., max_length=50)
    unit: str = Field(..., max_length=50)
    notes: Optional[str] = Field(None, max_length=500)


class InstructionSchema(BaseModel):
    """Schema for a single instruction step"""

    step_number: int = Field(..., ge=1)
    instruction: str = Field(..., min_length=1)
    duration_minutes: Optional[int] = Field(None, ge=0)


class RecipeBase(BaseModel):
    """Base recipe schema with common fields"""

    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    ingredients: list[IngredientSchema] = Field(..., min_length=1)
    instructions: list[InstructionSchema] = Field(..., min_length=1)
    prep_time_minutes: Optional[int] = Field(None, ge=0)
    cook_time_minutes: Optional[int] = Field(None, ge=0)
    servings: int = Field(default=4, ge=1)
    cuisine_type: Optional[str] = Field(None, max_length=100)
    dietary_tags: Optional[list[str]] = None
    difficulty_level: DifficultyLevel = DifficultyLevel.MEDIUM
    source_url: Optional[str] = Field(None, max_length=500)
    source_name: Optional[str] = Field(None, max_length=255)
    notes: Optional[str] = None
    image_url: Optional[str] = Field(None, max_length=500)


class RecipeCreate(RecipeBase):
    """Schema for creating a new recipe"""

    library_id: Optional[str] = None


class RecipeUpdate(BaseModel):
    """Schema for updating a recipe"""

    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    ingredients: Optional[list[IngredientSchema]] = Field(None, min_length=1)
    instructions: Optional[list[InstructionSchema]] = Field(None, min_length=1)
    prep_time_minutes: Optional[int] = Field(None, ge=0)
    cook_time_minutes: Optional[int] = Field(None, ge=0)
    servings: Optional[int] = Field(None, ge=1)
    cuisine_type: Optional[str] = Field(None, max_length=100)
    dietary_tags: Optional[list[str]] = None
    difficulty_level: Optional[DifficultyLevel] = None
    source_url: Optional[str] = Field(None, max_length=500)
    source_name: Optional[str] = Field(None, max_length=255)
    notes: Optional[str] = None
    image_url: Optional[str] = Field(None, max_length=500)
    library_id: Optional[str] = None


class RecipeResponse(RecipeBase):
    """Schema for recipe API responses"""

    id: str
    owner_id: str
    library_id: Optional[str]
    total_time_minutes: Optional[int]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RecipeListResponse(BaseModel):
    """Schema for paginated recipe list responses"""

    recipes: list[RecipeResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

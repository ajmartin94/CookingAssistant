"""
Shopping List Schemas

Pydantic schemas for shopping list data validation and serialization.
"""

from pydantic import BaseModel, Field, ConfigDict, field_validator
from datetime import date as date_type, datetime
from typing import Optional


class ShoppingListItemCreate(BaseModel):
    """Schema for creating a shopping list item"""

    name: str = Field(..., min_length=1, max_length=255)
    amount: Optional[str] = Field(None, max_length=50)
    unit: Optional[str] = Field(None, max_length=50)
    category: Optional[str] = Field(None, max_length=100)
    source_recipe_id: Optional[str] = None
    sort_order: int = 0


class ShoppingListItemResponse(BaseModel):
    """Schema for shopping list item API responses"""

    id: str
    list_id: str
    name: str
    amount: Optional[str]
    unit: Optional[str]
    category: Optional[str]
    source_recipe_id: Optional[str]
    sort_order: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GenerateShoppingListRequest(BaseModel):
    """Schema for generating a shopping list from a meal plan"""

    week_start_date: str = Field(..., min_length=10, max_length=10)
    name: Optional[str] = None

    @field_validator("week_start_date")
    @classmethod
    def validate_date_format(cls, v: str) -> str:
        try:
            date_type.fromisoformat(v)
        except ValueError:
            raise ValueError(
                "week_start_date must be a valid date in YYYY-MM-DD format"
            )
        return v


class ShoppingListCreate(BaseModel):
    """Schema for creating a shopping list"""

    name: str = Field(..., min_length=1, max_length=255)
    week_start_date: Optional[str] = None


class ShoppingListResponse(BaseModel):
    """Schema for shopping list API responses"""

    id: str
    user_id: str
    name: str
    week_start_date: Optional[str]
    created_at: datetime
    updated_at: datetime
    items: list[ShoppingListItemResponse] = []

    model_config = ConfigDict(from_attributes=True)

"""
Library Schemas

Pydantic schemas for recipe library data validation and serialization.
"""

from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional
from app.schemas.recipe import RecipeResponse


class LibraryBase(BaseModel):
    """Base library schema with common fields"""

    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    is_public: bool = False


class LibraryCreate(LibraryBase):
    """Schema for creating a new library"""

    pass


class LibraryUpdate(BaseModel):
    """Schema for updating a library"""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    is_public: Optional[bool] = None


class LibraryResponse(LibraryBase):
    """Schema for library API responses"""

    id: str
    owner_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LibraryDetailResponse(LibraryResponse):
    """Schema for library details with recipes"""

    recipes: list[RecipeResponse] = []

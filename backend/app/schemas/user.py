"""
User Schemas

Pydantic schemas for user data validation and serialization.
"""

from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from datetime import datetime
from typing import Literal, Optional


ALLOWED_DIETARY_TAGS = [
    "vegetarian",
    "vegan",
    "gluten-free",
    "dairy-free",
    "keto",
    "paleo",
    "low-carb",
    "nut-free",
    "soy-free",
]


class UserBase(BaseModel):
    """Base user schema with common fields"""

    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: Optional[str] = Field(None, max_length=255)


class UserCreate(UserBase):
    """Schema for user registration"""

    password: str = Field(..., min_length=8, max_length=100)


class UserLogin(BaseModel):
    """Schema for user login"""

    username: str
    password: str


class UserUpdate(BaseModel):
    """Schema for updating user profile"""

    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, max_length=255)
    password: Optional[str] = Field(None, min_length=8, max_length=100)


class UserPreferencesUpdate(BaseModel):
    """Schema for updating user preferences (partial update)"""

    dietary_restrictions: Optional[list[str]] = None
    skill_level: Optional[Literal["beginner", "intermediate", "advanced"]] = None
    default_servings: Optional[int] = Field(None, ge=1, le=100)

    @field_validator("dietary_restrictions")
    @classmethod
    def validate_dietary_restrictions(
        cls,
        v: Optional[list[str]],
    ) -> Optional[list[str]]:
        if v is None:
            return v
        # Check for duplicates
        if len(v) != len(set(v)):
            raise ValueError("dietary_restrictions must not contain duplicates")
        # Validate each tag against allowed values
        for tag in v:
            if tag not in ALLOWED_DIETARY_TAGS:
                raise ValueError(
                    f"Invalid dietary tag: '{tag}'. "
                    f"Allowed values: {ALLOWED_DIETARY_TAGS}"
                )
        return v


class UserResponse(UserBase):
    """Schema for user API responses"""

    id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    dietary_restrictions: Optional[list[str]] = None
    skill_level: Optional[str] = None
    default_servings: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class UserPreferencesResponse(BaseModel):
    """Schema for user preferences API responses"""

    dietary_restrictions: list[str] = []
    skill_level: str = "beginner"
    default_servings: int = 4

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    """Schema for JWT token response"""

    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema for token payload data"""

    username: Optional[str] = None
    user_id: Optional[str] = None

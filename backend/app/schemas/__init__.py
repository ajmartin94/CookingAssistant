"""
Pydantic Schemas

Import all schemas for easy access.
"""

from app.schemas.user import (
    UserBase,
    UserCreate,
    UserLogin,
    UserUpdate,
    UserResponse,
    Token,
    TokenData,
)
from app.schemas.recipe import (
    IngredientSchema,
    InstructionSchema,
    RecipeBase,
    RecipeCreate,
    RecipeUpdate,
    RecipeResponse,
    RecipeListResponse,
)
from app.schemas.library import (
    LibraryBase,
    LibraryCreate,
    LibraryUpdate,
    LibraryResponse,
    LibraryDetailResponse,
)
from app.schemas.share import (
    ShareCreate,
    ShareResponse,
    ShareTokenResponse,
)

__all__ = [
    # User schemas
    "UserBase",
    "UserCreate",
    "UserLogin",
    "UserUpdate",
    "UserResponse",
    "Token",
    "TokenData",
    # Recipe schemas
    "IngredientSchema",
    "InstructionSchema",
    "RecipeBase",
    "RecipeCreate",
    "RecipeUpdate",
    "RecipeResponse",
    "RecipeListResponse",
    # Library schemas
    "LibraryBase",
    "LibraryCreate",
    "LibraryUpdate",
    "LibraryResponse",
    "LibraryDetailResponse",
    # Share schemas
    "ShareCreate",
    "ShareResponse",
    "ShareTokenResponse",
]

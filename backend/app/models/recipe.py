"""
Recipe Model

Database model for storing recipes in LLM-friendly format.
"""

from sqlalchemy import String, Text, Integer, DateTime, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime
from typing import Any
import uuid
import enum

from app.database import Base


class DifficultyLevel(str, enum.Enum):
    """Recipe difficulty levels"""

    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class Recipe(Base):
    """Recipe model with structured LLM-friendly data"""

    __tablename__ = "recipes"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Structured data stored as JSON for LLM compatibility
    # ingredients: [{"name": "flour", "amount": "2", "unit": "cups", "notes": ""}]
    ingredients: Mapped[list[Any]] = mapped_column(JSON, nullable=False)

    # instructions: [{"step_number": 1, "instruction": "...", "duration_minutes": 10}]
    instructions: Mapped[list[Any]] = mapped_column(JSON, nullable=False)

    # Time information
    prep_time_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cook_time_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_time_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Serving and categorization
    servings: Mapped[int] = mapped_column(Integer, default=4, nullable=False)
    cuisine_type: Mapped[str | None] = mapped_column(
        String(100), nullable=True, index=True
    )

    # Tags for dietary restrictions and preferences
    # dietary_tags: ["vegetarian", "gluten-free", "dairy-free"]
    dietary_tags: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)

    difficulty_level: Mapped[DifficultyLevel] = mapped_column(
        Enum(DifficultyLevel), default=DifficultyLevel.MEDIUM, nullable=False
    )

    # Source information
    source_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    source_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # User notes and customizations
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Image
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Ownership and organization
    owner_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )
    library_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("recipe_libraries.id"), nullable=True, index=True
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    owner = relationship("User", back_populates="recipes")
    library = relationship("RecipeLibrary", back_populates="recipes")
    shares = relationship(
        "RecipeShare", back_populates="recipe", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Recipe(id={self.id}, title={self.title}, owner_id={self.owner_id})>"

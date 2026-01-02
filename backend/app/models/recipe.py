"""
Recipe Model

Database model for storing recipes in LLM-friendly format.
"""

from sqlalchemy import Column, String, Text, Integer, DateTime, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
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

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)

    # Structured data stored as JSON for LLM compatibility
    # ingredients: [{"name": "flour", "amount": "2", "unit": "cups", "notes": ""}]
    ingredients = Column(JSON, nullable=False)

    # instructions: [{"step_number": 1, "instruction": "...", "duration_minutes": 10}]
    instructions = Column(JSON, nullable=False)

    # Time information
    prep_time_minutes = Column(Integer, nullable=True)
    cook_time_minutes = Column(Integer, nullable=True)
    total_time_minutes = Column(Integer, nullable=True)

    # Serving and categorization
    servings = Column(Integer, default=4, nullable=False)
    cuisine_type = Column(String(100), nullable=True, index=True)

    # Tags for dietary restrictions and preferences
    # dietary_tags: ["vegetarian", "gluten-free", "dairy-free"]
    dietary_tags = Column(JSON, nullable=True)

    difficulty_level = Column(
        Enum(DifficultyLevel), default=DifficultyLevel.MEDIUM, nullable=False
    )

    # Source information
    source_url = Column(String(500), nullable=True)
    source_name = Column(String(255), nullable=True)

    # User notes and customizations
    notes = Column(Text, nullable=True)

    # Image
    image_url = Column(String(500), nullable=True)

    # Ownership and organization
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    library_id = Column(
        String(36), ForeignKey("recipe_libraries.id"), nullable=True, index=True
    )

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    owner = relationship("User", back_populates="recipes")
    library = relationship("RecipeLibrary", back_populates="recipes")
    shares = relationship("RecipeShare", back_populates="recipe", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Recipe(id={self.id}, title={self.title}, owner_id={self.owner_id})>"

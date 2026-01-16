"""
Recipe Favorite Model

Database model for storing user's favorite recipes.
"""

from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class RecipeFavorite(Base):
    """Model linking users to their favorite recipes"""

    __tablename__ = "recipe_favorites"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    recipe_id = Column(String(36), ForeignKey("recipes.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="favorites")
    recipe = relationship("Recipe", back_populates="favorites")

    # Ensure a user can only favorite a recipe once
    __table_args__ = (
        UniqueConstraint("user_id", "recipe_id", name="uq_user_recipe_favorite"),
    )

    def __repr__(self) -> str:
        return f"<RecipeFavorite(user_id={self.user_id}, recipe_id={self.recipe_id})>"

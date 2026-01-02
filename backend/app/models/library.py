"""
Recipe Library Model

Database model for organizing recipes into collections/libraries.
"""

from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class RecipeLibrary(Base):
    """Recipe library for organizing recipes into collections"""

    __tablename__ = "recipe_libraries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    is_public = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    owner = relationship("User", back_populates="libraries")
    recipes = relationship("Recipe", back_populates="library")
    shares = relationship(
        "RecipeShare", back_populates="library", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<RecipeLibrary(id={self.id}, name={self.name}, owner_id={self.owner_id})>"

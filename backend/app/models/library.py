"""
Recipe Library Model

Database model for organizing recipes into collections/libraries.
"""

from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime
import uuid

from app.database import Base


class RecipeLibrary(Base):
    """Recipe library for organizing recipes into collections"""

    __tablename__ = "recipe_libraries"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    owner_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )
    is_public: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    owner = relationship("User", back_populates="libraries")
    recipes = relationship("Recipe", back_populates="library")
    shares = relationship(
        "RecipeShare", back_populates="library", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return (
            f"<RecipeLibrary(id={self.id}, name={self.name}, owner_id={self.owner_id})>"
        )

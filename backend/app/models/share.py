"""
Recipe Share Model

Database model for sharing recipes and libraries with other users.
"""

from sqlalchemy import Column, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
import secrets

from app.database import Base


class SharePermission(str, enum.Enum):
    """Share permission levels"""

    VIEW = "view"
    EDIT = "edit"


class RecipeShare(Base):
    """Recipe/Library share model for collaboration"""

    __tablename__ = "recipe_shares"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Can share either a recipe or a library (one must be set)
    recipe_id = Column(String(36), ForeignKey("recipes.id"), nullable=True, index=True)
    library_id = Column(
        String(36), ForeignKey("recipe_libraries.id"), nullable=True, index=True
    )

    # Sharing metadata
    shared_by_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    shared_with_id = Column(
        String(36), ForeignKey("users.id"), nullable=True, index=True
    )  # Null for public shares

    # Unique token for link-based sharing
    share_token = Column(
        String(64), unique=True, nullable=False, default=lambda: secrets.token_urlsafe(32)
    )

    permission = Column(Enum(SharePermission), default=SharePermission.VIEW, nullable=False)

    # Optional expiration
    expires_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    recipe = relationship("Recipe", back_populates="shares")
    library = relationship("RecipeLibrary", back_populates="shares")
    shared_by = relationship(
        "User", foreign_keys=[shared_by_id], back_populates="shares_created"
    )
    shared_with = relationship(
        "User", foreign_keys=[shared_with_id], back_populates="shares_received"
    )

    def __repr__(self) -> str:
        share_type = "Recipe" if self.recipe_id else "Library"
        return f"<RecipeShare(id={self.id}, type={share_type}, shared_by={self.shared_by_id})>"

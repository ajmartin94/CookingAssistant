"""
User Model

Database model for user authentication and profile management.
"""

from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class User(Base):
    """User model for authentication and profile"""

    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    recipes = relationship(
        "Recipe", back_populates="owner", cascade="all, delete-orphan"
    )
    libraries = relationship(
        "RecipeLibrary", back_populates="owner", cascade="all, delete-orphan"
    )
    shares_created = relationship(
        "RecipeShare",
        foreign_keys="RecipeShare.shared_by_id",
        back_populates="shared_by",
        cascade="all, delete-orphan",
    )
    shares_received = relationship(
        "RecipeShare",
        foreign_keys="RecipeShare.shared_with_id",
        back_populates="shared_with",
    )
    favorites = relationship(
        "RecipeFavorite", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, username={self.username}, email={self.email})>"

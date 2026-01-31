"""
Shopping List Models

Database models for shopping lists and shopping list items.
"""

from sqlalchemy import String, Integer, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime
from typing import Optional
import uuid

from app.database import Base


class ShoppingList(Base):
    """Shopping list model"""

    __tablename__ = "shopping_lists"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    week_start_date: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    owner = relationship("User", backref="shopping_lists")
    items = relationship(
        "ShoppingListItem", back_populates="shopping_list", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<ShoppingList(id={self.id}, name={self.name})>"


class ShoppingListItem(Base):
    """Shopping list item model"""

    __tablename__ = "shopping_list_items"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    list_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("shopping_lists.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    amount: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    unit: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    source_recipe_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("recipes.id"), nullable=True
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    shopping_list = relationship("ShoppingList", back_populates="items")

    __table_args__ = (Index("ix_shopping_list_items_list_id", "list_id"),)

    def __repr__(self) -> str:
        return f"<ShoppingListItem(id={self.id}, name={self.name})>"

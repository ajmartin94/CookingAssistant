"""
Meal Plan Model

Database models for weekly meal plans and their entries.
"""

from sqlalchemy import String, Integer, Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime, date
import uuid

from app.database import Base


class MealPlan(Base):
    """Weekly meal plan for a user."""

    __tablename__ = "meal_plans"
    __table_args__ = (
        UniqueConstraint("user_id", "week_start_date", name="uq_user_week"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )
    week_start_date: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, onupdate=datetime.utcnow
    )

    entries: Mapped[list["MealPlanEntry"]] = relationship(
        back_populates="meal_plan", cascade="all, delete-orphan"
    )


class MealPlanEntry(Base):
    """Single entry in a meal plan (one meal slot)."""

    __tablename__ = "meal_plan_entries"
    __table_args__ = (
        UniqueConstraint(
            "meal_plan_id", "day_of_week", "meal_type", name="uq_plan_day_meal"
        ),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    meal_plan_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("meal_plans.id"), nullable=False, index=True
    )
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)
    meal_type: Mapped[str] = mapped_column(String(20), nullable=False)
    recipe_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("recipes.id", ondelete="SET NULL"), nullable=True
    )

    meal_plan: Mapped["MealPlan"] = relationship(back_populates="entries")
    recipe = relationship("Recipe", lazy="joined")

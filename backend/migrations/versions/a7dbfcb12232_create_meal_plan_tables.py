"""create_meal_plan_tables

Revision ID: a7dbfcb12232
Revises: b2c3d4e5f6g7
Create Date: 2026-01-28 22:50:03.084347

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "a7dbfcb12232"
down_revision: Union[str, None] = "b2c3d4e5f6g7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "meal_plans",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("week_start_date", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "week_start_date", name="uq_user_week"),
    )
    op.create_index("ix_meal_plans_user_id", "meal_plans", ["user_id"], unique=False)

    op.create_table(
        "meal_plan_entries",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("meal_plan_id", sa.String(length=36), nullable=False),
        sa.Column("day_of_week", sa.Integer(), nullable=False),
        sa.Column("meal_type", sa.String(length=20), nullable=False),
        sa.Column("recipe_id", sa.String(length=36), nullable=True),
        sa.ForeignKeyConstraint(["meal_plan_id"], ["meal_plans.id"]),
        sa.ForeignKeyConstraint(["recipe_id"], ["recipes.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "meal_plan_id", "day_of_week", "meal_type", name="uq_plan_day_meal"
        ),
    )
    op.create_index(
        "ix_meal_plan_entries_meal_plan_id",
        "meal_plan_entries",
        ["meal_plan_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_meal_plan_entries_meal_plan_id", table_name="meal_plan_entries")
    op.drop_table("meal_plan_entries")
    op.drop_index("ix_meal_plans_user_id", table_name="meal_plans")
    op.drop_table("meal_plans")

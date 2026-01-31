"""create shopping list tables

Revision ID: 57b595609578
Revises: a7dbfcb12232
Create Date: 2026-01-30 21:11:12.123218

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "57b595609578"
down_revision: Union[str, None] = "a7dbfcb12232"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "shopping_lists",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("week_start_date", sa.String(length=10), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_shopping_lists_user_id", "shopping_lists", ["user_id"])

    op.create_table(
        "shopping_list_items",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("list_id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("amount", sa.String(length=50), nullable=True),
        sa.Column("unit", sa.String(length=50), nullable=True),
        sa.Column("category", sa.String(length=100), nullable=True),
        sa.Column("source_recipe_id", sa.String(length=36), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["list_id"], ["shopping_lists.id"]),
        sa.ForeignKeyConstraint(["source_recipe_id"], ["recipes.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_shopping_list_items_list_id", "shopping_list_items", ["list_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_shopping_list_items_list_id", table_name="shopping_list_items")
    op.drop_table("shopping_list_items")
    op.drop_index("ix_shopping_lists_user_id", table_name="shopping_lists")
    op.drop_table("shopping_lists")

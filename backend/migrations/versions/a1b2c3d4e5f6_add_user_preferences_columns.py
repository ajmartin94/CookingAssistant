"""add user preferences columns

Revision ID: a1b2c3d4e5f6
Revises: 5ffbbb64be7d
Create Date: 2026-01-23 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "5ffbbb64be7d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("dietary_restrictions", sa.JSON(), nullable=True))
    op.add_column("users", sa.Column("skill_level", sa.String(20), nullable=True))
    op.add_column("users", sa.Column("default_servings", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "default_servings")
    op.drop_column("users", "skill_level")
    op.drop_column("users", "dietary_restrictions")

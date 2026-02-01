"""add screenshot and github_issue_url to feedback

Revision ID: c3d4e5f6g7h8
Revises: 57b595609578
Create Date: 2026-02-01 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c3d4e5f6g7h8"
down_revision: Union[str, None] = "57b595609578"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("feedback", sa.Column("screenshot", sa.Text(), nullable=True))
    op.add_column(
        "feedback", sa.Column("github_issue_url", sa.String(500), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("feedback", "github_issue_url")
    op.drop_column("feedback", "screenshot")

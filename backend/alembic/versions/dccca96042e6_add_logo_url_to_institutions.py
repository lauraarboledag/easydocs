"""add logo_url to institutions

Revision ID: dccca96042e6
Revises: 3db356717b5d
Create Date: 2026-06-17 16:20:08.994952

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "dccca96042e6"
down_revision: Union[str, Sequence[str], None] = "3db356717b5d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("institutions", sa.Column("logo_url", sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("institutions", "logo_url")

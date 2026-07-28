"""add free value to planname enum

Revision ID: 189ece23c987
Revises: 383e1d34c9f0
Create Date: 2026-07-28 22:11:02.302651

"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "189ece23c987"
down_revision: Union[str, Sequence[str], None] = "383e1d34c9f0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TYPE planname ADD VALUE IF NOT EXISTS 'free'")


def downgrade() -> None:
    """Downgrade schema."""
    # PostgreSQL no permite eliminar valores de un ENUM directamente.
    # No se implementa downgrade para esta migración.
    pass

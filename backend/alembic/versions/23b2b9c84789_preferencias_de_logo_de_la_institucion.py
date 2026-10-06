"""preferencias de logo de la institucion

Revision ID: 23b2b9c84789
Revises: 4a373c5603ce
Create Date: 2026-10-01 20:50:10.734748

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "23b2b9c84789"
down_revision: Union[str, Sequence[str], None] = "4a373c5603ce"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "institutions",
        sa.Column(
            "logo_position",
            sa.String(length=20),
            nullable=False,
            server_default="top-left",
        ),
    )
    op.add_column(
        "institutions",
        sa.Column(
            "logo_watermark", sa.Boolean(), nullable=False, server_default=sa.false()
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("institutions", "logo_watermark")
    op.drop_column("institutions", "logo_position")

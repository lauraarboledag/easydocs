"""agregar table_columns a document_templates

Revision ID: 4a373c5603ce
Revises: 2956e37318ec
Create Date: 2026-09-16 14:49:55.408122

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "4a373c5603ce"
down_revision: Union[str, Sequence[str], None] = "2956e37318ec"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "document_templates",
        sa.Column("table_columns", sa.JSON(), nullable=False, server_default="{}"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("document_templates", "table_columns")

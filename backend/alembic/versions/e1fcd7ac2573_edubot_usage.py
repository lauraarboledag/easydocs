"""edubot usage

Revision ID: e1fcd7ac2573
Revises: f07f96ea2b72
Create Date: 2026-10-09 21:07:57.361495

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "e1fcd7ac2573"
down_revision: Union[str, Sequence[str], None] = "f07f96ea2b72"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "edubot_usage",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column(
            "institution_id",
            sa.String(),
            sa.ForeignKey("institutions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("period", sa.String(length=7), nullable=False),
        sa.Column("chat_messages", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=True
        ),
        sa.UniqueConstraint(
            "institution_id", "period", name="uq_edubot_usage_institution_period"
        ),
    )
    op.create_index(
        "ix_edubot_usage_institution_id", "edubot_usage", ["institution_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_edubot_usage_institution_id", table_name="edubot_usage")
    op.drop_table("edubot_usage")

"""notification receipts

Revision ID: 4c3c415639d8
Revises: 23b2b9c84789
Create Date: 2026-10-06 20:15:10.785027

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "4c3c415639d8"
down_revision: Union[str, Sequence[str], None] = "23b2b9c84789"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "notification_receipts",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column(
            "notification_id",
            sa.String(),
            sa.ForeignKey("notifications.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.String(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("read_at", sa.DateTime(), nullable=True),
        sa.Column("dismissed_at", sa.DateTime(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.func.now(), nullable=True
        ),
        sa.UniqueConstraint(
            "notification_id", "user_id", name="uq_notification_receipt"
        ),
    )
    op.create_index(
        "ix_notification_receipts_user_id", "notification_receipts", ["user_id"]
    )


def downgrade() -> None:
    op.drop_index(
        "ix_notification_receipts_user_id", table_name="notification_receipts"
    )
    op.drop_table("notification_receipts")

"""wompi en transacciones

Revision ID: 329ad8df4322
Revises: e1fcd7ac2573
Create Date: 2026-10-13 16:59:34.399664

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "329ad8df4322"
down_revision: Union[str, Sequence[str], None] = "e1fcd7ac2573"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "transactions", sa.Column("payment_method", sa.String(length=20), nullable=True)
    )
    op.add_column(
        "transactions", sa.Column("reference", sa.String(length=100), nullable=True)
    )
    op.add_column(
        "transactions",
        sa.Column("provider_transaction_id", sa.String(length=100), nullable=True),
    )
    op.add_column(
        "transactions",
        sa.Column("provider_payment_type", sa.String(length=30), nullable=True),
    )
    op.create_unique_constraint(
        "uq_transactions_reference", "transactions", ["reference"]
    )
    # Las transacciones que ya existen son todas transferencias
    op.execute(
        "UPDATE transactions SET payment_method = 'transfer' WHERE payment_method IS NULL"
    )


def downgrade() -> None:
    op.drop_constraint("uq_transactions_reference", "transactions", type_="unique")
    op.drop_column("transactions", "provider_payment_type")
    op.drop_column("transactions", "provider_transaction_id")
    op.drop_column("transactions", "reference")
    op.drop_column("transactions", "payment_method")

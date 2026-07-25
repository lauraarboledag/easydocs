"""add calendar events

Revision ID: f1775b9145bf
Revises: dccca96042e6
Create Date: 2026-07-18 15:38:06.621744

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'f1775b9145bf'
down_revision: Union[str, Sequence[str], None] = 'dccca96042e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('calendar_events',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('institution_id', sa.String(), nullable=True),
        sa.Column('created_by', sa.String(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('event_date', sa.DateTime(), nullable=False),
        sa.Column('type', sa.Enum('manual', 'system', name='eventtype'), nullable=False),
        sa.Column('color', sa.Enum('blue', 'green', 'red', 'yellow', 'purple', name='eventcolor'), nullable=False),
        sa.Column('is_done', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('calendar_events')
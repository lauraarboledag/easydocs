"""add calendar events

Revision ID: 4a6e1e33621f
Revises: f1775b9145bf
Create Date: 2026-07-18 15:56:49.216191

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '4a6e1e33621f'
down_revision: Union[str, Sequence[str], None] = 'f1775b9145bf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
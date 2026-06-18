"""add programs students enrollments

Revision ID: 3db356717b5d
Revises: d0823b2c17dc
Create Date: 2026-06-13 22:29:05.255264

"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "3db356717b5d"
down_revision: Union[str, Sequence[str], None] = "d0823b2c17dc"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "programs",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("institution_id", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("resolution", sa.String(), nullable=True),
        sa.Column("total_hours", sa.String(), nullable=True),
        sa.Column("certificate_type", sa.String(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["institution_id"], ["institutions.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "students",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("institution_id", sa.String(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=False),
        sa.Column("document_type", sa.String(), nullable=False),
        sa.Column("document_number", sa.String(), nullable=False),
        sa.Column("document_place", sa.String(), nullable=True),
        sa.Column("address", sa.String(), nullable=True),
        sa.Column("neighborhood", sa.String(), nullable=True),
        sa.Column("commune", sa.String(), nullable=True),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("is_minor", sa.Boolean(), nullable=True),
        sa.Column("guardian_name", sa.String(), nullable=True),
        sa.Column("guardian_document", sa.String(), nullable=True),
        sa.Column("guardian_address", sa.String(), nullable=True),
        sa.Column("guardian_phone", sa.String(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["institution_id"], ["institutions.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "enrollments",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("institution_id", sa.String(), nullable=False),
        sa.Column("student_id", sa.String(), nullable=False),
        sa.Column("program_id", sa.String(), nullable=False),
        sa.Column("enrollment_number", sa.String(), nullable=True),
        sa.Column("folio", sa.String(), nullable=True),
        sa.Column("certificate_type", sa.String(), nullable=True),
        sa.Column("year", sa.String(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["institution_id"], ["institutions.id"]),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"]),
        sa.ForeignKeyConstraint(["program_id"], ["programs.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("enrollments")
    op.drop_table("students")
    op.drop_table("programs")

"""personalizado document type y unique parcial

Revision ID: 2956e37318ec
Revises: d1e670c74f44
Create Date: 2026-09-12 15:47:15.258118

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2956e37318ec'
down_revision: Union[str, Sequence[str], None] = 'd1e670c74f44'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. Agregar el nuevo valor al ENUM de Postgres.
    #    ALTER TYPE ... ADD VALUE no puede ejecutarse dentro de un bloque de
    #    transacción normal en versiones viejas de Postgres; con autocommit
    #    forzado evitamos ese problema sin importar la versión del servidor.
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE documenttype ADD VALUE IF NOT EXISTS 'personalizado'")

    # 2. Quitar la restricción unique simple sobre document_type.
    op.drop_constraint(
        "document_templates_document_type_key",
        "document_templates",
        type_="unique",
    )

    # 3. Crear un índice único PARCIAL: solo aplica cuando document_type
    #    NO es 'personalizado'. Así, los 14 tipos reglamentarios siguen
    #    limitados a una plantilla cada uno, pero 'personalizado' puede
    #    repetirse tantas veces como se quiera.
    op.execute(
        """
        CREATE UNIQUE INDEX document_templates_document_type_unique_idx
        ON document_templates (document_type)
        WHERE document_type != 'personalizado'
        """
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Revierte el índice parcial y restaura la unique constraint simple.
    op.execute("DROP INDEX IF EXISTS document_templates_document_type_unique_idx")
    op.create_unique_constraint(
        "document_templates_document_type_key",
        "document_templates",
        ["document_type"],
    )
    # Nota: PostgreSQL no permite quitar un valor de un ENUM una vez
    # agregado (mismo patrón que el bug 6.4 del handoff) — 'personalizado'
    # queda en el tipo aunque se haga downgrade. No es un problema práctico
    # salvo que se quiera un rollback perfecto, lo cual Postgres no soporta
    # para este caso.
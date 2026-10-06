"""Recalcula required_fields y table_columns de TODAS las plantillas a partir
de su template_html. Útil tras un seed, una base reconstruida o en producción.
"""

import sys
import app.main  # noqa: F401  (carga todos los modelos, ver bug 6.14)
from app.database import SessionLocal
from app.domains.documents.models import DocumentTemplate
from app.domains.documents.template_fields import (
    TemplateFieldsError,
    derive_template_fields,
)


def main(dry_run: bool) -> int:
    db = SessionLocal()
    changed = errors = 0
    try:
        templates = (
            db.query(DocumentTemplate).order_by(DocumentTemplate.document_type).all()
        )
        for t in templates:
            label = f"{t.document_type.value if hasattr(t.document_type, 'value') else t.document_type} — {t.name}"
            try:
                required, columns = derive_template_fields(t.template_html)
            except TemplateFieldsError as e:
                errors += 1
                print(f"[ERROR] {label}: {e}")
                continue

            old_required = list(t.required_fields or [])
            old_columns = dict(t.table_columns or {})
            if old_required == required and old_columns == columns:
                print(f"[OK]    {label}")
                continue

            changed += 1
            print(f"[CAMBIA] {label}")
            added = [f for f in required if f not in old_required]
            removed = [f for f in old_required if f not in required]
            if added:
                print(f"         + campos: {', '.join(added)}")
            if removed:
                print(f"         - campos: {', '.join(removed)}")
            if old_columns != columns:
                print(f"         tablas: {old_columns} -> {columns}")
            if not dry_run:
                t.required_fields = required
                t.table_columns = columns

        if not dry_run:
            db.commit()
    finally:
        db.close()

    mode = "Simulación (no se guardó nada)" if dry_run else "Cambios guardados"
    print(f"\n{mode}: {changed} plantilla(s) con cambios, {errors} con errores.")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(dry_run="--dry-run" in sys.argv))

import re
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException
from fastapi.responses import Response
from app.domains.documents.models import Document, DocumentTemplate, DocumentStatus
from app.domains.documents.schemas import (
    DocumentCreate,
    DocumentTemplateCreate,
    DocumentUpdate,
)
from app.domains.notifications.services import create_notification
from app.core.pdf_engine import render_pdf
from app.domains.documents.template_fields import (
    TemplateFieldsError,
    derive_template_fields,
)

# --- Contexto institucional (único para vista previa y PDF) ---
LOGO_ALIGN_MAP = {
    "top-left": "left",
    "top-center": "center",
    "top-right": "right",
}


# Clave dentro de document_data donde se guardan las opciones de presentación
# del documento (posición del logo y marca de agua).
DOCUMENT_OPTIONS_KEY = "_opciones"


def build_institution_context(
    institution, logo_position: str | None = None, watermark: bool | None = None
) -> dict:
    """Variables {{ institucion.* }} disponibles en todas las plantillas.

    La usan tanto la vista previa como la generación del PDF, para que
    ambos muestren siempre lo mismo. Los valores vacíos se envían como ""
    porque Jinja imprime None como el texto "None".

    logo_position / watermark: opciones del documento; si son None se usan
    las preferencias guardadas en la institución.
    """

    def val(value):
        return value if value is not None else ""

    if logo_position not in LOGO_ALIGN_MAP:
        logo_position = getattr(institution, "logo_position", None) or "top-left"
    if watermark is None:
        watermark = bool(getattr(institution, "logo_watermark", False))
    logo_url = val(getattr(institution, "logo_url", None))

    return {
        "nombre": val(institution.name),
        "dane_code": val(institution.dane_code),
        "departamento": val(institution.department),
        "municipio": val(institution.municipality),
        "direccion": val(institution.address),
        "telefono": val(institution.phone),
        "email": val(institution.email),
        "nivel_educativo": val(institution.education_level),
        "licencia": val(institution.license_number),
        "logo_url": logo_url,
        "logo_align": LOGO_ALIGN_MAP.get(logo_position, "left"),
        # Sin logo no hay marca de agua
        "marca_agua": bool(watermark and logo_url),
        "firma_url": val(getattr(institution, "signature_url", None)),
    }


def _template_payload(data: DocumentTemplateCreate) -> dict:
    """Datos a guardar de una plantilla. required_fields y table_columns se
    calculan SIEMPRE a partir del HTML (fuente de verdad), sin importar lo
    que mande el cliente, para que nunca queden desincronizados."""
    payload = data.model_dump()
    try:
        required_fields, table_columns = derive_template_fields(
            payload["template_html"]
        )
    except TemplateFieldsError as e:
        raise HTTPException(status_code=400, detail=str(e))
    payload["required_fields"] = required_fields
    payload["table_columns"] = table_columns
    return payload


def create_template(db: Session, data: DocumentTemplateCreate) -> DocumentTemplate:
    existing = db.execute(
        select(DocumentTemplate).where(
            DocumentTemplate.document_type == data.document_type
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Ya existe una plantilla para ese tipo de documento.",
        )
    template = DocumentTemplate(**_template_payload(data))
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


def list_templates(db: Session) -> list[DocumentTemplate]:
    return (
        db.execute(select(DocumentTemplate).where(DocumentTemplate.is_active == True))
        .scalars()
        .all()
    )


_TOKEN_RE = re.compile(
    r"\{%-?\s*if\s+([\w.]+)\s*-?%\}"  # {% if variable %}
    r"|\{%-?\s*(endif)\s*-?%\}"  # {% endif %}
    r"|\{\{\s*([\w.]+)\s*(?:\|[^}]*)?\}\}"  # {{ variable }}
)


def _analyze_conditionals(template_html: str):
    """
    Devuelve (por_condicion, siempre):
      por_condicion: {variable_condicion: {campos dentro de esa sección}}
      siempre: campos que aparecen al menos una vez fuera de toda sección condicional
    """
    stack, por_condicion, siempre = [], {}, set()
    for m in _TOKEN_RE.finditer(template_html or ""):
        cond, endif, var = m.group(1), m.group(2), m.group(3)
        if cond:
            stack.append(cond)
            por_condicion.setdefault(cond, set())
        elif endif:
            if stack:
                stack.pop()
        elif var:
            if stack:
                for c in stack:
                    por_condicion[c].add(var)
            else:
                siempre.add(var)
    return por_condicion, siempre


def _fields_to_skip(template_html: str, data: dict) -> set:
    """Campos que NO se exigen: las variables de condición (booleanas) y los
    campos de secciones condicionales cuya condición es falsa."""
    por_condicion, siempre = _analyze_conditionals(template_html)
    skip = set()
    for cond, fields in por_condicion.items():
        skip.add(cond)  # False es un valor válido para una condición
        if not data.get(cond):
            skip |= fields
    return skip - siempre


def _missing_required_fields(
    template: DocumentTemplate, document_data: dict
) -> list[str]:
    """Campos obligatorios vacíos (sin contar secciones condicionales apagadas)."""
    skip = _fields_to_skip(template.template_html, document_data)
    return [
        field
        for field in template.required_fields
        if field not in skip and not document_data.get(field)
    ]


def _check_required_fields(template: DocumentTemplate, document_data: dict) -> None:
    missing = _missing_required_fields(template, document_data)
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"El campo obligatorio '{missing[0]}' está vacío o falta.",
        )


def _with_options(document_data: dict, logo_position, watermark) -> dict:
    """Copia de document_data con las opciones de presentación del logo."""
    data = dict(document_data or {})
    data.pop(DOCUMENT_OPTIONS_KEY, None)
    options = {}
    if logo_position in LOGO_ALIGN_MAP:
        options["logo_position"] = logo_position
    if watermark is not None:
        options["marca_agua"] = bool(watermark)
    if options:
        data[DOCUMENT_OPTIONS_KEY] = options
    return data


# Clave dentro de document_data con la trazabilidad del texto de EduBot:
# qué campos redactó y quién confirmó la revisión.
AI_INFO_KEY = "_ia"


def _with_ai_info(
    document_data: dict,
    ai_fields: list[str],
    previous: Optional[dict],
    reviewed: bool,
    user_id: Optional[str],
) -> tuple[dict, list[str]]:
    """Copia de document_data con la marca de EduBot. Devuelve (datos, campos IA)."""
    data = dict(document_data or {})
    data.pop(AI_INFO_KEY, None)  # nunca se confía en lo que mande el cliente
    fields = sorted({f for f in (ai_fields or []) if isinstance(f, str) and f in data})
    if not fields and previous:
        # Si el cliente no los reenvía, se conservan los que ya tenía el documento
        fields = [f for f in previous.get("campos", []) if f in data]
    if fields:
        info = {"campos": fields, "revisado": bool(reviewed)}
        if reviewed:
            info["revisado_por"] = user_id
            info["revisado_en"] = datetime.utcnow().isoformat(timespec="seconds")
        data[AI_INFO_KEY] = info
    return data, fields


def _require_ai_review(ai_fields: list[str], reviewed: bool) -> None:
    if ai_fields and not reviewed:
        raise HTTPException(
            status_code=400,
            detail="Confirma que revisaste el texto sugerido por EduBot antes de generar el documento.",
        )


def _notify_generated(
    db: Session, template: DocumentTemplate, institution_id: str
) -> None:
    try:
        create_notification(
            db,
            title="Documento generado",
            message=f"{template.name if template else 'Documento'} se generó exitosamente.",
            institution_id=institution_id,
            calendar_event_id=None,
        )
    except Exception as e:
        print(f"Error creando notificación de documento: {e}")


def create_document(
    db: Session, data: DocumentCreate, institution_id: str, user_id: str
) -> Document:
    template = db.execute(
        select(DocumentTemplate).where(DocumentTemplate.id == data.template_id)
    ).scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada.")

    # Guarda con el documento cómo se eligió presentar el logo, para que el
    # PDF descargado salga igual que la vista previa.
    document_data = _with_options(
        data.document_data, data.logo_position, data.watermark
    )
    document_data, ai_fields = _with_ai_info(
        document_data,
        data.ai_fields,
        None,
        data.ai_reviewed and not data.save_as_draft,
        user_id,
    )

    if data.save_as_draft:
        # Borrador: se guarda tal cual, aunque falten campos
        status = DocumentStatus.ai_draft if ai_fields else DocumentStatus.draft
    else:
        _require_ai_review(ai_fields, data.ai_reviewed)
        _check_required_fields(template, document_data)
        status = DocumentStatus.generated

    document = Document(
        institution_id=institution_id,
        template_id=data.template_id,
        created_by=user_id,
        status=status,
        document_data=document_data,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    if status == DocumentStatus.generated:
        _notify_generated(db, template, institution_id)
    return document


def get_document(db: Session, document_id: str, institution_id: str) -> Document:
    document = db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.institution_id == institution_id,
            Document.is_active == True,
        )
    ).scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Documento no encontrado.")
    return document


EDITABLE_STATUSES = (DocumentStatus.draft, DocumentStatus.ai_draft)


def update_document(
    db: Session,
    document_id: str,
    data: DocumentUpdate,
    institution_id: str,
    user_id: Optional[str] = None,
) -> Document:
    """Guarda cambios en un borrador; con save_as_draft=False lo genera."""
    document = get_document(db, document_id, institution_id)
    if document.status not in EDITABLE_STATUSES:
        raise HTTPException(
            status_code=400, detail="Solo se pueden editar documentos en borrador."
        )
    previous_ai = (document.document_data or {}).get(AI_INFO_KEY)
    document_data = _with_options(
        data.document_data, data.logo_position, data.watermark
    )
    document_data, ai_fields = _with_ai_info(
        document_data,
        data.ai_fields,
        previous_ai,
        data.ai_reviewed and not data.save_as_draft,
        user_id,
    )

    finalized = False
    if data.save_as_draft:
        document.status = DocumentStatus.ai_draft if ai_fields else DocumentStatus.draft
    else:
        _require_ai_review(ai_fields, data.ai_reviewed)
        _check_required_fields(document.template, document_data)
        document.status = DocumentStatus.generated
        finalized = True
    document.document_data = document_data

    db.commit()
    db.refresh(document)
    if finalized:
        _notify_generated(db, document.template, institution_id)
    return document


def generate_pdf(db: Session, document_id: str, institution_id: str) -> bytes:
    document = db.execute(
        select(Document).where(
            Document.id == document_id, Document.institution_id == institution_id
        )
    ).scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Documento no encontrado.")
    if document.status == DocumentStatus.cancelled:
        raise HTTPException(status_code=400, detail="Este documento fue cancelado.")

    template = db.execute(
        select(DocumentTemplate).where(DocumentTemplate.id == document.template_id)
    ).scalar_one_or_none()

    # Un borrador IA no se descarga hasta que alguien revise el texto y lo genere.
    if document.status == DocumentStatus.ai_draft:
        raise HTTPException(
            status_code=400,
            detail="Este documento tiene texto sugerido por EduBot pendiente de revisión. Ábrelo con «Revisar» y genéralo antes de descargarlo.",
        )

    # Un borrador incompleto no se descarga. (Los "draft" antiguos, creados
    # antes de existir los borradores, están completos y sí se descargan.)
    if document.status in EDITABLE_STATUSES and _missing_required_fields(
        template, document.document_data or {}
    ):
        raise HTTPException(
            status_code=400,
            detail="Este documento es un borrador incompleto. Ábrelo con «Continuar» y genéralo antes de descargarlo.",
        )

    # Datos institucionales para el contexto del PDF (mismo armado que la vista previa)
    options = (document.document_data or {}).get(DOCUMENT_OPTIONS_KEY) or {}
    institution_context = build_institution_context(
        document.institution,
        logo_position=options.get("logo_position"),
        watermark=options.get("marca_agua"),
    )

    pdf_bytes = render_pdf(
        template.template_html,
        document.document_data,
        institution_context,
        table_columns=template.table_columns,
    )
    document.status = DocumentStatus.generated
    db.commit()

    return pdf_bytes


def list_documents(db: Session, institution_id: str) -> list[Document]:
    return (
        db.execute(
            select(Document).where(
                Document.institution_id == institution_id, Document.is_active == True
            )
        )
        .scalars()
        .all()
    )


def cancel_document(db: Session, document_id: str, institution_id: str) -> Document:
    document = db.execute(
        select(Document).where(
            Document.id == document_id, Document.institution_id == institution_id
        )
    ).scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Documento no encontrado.")
    if document.status == DocumentStatus.generated:
        raise HTTPException(
            status_code=400, detail="No se puede cancelar un documento ya generado."
        )
    document.status = DocumentStatus.cancelled
    db.commit()
    db.refresh(document)
    return document


def update_template(
    db: Session, template_id: str, data: DocumentTemplateCreate
) -> DocumentTemplate:
    template = db.execute(
        select(DocumentTemplate).where(DocumentTemplate.id == template_id)
    ).scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada.")

    for key, value in _template_payload(data).items():
        setattr(template, key, value)

    db.commit()
    db.refresh(template)
    return template


def delete_template(db: Session, template_id: str) -> dict:
    template = db.execute(
        select(DocumentTemplate).where(DocumentTemplate.id == template_id)
    ).scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada.")

    has_documents = db.execute(
        select(Document).where(Document.template_id == template_id)
    ).scalar_one_or_none()

    if has_documents:
        # Ya se usó para generar documentos reales — se conserva el
        # historial y solo se desactiva, no se borra.
        template.is_active = False
        db.commit()
        return {"deleted": False, "deactivated": True}

    # Nunca se usó — se puede borrar de verdad sin perder nada.
    db.delete(template)
    db.commit()
    return {"deleted": True, "deactivated": False}

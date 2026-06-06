from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException
from fastapi.responses import Response
from app.domains.documents.models import Document, DocumentTemplate, DocumentStatus
from app.domains.documents.schemas import DocumentCreate, DocumentTemplateCreate
from app.core.pdf_engine import render_pdf

def create_template(db: Session, data: DocumentTemplateCreate) -> DocumentTemplate:
    existing = db.execute(
        select(DocumentTemplate).where(
            DocumentTemplate.document_type == data.document_type
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Ya existe una plantilla para ese tipo de documento."
        )
    template = DocumentTemplate(**data.model_dump())
    db.add(template)
    db.commit()
    db.refresh(template)
    return template

def list_templates(db: Session) -> list[DocumentTemplate]:
    return db.execute(
        select(DocumentTemplate).where(DocumentTemplate.is_active == True)
    ).scalars().all()

def create_document(
    db: Session,
    data: DocumentCreate,
    institution_id: str,
    user_id: str
) -> Document:
    template = db.execute(
        select(DocumentTemplate).where(DocumentTemplate.id == data.template_id)
    ).scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada.")

    for field in template.required_fields:
        if field not in data.document_data or not data.document_data[field]:
            raise HTTPException(
                status_code=400,
                detail=f"El campo obligatorio '{field}' está vacío o falta."
            )

    document = Document(
        institution_id=institution_id,
        template_id=data.template_id,
        created_by=user_id,
        status=DocumentStatus.draft,
        document_data=data.document_data
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document

def generate_pdf(db: Session, document_id: str, institution_id: str) -> bytes:
    document = db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.institution_id == institution_id
        )
    ).scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Documento no encontrado.")
    if document.status == DocumentStatus.cancelled:
        raise HTTPException(status_code=400, detail="Este documento fue cancelado.")

    template = db.execute(
        select(DocumentTemplate).where(DocumentTemplate.id == document.template_id)
    ).scalar_one_or_none()

    # Datos institucionales para el contexto del PDF
    institution = document.institution
    institution_context = {
        "nombre": institution.name,
        "dane_code": institution.dane_code,
        "municipio": institution.municipality,
        "departamento": institution.department,
        "licencia": institution.license_number,
        "email": institution.email,
        "telefono": institution.phone,
        "logo_url": getattr(institution, "logo_url", None),
        "firma_url": getattr(institution, "signature_url", None),
    }

    pdf_bytes = render_pdf(template.template_html, document.document_data, institution_context)

    document.status = DocumentStatus.generated
    db.commit()

    return pdf_bytes

def list_documents(db: Session, institution_id: str) -> list[Document]:
    return db.execute(
        select(Document).where(
            Document.institution_id == institution_id,
            Document.is_active == True
        )
    ).scalars().all()

def cancel_document(db: Session, document_id: str, institution_id: str) -> Document:
    document = db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.institution_id == institution_id
        )
    ).scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Documento no encontrado.")
    if document.status == DocumentStatus.generated:
        raise HTTPException(
            status_code=400,
            detail="No se puede cancelar un documento ya generado."
        )
    document.status = DocumentStatus.cancelled
    db.commit()
    db.refresh(document)
    return document
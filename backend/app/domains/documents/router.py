from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.auth import get_current_user
from app.core.features import require_superadmin
from app.domains.users.models import User
from app.domains.documents.schemas import (
    DocumentTemplateCreate, DocumentTemplateResponse,
    DocumentCreate, DocumentResponse
)
from app.domains.documents.services import (
    create_template, list_templates, create_document,
    generate_pdf, list_documents, cancel_document
)

router = APIRouter(tags=["Documentos"])

@router.post("/templates/", response_model=DocumentTemplateResponse, status_code=201)
def add_template(
    data: DocumentTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin)
):
    return create_template(db, data)

@router.get("/templates/", response_model=list[DocumentTemplateResponse])
def get_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return list_templates(db)

@router.post("/documents/", response_model=DocumentResponse, status_code=201)
def new_document(
    data: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return create_document(db, data, current_user.institution_id, current_user.id)

@router.get("/documents/", response_model=list[DocumentResponse])
def get_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return list_documents(db, current_user.institution_id)

@router.get("/documents/{document_id}/pdf")
def download_pdf(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pdf_bytes = generate_pdf(db, document_id, current_user.institution_id)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=documento_{document_id}.pdf"}
    )

@router.patch("/documents/{document_id}/cancel", response_model=DocumentResponse)
def cancel(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return cancel_document(db, document_id, current_user.institution_id)
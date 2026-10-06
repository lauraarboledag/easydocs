from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from app.database import get_db
from app.core.auth import get_current_user
from app.core.pdf_engine import render_html_preview
from app.domains.institutions.services import get_institution
from app.core.features import require_superadmin
from app.domains.users.models import User
from app.domains.subscriptions.models import Subscription, Plan
from app.domains.documents.models import DocumentTemplate, Document
from app.domains.notifications.services import create_notification
from datetime import datetime
from app.domains.documents.schemas import (
    DocumentTemplateCreate,
    DocumentTemplateResponse,
    DocumentCreate,
    DocumentResponse,
    DocumentUpdate,
)
from app.domains.documents.models import DocumentStatus
from app.domains.documents.services import (
    create_template,
    list_templates,
    create_document,
    generate_pdf,
    list_documents,
    cancel_document,
    update_template,
    delete_template,
    build_institution_context,
    get_document,
    update_document,
)

router = APIRouter(tags=["Documentos"])


@router.post("/templates/", response_model=DocumentTemplateResponse, status_code=201)
def add_template(
    data: DocumentTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    return create_template(db, data)


@router.put("/templates/{template_id}", response_model=DocumentTemplateResponse)
def edit_template(
    template_id: str,
    data: DocumentTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    return update_template(db, template_id, data)


@router.delete("/templates/{template_id}")
def remove_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    return delete_template(db, template_id)


class PreviewRequest(BaseModel):
    document_data: dict
    # None = usar las preferencias de la institución
    logo_position: str | None = None
    watermark: bool | None = None


@router.post("/templates/{template_id}/preview")
def preview_template(
    template_id: str,
    data: PreviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    template = db.execute(
        select(DocumentTemplate).where(DocumentTemplate.id == template_id)
    ).scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada.")

    institution = get_institution(db, current_user.institution_id)
    # Mismo contexto que el PDF final (ver build_institution_context)
    institution_dict = build_institution_context(
        institution, data.logo_position, data.watermark
    )

    rendered_html = render_html_preview(
        template.template_html,
        data.document_data,
        institution_dict,
        table_columns=template.table_columns,
    )
    return {"html": rendered_html}


@router.get("/templates/", response_model=list[DocumentTemplateResponse])
def get_templates(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return list_templates(db)


@router.get("/templates/{template_id}", response_model=DocumentTemplateResponse)
def get_template_by_id(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    template = db.execute(
        select(DocumentTemplate).where(DocumentTemplate.id == template_id)
    ).scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada.")
    return template


def check_monthly_quota(db: Session, institution_id: str) -> None:
    """Límite de documentos del plan. Los borradores no gastan cupo:
    se cuenta cuando el documento se genera."""
    subscription = db.execute(
        select(Subscription).where(
            Subscription.institution_id == institution_id,
            Subscription.is_active == True,
        )
    ).scalar_one_or_none()
    if not subscription:
        return
    plan = db.execute(
        select(Plan).where(Plan.id == subscription.plan_id)
    ).scalar_one_or_none()
    if not plan:
        return
    limite = plan.features.get("documentos_por_mes")
    if limite is None:  # None = ilimitado (enterprise)
        return

    inicio_mes = datetime.utcnow().replace(
        day=1, hour=0, minute=0, second=0, microsecond=0
    )
    total_mes = db.execute(
        select(func.count()).where(
            Document.institution_id == institution_id,
            Document.created_at >= inicio_mes,
            Document.status.not_in([DocumentStatus.draft, DocumentStatus.ai_draft]),
        )
    ).scalar()

    if total_mes >= limite:
        raise HTTPException(
            status_code=403,
            detail={
                "message": f"Alcanzaste el límite de {limite} documentos por mes de tu plan.",
                "limit_reached": True,
                "limit": limite,
                "used": total_mes,
            },
        )
    # Notificar cuando se alcanza el 80% del límite (una sola vez)
    if limite and total_mes == int(limite * 0.8):
        try:
            create_notification(
                db,
                title="Cerca del límite de tu plan",
                message=f"Has usado {total_mes} de {limite} documentos este mes.",
                institution_id=institution_id,
            )
        except Exception as e:
            print(f"Error creando notificación de límite: {e}")


@router.post("/documents/", response_model=DocumentResponse, status_code=201)
def new_document(
    data: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not data.save_as_draft:
        check_monthly_quota(db, current_user.institution_id)
    return create_document(db, data, current_user.institution_id, current_user.id)


@router.get("/documents/{document_id}", response_model=DocumentResponse)
def get_document_by_id(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_document(db, document_id, current_user.institution_id)


@router.put("/documents/{document_id}", response_model=DocumentResponse)
def edit_document(
    document_id: str,
    data: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not data.save_as_draft:
        check_monthly_quota(db, current_user.institution_id)
    return update_document(
        db, document_id, data, current_user.institution_id, current_user.id
    )


@router.get("/documents/", response_model=list[DocumentResponse])
def get_documents(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return list_documents(db, current_user.institution_id)


@router.get("/documents/{document_id}/pdf")
def download_pdf(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pdf_bytes = generate_pdf(db, document_id, current_user.institution_id)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=documento_{document_id}.pdf"
        },
    )


@router.patch("/documents/{document_id}/cancel", response_model=DocumentResponse)
def cancel(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return cancel_document(db, document_id, current_user.institution_id)


@router.delete("/documents/{document_id}", status_code=204)
def delete_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.domains.documents.models import Document

    doc = db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.institution_id == current_user.institution_id,
        )
    ).scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado.")
    db.delete(doc)
    db.commit()

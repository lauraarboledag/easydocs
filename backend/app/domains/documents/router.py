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
)
from app.domains.documents.services import (
    create_template,
    list_templates,
    create_document,
    generate_pdf,
    list_documents,
    cancel_document,
    update_template,
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


class PreviewRequest(BaseModel):
    document_data: dict
    logo_position: str = "top-left"


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

    align_map = {
        "top-left": "left",
        "top-center": "center",
        "top-right": "right",
    }

    institution_dict = {
        "nombre": institution.name,
        "municipio": institution.municipality,
        "direccion": institution.address,
        "telefono": institution.phone,
        "email": institution.email,
        "licencia": institution.license_number,
        "logo_url": institution.logo_url or "",
        "logo_align": align_map.get(data.logo_position, "left"),
    }

    rendered_html = render_html_preview(
        template.template_html,
        data.document_data,
        institution_dict,
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


@router.post("/documents/", response_model=DocumentResponse, status_code=201)
def new_document(
    data: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Obtener suscripción activa y su plan
    subscription = db.execute(
        select(Subscription).where(
            Subscription.institution_id == current_user.institution_id,
            Subscription.is_active == True,
        )
    ).scalar_one_or_none()

    if subscription:
        plan = db.execute(
            select(Plan).where(Plan.id == subscription.plan_id)
        ).scalar_one_or_none()

        if plan:
            limite = plan.features.get("documentos_por_mes")

            # None = ilimitado (enterprise)
            if limite is not None:
                # Contar documentos del mes actual
                inicio_mes = datetime.utcnow().replace(
                    day=1, hour=0, minute=0, second=0, microsecond=0
                )
                total_mes = db.execute(
                    select(func.count()).where(
                        Document.institution_id == current_user.institution_id,
                        Document.created_at >= inicio_mes,
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
                            institution_id=current_user.institution_id,
                        )
                    except Exception as e:
                        print(f"Error creando notificación de límite: {e}")

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
    return create_document(db, data, current_user.institution_id, current_user.id)


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

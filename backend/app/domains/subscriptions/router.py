from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.database import get_db
from app.core.auth import get_current_user
from app.core.features import (
    get_active_subscription,
    require_feature,
    require_superadmin,
)
from app.domains.users.models import User
from app.domains.subscriptions.models import Subscription, Plan
from app.domains.subscriptions.wompi import (
    verify_wompi_signature,
    map_plan_from_reference,
)
from pydantic import BaseModel
from typing import Optional
from app.domains.subscriptions.schemas import (
    PlanCreate,
    PlanResponse,
    SubscriptionCreate,
    SubscriptionResponse,
    TransactionResponse,
    ConfirmTransaction,
    ReceiptInfo,
    SubscriptionStatus,
)
from app.domains.subscriptions.services import (
    create_plan,
    list_plans,
    create_subscription,
    confirm_transaction,
    get_institution_subscription,
    list_transactions,
    activate_subscription_with_invoice,
    request_plan_change,
    reject_transaction,
    attach_receipt,
    get_receipt,
    pending_has_receipt,
    MAX_RECEIPT_BYTES,
    get_pending_request,
    cancel_pending_request,
)

router = APIRouter(tags=["Suscripciones"])


@router.post("/plans/", response_model=PlanResponse, status_code=201)
def add_plan(
    data: PlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    return create_plan(db, data)


@router.get("/plans/", response_model=list[PlanResponse])
def get_plans(db: Session = Depends(get_db)):
    return list_plans(db)


@router.post("/subscriptions/", response_model=SubscriptionResponse, status_code=201)
def subscribe(
    data: SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_subscription(db, data)


@router.get("/subscriptions/my", response_model=SubscriptionResponse)
def my_subscription(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return get_institution_subscription(db, current_user.institution_id)


@router.get("/subscriptions/pending", response_model=Optional[SubscriptionResponse])
def my_pending_request(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Solicitud de cambio de plan esperando confirmación de pago (o null)."""
    pending = get_pending_request(db, current_user.institution_id)
    if not pending:
        return None
    response = SubscriptionResponse.model_validate(pending)
    response.receipt_uploaded = pending_has_receipt(db, pending)
    return response


@router.post("/subscriptions/pending/receipt", response_model=ReceiptInfo)
async def upload_pending_receipt(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Adjunta la foto o PDF del comprobante a la solicitud de plan pendiente."""
    content = await file.read(MAX_RECEIPT_BYTES + 1)
    receipt = attach_receipt(
        db, current_user.institution_id, current_user.id, file.filename, content
    )
    return ReceiptInfo(
        transaction_id=receipt.transaction_id,
        filename=receipt.filename,
        content_type=receipt.content_type,
        size=receipt.size,
        created_at=receipt.created_at,
    )


@router.get("/transactions/{transaction_id}/receipt")
def download_receipt(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    receipt = get_receipt(db, transaction_id, current_user)
    safe_name = (receipt.filename or "comprobante").replace('"', "")
    return Response(
        content=receipt.data,
        media_type=receipt.content_type,
        headers={
            "Content-Disposition": f'inline; filename="{safe_name}"',
            "Cache-Control": "no-store",
        },
    )


@router.delete("/subscriptions/pending", status_code=204)
def cancel_my_pending_request(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    cancel_pending_request(db, current_user.institution_id)


@router.get("/transactions/", response_model=list[TransactionResponse])
def get_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    return list_transactions(db)


@router.patch(
    "/transactions/{transaction_id}/confirm", response_model=TransactionResponse
)
def confirm(
    transaction_id: str,
    data: ConfirmTransaction,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    return confirm_transaction(db, transaction_id, data, current_user.id)


@router.patch(
    "/transactions/{transaction_id}/reject", response_model=TransactionResponse
)
def reject(
    transaction_id: str,
    data: ConfirmTransaction,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """Rechaza un pago pendiente. `notes` = motivo (se le muestra a la institución)."""
    return reject_transaction(db, transaction_id, data, current_user.id)


class ChangePlanRequest(BaseModel):
    plan_id: str


@router.post("/subscriptions/change-plan", response_model=SubscriptionResponse)
def change_plan(
    data: ChangePlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Plan gratuito: inmediato. Plan de pago: queda pendiente y el plan actual
    # sigue vigente hasta que se confirme el pago (ver request_plan_change).
    # La respuesta trae status: "active" (aplicado) o "pending" (espera el pago).
    return request_plan_change(db, current_user.institution_id, data.plan_id)


# Funciones que se pueden configurar por plan desde AdminPlans.
# bool = incluida o no; int/None = límite (None = ilimitado); str = opción.
PLAN_FEATURE_SPEC = {
    "documentos_lr001_lr009": bool,
    "certificados_capitulo_ii": bool,
    "edubot": bool,
    "transcripcion_audio": bool,
    "usuarios_maximos": "limit",
    "documentos_por_mes": "limit",
    "mensajes_edubot_por_mes": "limit",
    "soporte": ("ninguno", "email", "email_chat", "prioritario"),
}


def _clean_features(raw: dict) -> dict:
    """Valida las funciones recibidas; ignora claves desconocidas."""
    clean = {}
    for key, value in (raw or {}).items():
        spec = PLAN_FEATURE_SPEC.get(key)
        if spec is None:
            continue
        if spec is bool:
            if not isinstance(value, bool):
                raise HTTPException(
                    status_code=400, detail=f"'{key}' debe ser sí o no."
                )
            clean[key] = value
        elif spec == "limit":
            if value is None:
                clean[key] = None  # ilimitado
            elif isinstance(value, int) and not isinstance(value, bool) and value >= 1:
                clean[key] = value
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"'{key}' debe ser un número mayor que 0 o ilimitado.",
                )
        else:
            if value not in spec:
                raise HTTPException(
                    status_code=400, detail=f"Valor no válido para '{key}'."
                )
            clean[key] = value
    return clean


class PlanUpdate(BaseModel):
    price: Optional[int] = None
    is_active: Optional[bool] = None
    description: Optional[str] = None
    # Solo se cambian las claves enviadas; el resto se conserva
    features: Optional[dict] = None
    # Copia las funciones al plan del otro ciclo (mensual/anual) con el mismo nombre
    apply_features_to_all_cycles: bool = True


@router.put("/plans/{plan_id}", response_model=PlanResponse)
def update_plan(
    plan_id: str,
    data: PlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    plan = db.execute(select(Plan).where(Plan.id == plan_id)).scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado.")
    if data.price is not None:
        if data.price < 0:
            raise HTTPException(
                status_code=400, detail="El precio no puede ser negativo."
            )
        plan.price = data.price
    if data.is_active is not None:
        plan.is_active = data.is_active
    if data.description is not None:
        plan.description = data.description.strip() or None

    if data.features is not None:
        changes = _clean_features(data.features)
        targets = [plan]
        if data.apply_features_to_all_cycles:
            targets = (
                db.execute(select(Plan).where(Plan.name == plan.name)).scalars().all()
            )
        for target in targets:
            # Se reasigna el dict para que SQLAlchemy detecte el cambio en la columna JSON
            target.features = {**(target.features or {}), **changes}

    db.commit()
    db.refresh(plan)
    return plan


@router.post("/webhooks/wompi")
async def wompi_webhook(request: Request, db: Session = Depends(get_db)):
    event_data = await request.json()

    if not verify_wompi_signature(event_data):
        raise HTTPException(status_code=401, detail="Firma inválida.")

    event_type = event_data.get("event")
    if event_type != "transaction.updated":
        return {"message": "Evento ignorado."}

    transaction = event_data.get("data", {}).get("transaction", {})
    status = transaction.get("status")
    reference = transaction.get("reference", "")

    if status != "APPROVED":
        return {"message": f"Transacción no aprobada, estado: {status}"}

    parsed = map_plan_from_reference(reference)
    if not parsed:
        raise HTTPException(status_code=400, detail="Referencia de pago inválida.")

    institution_id, plan_id = parsed

    subscription, invoice = activate_subscription_with_invoice(
        db,
        institution_id=institution_id,
        plan_id=plan_id,
        payment_method="wompi",
        transaction_id=transaction.get("id"),
    )

    return {
        "message": "Suscripción activada.",
        "invoice_number": invoice.invoice_number,
    }


@router.get("/invoices/", response_model=list[dict])
def get_my_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.domains.subscriptions.models import Invoice

    invoices = (
        db.execute(
            select(Invoice)
            .where(Invoice.institution_id == current_user.institution_id)
            .order_by(Invoice.issued_at.desc())
        )
        .scalars()
        .all()
    )

    return [
        {
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "plan_name": inv.plan_name,
            "billing_cycle": inv.billing_cycle,
            "amount": inv.amount,
            "payment_method": inv.payment_method,
            "issued_at": inv.issued_at.isoformat(),
        }
        for inv in invoices
    ]


@router.get("/invoices/{invoice_id}/pdf")
def download_invoice_pdf(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.domains.subscriptions.models import Invoice
    from app.domains.subscriptions.invoicing import render_invoice_pdf
    from app.domains.institutions.services import get_institution

    invoice = db.execute(
        select(Invoice).where(
            Invoice.id == invoice_id,
            Invoice.institution_id == current_user.institution_id,
        )
    ).scalar_one_or_none()

    if not invoice:
        raise HTTPException(status_code=404, detail="Factura no encontrada.")

    institution = get_institution(db, current_user.institution_id)
    pdf_bytes = render_invoice_pdf(invoice, institution)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={invoice.invoice_number}.pdf"
        },
    )

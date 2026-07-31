from fastapi import APIRouter, Depends, HTTPException, Request
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


class ChangePlanRequest(BaseModel):
    plan_id: str


@router.post("/subscriptions/change-plan")
def change_plan(
    data: ChangePlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_sub = db.execute(
        select(Subscription).where(
            Subscription.institution_id == current_user.institution_id,
            Subscription.is_active == True,
        )
    ).scalar_one_or_none()

    if current_sub:
        current_sub.is_active = False
        current_sub.status = SubscriptionStatus.cancelled
        db.commit()

    return create_subscription(
        db,
        SubscriptionCreate(
            plan_id=data.plan_id, institution_id=current_user.institution_id
        ),
    )


class PlanUpdate(BaseModel):
    price: Optional[int] = None
    is_active: Optional[bool] = None


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
        plan.price = data.price
    if data.is_active is not None:
        plan.is_active = data.is_active
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
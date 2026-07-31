from sqlalchemy.orm import Session
from app.domains.users.models import User, UserRole
from sqlalchemy import select
from fastapi import HTTPException
from datetime import datetime, timedelta
from app.domains.subscriptions.models import (
    Plan,
    Subscription,
    Transaction,
    SubscriptionStatus,
    TransactionStatus,
    BillingCycle,
)
from app.domains.subscriptions.schemas import (
    PlanCreate,
    SubscriptionCreate,
    ConfirmTransaction,
)
import base64


def create_plan(db: Session, data: PlanCreate) -> Plan:
    existing = db.execute(
        select(Plan).where(
            Plan.name == data.name, Plan.billing_cycle == data.billing_cycle
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un plan con ese nombre.")
    plan = Plan(**data.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


def list_plans(db: Session) -> list[Plan]:
    return db.execute(select(Plan).where(Plan.is_active == True)).scalars().all()


def create_subscription(db: Session, data: SubscriptionCreate) -> Subscription:
    existing = db.execute(
        select(Subscription).where(
            Subscription.institution_id == data.institution_id,
            Subscription.is_active == True,
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=400, detail="Esta institución ya tiene una suscripción activa."
        )

    plan = db.execute(select(Plan).where(Plan.id == data.plan_id)).scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado.")

    subscription = Subscription(
        institution_id=data.institution_id,
        plan_id=data.plan_id,
        status=SubscriptionStatus.pending,
    )
    db.add(subscription)
    db.commit()
    db.refresh(subscription)

    transaction = Transaction(
        subscription_id=subscription.id,
        amount=plan.price,
        status=TransactionStatus.pending,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    # Si es plan Free, activar automáticamente sin esperar confirmación
    if plan.name == "free":
        transaction.status = TransactionStatus.confirmed
        transaction.notes = "Activación automática plan Free"
        subscription.status = SubscriptionStatus.active
        subscription.starts_at = datetime.utcnow()
        subscription.expires_at = datetime.utcnow() + timedelta(days=30)
        db.commit()
        db.refresh(subscription)

    return subscription


def confirm_transaction(
    db: Session, transaction_id: str, data: ConfirmTransaction, confirmed_by_id: str
) -> Transaction:
    transaction = db.execute(
        select(Transaction).where(Transaction.id == transaction_id)
    ).scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transacción no encontrada.")
    if transaction.status != TransactionStatus.pending:
        raise HTTPException(
            status_code=400, detail="Esta transacción ya fue procesada."
        )

    transaction.status = TransactionStatus.confirmed
    transaction.notes = data.notes
    transaction.confirmed_by = confirmed_by_id

    subscription = db.execute(
        select(Subscription).where(Subscription.id == transaction.subscription_id)
    ).scalar_one_or_none()

    # Duración según plan y ciclo de facturación
    if subscription.plan.name == "free":
        days = 30
    elif subscription.plan.billing_cycle == BillingCycle.annual:
        days = 365
    else:
        days = 30

    subscription.status = SubscriptionStatus.active
    subscription.starts_at = datetime.utcnow()
    subscription.expires_at = datetime.utcnow() + timedelta(days=days)

    db.commit()
    db.refresh(transaction)
    return transaction


def get_institution_subscription(db: Session, institution_id: str) -> Subscription:
    subscription = db.execute(
        select(Subscription).where(
            Subscription.institution_id == institution_id,
            Subscription.is_active == True,
        )
    ).scalar_one_or_none()
    if not subscription:
        raise HTTPException(
            status_code=404, detail="No hay suscripción activa para esta institución."
        )
    return subscription


def list_transactions(db: Session) -> list[Transaction]:
    return db.execute(select(Transaction)).scalars().all()

def activate_subscription_with_invoice(
    db: Session,
    institution_id: str,
    plan_id: str,
    payment_method: str,
    transaction_id: str = None,
):
    """
    Activa una suscripción automáticamente (pago confirmado) y genera su factura.
    payment_method: "wompi" | "transfer"
    """
    from datetime import timedelta
    from app.domains.subscriptions.models import Invoice
    from app.domains.subscriptions.invoicing import generate_invoice_number, render_invoice_pdf
    from app.domains.institutions.services import get_institution
    from app.core.email import send_invoice_email

    plan = db.execute(select(Plan).where(Plan.id == plan_id)).scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado.")

    # Desactivar suscripción anterior si existe
    current_sub = db.execute(
        select(Subscription).where(
            Subscription.institution_id == institution_id,
            Subscription.is_active == True,
        )
    ).scalar_one_or_none()
    if current_sub:
        current_sub.is_active = False
        current_sub.status = SubscriptionStatus.cancelled
        db.commit()

    # Crear la nueva suscripción ya activa
    days = 365 if plan.billing_cycle.value == "annual" else 30
    now = datetime.utcnow()
    subscription = Subscription(
        institution_id=institution_id,
        plan_id=plan_id,
        status=SubscriptionStatus.active,
        starts_at=now,
        expires_at=now + timedelta(days=days),
        is_active=True,
    )
    db.add(subscription)
    db.commit()
    db.refresh(subscription)

    # Generar factura
    invoice_number = generate_invoice_number(db)
    invoice = Invoice(
        invoice_number=invoice_number,
        institution_id=institution_id,
        subscription_id=subscription.id,
        transaction_id=transaction_id,
        plan_name=plan.name.value,
        billing_cycle=plan.billing_cycle.value,
        amount=plan.price,
        payment_method=payment_method,
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    # Generar PDF y enviar por correo
    institution = get_institution(db, institution_id)
    pdf_bytes = render_invoice_pdf(invoice, institution)

    representative = db.execute(
        select(User).where(
            User.institution_id == institution_id,
            User.role == UserRole.representative,
        )
    ).scalar_one_or_none()

    if representative:
        try:
            pdf_base64 = base64.b64encode(pdf_bytes).decode()
            send_invoice_email(
                to_email=representative.email,
                full_name=representative.full_name,
                invoice_number=invoice.invoice_number,
                plan_label=plan.name.value,
                pdf_base64=pdf_base64,
            )
        except Exception as e:
            print(f"Error enviando factura por correo: {e}")

    return subscription, invoice
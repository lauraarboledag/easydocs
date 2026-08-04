from datetime import datetime, timedelta
import base64
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException

from app.domains.subscriptions.models import (
    Plan,
    Subscription,
    Transaction,
    Invoice,
    SubscriptionStatus,
    TransactionStatus,
    BillingCycle,
)
from app.domains.subscriptions.schemas import (
    PlanCreate,
    SubscriptionCreate,
    ConfirmTransaction,
)
from app.domains.subscriptions.invoicing import (
    generate_invoice_number,
    render_invoice_pdf,
)
from app.domains.users.models import User, UserRole
from app.domains.notifications.services import create_notification
from app.domains.institutions.services import get_institution
from app.core.email import send_invoice_email


def create_plan(db: Session, data: PlanCreate) -> Plan:
    plan = Plan(**data.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


def list_plans(db: Session) -> list[Plan]:
    return db.execute(select(Plan)).scalars().all()


def create_subscription(db: Session, data: SubscriptionCreate) -> Subscription:
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
    superadmins = (
        db.execute(select(User).where(User.role == UserRole.superadmin)).scalars().all()
    )
    for admin in superadmins:
        create_notification(
            db,
            title="Nueva transacción pendiente",
            message=f"${plan.price / 100:,.0f} COP — esperando confirmación.",
            user_id=admin.id,
        )
    return subscription


def get_institution_subscription(db: Session, institution_id: str) -> Subscription:
    subscription = db.execute(
        select(Subscription).where(
            Subscription.institution_id == institution_id,
            Subscription.is_active == True,
        )
    ).scalar_one_or_none()

    if not subscription:
        raise HTTPException(status_code=404, detail="No tienes una suscripción activa.")

    return subscription


def list_transactions(db: Session) -> list[Transaction]:
    return db.execute(select(Transaction)).scalars().all()


def _generate_and_send_invoice(
    db: Session,
    subscription: Subscription,
    plan: Plan,
    payment_method: str,
    transaction_id: str = None,
) -> Invoice:
    """Helper interno: genera la factura, el PDF, y la envía por correo."""
    invoice_number = generate_invoice_number(db)
    invoice = Invoice(
        invoice_number=invoice_number,
        institution_id=subscription.institution_id,
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

    try:
        institution = get_institution(db, subscription.institution_id)
        pdf_bytes = render_invoice_pdf(invoice, institution)

        representative = db.execute(
            select(User).where(
                User.institution_id == subscription.institution_id,
                User.role == UserRole.representative,
            )
        ).scalar_one_or_none()

        if representative:
            pdf_base64 = base64.b64encode(pdf_bytes).decode()
            send_invoice_email(
                to_email=representative.email,
                full_name=representative.full_name,
                invoice_number=invoice.invoice_number,
                plan_label=plan.name.value,
                pdf_base64=pdf_base64,
            )
    except Exception as e:
        print(f"Error generando/enviando factura: {e}")

    create_notification(
        db,
        title="¡Tu plan fue activado!",
        message=f"Plan {plan.name.value} activo hasta {subscription.expires_at.strftime('%d/%m/%Y')}.",
        institution_id=subscription.institution_id,
    )
    superadmins = (
        db.execute(select(User).where(User.role == UserRole.superadmin)).scalars().all()
    )
    for admin in superadmins:
        create_notification(
            db,
            title="Nueva venta confirmada",
            message=f"{plan.name.value} — ${plan.price / 100:,.0f} COP vía {payment_method}.",
            user_id=admin.id,
        )
    return invoice


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

    plan = db.execute(select(Plan).where(Plan.id == subscription.plan_id)).scalar_one()

    # Duración según ciclo de facturación
    days = 365 if plan.billing_cycle == BillingCycle.annual else 30

    subscription.status = SubscriptionStatus.active
    subscription.starts_at = datetime.utcnow()
    subscription.expires_at = datetime.utcnow() + timedelta(days=days)

    db.commit()
    db.refresh(transaction)

    _generate_and_send_invoice(
        db, subscription, plan, payment_method="transfer", transaction_id=transaction.id
    )

    return transaction


def activate_subscription_with_invoice(
    db: Session,
    institution_id: str,
    plan_id: str,
    payment_method: str,
    transaction_id: str = None,
):
    """
    Activa una suscripción automáticamente (pago confirmado vía Wompi) y genera su factura.
    """
    plan = db.execute(select(Plan).where(Plan.id == plan_id)).scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado.")

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

    days = 365 if plan.billing_cycle == BillingCycle.annual else 30
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

    invoice = _generate_and_send_invoice(
        db,
        subscription,
        plan,
        payment_method=payment_method,
        transaction_id=transaction_id,
    )

    return subscription, invoice

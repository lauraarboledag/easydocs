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


# --- Cambio de plan -----------------------------------------------------------
# Una solicitud de plan de pago se guarda como una suscripción aparte con
# status=pending e is_active=False. La suscripción actual NO se toca: la
# institución conserva su plan hasta que se confirme el pago (administración
# o Wompi). Así el banner muestra el plan real y nadie se queda sin plan.


def get_pending_request(db: Session, institution_id: str):
    """Solicitud de cambio de plan pendiente de pago (o None)."""
    return (
        db.execute(
            select(Subscription)
            .where(
                Subscription.institution_id == institution_id,
                Subscription.status == SubscriptionStatus.pending,
                Subscription.is_active == False,
            )
            .order_by(Subscription.created_at.desc())
        )
        .scalars()
        .first()
    )


def _cancel_pending_requests(
    db: Session, institution_id: str, note: str, exclude_id: str = None
) -> None:
    """Cancela las solicitudes pendientes y rechaza sus transacciones."""
    pending = (
        db.execute(
            select(Subscription).where(
                Subscription.institution_id == institution_id,
                Subscription.status == SubscriptionStatus.pending,
                Subscription.is_active == False,
            )
        )
        .scalars()
        .all()
    )
    for sub in pending:
        if exclude_id and sub.id == exclude_id:
            continue
        sub.status = SubscriptionStatus.cancelled
        for tx in sub.transactions:
            if tx.status == TransactionStatus.pending:
                tx.status = TransactionStatus.rejected
                tx.notes = note


def _deactivate_current(
    db: Session, institution_id: str, exclude_id: str = None
) -> None:
    current = (
        db.execute(
            select(Subscription).where(
                Subscription.institution_id == institution_id,
                Subscription.is_active == True,
            )
        )
        .scalars()
        .all()
    )
    for sub in current:
        if exclude_id and sub.id == exclude_id:
            continue
        sub.is_active = False
        sub.status = SubscriptionStatus.cancelled


def request_plan_change(db: Session, institution_id: str, plan_id: str) -> Subscription:
    """Cambio de plan pedido por la institución.

    - Plan gratuito: se aplica de inmediato.
    - Plan de pago: queda como solicitud pendiente; el plan actual sigue vigente
      hasta que se confirme el pago.
    """
    plan = db.execute(select(Plan).where(Plan.id == plan_id)).scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado.")
    if not plan.is_active:
        raise HTTPException(status_code=400, detail="Este plan no está disponible.")

    if plan.price == 0:
        _cancel_pending_requests(
            db,
            institution_id,
            note="Cancelada: la institución eligió un plan gratuito.",
        )
        _deactivate_current(db, institution_id)
        subscription = Subscription(
            institution_id=institution_id,
            plan_id=plan.id,
            status=SubscriptionStatus.active,
            starts_at=datetime.utcnow(),
            expires_at=None,  # el plan gratuito no vence
            is_active=True,
        )
        db.add(subscription)
        db.commit()
        db.refresh(subscription)
        return subscription

    # Plan de pago: solo puede haber una solicitud pendiente a la vez
    _cancel_pending_requests(
        db, institution_id, note="Reemplazada por una nueva solicitud de plan."
    )
    subscription = Subscription(
        institution_id=institution_id,
        plan_id=plan.id,
        status=SubscriptionStatus.pending,
        is_active=False,
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

    institution = get_institution(db, institution_id)
    superadmins = (
        db.execute(select(User).where(User.role == UserRole.superadmin)).scalars().all()
    )
    for admin in superadmins:
        create_notification(
            db,
            title="Nueva transacción pendiente",
            message=f"{institution.name if institution else 'Institución'} — plan {plan.name.value} "
            f"(${plan.price / 100:,.0f} COP), esperando confirmación.",
            user_id=admin.id,
        )
    return subscription


def cancel_pending_request(db: Session, institution_id: str) -> None:
    if not get_pending_request(db, institution_id):
        raise HTTPException(status_code=404, detail="No tienes solicitudes pendientes.")
    _cancel_pending_requests(db, institution_id, note="Cancelada por la institución.")
    db.commit()


def list_transactions(db: Session) -> list[dict]:
    """Transacciones, las más recientes primero, con institución y plan."""
    transactions = (
        db.execute(select(Transaction).order_by(Transaction.created_at.desc()))
        .scalars()
        .all()
    )
    result = []
    for tx in transactions:
        sub = tx.subscription
        result.append(
            {
                "id": tx.id,
                "subscription_id": tx.subscription_id,
                "amount": tx.amount,
                "status": tx.status,
                "notes": tx.notes,
                "confirmed_by": tx.confirmed_by,
                "created_at": tx.created_at,
                "institution_name": (
                    sub.institution.name if sub and sub.institution else None
                ),
                "plan_name": sub.plan.name.value if sub and sub.plan else None,
                "billing_cycle": (
                    sub.plan.billing_cycle.value if sub and sub.plan else None
                ),
            }
        )
    return result


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
    if not subscription:
        raise HTTPException(status_code=404, detail="Suscripción no encontrada.")
    if subscription.status == SubscriptionStatus.cancelled:
        raise HTTPException(
            status_code=400, detail="La institución canceló o reemplazó esta solicitud."
        )

    plan = db.execute(select(Plan).where(Plan.id == subscription.plan_id)).scalar_one()

    # Duración según ciclo de facturación
    days = 365 if plan.billing_cycle == BillingCycle.annual else 30

    # Recién ahora se reemplaza el plan anterior por el nuevo
    _deactivate_current(db, subscription.institution_id, exclude_id=subscription.id)
    _cancel_pending_requests(
        db,
        subscription.institution_id,
        note="Reemplazada: se confirmó otra solicitud.",
        exclude_id=subscription.id,
    )
    subscription.status = SubscriptionStatus.active
    subscription.is_active = True
    subscription.starts_at = datetime.utcnow()
    subscription.expires_at = datetime.utcnow() + timedelta(days=days)

    db.commit()
    db.refresh(transaction)

    _generate_and_send_invoice(
        db, subscription, plan, payment_method="transfer", transaction_id=transaction.id
    )

    return transaction


def reject_transaction(
    db: Session, transaction_id: str, data: ConfirmTransaction, reviewed_by_id: str
) -> Transaction:
    """La administración rechaza un pago (no llegó, monto incorrecto...).

    La solicitud de plan queda cancelada y la institución sigue con su plan
    actual. Se le avisa con el motivo, si se escribió uno.
    """
    transaction = db.execute(
        select(Transaction).where(Transaction.id == transaction_id)
    ).scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transacción no encontrada.")
    if transaction.status != TransactionStatus.pending:
        raise HTTPException(
            status_code=400, detail="Esta transacción ya fue procesada."
        )

    reason = (data.notes or "").strip()
    transaction.status = TransactionStatus.rejected
    transaction.notes = reason or "Rechazada por la administración."
    transaction.confirmed_by = reviewed_by_id  # quién la revisó

    subscription = db.execute(
        select(Subscription).where(Subscription.id == transaction.subscription_id)
    ).scalar_one_or_none()
    plan = None
    if subscription:
        plan = db.execute(
            select(Plan).where(Plan.id == subscription.plan_id)
        ).scalar_one_or_none()
        if subscription.status == SubscriptionStatus.pending:
            subscription.status = SubscriptionStatus.cancelled
            # Solicitudes antiguas (antes del arreglo) podían quedar como
            # "is_active" estando pendientes; se desactivan también.
            subscription.is_active = False

    db.commit()
    db.refresh(transaction)

    if subscription:
        plan_label = plan.name.value if plan else "solicitado"
        message = f"Tu solicitud del plan {plan_label} no fue aprobada."
        if reason:
            message += f" Motivo: {reason}"
        message += (
            " Sigues con tu plan actual; si ya pagaste, escríbenos con el comprobante."
        )
        create_notification(
            db,
            title="Solicitud de plan rechazada",
            message=message,
            institution_id=subscription.institution_id,
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

    # Pago ya aprobado: se reemplaza el plan actual y se descartan solicitudes pendientes
    _deactivate_current(db, institution_id)
    _cancel_pending_requests(
        db, institution_id, note="Reemplazada: pago en línea aprobado."
    )
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

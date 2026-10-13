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
    PaymentReceipt,
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
from app.domains.subscriptions.wompi import (
    CURRENCY,
    integrity_signature,
    is_test_mode,
    wompi_setting,
)


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


def request_plan_change(
    db: Session,
    institution_id: str,
    plan_id: str,
    payment_method: str = "transfer",
    notify_admins: bool = True,
) -> Subscription:
    """Cambio de plan pedido por la institución.

    - Plan gratuito: se aplica de inmediato.
    - Plan de pago: queda como solicitud pendiente; el plan actual sigue vigente
      hasta que se confirme el pago (la administración, o Wompi por webhook).
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
        payment_method=payment_method,
    )
    db.add(transaction)
    db.commit()

    if not notify_admins:
        return subscription

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


# --- Comprobantes de pago -----------------------------------------------------
MAX_RECEIPT_BYTES = 5 * 1024 * 1024

RECEIPT_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf",
}


def _detect_receipt_type(content: bytes):
    """Tipo real del archivo según sus primeros bytes (no se confía en la extensión)."""
    if content.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if content[:4] == b"RIFF" and content[8:12] == b"WEBP":
        return "image/webp"
    if content.startswith(b"%PDF"):
        return "application/pdf"
    return None


def _pending_transaction(db: Session, subscription: Subscription):
    return (
        db.execute(
            select(Transaction)
            .where(
                Transaction.subscription_id == subscription.id,
                Transaction.status == TransactionStatus.pending,
            )
            .order_by(Transaction.created_at.desc())
        )
        .scalars()
        .first()
    )


def has_receipt(db: Session, transaction_id: str) -> bool:
    return (
        db.execute(
            select(PaymentReceipt.id).where(
                PaymentReceipt.transaction_id == transaction_id
            )
        ).first()
        is not None
    )


def pending_has_receipt(db: Session, subscription: Subscription) -> bool:
    tx = _pending_transaction(db, subscription)
    return bool(tx and has_receipt(db, tx.id))


def pending_payment_method(db: Session, subscription: Subscription):
    tx = _pending_transaction(db, subscription)
    return (tx.payment_method or "transfer") if tx else None


def wompi_enabled() -> bool:
    return bool(
        wompi_setting("WOMPI_PUBLIC_KEY") and wompi_setting("WOMPI_INTEGRITY_KEY")
    )


def attach_receipt(
    db: Session, institution_id: str, user_id: str, filename: str, content: bytes
) -> PaymentReceipt:
    """Adjunta (o reemplaza) el comprobante de la solicitud de plan pendiente."""
    pending = get_pending_request(db, institution_id)
    if not pending:
        raise HTTPException(
            status_code=404, detail="No tienes una solicitud de plan pendiente."
        )
    transaction = _pending_transaction(db, pending)
    if not transaction:
        raise HTTPException(
            status_code=404, detail="No hay un pago pendiente para esta solicitud."
        )

    if not content:
        raise HTTPException(status_code=400, detail="El archivo está vacío.")
    if len(content) > MAX_RECEIPT_BYTES:
        raise HTTPException(
            status_code=400, detail="El comprobante no puede superar 5 MB."
        )
    content_type = _detect_receipt_type(content)
    if not content_type:
        raise HTTPException(
            status_code=400,
            detail="Formato no permitido. Sube una foto (JPG, PNG, WEBP) o un PDF.",
        )

    receipt = db.execute(
        select(PaymentReceipt).where(PaymentReceipt.transaction_id == transaction.id)
    ).scalar_one_or_none()
    replaced = receipt is not None
    if not receipt:
        receipt = PaymentReceipt(transaction_id=transaction.id)
        db.add(receipt)
    receipt.filename = (filename or f"comprobante.{RECEIPT_TYPES[content_type]}")[:255]
    receipt.content_type = content_type
    receipt.size = len(content)
    receipt.data = content
    receipt.uploaded_by = user_id
    db.commit()
    db.refresh(receipt)

    institution = get_institution(db, institution_id)
    plan = db.execute(
        select(Plan).where(Plan.id == pending.plan_id)
    ).scalar_one_or_none()
    superadmins = (
        db.execute(select(User).where(User.role == UserRole.superadmin)).scalars().all()
    )
    for admin in superadmins:
        create_notification(
            db,
            title="Comprobante de pago " + ("actualizado" if replaced else "recibido"),
            message=f"{institution.name if institution else 'Institución'} — plan "
            f"{plan.name.value if plan else ''}: revisa el comprobante en Transacciones.",
            user_id=admin.id,
        )
    return receipt


def get_receipt(db: Session, transaction_id: str, user) -> PaymentReceipt:
    """Comprobante de una transacción: lo ve el superadmin o la institución dueña."""
    transaction = db.execute(
        select(Transaction).where(Transaction.id == transaction_id)
    ).scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transacción no encontrada.")
    if user.role != UserRole.superadmin:
        sub = transaction.subscription
        if not sub or sub.institution_id != user.institution_id:
            raise HTTPException(status_code=404, detail="Transacción no encontrada.")
    receipt = db.execute(
        select(PaymentReceipt).where(PaymentReceipt.transaction_id == transaction_id)
    ).scalar_one_or_none()
    if not receipt:
        raise HTTPException(
            status_code=404, detail="Esta transacción no tiene comprobante."
        )
    return receipt


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
    with_receipt = set(
        db.execute(select(PaymentReceipt.transaction_id)).scalars().all()
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
                "has_receipt": tx.id in with_receipt,
                "payment_method": tx.payment_method,
                "provider_payment_type": tx.provider_payment_type,
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

    subscription = db.execute(
        select(Subscription).where(Subscription.id == transaction.subscription_id)
    ).scalar_one_or_none()
    if not subscription:
        raise HTTPException(status_code=404, detail="Suscripción no encontrada.")
    if subscription.status == SubscriptionStatus.cancelled:
        raise HTTPException(
            status_code=400, detail="La institución canceló o reemplazó esta solicitud."
        )

    transaction.status = TransactionStatus.confirmed
    transaction.notes = data.notes
    transaction.confirmed_by = confirmed_by_id
    _activate_paid_request(
        db,
        transaction,
        subscription,
        payment_method=transaction.payment_method or "transfer",
    )
    db.refresh(transaction)
    return transaction


def _activate_paid_request(
    db: Session,
    transaction: Transaction,
    subscription: Subscription,
    payment_method: str,
) -> Invoice:
    """Activa una solicitud de plan ya pagada y genera su factura.

    La usan la confirmación manual (transferencia) y el webhook de Wompi.
    El estado de `transaction` lo deja listo quien llama.
    """
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
    now = datetime.utcnow()
    subscription.status = SubscriptionStatus.active
    subscription.is_active = True
    subscription.starts_at = now
    subscription.expires_at = now + timedelta(days=days)
    db.commit()

    return _generate_and_send_invoice(
        db,
        subscription,
        plan,
        payment_method=payment_method,
        transaction_id=transaction.id,
    )


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
    Activa una suscripción sin pasar por una solicitud pendiente.

    Ya no la usa el webhook de Wompi (ver process_wompi_event). Se deja para
    activaciones manuales; `transaction_id` debe ser un id de la tabla
    transactions o None.
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


# --- Pago en línea con Wompi --------------------------------------------------
# 1. start_wompi_checkout crea la solicitud pendiente (como una transferencia)
#    y devuelve la referencia y la firma de integridad para abrir el widget.
# 2. Wompi avisa por webhook; process_wompi_event busca la transacción por la
#    referencia, revisa monto y moneda, y activa el plan.
# El plan nunca se activa desde el navegador: solo con el aviso firmado.


def start_wompi_checkout(db: Session, user: User, plan_id: str) -> dict:
    if user.role != UserRole.representative:
        raise HTTPException(
            status_code=403,
            detail="Solo el representante de la institución puede pagar el plan.",
        )
    public_key = wompi_setting("WOMPI_PUBLIC_KEY")
    if not wompi_enabled():
        raise HTTPException(
            status_code=503,
            detail="El pago en línea no está disponible en este momento. Usa transferencia.",
        )

    plan = db.execute(select(Plan).where(Plan.id == plan_id)).scalar_one_or_none()
    if not plan or not plan.is_active:
        raise HTTPException(status_code=404, detail="Plan no encontrado.")
    if plan.price <= 0:
        raise HTTPException(status_code=400, detail="Este plan no requiere pago.")

    subscription = request_plan_change(
        db, user.institution_id, plan.id, payment_method="wompi", notify_admins=False
    )
    transaction = _pending_transaction(db, subscription)
    transaction.reference = f"easydocs-{transaction.id}"
    db.commit()

    return {
        "public_key": public_key,
        "currency": CURRENCY,
        "amount_in_cents": transaction.amount,
        "reference": transaction.reference,
        "signature": integrity_signature(transaction.reference, transaction.amount),
        "customer_email": user.email,
        "customer_name": user.full_name,
        "test_mode": is_test_mode(),
    }


WOMPI_FAILED_STATUSES = {"DECLINED", "VOIDED", "ERROR"}


def _notify_superadmins(db: Session, title: str, message: str) -> None:
    superadmins = (
        db.execute(select(User).where(User.role == UserRole.superadmin)).scalars().all()
    )
    for admin in superadmins:
        create_notification(db, title=title, message=message, user_id=admin.id)


def process_wompi_event(db: Session, event: dict) -> dict:
    """Procesa un evento transaction.updated ya verificado.

    Siempre responde (sin lanzar error) para que Wompi no reintente un
    evento que ya se manejó; los casos raros se avisan al superadmin.
    """
    if event.get("event") != "transaction.updated":
        return {"message": "Evento ignorado."}

    wompi_tx = (event.get("data") or {}).get("transaction") or {}
    status = wompi_tx.get("status")
    reference = wompi_tx.get("reference") or ""

    transaction = db.execute(
        select(Transaction).where(Transaction.reference == reference)
    ).scalar_one_or_none()
    if not transaction:
        print(f"Wompi: referencia desconocida {reference!r} ({status})")
        return {"message": "Referencia desconocida."}

    if status == "PENDING":
        return {"message": "Pago en proceso."}

    subscription = transaction.subscription
    institution_name = (
        subscription.institution.name
        if subscription and subscription.institution
        else "Institución"
    )

    # Ya procesada (Wompi puede mandar el mismo aviso más de una vez)
    if transaction.status != TransactionStatus.pending:
        if status == "APPROVED" and transaction.status != TransactionStatus.confirmed:
            # Pagó una solicitud que ya había sido reemplazada o cancelada
            _notify_superadmins(
                db,
                "Pago en línea para revisar",
                f"{institution_name} pagó en Wompi una solicitud que ya estaba "
                f"cancelada (referencia {reference}). Revísalo en Transacciones.",
            )
        return {"message": "Transacción ya procesada."}

    transaction.provider_transaction_id = str(wompi_tx.get("id") or "")[:100] or None
    transaction.provider_payment_type = (wompi_tx.get("payment_method_type") or "")[
        :30
    ] or None

    if status == "APPROVED":
        amount = wompi_tx.get("amount_in_cents")
        currency = wompi_tx.get("currency")
        if amount != transaction.amount or currency != CURRENCY:
            transaction.status = TransactionStatus.rejected
            transaction.notes = (
                f"Wompi aprobó un monto distinto: {amount} {currency} "
                f"(esperado {transaction.amount} {CURRENCY}). Revisar."
            )
            db.commit()
            _notify_superadmins(
                db,
                "Pago en línea con monto distinto",
                f"{institution_name} — referencia {reference}: el monto pagado no "
                "coincide con el plan. No se activó. Revísalo en Transacciones.",
            )
            return {"message": "Monto no coincide."}

        if not subscription or subscription.status != SubscriptionStatus.pending:
            transaction.status = TransactionStatus.rejected
            transaction.notes = "Pago aprobado en Wompi, pero la solicitud ya no estaba pendiente. Revisar."
            db.commit()
            _notify_superadmins(
                db,
                "Pago en línea para revisar",
                f"{institution_name} pagó en Wompi una solicitud que ya no estaba "
                f"pendiente (referencia {reference}). Revísalo en Transacciones.",
            )
            return {"message": "Solicitud no pendiente."}

        transaction.status = TransactionStatus.confirmed
        transaction.notes = (
            f"Pago en línea aprobado ({transaction.provider_payment_type or 'Wompi'})."
        )
        invoice = _activate_paid_request(
            db, transaction, subscription, payment_method="wompi"
        )
        return {
            "message": "Suscripción activada.",
            "invoice_number": invoice.invoice_number,
        }

    if status in WOMPI_FAILED_STATUSES:
        transaction.status = TransactionStatus.rejected
        transaction.notes = f"Wompi no aprobó el pago ({status})."
        if subscription and subscription.status == SubscriptionStatus.pending:
            subscription.status = SubscriptionStatus.cancelled
            subscription.is_active = False
        db.commit()
        if subscription:
            create_notification(
                db,
                title="Pago no aprobado",
                message="Tu pago en línea no fue aprobado. Sigues con tu plan actual; "
                "puedes intentarlo de nuevo o pagar por transferencia.",
                institution_id=subscription.institution_id,
            )
        return {"message": f"Pago no aprobado ({status})."}

    return {"message": f"Estado ignorado: {status}"}

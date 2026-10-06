from datetime import datetime

from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from app.domains.notifications.models import Notification, NotificationReceipt

# --- Qué ve cada usuario ------------------------------------------------------
# - Usuario de una institución: los avisos de su institución + los dirigidos a él.
# - Superadmin (sin institución): solo los dirigidos a él.
# Leído/borrado se guarda por usuario en NotificationReceipt.


def _scope(user):
    if user.institution_id:
        return or_(
            Notification.institution_id == user.institution_id,
            Notification.user_id == user.id,
        )
    return Notification.user_id == user.id


def _receipt_join(user):
    return and_(
        NotificationReceipt.notification_id == Notification.id,
        NotificationReceipt.user_id == user.id,
    )


def _is_read_expr():
    return or_(Notification.is_read == True, NotificationReceipt.read_at.isnot(None))


def _visible(user):
    """Notificaciones del usuario que no ha borrado (con su recibo, si existe)."""
    return (
        select(Notification, NotificationReceipt)
        .outerjoin(NotificationReceipt, _receipt_join(user))
        .where(_scope(user), NotificationReceipt.dismissed_at.is_(None))
    )


def _to_dict(notification: Notification, receipt) -> dict:
    return {
        "id": notification.id,
        "title": notification.title,
        "message": notification.message,
        "calendar_event_id": notification.calendar_event_id,
        "is_read": bool(notification.is_read or (receipt and receipt.read_at)),
        "created_at": notification.created_at,
    }


def _get_receipt(
    db: Session, notification_id: str, user_id: str
) -> NotificationReceipt:
    receipt = db.execute(
        select(NotificationReceipt).where(
            NotificationReceipt.notification_id == notification_id,
            NotificationReceipt.user_id == user_id,
        )
    ).scalar_one_or_none()
    if not receipt:
        receipt = NotificationReceipt(notification_id=notification_id, user_id=user_id)
        db.add(receipt)
    return receipt


# --- Lectura ------------------------------------------------------------------
def list_notifications(
    db: Session, user, unread_only: bool = False, limit: int = 30, offset: int = 0
) -> list[dict]:
    query = _visible(user)
    if unread_only:
        query = query.where(~_is_read_expr())
    rows = db.execute(
        query.order_by(Notification.created_at.desc()).limit(limit).offset(offset)
    ).all()
    return [_to_dict(n, r) for n, r in rows]


def count_unread(db: Session, user) -> int:
    query = (
        select(func.count())
        .select_from(Notification)
        .outerjoin(NotificationReceipt, _receipt_join(user))
        .where(
            _scope(user),
            NotificationReceipt.dismissed_at.is_(None),
            ~_is_read_expr(),
        )
    )
    return db.execute(query).scalar() or 0


def _get_visible(db: Session, notification_id: str, user):
    return db.execute(_visible(user).where(Notification.id == notification_id)).first()


# --- Marcar como leídas -------------------------------------------------------
def mark_as_read(db: Session, notification_id: str, user) -> bool:
    row = _get_visible(db, notification_id, user)
    if not row:
        return False
    receipt = _get_receipt(db, notification_id, user.id)
    receipt.read_at = receipt.read_at or datetime.utcnow()
    db.commit()
    return True


def mark_all_as_read(db: Session, user) -> int:
    rows = db.execute(_visible(user).where(~_is_read_expr())).all()
    now = datetime.utcnow()
    for notification, receipt in rows:
        receipt = receipt or _get_receipt(db, notification.id, user.id)
        receipt.read_at = now
    db.commit()
    return len(rows)


# --- Borrar -------------------------------------------------------------------
def _dismiss(db: Session, notification: Notification, receipt, user) -> None:
    personal = notification.user_id == user.id and not notification.institution_id
    if personal:
        # Es solo de este usuario: se borra de verdad
        db.delete(notification)
        return
    # Es de toda la institución: se oculta solo para este usuario
    receipt = receipt or _get_receipt(db, notification.id, user.id)
    now = datetime.utcnow()
    receipt.dismissed_at = now
    receipt.read_at = receipt.read_at or now


def dismiss_notifications(db: Session, ids: list[str], user) -> int:
    if not ids:
        return 0
    rows = db.execute(_visible(user).where(Notification.id.in_(ids))).all()
    for notification, receipt in rows:
        _dismiss(db, notification, receipt, user)
    db.commit()
    return len(rows)


def dismiss_read(db: Session, user) -> int:
    """Limpia la bandeja: borra todas las notificaciones ya leídas."""
    rows = db.execute(_visible(user).where(_is_read_expr())).all()
    for notification, receipt in rows:
        _dismiss(db, notification, receipt, user)
    db.commit()
    return len(rows)


# --- Crear (sin cambios para quien la llama) ------------------------------------
def create_notification(
    db: Session,
    title: str,
    message: str,
    institution_id: str = None,
    user_id: str = None,
    calendar_event_id: str = None,
) -> Notification:
    notification = Notification(
        institution_id=institution_id,
        user_id=user_id,
        title=title,
        message=message,
        calendar_event_id=calendar_event_id,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification

from sqlalchemy.orm import Session
from sqlalchemy import select
from app.domains.notifications.models import Notification


def list_notifications(db: Session, institution_id: str = None, user_id: str = None) -> list[Notification]:
    query = select(Notification)
    if institution_id:
        query = query.where(Notification.institution_id == institution_id)
    else:
        query = query.where(Notification.user_id == user_id)
    return db.execute(
        query.order_by(Notification.created_at.desc()).limit(30)
    ).scalars().all()


def count_unread(db: Session, institution_id: str = None, user_id: str = None) -> int:
    from sqlalchemy import func
    query = select(func.count()).select_from(Notification).where(Notification.is_read == False)
    if institution_id:
        query = query.where(Notification.institution_id == institution_id)
    else:
        query = query.where(Notification.user_id == user_id)
    return db.execute(query).scalar()


def mark_as_read(db: Session, notification_id: str, institution_id: str = None, user_id: str = None) -> bool:
    query = select(Notification).where(Notification.id == notification_id)
    if institution_id:
        query = query.where(Notification.institution_id == institution_id)
    else:
        query = query.where(Notification.user_id == user_id)

    notification = db.execute(query).scalar_one_or_none()
    if not notification:
        return False

    notification.is_read = True
    db.commit()
    return True


def mark_all_as_read(db: Session, institution_id: str = None, user_id: str = None):
    query = select(Notification).where(Notification.is_read == False)
    if institution_id:
        query = query.where(Notification.institution_id == institution_id)
    else:
        query = query.where(Notification.user_id == user_id)

    notifications = db.execute(query).scalars().all()
    for n in notifications:
        n.is_read = True
    db.commit()


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
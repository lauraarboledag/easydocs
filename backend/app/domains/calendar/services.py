from sqlalchemy.orm import Session
from sqlalchemy import select
from app.domains.calendar.models import CalendarEvent
from app.domains.calendar.schemas import CalendarEventCreate, CalendarEventUpdate
from datetime import datetime
from app.domains.institutions.models import Institution
from app.domains.calendar.models import EventType, EventColor
from app.domains.notifications.models import Notification

def list_events(
    db: Session,
    institution_id: str = None,
    user_id: str = None,
) -> list[CalendarEvent]:
    query = select(CalendarEvent)
    if institution_id:
        query = query.where(CalendarEvent.institution_id == institution_id)
    else:
        query = query.where(
            CalendarEvent.created_by == user_id,
            CalendarEvent.source_event_id.is_(None),
        )
    return db.execute(query.order_by(CalendarEvent.event_date)).scalars().all()


def create_event(
    db: Session,
    data: CalendarEventCreate,
    institution_id: str = None,
    user_id: str = None,
) -> CalendarEvent:
    event = CalendarEvent(
        institution_id=institution_id,
        created_by=user_id,
        title=data.title,
        description=data.description,
        event_date=data.event_date,
        color=data.color,
        type=data.type,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def update_event(
    db: Session,
    event_id: str,
    institution_id: str = None,
    user_id: str = None,
    data: CalendarEventUpdate = None,
) -> CalendarEvent:
    query = select(CalendarEvent).where(CalendarEvent.id == event_id)
    if institution_id:
        query = query.where(CalendarEvent.institution_id == institution_id)
    else:
        query = query.where(CalendarEvent.created_by == user_id)

    event = db.execute(query).scalar_one_or_none()
    if not event:
        return None

    if data.title is not None:
        event.title = data.title
    if data.description is not None:
        event.description = data.description
    if data.event_date is not None:
        event.event_date = data.event_date
    if data.color is not None:
        event.color = data.color
    if data.is_done is not None:
        event.is_done = data.is_done

    db.commit()
    db.refresh(event)
    return event


def delete_event(
    db: Session,
    event_id: str,
    institution_id: str = None,
    user_id: str = None,
) -> bool:
    query = select(CalendarEvent).where(CalendarEvent.id == event_id)
    if institution_id:
        query = query.where(CalendarEvent.institution_id == institution_id)
    else:
        query = query.where(CalendarEvent.created_by == user_id)

    event = db.execute(query).scalar_one_or_none()
    if not event:
        return False

    db.delete(event)
    db.commit()
    return True

def create_mandatory_event(
    db: Session,
    title: str,
    description: str,
    event_date: datetime,
    reminder_days_before: int,
    color: str,
    superadmin_id: str,
) -> CalendarEvent:

    # Evento maestro — referencia central, no aparece en ningún calendario institucional
    master_event = CalendarEvent(
        institution_id=None,
        created_by=superadmin_id,
        title=title,
        description=description,
        event_date=event_date,
        color=EventColor(color),
        type=EventType.system,
        is_mandatory=True,
        reminder_days_before=reminder_days_before,
    )
    db.add(master_event)
    db.commit()
    db.refresh(master_event)

    # Clonar a todas las instituciones activas
    institutions = db.execute(
        select(Institution).where(Institution.is_active == True)
    ).scalars().all()

    for inst in institutions:
        clone = CalendarEvent(
            institution_id=inst.id,
            created_by=superadmin_id,
            title=title,
            description=description,
            event_date=event_date,
            color=EventColor(color),
            type=EventType.system,
            is_mandatory=True,
            reminder_days_before=reminder_days_before,
            source_event_id=master_event.id,
        )
        db.add(clone)

    db.commit()
    return master_event


def list_mandatory_events(db: Session) -> list[CalendarEvent]:
    """Lista los eventos maestros creados por el superadmin."""
    return db.execute(
        select(CalendarEvent)
        .where(CalendarEvent.is_mandatory == True, CalendarEvent.institution_id.is_(None))
        .order_by(CalendarEvent.event_date.desc())
    ).scalars().all()
    
def delete_mandatory_event(db: Session, master_event_id: str) -> bool:
    master = db.execute(
        select(CalendarEvent).where(CalendarEvent.id == master_event_id)
    ).scalar_one_or_none()
    if not master:
        return False

    clones = db.execute(
        select(CalendarEvent).where(CalendarEvent.source_event_id == master_event_id)
    ).scalars().all()

    # IDs de todos los eventos involucrados (maestro + clones)
    all_event_ids = [master_event_id] + [clone.id for clone in clones]
    notifications = db.execute(
        select(Notification).where(Notification.calendar_event_id.in_(all_event_ids))
    ).scalars().all()
    for notif in notifications:
        db.delete(notif)

    for clone in clones:
        db.delete(clone)

    db.delete(master)
    db.commit()
    return True
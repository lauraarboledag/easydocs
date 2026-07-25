from sqlalchemy.orm import Session
from sqlalchemy import select
from app.domains.calendar.models import CalendarEvent
from app.domains.calendar.schemas import CalendarEventCreate, CalendarEventUpdate
from datetime import datetime


def list_events(
    db: Session,
    institution_id: str = None,
    user_id: str = None,
) -> list[CalendarEvent]:
    query = select(CalendarEvent)
    if institution_id:
        query = query.where(CalendarEvent.institution_id == institution_id)
    else:
        query = query.where(CalendarEvent.created_by == user_id)
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

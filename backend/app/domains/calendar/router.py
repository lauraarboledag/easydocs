from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from app.database import get_db
from app.core.auth import get_current_user
from app.core.features import require_superadmin
from app.domains.users.models import User
from app.domains.calendar.models import EventColor
from app.domains.calendar.schemas import (
    CalendarEventCreate,
    CalendarEventUpdate,
    CalendarEventResponse,
)
from app.domains.calendar.services import (
    list_events,
    create_event,
    update_event,
    delete_event,
    create_mandatory_event,
    list_mandatory_events,
    delete_mandatory_event,
)

router = APIRouter(tags=["Calendario"])


@router.get("/calendar/", response_model=list[CalendarEventResponse])
def get_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return list_events(
        db,
        institution_id=current_user.institution_id or None,
        user_id=current_user.id,
    )


@router.post("/calendar/", response_model=CalendarEventResponse, status_code=201)
def new_event(
    data: CalendarEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_event(
        db,
        data,
        institution_id=current_user.institution_id or None,
        user_id=current_user.id,
    )


@router.patch("/calendar/{event_id}", response_model=CalendarEventResponse)
def edit_event(
    event_id: str,
    data: CalendarEventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = update_event(
        db,
        event_id,
        institution_id=current_user.institution_id or None,
        user_id=current_user.id,
        data=data,
    )
    if not event:
        raise HTTPException(status_code=404, detail="Evento no encontrado.")
    return event


@router.delete("/calendar/{event_id}", status_code=204)
def remove_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deleted = delete_event(
        db,
        event_id,
        institution_id=current_user.institution_id or None,
        user_id=current_user.id,
    )
    if not deleted:
        raise HTTPException(status_code=404, detail="Evento no encontrado.")

class MandatoryEventCreate(BaseModel):
    title: str
    description: str = None
    event_date: datetime
    reminder_days_before: int = 7
    color: EventColor = EventColor.red


@router.post("/calendar/mandatory", response_model=CalendarEventResponse, status_code=201)
def new_mandatory_event(
    data: MandatoryEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    return create_mandatory_event(
        db,
        title=data.title,
        description=data.description,
        event_date=data.event_date,
        reminder_days_before=data.reminder_days_before,
        color=data.color.value,
        superadmin_id=current_user.id,
    )


@router.get("/calendar/mandatory", response_model=list[CalendarEventResponse])
def get_mandatory_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    return list_mandatory_events(db)


@router.delete("/calendar/mandatory/{event_id}", status_code=204)
def remove_mandatory_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    deleted = delete_mandatory_event(db, event_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Evento no encontrado.")

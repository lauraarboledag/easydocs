from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.domains.calendar.models import EventType, EventColor


class CalendarEventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    event_date: datetime
    color: EventColor = EventColor.blue
    type: EventType = EventType.manual


class CalendarEventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[datetime] = None
    color: Optional[EventColor] = None
    is_done: Optional[bool] = None


class CalendarEventResponse(BaseModel):
    id: str
    institution_id: Optional[str] = None
    created_by: str
    title: str
    description: Optional[str]
    event_date: datetime
    type: EventType
    color: EventColor
    is_done: bool
    is_mandatory: bool
    source_event_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}
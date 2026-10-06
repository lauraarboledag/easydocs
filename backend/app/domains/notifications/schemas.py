from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class NotificationResponse(BaseModel):
    id: str
    title: str
    message: Optional[str]
    calendar_event_id: Optional[str]
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationIds(BaseModel):
    ids: list[str] = Field(..., min_length=1, max_length=200)

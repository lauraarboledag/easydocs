import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey, func, Enum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import enum


class EventType(str, enum.Enum):
    manual = "manual"
    system = "system"


class EventColor(str, enum.Enum):
    blue = "blue"
    green = "green"
    red = "red"
    yellow = "yellow"
    purple = "purple"


class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    institution_id: Mapped[str] = mapped_column(
        String, ForeignKey("institutions.id"), nullable=True
    )
    created_by: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    event_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    type: Mapped[EventType] = mapped_column(
        Enum(EventType), nullable=False, default=EventType.manual
    )
    color: Mapped[EventColor] = mapped_column(
        Enum(EventColor), nullable=False, default=EventColor.blue
    )
    is_done: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    institution = relationship("Institution", back_populates="calendar_events")
    creator = relationship("User", foreign_keys=[created_by])
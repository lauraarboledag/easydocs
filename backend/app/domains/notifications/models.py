import uuid
from datetime import datetime
from sqlalchemy import (
    String,
    Boolean,
    DateTime,
    ForeignKey,
    func,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    institution_id: Mapped[str] = mapped_column(
        String, ForeignKey("institutions.id"), nullable=True
    )
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=True)
    calendar_event_id: Mapped[str] = mapped_column(
        String, ForeignKey("calendar_events.id"), nullable=True
    )
    # Estado "leído" antiguo y compartido. Las notificaciones nuevas guardan
    # leído/borrado por usuario en NotificationReceipt; este campo se respeta
    # solo para lo que ya estaba marcado antes de existir los recibos.
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    institution = relationship("Institution")
    user = relationship("User")
    calendar_event = relationship("CalendarEvent")


class NotificationReceipt(Base):
    __tablename__ = "notification_receipts"
    __table_args__ = (
        UniqueConstraint("notification_id", "user_id", name="uq_notification_receipt"),
    )

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    notification_id: Mapped[str] = mapped_column(
        String, ForeignKey("notifications.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    read_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    dismissed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

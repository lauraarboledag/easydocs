import uuid
from datetime import datetime
from sqlalchemy import Column, Text, String, Boolean, DateTime, func, false
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Institution(Base):
    __tablename__ = "institutions"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    dane_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=True)
    department: Mapped[str] = mapped_column(String(100), nullable=False)
    municipality: Mapped[str] = mapped_column(String(100), nullable=False)
    address: Mapped[str] = mapped_column(String(255), nullable=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=True)
    email: Mapped[str] = mapped_column(String(255), nullable=True)
    education_level: Mapped[str] = mapped_column(String(100), nullable=False)
    license_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    logo_url = Column(Text, nullable=True)
    # Preferencias del logo en los documentos (cada documento puede cambiarlas)
    logo_position: Mapped[str] = mapped_column(
        String(20), nullable=False, default="top-left", server_default="top-left"
    )
    logo_watermark: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=false()
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    users = relationship("User", back_populates="institution")
    subscription = relationship(
        "Subscription", back_populates="institution", uselist=False
    )
    documents = relationship("Document", back_populates="institution")
    programs = relationship("Program", back_populates="institution")
    students = relationship("Student", back_populates="institution")
    enrollments = relationship("Enrollment", back_populates="institution")
    calendar_events = relationship("CalendarEvent", back_populates="institution")

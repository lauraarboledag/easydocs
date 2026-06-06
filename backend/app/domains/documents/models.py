import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey, func, Enum, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import enum

class DocumentStatus(str, enum.Enum):
    draft = "draft"
    ai_draft = "ai_draft"
    generated = "generated"
    cancelled = "cancelled"

class DocumentType(str, enum.Enum):
    LR001 = "LR001"
    LR002 = "LR002"
    LR003 = "LR003"
    LR004 = "LR004"
    LR005 = "LR005"
    LR006 = "LR006"
    LR007 = "LR007"
    LR008 = "LR008"
    LR009 = "LR009"
    certificado_aptitud_laboral = "certificado_aptitud_laboral"
    certificado_aptitud_salud = "certificado_aptitud_salud"
    certificado_conocimientos = "certificado_conocimientos"
    constancia_asistencia = "constancia_asistencia"
    constancia_estudio = "constancia_estudio"

class DocumentTemplate(Base):
    __tablename__ = "document_templates"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    document_type: Mapped[DocumentType] = mapped_column(
        Enum(DocumentType), nullable=False, unique=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=True)
    template_html: Mapped[str] = mapped_column(String, nullable=False)
    required_fields: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    documents = relationship("Document", back_populates="template")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    institution_id: Mapped[str] = mapped_column(
        String, ForeignKey("institutions.id"), nullable=False
    )
    template_id: Mapped[str] = mapped_column(
        String, ForeignKey("document_templates.id"), nullable=False
    )
    created_by: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), nullable=False
    )
    status: Mapped[DocumentStatus] = mapped_column(
        Enum(DocumentStatus), nullable=False, default=DocumentStatus.draft
    )
    document_data: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    pdf_url: Mapped[str] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    institution = relationship("Institution", back_populates="documents")
    template = relationship("DocumentTemplate", back_populates="documents")
    creator = relationship("User", back_populates="documents", foreign_keys=[created_by])
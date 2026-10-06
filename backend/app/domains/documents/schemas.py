from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime
from app.domains.documents.models import DocumentStatus, DocumentType


class DocumentTemplateCreate(BaseModel):
    document_type: DocumentType
    name: str
    description: Optional[str] = None
    template_html: str
    # El backend los recalcula a partir de template_html al guardar
    # (ver template_fields.py); se aceptan por compatibilidad.
    required_fields: list[str] = []
    table_columns: dict[str, list[str]] = {}


class DocumentTemplateResponse(BaseModel):
    id: str
    document_type: DocumentType
    name: str
    description: Optional[str]
    template_html: str
    required_fields: list[str]
    table_columns: dict[str, list[str]]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentCreate(BaseModel):
    template_id: str
    document_data: dict
    # Opciones de presentación de este documento. Si no se envían, se usan
    # las preferencias de la institución.
    logo_position: Optional[str] = None
    watermark: Optional[bool] = None
    # True = guardar como borrador (sin exigir campos obligatorios ni gastar cupo)
    save_as_draft: bool = False
    # Campos con texto redactado por EduBot. Si hay alguno, el borrador queda
    # como "Borrador IA" y para generarlo hay que confirmar la revisión.
    ai_fields: list[str] = []
    ai_reviewed: bool = False


class DocumentUpdate(BaseModel):
    """Editar un borrador. Con save_as_draft=False se valida y queda generado."""

    document_data: dict
    logo_position: Optional[str] = None
    watermark: Optional[bool] = None
    save_as_draft: bool = True
    ai_fields: list[str] = []
    ai_reviewed: bool = False


class DocumentResponse(BaseModel):
    id: str
    institution_id: str
    template_id: str
    created_by: str
    status: DocumentStatus
    document_data: dict
    pdf_url: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

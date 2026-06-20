from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime
from app.domains.documents.models import DocumentStatus, DocumentType

class DocumentTemplateCreate(BaseModel):
    document_type: DocumentType
    name: str
    description: Optional[str] = None
    template_html: str
    required_fields: list[str]

class DocumentTemplateResponse(BaseModel):
    id: str
    document_type: DocumentType
    name: str
    description: Optional[str]
    template_html: str
    required_fields: list[str]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}

class DocumentCreate(BaseModel):
    template_id: str
    document_data: dict

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

    model_config = {"from_attributes": True}
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class InstitutionCreate(BaseModel):
    name: str
    dane_code: str
    department: str
    municipality: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    education_level: str
    license_number: Optional[str] = None

class InstitutionResponse(BaseModel):
    id: str
    name: str
    dane_code: str
    department: str
    municipality: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    education_level: str
    license_number: Optional[str] = None
    is_verified: bool
    is_active: bool
    logo_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
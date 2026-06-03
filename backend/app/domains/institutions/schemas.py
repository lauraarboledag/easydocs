from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class InstitutionCreate(BaseModel):
    name: str
    dane_code: str
    department: str
    municipality: str
    address: Optional[str] = None
    phone: str
    email: EmailStr
    education_level: str
    license_number: str

class InstitutionResponse(BaseModel):
    id: str
    name: str
    dane_code: str
    department: str
    municipality: str
    address: Optional[str]
    phone: str
    email: str
    education_level: str
    license_number: str
    is_verified: bool
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
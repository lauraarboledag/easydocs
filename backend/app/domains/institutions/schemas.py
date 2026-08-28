from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime


class InstitutionCreate(BaseModel):
    name: str
    dane_code: Optional[str] = None
    department: str
    municipality: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    education_level: str
    license_number: Optional[str] = None

    @field_validator("dane_code", "license_number", mode="before")
    @classmethod
    def empty_string_to_none(cls, v):
        if v is not None and v.strip() == "":
            return None
        return v


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

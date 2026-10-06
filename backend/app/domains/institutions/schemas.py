from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime
from app.domains.students.schemas import clean_phone

LOGO_POSITIONS = {"top-left", "top-center", "top-right"}
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

    @field_validator("phone", mode="before")
    @classmethod
    def validate_phone(cls, v):
        return clean_phone(v)


# Campos que la propia institución puede editar (Configuración y Documento nuevo).
# Nombre, licencia y código DANE son datos legales: solo los cambia el superadmin.
class InstitutionSelfUpdate(BaseModel):
    department: Optional[str] = None
    municipality: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    education_level: Optional[str] = None
    # Preferencias del logo en los documentos
    logo_position: Optional[str] = None
    logo_watermark: Optional[bool] = None

    @field_validator("logo_position")
    @classmethod
    def valid_logo_position(cls, v):
        if v is not None and v not in LOGO_POSITIONS:
            raise ValueError("Posición de logo no válida.")
        return v

    @field_validator("address", "email", mode="before")
    @classmethod
    def blank_to_none(cls, v):
        if isinstance(v, str):
            v = v.strip()
            return v or None
        return v

    @field_validator("department", "municipality", "education_level", mode="before")
    @classmethod
    def required_if_sent(cls, v):
        # Son obligatorios en la base de datos: si se envían, no pueden ir vacíos
        if isinstance(v, str):
            v = v.strip()
            if not v:
                raise ValueError("Este dato de la institución no puede quedar vacío.")
        return v

    @field_validator("phone", mode="before")
    @classmethod
    def validate_phone(cls, v):
        return clean_phone(v)


class InstitutionResponse(BaseModel):
    id: str
    name: str
    dane_code: Optional[str] = None
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
    logo_position: str = "top-left"
    logo_watermark: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}

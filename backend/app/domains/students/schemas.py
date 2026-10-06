import re
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime

# --- Validación de teléfonos ---
# Opcional; si viene, solo dígitos, espacios, guiones y "+" al inicio,
# con entre 7 y 15 dígitos (espacios y guiones no cuentan).
PHONE_RE = re.compile(r"^\+?[\d\s-]+$")
PHONE_ERROR = (
    "El teléfono solo puede tener números, espacios, guiones y + al inicio "
    "(entre 7 y 15 dígitos)."
)


def clean_phone(value):
    if value is None:
        return None
    # Excel puede entregar el número como int/float (3001234567 o 3001234567.0)
    if isinstance(value, (int, float)):
        value = str(int(value))
    value = str(value).strip()
    if not value:
        return None
    if re.fullmatch(r"\d+\.0", value):
        value = value[:-2]
    digits = len(re.sub(r"\D", "", value))
    if not PHONE_RE.match(value) or not 7 <= digits <= 15:
        raise ValueError(PHONE_ERROR)
    return value


# --- Program ---
class ProgramCreate(BaseModel):
    name: str
    resolution: Optional[str] = None
    total_hours: Optional[str] = None
    certificate_type: Optional[str] = None


class ProgramResponse(BaseModel):
    id: str
    institution_id: str
    name: str
    resolution: Optional[str] = None
    total_hours: Optional[str] = None
    certificate_type: Optional[str] = None
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True}


# --- Student ---
class StudentCreate(BaseModel):
    full_name: str
    document_type: str
    document_number: str
    document_place: Optional[str] = None
    address: Optional[str] = None
    neighborhood: Optional[str] = None
    commune: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_minor: bool = False
    guardian_name: Optional[str] = None
    guardian_document: Optional[str] = None
    guardian_address: Optional[str] = None
    guardian_phone: Optional[str] = None

    @field_validator("phone", "guardian_phone", mode="before")
    @classmethod
    def validate_phones(cls, value):
        return clean_phone(value)


class StudentResponse(BaseModel):
    id: str
    institution_id: str
    full_name: str
    document_type: str
    document_number: str
    document_place: Optional[str] = None
    address: Optional[str] = None
    neighborhood: Optional[str] = None
    commune: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_minor: bool
    guardian_name: Optional[str] = None
    guardian_document: Optional[str] = None
    guardian_address: Optional[str] = None
    guardian_phone: Optional[str] = None
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True}


# --- Enrollment ---
class EnrollmentCreate(BaseModel):
    student_id: str
    program_id: str
    enrollment_number: Optional[str] = None
    folio: Optional[str] = None
    certificate_type: Optional[str] = None
    year: Optional[str] = None


class EnrollmentUpdate(BaseModel):
    enrollment_number: Optional[str] = None
    folio: Optional[str] = None
    certificate_type: Optional[str] = None
    year: Optional[str] = None


class EnrollmentResponse(BaseModel):
    id: str
    institution_id: str
    student_id: str
    program_id: str
    enrollment_number: Optional[str] = None
    folio: Optional[str] = None
    certificate_type: Optional[str] = None
    year: Optional[str] = None
    is_active: bool
    created_at: datetime
    student: StudentResponse
    program: ProgramResponse
    model_config = {"from_attributes": True}

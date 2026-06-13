from pydantic import BaseModel
from typing import Optional
from datetime import datetime


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

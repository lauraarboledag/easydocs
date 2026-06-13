from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
import io
import openpyxl
from app.database import get_db
from app.core.auth import get_current_user
from app.domains.users.models import User
from app.domains.students.schemas import (
    ProgramCreate,
    ProgramResponse,
    StudentCreate,
    StudentResponse,
    EnrollmentCreate,
    EnrollmentResponse,
)
from app.domains.students.services import (
    get_programs,
    create_program,
    update_program,
    delete_program,
    get_students,
    get_student,
    create_student,
    update_student,
    delete_student,
    get_enrollments,
    create_enrollment,
    delete_enrollment,
)

router = APIRouter(tags=["Students"])


# --- Programs ---
@router.get("/programs/", response_model=list[ProgramResponse])
def list_programs(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return get_programs(db, current_user.institution_id)


@router.post("/programs/", response_model=ProgramResponse, status_code=201)
def add_program(
    data: ProgramCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_program(db, data, current_user.institution_id)


@router.put("/programs/{program_id}", response_model=ProgramResponse)
def edit_program(
    program_id: str,
    data: ProgramCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_program(db, program_id, data, current_user.institution_id)


@router.delete("/programs/{program_id}", status_code=204)
def remove_program(
    program_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    delete_program(db, program_id, current_user.institution_id)


# --- Students ---
@router.get("/students/", response_model=list[StudentResponse])
def list_students(
    program_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_students(db, current_user.institution_id, program_id)


@router.get("/students/{student_id}", response_model=StudentResponse)
def get_student_by_id(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_student(db, student_id, current_user.institution_id)


@router.post("/students/", response_model=StudentResponse, status_code=201)
def add_student(
    data: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_student(db, data, current_user.institution_id)


@router.put("/students/{student_id}", response_model=StudentResponse)
def edit_student(
    student_id: str,
    data: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_student(db, student_id, data, current_user.institution_id)


@router.delete("/students/{student_id}", status_code=204)
def remove_student(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    delete_student(db, student_id, current_user.institution_id)


# --- Enrollments ---
@router.get("/enrollments/", response_model=list[EnrollmentResponse])
def list_enrollments(
    program_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_enrollments(db, current_user.institution_id, program_id)


@router.post("/enrollments/", response_model=EnrollmentResponse, status_code=201)
def add_enrollment(
    data: EnrollmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_enrollment(db, data, current_user.institution_id)


@router.delete("/enrollments/{enrollment_id}", status_code=204)
def remove_enrollment(
    enrollment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    delete_enrollment(db, enrollment_id, current_user.institution_id)


# --- Exportación xlsx ---
@router.get("/enrollments/export/xlsx")
def export_enrollments_xlsx(
    program_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    enrollments = get_enrollments(db, current_user.institution_id, program_id)

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Estudiantes"

    headers = [
        "N° Matrícula",
        "Folio",
        "Nombre completo",
        "Tipo documento",
        "N° Documento",
        "Lugar expedición",
        "Dirección",
        "Barrio",
        "Comuna",
        "Teléfono",
        "Email",
        "Programa",
        "Tipo certificado",
        "Año",
    ]
    ws.append(headers)

    for e in enrollments:
        ws.append(
            [
                e.enrollment_number or "",
                e.folio or "",
                e.student.full_name,
                e.student.document_type,
                e.student.document_number,
                e.student.document_place or "",
                e.student.address or "",
                e.student.neighborhood or "",
                e.student.commune or "",
                e.student.phone or "",
                e.student.email or "",
                e.program.name,
                e.certificate_type or "",
                e.year or "",
            ]
        )

    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)

    filename = f"estudiantes_{program_id or 'todos'}.xlsx"
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )

from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException
from app.domains.students.models import Program, Student, Enrollment
from app.domains.students.schemas import ProgramCreate, StudentCreate, EnrollmentCreate


# --- Programs ---
def get_programs(db: Session, institution_id: str):
    return (
        db.execute(
            select(Program).where(
                Program.institution_id == institution_id, Program.is_active == True
            )
        )
        .scalars()
        .all()
    )


def create_program(db: Session, data: ProgramCreate, institution_id: str):
    program = Program(**data.model_dump(), institution_id=institution_id)
    db.add(program)
    db.commit()
    db.refresh(program)
    return program


def update_program(
    db: Session, program_id: str, data: ProgramCreate, institution_id: str
):
    program = db.execute(
        select(Program).where(
            Program.id == program_id, Program.institution_id == institution_id
        )
    ).scalar_one_or_none()
    if not program:
        raise HTTPException(status_code=404, detail="Programa no encontrado.")
    for key, value in data.model_dump().items():
        setattr(program, key, value)
    db.commit()
    db.refresh(program)
    return program


def delete_program(db: Session, program_id: str, institution_id: str):
    program = db.execute(
        select(Program).where(
            Program.id == program_id, Program.institution_id == institution_id
        )
    ).scalar_one_or_none()
    if not program:
        raise HTTPException(status_code=404, detail="Programa no encontrado.")
    program.is_active = False
    db.commit()


# --- Students ---
def get_students(db: Session, institution_id: str, program_id: str = None):
    query = select(Student).where(
        Student.institution_id == institution_id, Student.is_active == True
    )
    if program_id:
        query = query.join(Enrollment).where(Enrollment.program_id == program_id)
    return db.execute(query).scalars().all()


def get_student(db: Session, student_id: str, institution_id: str):
    student = db.execute(
        select(Student).where(
            Student.id == student_id, Student.institution_id == institution_id
        )
    ).scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado.")
    return student


def create_student(db: Session, data: StudentCreate, institution_id: str):
    student = Student(**data.model_dump(), institution_id=institution_id)
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


def update_student(
    db: Session, student_id: str, data: StudentCreate, institution_id: str
):
    student = get_student(db, student_id, institution_id)
    for key, value in data.model_dump().items():
        setattr(student, key, value)
    db.commit()
    db.refresh(student)
    return student


def delete_student(db: Session, student_id: str, institution_id: str):
    student = get_student(db, student_id, institution_id)
    student.is_active = False
    db.commit()


# --- Enrollments ---
def get_enrollments(db: Session, institution_id: str, program_id: str = None):
    query = select(Enrollment).where(
        Enrollment.institution_id == institution_id, Enrollment.is_active == True
    )
    if program_id:
        query = query.where(Enrollment.program_id == program_id)
    return db.execute(query).scalars().all()


def create_enrollment(db: Session, data: EnrollmentCreate, institution_id: str):
    existing = db.execute(
        select(Enrollment).where(
            Enrollment.student_id == data.student_id,
            Enrollment.program_id == data.program_id,
            Enrollment.is_active == True,
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="El estudiante ya está matriculado en este programa.",
        )
    enrollment = Enrollment(**data.model_dump(), institution_id=institution_id)
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return db.execute(
        select(Enrollment).where(Enrollment.id == enrollment.id)
    ).scalar_one()


def delete_enrollment(db: Session, enrollment_id: str, institution_id: str):
    enrollment = db.execute(
        select(Enrollment).where(
            Enrollment.id == enrollment_id, Enrollment.institution_id == institution_id
        )
    ).scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Matrícula no encontrada.")
    enrollment.is_active = False
    db.commit()

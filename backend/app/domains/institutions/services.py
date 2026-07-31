from sqlalchemy.orm import Session
from sqlalchemy import select
from app.domains.institutions.models import Institution
from app.domains.institutions.schemas import InstitutionCreate
from fastapi import HTTPException


def create_institution(db: Session, data: InstitutionCreate) -> Institution:
    existing = db.execute(
        select(Institution).where(Institution.dane_code == data.dane_code)
    ).scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Ya existe una institución registrada con ese código DANE.",
        )

    institution = Institution(**data.model_dump())
    db.add(institution)
    db.commit()
    db.refresh(institution)
    return institution


def get_institution(db: Session, institution_id: str) -> Institution:
    institution = db.execute(
        select(Institution).where(Institution.id == institution_id)
    ).scalar_one_or_none()

    if not institution:
        raise HTTPException(status_code=404, detail="Institución no encontrada.")

    return institution


def list_institutions(db: Session) -> list[Institution]:
    return db.execute(select(Institution)).scalars().all()


def update_institution(
    db: Session, institution_id: str, data: InstitutionCreate
) -> Institution:
    institution = get_institution(db, institution_id)
    if not institution:
        raise HTTPException(status_code=404, detail="Institución no encontrada.")
    for key, value in data.model_dump().items():
        setattr(institution, key, value)
    db.commit()
    db.refresh(institution)
    return institution

def delete_institution(db: Session, institution_id: str) -> None:
    """Elimina una institución y todos sus datos relacionados en cascada."""
    from app.domains.users.models import (
        User, RefreshToken, PasswordResetToken, TwoFactorCode, KnownDevice, LoginAttempt
    )
    from app.domains.documents.models import Document
    from app.domains.students.models import Program, Student, Enrollment
    from app.domains.subscriptions.models import Subscription, Transaction
    from app.domains.calendar.models import CalendarEvent
    from sqlalchemy import delete

    institution = get_institution(db, institution_id)

    # Usuarios de la institución — limpiar sus dependencias primero
    users = db.execute(
        select(User).where(User.institution_id == institution_id)
    ).scalars().all()

    for user in users:
        db.execute(delete(RefreshToken).where(RefreshToken.user_id == user.id))
        db.execute(delete(PasswordResetToken).where(PasswordResetToken.user_id == user.id))
        db.execute(delete(TwoFactorCode).where(TwoFactorCode.user_id == user.id))
        db.execute(delete(KnownDevice).where(KnownDevice.user_id == user.id))
        db.execute(delete(LoginAttempt).where(LoginAttempt.email == user.email))
        db.execute(delete(CalendarEvent).where(CalendarEvent.created_by == user.id))

    # Datos de la institución
    db.execute(delete(Document).where(Document.institution_id == institution_id))
    db.execute(delete(Enrollment).where(Enrollment.institution_id == institution_id))
    db.execute(delete(Student).where(Student.institution_id == institution_id))
    db.execute(delete(Program).where(Program.institution_id == institution_id))
    db.execute(delete(CalendarEvent).where(CalendarEvent.institution_id == institution_id))

    sub_ids = db.execute(
        select(Subscription.id).where(Subscription.institution_id == institution_id)
    ).scalars().all()
    if sub_ids:
        db.execute(delete(Transaction).where(Transaction.subscription_id.in_(sub_ids)))
    db.execute(delete(Subscription).where(Subscription.institution_id == institution_id))

    # Usuarios y por último la institución
    db.execute(delete(User).where(User.institution_id == institution_id))
    db.delete(institution)
    db.commit()
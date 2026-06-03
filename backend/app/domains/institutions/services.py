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
            detail="Ya existe una institución registrada con ese código DANE."
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
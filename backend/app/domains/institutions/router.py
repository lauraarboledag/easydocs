from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.domains.institutions.services import create_institution, get_institution, list_institutions
from app.domains.institutions.schemas import InstitutionCreate, InstitutionResponse

router = APIRouter(prefix="/institutions", tags=["Instituciones"])

@router.post("/", response_model=InstitutionResponse, status_code=201)
def register_institution(data: InstitutionCreate, db: Session = Depends(get_db)):
    return create_institution(db, data)

@router.get("/", response_model=list[InstitutionResponse])
def get_institutions(db: Session = Depends(get_db)):
    return list_institutions(db)

@router.get("/{institution_id}", response_model=InstitutionResponse)
def get_institution_by_id(institution_id: str, db: Session = Depends(get_db)):
    return get_institution(db, institution_id)
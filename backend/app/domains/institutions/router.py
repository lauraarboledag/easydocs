from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.auth import get_current_user
from app.domains.users.models import User
from app.domains.institutions.schemas import InstitutionCreate, InstitutionResponse
from app.domains.institutions.services import (
    get_institution,
    update_institution,
    list_institutions,
)
import base64

router = APIRouter(prefix="/institutions", tags=["Instituciones"])


@router.get("/", response_model=list[InstitutionResponse])
def get_institutions(db: Session = Depends(get_db)):
    return list_institutions(db)


@router.put("/my", response_model=InstitutionResponse)
def update_my_institution(
    data: InstitutionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_institution(db, current_user.institution_id, data)


ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/svg+xml"}
MAX_LOGO_BYTES = 2 * 1024 * 1024  # 2MB


@router.post("/my/logo")
async def upload_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Formato no permitido. Usa JPG, PNG, WEBP o SVG.",
        )

    contents = await file.read()

    if len(contents) > MAX_LOGO_BYTES:
        raise HTTPException(
            status_code=400,
            detail="El logo no puede superar 2MB.",
        )

    logo_base64 = (
        f"data:{file.content_type};base64,{base64.b64encode(contents).decode()}"
    )
    institution = get_institution(db, current_user.institution_id)
    institution.logo_url = logo_base64
    db.commit()
    db.refresh(institution)
    return {"logo_url": institution.logo_url}


@router.get("/{institution_id}", response_model=InstitutionResponse)
def get_institution_by_id(institution_id: str, db: Session = Depends(get_db)):
    return get_institution(db, institution_id)

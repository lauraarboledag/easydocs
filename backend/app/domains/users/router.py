from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.auth import get_current_user
from app.domains.users.schemas import UserCreate, UserResponse, LoginRequest, TokenResponse
from app.domains.users.services import create_user, login, list_users
from app.domains.users.models import User

router = APIRouter(tags=["Usuarios"])

@router.post("/auth/register-superadmin", response_model=UserResponse, status_code=201)
def register_superadmin(data: UserCreate, db: Session = Depends(get_db)):
    """Solo para crear el primer superadmin. Eliminar o proteger en producción."""
    return create_user(db, data)

@router.post("/auth/login", response_model=TokenResponse)
def login_user(data: LoginRequest, db: Session = Depends(get_db)):
    return login(db, data.email, data.password)

@router.post("/users/", response_model=UserResponse, status_code=201)
def register_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return create_user(db, data)

@router.get("/users/", response_model=list[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return list_users(db, current_user.institution_id)

@router.get("/users/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
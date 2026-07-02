from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from app.database import get_db
from app.core.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)
from app.domains.users.schemas import (
    UserCreate,
    UserResponse,
    LoginRequest,
    TokenResponse,
)
from app.domains.users.services import create_user, login, list_users
from app.domains.users.models import User, UserRole, PasswordResetToken, LoginAttempt
from app.domains.institutions.schemas import InstitutionCreate
from app.domains.institutions.services import create_institution
from app.core.email import send_password_reset_email, send_welcome_email
from app.config import settings

router = APIRouter(tags=["Usuarios"])
limiter = Limiter(key_func=get_remote_address)


class RegisterInstitutionRequest(BaseModel):
    institution: InstitutionCreate
    representative_name: str
    representative_email: EmailStr
    representative_password: str


@router.post("/auth/register", response_model=TokenResponse, status_code=201)
@limiter.limit("3/hour")
def register_institution_and_representative(
    request: Request, data: RegisterInstitutionRequest, db: Session = Depends(get_db)
):
    """Registro público — crea institución y representante en un solo paso."""
    institution = create_institution(db, data.institution)
    user_data = UserCreate(
        email=data.representative_email,
        password=data.representative_password,
        full_name=data.representative_name,
        role=UserRole.representative,
        institution_id=institution.id,
    )
    user = create_user(db, user_data)

    try:
        send_welcome_email(
            to_email="nightshadelust1876@gmail.com",  # Temporal hasta verificar dominio
            full_name=user.full_name,
            institution_name=institution.name,
        )
    except Exception as e:
        print(f"[LAU-22] Error enviando email de bienvenida: {e}")

    token = create_access_token({"sub": user.id, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/users/", response_model=UserResponse, status_code=201)
def register_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_user(db, data)


@router.get("/users/", response_model=list[UserResponse])
def get_users(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return list_users(db, current_user.institution_id)


@router.get("/users/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@router.post("/auth/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.execute(select(User).where(User.email == data.email)).scalar_one_or_none()

    if not user:
        return {"message": "Si el correo existe, recibirás un enlace de recuperación."}

    old_tokens = (
        db.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.user_id == user.id,
                PasswordResetToken.used == False,
            )
        )
        .scalars()
        .all()
    )
    for t in old_tokens:
        t.used = True
    db.commit()

    reset_token = PasswordResetToken(user_id=user.id)
    db.add(reset_token)
    db.commit()
    db.refresh(reset_token)

    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token.token}"
    send_password_reset_email(user.email, reset_url, user.full_name)

    return {"message": "Si el correo existe, recibirás un enlace de recuperación."}


@router.post("/auth/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    reset_token = db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.token == data.token,
            PasswordResetToken.used == False,
            PasswordResetToken.expires_at > datetime.utcnow(),
        )
    ).scalar_one_or_none()

    if not reset_token:
        raise HTTPException(
            status_code=400, detail="El enlace es inválido o ha expirado."
        )

    user = db.execute(select(User).where(User.id == reset_token.user_id)).scalar_one()
    user.password_hash = hash_password(data.new_password)
    reset_token.used = True
    db.commit()

    return {"message": "Contraseña actualizada exitosamente."}


MAX_ATTEMPTS = 3
BLOCK_MINUTES = 20


@router.post("/auth/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login_user(request: Request, data: LoginRequest, db: Session = Depends(get_db)):
    ip = request.client.host
    since = datetime.utcnow() - timedelta(minutes=BLOCK_MINUTES)

    # Bloqueo solo por email, temporalmente hasta despliegue
    failed_attempts = (
        db.execute(
            select(LoginAttempt).where(
                LoginAttempt.email == data.email,
                LoginAttempt.success == False,
                LoginAttempt.created_at >= since,
            )
        )
        .scalars()
        .all()
    )

    if len(failed_attempts) >= MAX_ATTEMPTS:
        oldest = min(a.created_at for a in failed_attempts)
        unlock_at = oldest + timedelta(minutes=BLOCK_MINUTES)
        remaining = int((unlock_at - datetime.utcnow()).total_seconds() / 60) + 1
        raise HTTPException(
            status_code=429,
            detail={
                "message": "Cuenta bloqueada por demasiados intentos fallidos.",
                "blocked": True,
                "remaining_minutes": remaining,
                "unlock_at": unlock_at.isoformat(),
            },
        )

    try:
        result = login(db, data.email, data.password)
        for attempt in failed_attempts:
            db.delete(attempt)
        db.add(LoginAttempt(email=data.email, ip_address=ip, success=True))
        db.commit()
        return result
    except HTTPException:
        db.add(LoginAttempt(email=data.email, ip_address=ip, success=False))
        db.commit()
        attempts_left = MAX_ATTEMPTS - len(failed_attempts) - 1
        if attempts_left > 0:
            raise HTTPException(
                status_code=401,
                detail={
                    "message": "Contraseña incorrecta.",
                    "blocked": False,
                    "attempts_left": attempts_left,
                },
            )
        else:
            raise HTTPException(
                status_code=429,
                detail={
                    "message": "Cuenta bloqueada por demasiados intentos fallidos.",
                    "blocked": True,
                    "remaining_minutes": BLOCK_MINUTES,
                    "unlock_at": (
                        datetime.utcnow() + timedelta(minutes=BLOCK_MINUTES)
                    ).isoformat(),
                },
            )

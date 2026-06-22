from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.database import get_db
from app.core.auth import get_current_user
from app.domains.users.schemas import (
    UserCreate,
    UserResponse,
    LoginRequest,
    TokenResponse,
)
from app.core.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)
from app.domains.users.services import create_user, login, list_users
from app.domains.users.models import User, UserRole
from app.domains.institutions.schemas import InstitutionCreate
from app.domains.institutions.services import create_institution
from pydantic import BaseModel, EmailStr
from app.domains.users.models import User
from app.domains.users.models import PasswordResetToken
from app.core.email import send_password_reset_email
from datetime import datetime, timedelta
from app.domains.users.models import LoginAttempt

router = APIRouter(tags=["Usuarios"])


class RegisterInstitutionRequest(BaseModel):
    institution: InstitutionCreate
    representative_name: str
    representative_email: EmailStr
    representative_password: str


@router.post("/auth/register-superadmin", response_model=UserResponse, status_code=201)
def register_superadmin(data: UserCreate, db: Session = Depends(get_db)):
    """Solo para crear el primer superadmin. Eliminar o proteger en producción."""
    return create_user(db, data)


@router.post("/auth/register", response_model=TokenResponse, status_code=201)
def register_institution_and_representative(
    data: RegisterInstitutionRequest, db: Session = Depends(get_db)
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

    # Generar token directamente sin pasar por login
    token = create_access_token({"sub": user.id, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}


limiter = Limiter(key_func=get_remote_address)


@router.post("/auth/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login_user(request: Request, data: LoginRequest, db: Session = Depends(get_db)):
    return login(db, data.email, data.password)


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
    # Buscar usuario por email
    user = db.execute(select(User).where(User.email == data.email)).scalar_one_or_none()

    # Siempre devolver 200 aunque no exista el email (seguridad)
    if not user:
        return {"message": "Si el correo existe, recibirás un enlace de recuperación."}

    # Invalidar tokens anteriores
    old_tokens = (
        db.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.user_id == user.id, PasswordResetToken.used == False
            )
        )
        .scalars()
        .all()
    )
    for t in old_tokens:
        t.used = True
    db.commit()

    # Crear nuevo token
    reset_token = PasswordResetToken(user_id=user.id)
    db.add(reset_token)
    db.commit()
    db.refresh(reset_token)

    # Enviar email
    reset_url = f"http://localhost:5173/reset-password?token={reset_token.token}"
    send_password_reset_email(user.email, reset_url, user.full_name)

    return {"message": "Si el correo existe, recibirás un enlace de recuperación."}


@router.post("/auth/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    # Buscar token válido
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

    # Actualizar contraseña
    user = db.execute(select(User).where(User.id == reset_token.user_id)).scalar_one()

    from app.core.auth import hash_password

    user.password_hash = hash_password(data.new_password)

    # Invalidar token
    reset_token.used = True
    db.commit()

    return {"message": "Contraseña actualizada exitosamente."}


MAX_ATTEMPTS = 3
BLOCK_MINUTES = 20


@router.post("/auth/login", response_model=TokenResponse)
def login_user(request: Request, data: LoginRequest, db: Session = Depends(get_db)):
    ip = request.client.host

    # Verificar intentos fallidos en los últimos 20 minutos
    since = datetime.utcnow() - timedelta(minutes=BLOCK_MINUTES)
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
        # Calcular tiempo restante
        oldest = min(a.created_at for a in failed_attempts)
        unlock_at = oldest + timedelta(minutes=BLOCK_MINUTES)
        remaining = int((unlock_at - datetime.utcnow()).total_seconds() / 60) + 1
        raise HTTPException(
            status_code=429,
            detail={
                "message": f"Cuenta bloqueada por demasiados intentos fallidos.",
                "blocked": True,
                "remaining_minutes": remaining,
                "unlock_at": unlock_at.isoformat(),
            },
        )

    try:
        result = login(db, data.email, data.password)
        # Login exitoso — limpiar intentos fallidos
        for attempt in failed_attempts:
            db.delete(attempt)
        db.add(LoginAttempt(email=data.email, ip_address=ip, success=True))
        db.commit()
        return result
    except HTTPException:
        # Login fallido — registrar intento
        db.add(LoginAttempt(email=data.email, ip_address=ip, success=False))
        db.commit()
        attempts_left = MAX_ATTEMPTS - len(failed_attempts) - 1
        if attempts_left > 0:
            raise HTTPException(
                status_code=401,
                detail={
                    "message": f"Contraseña incorrecta.",
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

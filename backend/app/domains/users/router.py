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
    create_refresh_token,
    rotate_refresh_token,
    get_current_user,
)
from app.domains.users.schemas import (
    UserCreate,
    UserResponse,
    LoginRequest,
    TokenResponse,
)
from app.domains.users.services import (
    create_user,
    verify_credentials,
    send_2fa_code,
    verify_2fa_code,
    block_account_by_token,
    revoke_refresh_token,
    request_email_change,
    confirm_email_change,
    list_users,
)
from app.domains.users.models import User, UserRole, PasswordResetToken, LoginAttempt
from app.domains.institutions.schemas import InstitutionCreate
from app.domains.institutions.services import create_institution
from app.domains.notifications.services import create_notification
from app.core.email import send_password_reset_email, send_welcome_email
from app.config import settings
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from app.core.captcha import verify_hcaptcha

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
    try:
        superadmins = db.execute(select(User).where(User.role == UserRole.superadmin)).scalars().all()
        for admin in superadmins:
            create_notification(
                db,
                title="Nueva institución registrada",
                message=f"{institution.name} se registró en EasyDocs.",
                user_id=admin.id,
            )
    except Exception as e:
        print(f"Error creando notificación de nuevo registro: {e}")
    user = create_user(db, user_data)

    try:
        send_welcome_email(
            to_email=user.email,
            full_name=user.full_name,
            institution_name=institution.name,
        )
    except Exception as e:
        print(f"Error enviando email de bienvenida: {e}")

    token = create_access_token({"sub": user.id, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}


class GoogleAuthRequest(BaseModel):
    credential: str


class GoogleUserInfo(BaseModel):
    email: str
    full_name: str
    already_exists: bool


@router.post("/auth/google/verify", response_model=GoogleUserInfo)
def verify_google_token(data: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Verifica el token de Google y retorna la info del usuario para prellenar el registro."""
    try:
        idinfo = id_token.verify_oauth2_token(
            data.credential, google_requests.Request(), settings.GOOGLE_CLIENT_ID
        )
    except ValueError:
        raise HTTPException(status_code=401, detail="Token de Google inválido.")

    email = idinfo.get("email")
    full_name = idinfo.get("name", "")

    if not email:
        raise HTTPException(
            status_code=400, detail="No se pudo obtener el correo de Google."
        )

    existing = db.execute(select(User).where(User.email == email)).scalar_one_or_none()

    return GoogleUserInfo(
        email=email,
        full_name=full_name,
        already_exists=existing is not None,
    )


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


class CreateSuperadminRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str

class RequestEmailChangeRequest(BaseModel):
    new_email: EmailStr
    current_password: str


class ConfirmEmailChangeRequest(BaseModel):
    code: str


@router.patch("/users/me/request-email-change")
def request_email_change_endpoint(
    data: RequestEmailChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    request_email_change(db, current_user, data.new_email, data.current_password)
    return {"message": "Te enviamos un código de verificación a tu nuevo correo."}


@router.patch("/users/me/confirm-email-change", response_model=UserResponse)
def confirm_email_change_endpoint(
    data: ConfirmEmailChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return confirm_email_change(db, current_user, data.code)


@router.post("/admin/superadmin", response_model=UserResponse, status_code=201)
def create_superadmin(
    data: CreateSuperadminRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.superadmin:
        raise HTTPException(
            status_code=403, detail="Solo superadmins pueden crear otros superadmins."
        )
    user_data = UserCreate(
        email=data.email,
        password=data.password,
        full_name=data.full_name,
        role=UserRole.superadmin,
    )
    return create_user(db, user_data)


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


class VerifyCodeRequest(BaseModel):
    user_id: str
    code: str


@router.post("/auth/login")
@limiter.limit("5/minute")
async def login_user(
    request: Request, data: LoginRequest, db: Session = Depends(get_db)
):
    ip = request.client.host
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
    # Exigir captcha después del primer intento fallido
    if len(failed_attempts) >= 1:
        if not data.captcha_token:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Verificación de seguridad requerida.",
                    "requires_captcha": True,
                },
            )
        captcha_valid = await verify_hcaptcha(data.captcha_token)
        if not captcha_valid:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Verificación de seguridad fallida. Intenta de nuevo.",
                    "requires_captcha": True,
                },
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
        user = verify_credentials(db, data.email, data.password)
        for attempt in failed_attempts:
            db.delete(attempt)
        db.add(LoginAttempt(email=data.email, ip_address=ip, success=True))
        db.commit()

        # Credenciales correctas — enviar código 2FA en lugar de token
        send_2fa_code(db, user)
        return {
            "requires_2fa": True,
            "user_id": user.id,
            "message": "Te enviamos un código de verificación a tu correo.",
        }
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


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/auth/refresh")
@limiter.limit("30/minute")
def refresh_access_token(
    request: Request, data: RefreshRequest, db: Session = Depends(get_db)
):
    result = rotate_refresh_token(db, data.refresh_token)
    if not result:
        raise HTTPException(
            status_code=401, detail="Refresh token inválido o expirado."
        )
    new_access_token, new_refresh_token = result
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
    }

@router.post("/auth/logout")
def logout(data: RefreshRequest, db: Session = Depends(get_db)):
    revoke_refresh_token(db, data.refresh_token)
    return {"message": "Sesión cerrada correctamente."}

@router.post("/auth/verify-2fa", response_model=TokenResponse)
@limiter.limit("10/minute")
def verify_2fa(
    request: Request, data: VerifyCodeRequest, db: Session = Depends(get_db)
):
    ip_address = request.client.host
    user_agent = request.headers.get("user-agent", "Desconocido")
    return verify_2fa_code(db, data.user_id, data.code, ip_address, user_agent)


@router.post("/auth/resend-2fa")
@limiter.limit("3/minute")
def resend_2fa(
    request: Request, data: VerifyCodeRequest, db: Session = Depends(get_db)
):
    user = db.execute(select(User).where(User.id == data.user_id)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    send_2fa_code(db, user)
    return {"message": "Código reenviado."}


class BlockAccountRequest(BaseModel):
    token: str


@router.post("/auth/block-account")
def block_account(data: BlockAccountRequest, db: Session = Depends(get_db)):
    return block_account_by_token(db, data.token)

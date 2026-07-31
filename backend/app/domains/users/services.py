from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException
from datetime import datetime
import secrets
from app.domains.users.models import User, TwoFactorCode, KnownDevice
from app.domains.users.schemas import UserCreate
from app.core.auth import hash_password, verify_password, create_access_token
from app.core.email import send_2fa_code_email, send_new_device_email
from app.config import settings


def create_user(db: Session, data: UserCreate) -> User:
    existing = db.execute(
        select(User).where(User.email == data.email)
    ).scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=400, detail="Ya existe un usuario registrado con ese correo."
        )

    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        role=data.role,
        institution_id=data.institution_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def verify_credentials(db: Session, email: str, password: str) -> User:
    """Valida email y contraseña, sin generar el token todavía."""
    user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()

    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos.")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Usuario inactivo.")

    return user


def send_2fa_code(db: Session, user: User):
    """Genera un código de 6 dígitos, lo guarda y lo envía por correo."""
    # Invalidar códigos anteriores sin usar
    old_codes = (
        db.execute(
            select(TwoFactorCode).where(
                TwoFactorCode.user_id == user.id,
                TwoFactorCode.used == False,
            )
        )
        .scalars()
        .all()
    )
    for c in old_codes:
        c.used = True
    db.commit()

    code = f"{secrets.randbelow(1000000):06d}"
    two_factor = TwoFactorCode(user_id=user.id, code=code)
    db.add(two_factor)
    db.commit()

    send_2fa_code_email(user.email, code, user.full_name)


def verify_2fa_code(
    db: Session, user_id: str, code: str, ip_address: str = None, user_agent: str = None
):
    """Verifica el código 2FA y retorna access + refresh token si es válido."""
    from app.core.auth import create_refresh_token

    two_factor = db.execute(
        select(TwoFactorCode).where(
            TwoFactorCode.user_id == user_id,
            TwoFactorCode.code == code,
            TwoFactorCode.used == False,
            TwoFactorCode.expires_at > datetime.utcnow(),
        )
    ).scalar_one_or_none()

    if not two_factor:
        raise HTTPException(status_code=401, detail="Código inválido o expirado.")

    two_factor.used = True
    db.commit()

    user = db.execute(select(User).where(User.id == user_id)).scalar_one()

    if ip_address or user_agent:
        check_and_register_device(db, user, ip_address, user_agent)

    token = create_access_token({"sub": user.id, "role": user.role})
    refresh_token = create_refresh_token(db, user.id)
    return {
        "access_token": token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user,
    }


def list_users(db: Session, institution_id: str) -> list[User]:
    return (
        db.execute(select(User).where(User.institution_id == institution_id))
        .scalars()
        .all()
    )


def check_and_register_device(
    db: Session, user: User, ip_address: str, user_agent: str
):
    """Verifica si el dispositivo es conocido. Si no, lo registra y envía alerta."""
    existing = db.execute(
        select(KnownDevice).where(
            KnownDevice.user_id == user.id,
            KnownDevice.ip_address == ip_address,
            KnownDevice.user_agent == user_agent,
        )
    ).scalar_one_or_none()

    if existing:
        existing.last_seen_at = datetime.utcnow()
        db.commit()
        return

    device = KnownDevice(
        user_id=user.id,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(device)
    db.commit()
    db.refresh(device)

    block_url = f"{settings.FRONTEND_URL}/block-account?token={device.block_token}"
    try:
        send_new_device_email(
            user.email, user.full_name, ip_address, user_agent, block_url
        )
    except Exception as e:
        print(f"Error enviando alerta de nuevo dispositivo: {e}")


def block_account_by_token(db: Session, block_token: str):
    """Bloquea la cuenta del usuario usando el token del email de alerta."""
    device = db.execute(
        select(KnownDevice).where(KnownDevice.block_token == block_token)
    ).scalar_one_or_none()

    if not device:
        raise HTTPException(status_code=404, detail="Enlace inválido o ya utilizado.")

    user = db.execute(select(User).where(User.id == device.user_id)).scalar_one()
    user.is_active = False
    db.commit()

    return {
        "message": f"La cuenta de {user.full_name} ha sido bloqueada por seguridad."
    }


def revoke_refresh_token(db: Session, refresh_token: str):
    """Revoca un refresh token específico (logout)."""
    from app.domains.users.models import RefreshToken

    stored = db.execute(
        select(RefreshToken).where(RefreshToken.token == refresh_token)
    ).scalar_one_or_none()

    if stored:
        stored.revoked = True
        db.commit()


def request_email_change(
    db: Session, user: User, new_email: str, current_password: str
):
    """Valida contraseña, verifica que el nuevo email no esté en uso, y envía código."""
    from app.domains.users.models import EmailChangeRequest
    from app.core.email import send_email_change_code
    import secrets as secrets_module

    if not verify_password(current_password, user.password_hash):
        raise HTTPException(status_code=401, detail="Contraseña incorrecta.")

    existing = db.execute(
        select(User).where(User.email == new_email)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=400, detail="Ese correo ya está en uso por otra cuenta."
        )

    # Invalidar solicitudes anteriores sin usar
    old_requests = (
        db.execute(
            select(EmailChangeRequest).where(
                EmailChangeRequest.user_id == user.id,
                EmailChangeRequest.used == False,
            )
        )
        .scalars()
        .all()
    )
    for r in old_requests:
        r.used = True
    db.commit()

    code = f"{secrets_module.randbelow(1000000):06d}"
    request = EmailChangeRequest(user_id=user.id, new_email=new_email, code=code)
    db.add(request)
    db.commit()

    send_email_change_code(new_email, code, user.full_name)


def confirm_email_change(db: Session, user: User, code: str):
    """Verifica el código y actualiza el email del usuario."""
    from app.domains.users.models import EmailChangeRequest, RefreshToken
    from app.core.email import send_email_changed_notice
    from sqlalchemy import delete

    request = db.execute(
        select(EmailChangeRequest).where(
            EmailChangeRequest.user_id == user.id,
            EmailChangeRequest.code == code,
            EmailChangeRequest.used == False,
            EmailChangeRequest.expires_at > datetime.utcnow(),
        )
    ).scalar_one_or_none()

    if not request:
        raise HTTPException(status_code=401, detail="Código inválido o expirado.")

    old_email = user.email
    request.used = True
    user.email = request.new_email
    db.commit()

    # Invalidar todas las sesiones activas por seguridad
    db.execute(delete(RefreshToken).where(RefreshToken.user_id == user.id))
    db.commit()

    try:
        send_email_changed_notice(old_email, user.full_name, user.email)
    except Exception as e:
        print(f"Error enviando notificación de cambio de correo: {e}")

    return user

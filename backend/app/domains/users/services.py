from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException
from datetime import datetime
import secrets
from app.domains.users.models import User, TwoFactorCode
from app.domains.users.schemas import UserCreate
from app.core.auth import hash_password, verify_password, create_access_token
from app.core.email import send_2fa_code_email


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


def verify_2fa_code(db: Session, user_id: str, code: str):
    """Verifica el código 2FA y retorna el token si es válido."""
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
    token = create_access_token({"sub": user.id, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}


def list_users(db: Session, institution_id: str) -> list[User]:
    return (
        db.execute(select(User).where(User.institution_id == institution_id))
        .scalars()
        .all()
    )

from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException
from app.domains.users.models import User
from app.domains.users.schemas import UserCreate
from app.core.auth import hash_password, verify_password, create_access_token

def create_user(db: Session, data: UserCreate) -> User:
    existing = db.execute(
        select(User).where(User.email == data.email)
    ).scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Ya existe un usuario registrado con ese correo."
        )

    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        role=data.role,
        institution_id=data.institution_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def login(db: Session, email: str, password: str):
    user = db.execute(
        select(User).where(User.email == email)
    ).scalar_one_or_none()

    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Correo o contraseña incorrectos."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Usuario inactivo."
        )

    token = create_access_token({"sub": user.id, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}

def list_users(db: Session, institution_id: str) -> list[User]:
    return db.execute(
        select(User).where(User.institution_id == institution_id)
    ).scalars().all()
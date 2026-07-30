from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.config import settings
from app.database import get_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

oauth2_scheme = HTTPBearer()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(db: Session, user_id: str) -> str:
    """Crea y guarda un refresh token nuevo para el usuario, válido 7 días."""
    from app.domains.users.models import RefreshToken

    refresh = RefreshToken(user_id=user_id)
    db.add(refresh)
    db.commit()
    db.refresh(refresh)
    return refresh.token


def rotate_refresh_token(db: Session, old_token: str) -> tuple[str, str] | None:
    """
    Valida un refresh token, lo revoca, y genera uno nuevo (rotación).
    Retorna (new_access_token, new_refresh_token) o None si es inválido.
    """
    from app.domains.users.models import RefreshToken, User

    stored = db.execute(
        select(RefreshToken).where(
            RefreshToken.token == old_token,
            RefreshToken.revoked == False,
            RefreshToken.expires_at > datetime.utcnow(),
        )
    ).scalar_one_or_none()

    if not stored:
        return None

    user = db.execute(
        select(User).where(User.id == stored.user_id)
    ).scalar_one_or_none()
    if not user or not user.is_active:
        return None

    # Revocar el token usado (rotación) y crear uno nuevo con ventana completa de 7 días
    stored.revoked = True
    db.commit()

    new_access_token = create_access_token({"sub": user.id, "role": user.role})
    new_refresh_token = create_refresh_token(db, user.id)

    return new_access_token, new_refresh_token


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    from app.domains.users.models import User

    token = credentials.credentials

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()

    if user is None or not user.is_active:
        raise credentials_exception

    return user

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.domains.users.models import UserRole

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole
    institution_id: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: UserRole
    institution_id: Optional[str]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    captcha_token: Optional[str] = None
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    user: UserResponse
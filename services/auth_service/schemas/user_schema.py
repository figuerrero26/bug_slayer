from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    birth_date: Optional[date] = None
    phone: str
    country_city: str
    acepta_tratamiento_datos: bool


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    email: str


class PasswordChange(BaseModel):
    user_id: int
    current_password: str
    new_password: str


# ── Flujo de recuperación de contraseña ───────────────────────────────────────

class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetVerify(BaseModel):
    email: EmailStr
    otp_code: str


class PasswordResetConfirm(BaseModel):
    reset_token: str
    new_password: str


class PasswordResetTokenResponse(BaseModel):
    reset_token: str
    message: str


class MessageResponse(BaseModel):
    message: str


# ── Flujo 2FA ─────────────────────────────────────────────────────────────────

class TwoFactorRequired(BaseModel):
    status: str   # siempre "2fa_required"
    user_id: int


class TwoFactorVerify(BaseModel):
    user_id: int
    code: str

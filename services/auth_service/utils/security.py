from passlib.context import CryptContext
from jose import jwt, JWTError
from fastapi import HTTPException
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("JWT_SECRET", "cambia-esta-clave-en-produccion")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_token(user_id: int, email: str) -> str:
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": datetime.utcnow() + timedelta(minutes=EXPIRE_MINUTES),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ── Tokens de un solo uso para recuperación de contraseña ────────────────────

RESET_TOKEN_EXPIRE_MINUTES = 15


def create_reset_token(email: str) -> str:
    """JWT de corta duración (15 min) que solo autoriza el cambio de contraseña."""
    payload = {
        "sub":     email,
        "purpose": "password_reset",
        "exp":     datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_reset_token(token: str) -> str:
    """
    Valida el token de reset y retorna el email del usuario.
    Lanza HTTPException 401 si el token es inválido, expiró o no es de tipo reset.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Token de recuperación expirado o inválido")

    if payload.get("purpose") != "password_reset":
        raise HTTPException(status_code=401, detail="Token de recuperación inválido")

    email: str | None = payload.get("sub")
    if not email:
        raise HTTPException(status_code=401, detail="Token de recuperación inválido")

    return email

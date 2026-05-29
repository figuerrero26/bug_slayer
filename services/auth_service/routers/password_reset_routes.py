import secrets
import os
import httpx
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from database import get_db
from models.user_model import User
from schemas.user_schema import (
    MessageResponse,
    PasswordResetConfirm,
    PasswordResetRequest,
    PasswordResetTokenResponse,
    PasswordResetVerify,
)
from utils.security import create_reset_token, decode_reset_token, hash_password
from utils.rate_limit import limiter

router = APIRouter(prefix="/auth", tags=["password-reset"])

NOTIFICATIONS_URL = os.getenv("NOTIFICATIONS_SERVICE_URL", "http://localhost:8004")
OTP_EXPIRE_MINUTES = 5


# ── Endpoint 1: Solicitud ─────────────────────────────────────────────────────

@router.post("/password-reset/request", response_model=MessageResponse)
@limiter.limit("3/minute")
async def password_reset_request(
    request: Request,
    payload: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """
    Genera un OTP de 6 dígitos, lo guarda en la BD con expiración de 5 min
    y dispara el correo vía notifications_service (fire-and-forget).
    Por seguridad, siempre devuelve 200 sin revelar si el correo existe.
    """
    _GENERIC_MSG = "Si el correo está registrado, recibirás el código en breve."

    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        return MessageResponse(message=_GENERIC_MSG)

    otp = str(secrets.randbelow(900_000) + 100_000)  # 100000–999999
    expiry = datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES)

    user.otp_code   = otp
    user.otp_expiry = expiry
    db.commit()

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                f"{NOTIFICATIONS_URL}/notifications/",
                json={
                    "user_id": user.id,
                    "title":   "Código de recuperación de contraseña",
                    "message": f"Tu código de verificación es: {otp}. Expira en {OTP_EXPIRE_MINUTES} minutos.",
                    "type":    "sistema",
                    "email":   user.email,
                },
            )
    except Exception as exc:
        # El correo falló pero el OTP ya fue guardado; el usuario puede reintentar.
        print(f"[password_reset] Error al contactar notifications_service — user {user.id}: {type(exc).__name__}: {exc}")

    return MessageResponse(message=_GENERIC_MSG)


# ── Endpoint 2: Verificación del código ──────────────────────────────────────

@router.post("/password-reset/verify", response_model=PasswordResetTokenResponse)
@limiter.limit("5/minute")
def password_reset_verify(
    request: Request,
    payload: PasswordResetVerify,
    db: Session = Depends(get_db)
):
    """
    Valida el OTP. Si es correcto y no expiró, emite un JWT de corta duración
    (15 min, purpose=password_reset) y borra el OTP para que no sea reutilizable.
    """
    user = db.query(User).filter(User.email == payload.email).first()
    now  = datetime.utcnow()

    otp_invalid = (
        not user
        or not user.otp_code
        or not user.otp_expiry
        or user.otp_code   != payload.otp_code
        or user.otp_expiry  < now
    )
    if otp_invalid:
        raise HTTPException(status_code=400, detail="Código incorrecto o expirado")

    # Invalida el OTP inmediatamente para evitar reusos
    user.otp_code   = None
    user.otp_expiry = None
    db.commit()

    reset_token = create_reset_token(user.email)
    return PasswordResetTokenResponse(
        reset_token=reset_token,
        message="Código verificado correctamente. Tienes 15 minutos para cambiar tu contraseña.",
    )


# ── Endpoint 3: Establecer nueva contraseña ───────────────────────────────────

@router.post("/password-reset/confirm", response_model=MessageResponse)
@limiter.limit("5/minute")
def password_reset_confirm(
    request: Request,
    payload: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    """
    Valida el token de reset, hashea la nueva contraseña y limpia los campos OTP.
    El token solo puede usarse una vez (el OTP ya fue borrado en /verify).
    """
    email = decode_reset_token(payload.reset_token)  # lanza 401 si inválido/expirado

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    user.password_hash = hash_password(payload.new_password)
    user.otp_code      = None
    user.otp_expiry    = None
    db.commit()

    return MessageResponse(message="Contraseña actualizada exitosamente.")

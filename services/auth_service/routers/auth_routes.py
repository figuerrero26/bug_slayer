from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import httpx
import os
import secrets

from database import get_db
from models.user_model import User
from schemas.user_schema import (
    UserRegister, UserLogin, TokenResponse, PasswordChange,
    TwoFactorRequired, TwoFactorVerify,
)
from utils.security import hash_password, verify_password, create_token

router = APIRouter(prefix="/auth", tags=["auth"])

DASHBOARD_URL      = os.getenv("DASHBOARD_SERVICE_URL",      "http://localhost:8002")
NOTIFICATIONS_URL  = os.getenv("NOTIFICATIONS_SERVICE_URL",  "http://localhost:8004")

OTP_EXPIRE_MINUTES = 5
MAX_OTP_ATTEMPTS   = 5


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegister, db: Session = Depends(get_db)):
    """
    Registro doble:
    1. Guarda email + password_hash en db_auth.
    2. Llama al dashboard_service para crear el perfil con los datos personales.
    3. Devuelve el JWT solo si el dashboard confirma la creación del perfil.
    """
    if not payload.acepta_tratamiento_datos:
        raise HTTPException(
            status_code=400,
            detail="Es obligatorio aceptar la política de tratamiento de datos para registrarse"
        )

    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="El correo ya está registrado")

    new_user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        is_active=True,
        acepta_tratamiento_datos=True,
        fecha_aceptacion_legal=datetime.utcnow(),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Comunicación síncrona con dashboard_service
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{DASHBOARD_URL}/internal/create-profile",
                json={
                    "user_id":      new_user.id,
                    "full_name":    payload.full_name,
                    "birth_date":   payload.birth_date.isoformat() if payload.birth_date else None,
                    "phone":        payload.phone,
                    "country_city": payload.country_city,
                },
                timeout=10.0,
            )
        if resp.status_code not in (200, 201):
            # Si el dashboard falla, se revierte el usuario para mantener consistencia
            db.delete(new_user)
            db.commit()
            raise HTTPException(
                status_code=503,
                detail="Error al crear el perfil en el servicio de dashboard",
            )
    except httpx.RequestError:
        db.delete(new_user)
        db.commit()
        raise HTTPException(
            status_code=503,
            detail="No se pudo conectar con el servicio de dashboard",
        )

    # Notificación de bienvenida — fire-and-forget, no bloquea el registro
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{NOTIFICATIONS_URL}/notifications/",
                json={
                    "user_id": new_user.id,
                    "title":   "¡Bienvenido a CONIITI 2026!",
                    "message": f"Hola {payload.full_name}, tu cuenta fue creada exitosamente. ¡Explora las conferencias disponibles!",
                    "type":    "sistema",
                },
                timeout=5.0,
            )
    except Exception:
        pass

    token = create_token(new_user.id, new_user.email)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=new_user.id,
        email=new_user.email,
    )


@router.post("/change-password")
def change_password(payload: PasswordChange, db: Session = Depends(get_db)):
    """Cambia la contraseña del usuario verificando la contraseña actual."""
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user or not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=401, detail="Contraseña actual incorrecta")
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"message": "Contraseña actualizada exitosamente"}


@router.post("/login", response_model=TwoFactorRequired)
async def login(payload: UserLogin, db: Session = Depends(get_db)):
    """
    Paso 1 del login con 2FA.
    Valida credenciales, genera un OTP de 6 dígitos, lo guarda en BD
    con expiración de 5 min y lo envía por correo.
    NO emite token todavía — devuelve {"status": "2fa_required", "user_id": X}.
    """
    user = db.query(User).filter(User.email == payload.email).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="La cuenta está desactivada")

    # Reutiliza exactamente la misma lógica de password-reset
    otp    = str(secrets.randbelow(900_000) + 100_000)  # 100000–999999
    expiry = datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES)

    user.otp_code     = otp
    user.otp_expiry   = expiry
    user.otp_attempts = 0    # reinicia intentos en cada nuevo login
    db.commit()

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                f"{NOTIFICATIONS_URL}/notifications/",
                json={
                    "user_id": user.id,
                    "title":   "Código de verificación CONIITI 2026",
                    "message": f"Tu código de acceso es: {otp}. Expira en {OTP_EXPIRE_MINUTES} minutos.",
                    "type":    "sistema",
                    "email":   user.email,
                },
            )
    except Exception as exc:
        print(f"[2fa] Error al enviar OTP — user {user.id}: {type(exc).__name__}: {exc}")

    return TwoFactorRequired(status="2fa_required", user_id=user.id)


@router.post("/verify-2fa", response_model=TokenResponse)
def verify_2fa(payload: TwoFactorVerify, db: Session = Depends(get_db)):
    """
    Paso 2 del login con 2FA.
    Valida el OTP contra la BD. Máximo MAX_OTP_ATTEMPTS intentos fallidos
    consecutivos; al superarlos, se borra el código para obligar a reiniciar login.
    Si el código es correcto y vigente, lo invalida y emite el JWT de sesión.
    """
    user = db.query(User).filter(User.id == payload.user_id).first()

    if not user or not user.otp_code:
        raise HTTPException(status_code=400, detail="No hay un código de verificación activo. Inicia sesión nuevamente.")

    now = datetime.utcnow()

    # Código expirado — limpiar y forzar nuevo login
    if not user.otp_expiry or user.otp_expiry < now:
        user.otp_code     = None
        user.otp_expiry   = None
        user.otp_attempts = 0
        db.commit()
        raise HTTPException(status_code=400, detail="El código ha expirado. Inicia sesión nuevamente.")

    # Código incorrecto
    if user.otp_code != payload.code:
        user.otp_attempts += 1
        if user.otp_attempts >= MAX_OTP_ATTEMPTS:
            user.otp_code     = None
            user.otp_expiry   = None
            user.otp_attempts = 0
            db.commit()
            raise HTTPException(
                status_code=429,
                detail="Demasiados intentos fallidos. Inicia sesión nuevamente.",
            )
        db.commit()
        restantes = MAX_OTP_ATTEMPTS - user.otp_attempts
        raise HTTPException(
            status_code=400,
            detail=f"Código incorrecto. Te queda{'n' if restantes > 1 else ''} {restantes} intento{'s' if restantes > 1 else ''}.",
        )

    # Código correcto — invalida OTP (un solo uso) y emite token de sesión
    user.otp_code     = None
    user.otp_expiry   = None
    user.otp_attempts = 0
    db.commit()

    token = create_token(user.id, user.email)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
    )

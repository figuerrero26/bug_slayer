import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import httpx
import os
import secrets

from database import get_db
from models.user_model import User
from models.session_model import UserSession
from schemas.user_schema import (
    UserRegister, UserLogin, TokenResponse, PasswordChange,
    TwoFactorRequired, TwoFactorVerify, TwoFAUpdate,
)
from utils.security import hash_password, verify_password, create_token

router = APIRouter(prefix="/auth", tags=["auth"])

DASHBOARD_URL      = os.getenv("DASHBOARD_SERVICE_URL",      "http://localhost:8002")
NOTIFICATIONS_URL  = os.getenv("NOTIFICATIONS_SERVICE_URL",  "http://localhost:8004")

OTP_EXPIRE_MINUTES = 5
MAX_OTP_ATTEMPTS   = 5


# ── Helpers ───────────────────────────────────────────────────────────────────

def _parse_device(user_agent: str) -> str:
    """Extrae 'Navegador · SO' del User-Agent."""
    ua = user_agent.lower()
    if "edg/" in ua:           browser = "Edge"
    elif "opr/" in ua:         browser = "Opera"
    elif "firefox/" in ua:     browser = "Firefox"
    elif "chrome/" in ua:      browser = "Chrome"
    elif "safari/" in ua:      browser = "Safari"
    else:                      browser = "Navegador"

    if "iphone" in ua:         os_name = "iPhone"
    elif "ipad" in ua:         os_name = "iPad"
    elif "android" in ua:      os_name = "Android"
    elif "windows" in ua:      os_name = "Windows"
    elif "macintosh" in ua:    os_name = "Mac"
    elif "linux" in ua:        os_name = "Linux"
    else:                      os_name = "Dispositivo"

    return f"{browser} · {os_name}"


def _create_session(db: Session, user_id: int, request: Request) -> UserSession:
    ua     = request.headers.get("user-agent", "")
    device = _parse_device(ua) if ua else "Dispositivo desconocido"
    sid    = str(uuid.uuid4())
    session = UserSession(
        session_id=sid,
        user_id=user_id,
        device=device,
        location="Colombia",
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def _build_token_response(user: User, session: UserSession) -> TokenResponse:
    token = create_token(user.id, user.email, session_id=session.session_id)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        session_id=session.session_id,
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegister, request: Request, db: Session = Depends(get_db)):
    if not payload.acepta_tratamiento_datos:
        raise HTTPException(
            status_code=400,
            detail="Es obligatorio aceptar la política de tratamiento de datos para registrarse",
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
            db.delete(new_user)
            db.commit()
            raise HTTPException(status_code=503, detail="Error al crear el perfil en el servicio de dashboard")
    except httpx.RequestError:
        db.delete(new_user)
        db.commit()
        raise HTTPException(status_code=503, detail="No se pudo conectar con el servicio de dashboard")

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

    session = _create_session(db, new_user.id, request)
    return _build_token_response(new_user, session)


@router.post("/change-password")
def change_password(payload: PasswordChange, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user or not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=401, detail="Contraseña actual incorrecta")
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"message": "Contraseña actualizada exitosamente"}


@router.post("/login")
async def login(payload: UserLogin, request: Request, db: Session = Depends(get_db)):
    """
    Login con soporte de 2FA configurable por usuario.
    - Si two_fa_enabled (o no definido): genera OTP, envía correo y devuelve
      {"status": "2fa_required", "user_id": X}.
    - Si two_fa_enabled = False: salta el OTP y devuelve el JWT + session_id directamente.
    """
    user = db.query(User).filter(User.email == payload.email).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="La cuenta está desactivada")

    fa_active = user.two_fa_enabled is None or user.two_fa_enabled

    if not fa_active:
        session = _create_session(db, user.id, request)
        return _build_token_response(user, session)

    otp    = str(secrets.randbelow(900_000) + 100_000)
    expiry = datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES)

    user.otp_code     = otp
    user.otp_expiry   = expiry
    user.otp_attempts = 0
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
def verify_2fa(payload: TwoFactorVerify, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.user_id).first()

    if not user or not user.otp_code:
        raise HTTPException(status_code=400, detail="No hay un código de verificación activo. Inicia sesión nuevamente.")

    now = datetime.utcnow()

    if not user.otp_expiry or user.otp_expiry < now:
        user.otp_code = user.otp_expiry = None
        user.otp_attempts = 0
        db.commit()
        raise HTTPException(status_code=400, detail="El código ha expirado. Inicia sesión nuevamente.")

    if user.otp_code != payload.code:
        user.otp_attempts += 1
        if user.otp_attempts >= MAX_OTP_ATTEMPTS:
            user.otp_code = user.otp_expiry = None
            user.otp_attempts = 0
            db.commit()
            raise HTTPException(status_code=429, detail="Demasiados intentos fallidos. Inicia sesión nuevamente.")
        db.commit()
        restantes = MAX_OTP_ATTEMPTS - user.otp_attempts
        raise HTTPException(
            status_code=400,
            detail=f"Código incorrecto. Te queda{'n' if restantes > 1 else ''} {restantes} intento{'s' if restantes > 1 else ''}.",
        )

    user.otp_code = user.otp_expiry = None
    user.otp_attempts = 0
    db.commit()

    session = _create_session(db, user.id, request)
    return _build_token_response(user, session)


@router.patch("/2fa")
def toggle_2fa(payload: TwoFAUpdate, db: Session = Depends(get_db)):
    """Activa o desactiva el factor de doble autenticación para un usuario."""
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.two_fa_enabled = payload.enabled
    db.commit()
    return {"two_fa_enabled": user.two_fa_enabled}


# ── Gestión de sesiones activas ───────────────────────────────────────────────

@router.get("/sessions/{user_id}")
def get_sessions(user_id: int, db: Session = Depends(get_db)):
    """Devuelve todas las sesiones activas del usuario."""
    sessions = (
        db.query(UserSession)
        .filter(UserSession.user_id == user_id, UserSession.is_active == True)  # noqa: E712
        .order_by(UserSession.created_at.desc())
        .all()
    )
    return [
        {
            "session_id": s.session_id,
            "device":     s.device,
            "location":   s.location,
            "created_at": s.created_at.isoformat(),
        }
        for s in sessions
    ]


@router.delete("/sessions/{session_id}")
def close_session(session_id: str, db: Session = Depends(get_db)):
    """Invalida una sesión específica (cierre remoto de sesión)."""
    s = db.query(UserSession).filter(
        UserSession.session_id == session_id,
        UserSession.is_active == True,  # noqa: E712
    ).first()
    if not s:
        raise HTTPException(status_code=404, detail="Sesión no encontrada o ya cerrada")
    s.is_active = False
    db.commit()
    return {"message": "Sesión cerrada correctamente"}

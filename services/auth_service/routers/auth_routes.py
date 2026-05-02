from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import httpx
import os

from database import get_db
from models.user_model import User
from schemas.user_schema import UserRegister, UserLogin, TokenResponse
from utils.security import hash_password, verify_password, create_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegister, db: Session = Depends(get_db)):
    dashboard_url = os.getenv("DASHBOARD_SERVICE_URL", "http://localhost:8002")

    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="El correo ya está registrado")

    new_user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{dashboard_url}/internal/create-profile",
                json={
                    "user_id": new_user.id,
                    "full_name": payload.full_name,
                    "phone": payload.phone,
                    "country_city": payload.country_city,
                },
                timeout=10.0,
            )
        if resp.status_code not in (200, 201):
            db.delete(new_user)
            db.commit()
            raise HTTPException(
                status_code=503,
                detail="Error al crear el perfil en el servicio de dashboard",
            )
    except HTTPException:
        raise
    except httpx.RequestError as exc:
        db.delete(new_user)
        db.commit()
        raise HTTPException(
            status_code=503,
            detail="No se pudo conectar con el servicio de dashboard",
        ) from exc
    except Exception as exc:
        db.delete(new_user)
        db.commit()
        raise HTTPException(
            status_code=500,
            detail="Error inesperado al crear el perfil",
        ) from exc

    token = create_token(new_user.id, new_user.email)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=new_user.id,
        email=new_user.email,
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """Valida credenciales y devuelve un JWT con el user_id (llave lógica universal)."""
    user = db.query(User).filter(User.email == payload.email).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="La cuenta está desactivada")

    token = create_token(user.id, user.email)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
    )

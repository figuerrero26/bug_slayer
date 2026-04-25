from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
import httpx
import os

from database import get_db
from models.conference_model import Conference, ConferenceRegistration
from schemas.conference_schema import RegistrationCreate, RegistrationResponse

router = APIRouter(prefix="/registrations", tags=["registrations"])

NOTIFICATIONS_URL = os.getenv("NOTIFICATIONS_SERVICE_URL", "http://localhost:8004")


@router.post("/", response_model=RegistrationResponse, status_code=201)
async def register_to_conference(payload: RegistrationCreate, db: Session = Depends(get_db)):
    """
    Inscribe a un usuario en una conferencia.
    Si tiene éxito, dispara una notificación de forma asíncrona (fire-and-forget).
    """
    conf = db.query(Conference).filter(Conference.id == payload.conference_id).first()
    if not conf:
        raise HTTPException(status_code=404, detail="Conferencia no encontrada")

    registration = ConferenceRegistration(
        conference_id=payload.conference_id,
        user_id=payload.user_id,
        status="activo",
    )

    try:
        db.add(registration)
        db.commit()
        db.refresh(registration)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Ya estás inscrito en esta conferencia")

    # Notificación asíncrona: si falla, no cancela la inscripción
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{NOTIFICATIONS_URL}/notifications",
                json={
                    "user_id": payload.user_id,
                    "title": "Inscripción confirmada",
                    "message": f"Te inscribiste exitosamente en: {conf.title}",
                    "type": "info",
                },
                timeout=5.0,
            )
    except Exception:
        pass

    return registration


@router.get("/user/{user_id}", response_model=List[RegistrationResponse])
def get_user_registrations(user_id: int, db: Session = Depends(get_db)):
    """Devuelve todas las inscripciones activas de un usuario (llave lógica)."""
    return (
        db.query(ConferenceRegistration)
        .filter(
            ConferenceRegistration.user_id == user_id,
            ConferenceRegistration.status == "activo",
        )
        .all()
    )


@router.delete("/{registration_id}")
def cancel_registration(registration_id: int, db: Session = Depends(get_db)):
    """Cancela una inscripción cambiando su status a 'cancelado'."""
    reg = db.query(ConferenceRegistration).filter(ConferenceRegistration.id == registration_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")
    reg.status = "cancelado"
    db.commit()
    return {"message": "Inscripción cancelada"}

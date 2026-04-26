from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from typing import List

from database import get_db
from models.conference_model import Conference, ConferenceRegistration
from schemas.conference_schema import (
    RegistrationCreate,
    RegistrationResponse,
    UserConferenceOut,
)
from services.notification_client import notify_registration

router = APIRouter(tags=["registrations"])


@router.post("/registrations", response_model=RegistrationResponse, status_code=201)
def register_to_conference(
    payload: RegistrationCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Inscribe a un usuario en una conferencia.
    Valida: existencia de conferencia, cupos disponibles, duplicados.
    Dispara notificación de forma asíncrona (fire-and-forget).
    """
    conf = db.query(Conference).filter(
        Conference.id == payload.conference_id,
        Conference.is_active == True,
    ).first()
    if not conf:
        raise HTTPException(status_code=404, detail="Conferencia no encontrada")

    # Si ya existe (cancelada), la reactiva en vez de crear duplicado
    existing = db.query(ConferenceRegistration).filter(
        ConferenceRegistration.user_id == payload.user_id,
        ConferenceRegistration.conference_id == payload.conference_id,
    ).first()
    if existing:
        if existing.status == "activo":
            raise HTTPException(status_code=409, detail="Ya estás inscrito en esta conferencia")
        existing.status = "activo"
        db.commit()
        db.refresh(existing)
        background_tasks.add_task(notify_registration, payload.user_id, conf.id, conf.title)
        return existing

    # Validar cupos disponibles
    active_count = (
        db.query(func.count(ConferenceRegistration.id))
        .filter(
            ConferenceRegistration.conference_id == payload.conference_id,
            ConferenceRegistration.status == "activo",
        )
        .scalar()
    ) or 0
    if active_count >= conf.capacity:
        raise HTTPException(status_code=400, detail="No hay cupos disponibles para esta conferencia")

    reg = ConferenceRegistration(
        conference_id=payload.conference_id,
        user_id=payload.user_id,
        status="activo",
    )
    try:
        db.add(reg)
        db.commit()
        db.refresh(reg)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Ya estás inscrito en esta conferencia")

    background_tasks.add_task(notify_registration, payload.user_id, conf.id, conf.title)
    return reg


@router.delete("/registrations/{registration_id}", status_code=200)
def cancel_registration(registration_id: int, db: Session = Depends(get_db)):
    """Cancela una inscripción (soft-delete: status = 'cancelado')."""
    reg = db.query(ConferenceRegistration).filter(
        ConferenceRegistration.id == registration_id,
    ).first()
    if not reg or reg.status == "cancelado":
        raise HTTPException(status_code=404, detail="Inscripción no encontrada o ya cancelada")
    reg.status = "cancelado"
    db.commit()
    return {"message": "Inscripción cancelada"}


@router.get("/registrations/user/{user_id}", response_model=List[RegistrationResponse])
def get_user_registrations(user_id: int, db: Session = Depends(get_db)):
    """Devuelve las inscripciones activas de un usuario (IDs solamente)."""
    return (
        db.query(ConferenceRegistration)
        .filter(
            ConferenceRegistration.user_id == user_id,
            ConferenceRegistration.status == "activo",
        )
        .all()
    )


@router.get("/users/{user_id}/conferences", response_model=List[UserConferenceOut])
def get_user_conferences(user_id: int, db: Session = Depends(get_db)):
    """
    Endpoint para el dashboard_service.
    Devuelve los datos completos de cada conferencia en la que el usuario está inscrito.
    """
    rows = (
        db.query(Conference, ConferenceRegistration)
        .join(ConferenceRegistration, Conference.id == ConferenceRegistration.conference_id)
        .filter(
            ConferenceRegistration.user_id == user_id,
            ConferenceRegistration.status == "activo",
            Conference.is_active == True,
        )
        .all()
    )
    return [
        UserConferenceOut(
            id=conf.id,
            title=conf.title,
            speaker_name=conf.speaker_name,
            category=conf.category,
            schedule=conf.schedule,
            location_text=conf.location_text,
            registration_id=reg.id,
            registration_status=reg.status,
        )
        for conf, reg in rows
    ]

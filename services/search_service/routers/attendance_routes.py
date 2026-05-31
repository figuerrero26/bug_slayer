from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from datetime import datetime
from typing import List

from database import get_db
from models.conference_model import Conference, ConferenceRegistration
from schemas.conference_schema import (
    AttendanceValidateRequest,
    AttendanceValidateResponse,
    CompletedConferenceOut,
    CurrentConferenceOut,
)
from utils.qr_utils import parse_qr_string, verify_qr_signature

router = APIRouter(tags=["attendance"])

# Expresión SQL reutilizable: fecha/hora de fin de cada conferencia.
# MySQL evalúa el valor de la columna duration_minutes por cada fila.
_conf_end = func.date_add(
    Conference.schedule,
    text("INTERVAL conferences.duration_minutes MINUTE"),
)


@router.post("/validate-attendance", response_model=AttendanceValidateResponse)
def validate_attendance(body: AttendanceValidateRequest, db: Session = Depends(get_db)):
    """
    (Admin) Escanea el QR del asistente, verifica la firma y registra el ingreso.
    Devuelve already_validated=True si el QR ya había sido procesado antes,
    permitiendo al panel mostrar una alerta diferenciada.
    """
    parsed = parse_qr_string(body.qr_payload)
    if not parsed:
        raise HTTPException(status_code=400, detail="Formato de QR inválido")

    if not verify_qr_signature(parsed["payload_body"], parsed["sig"]):
        raise HTTPException(status_code=400, detail="Firma QR inválida — QR no auténtico")

    reg = (
        db.query(ConferenceRegistration)
        .filter_by(
            id=parsed["registration_id"],
            user_id=parsed["user_id"],
            conference_id=parsed["conference_id"],
            status="activo",
        )
        .first()
    )
    if not reg:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada o inactiva")

    conf = db.query(Conference).filter_by(id=parsed["conference_id"]).first()

    if reg.asistio:
        return AttendanceValidateResponse(
            success=True,
            message="Asistencia ya registrada anteriormente",
            registration_id=reg.id,
            user_id=reg.user_id,
            conference_title=conf.title if conf else None,
            already_validated=True,
        )

    reg.asistio = True
    reg.fecha_validacion = datetime.utcnow()
    db.commit()

    return AttendanceValidateResponse(
        success=True,
        message="Ingreso confirmado",
        registration_id=reg.id,
        user_id=reg.user_id,
        conference_title=conf.title if conf else None,
        already_validated=False,
    )


@router.get("/conferences/completed", response_model=List[CompletedConferenceOut])
def get_completed_conferences(user_id: int, db: Session = Depends(get_db)):
    """
    Retorna las conferencias finalizadas donde el usuario validó asistencia.
    Condiciones: asistio=True y schedule < ahora.
    """
    now = datetime.utcnow()
    rows = (
        db.query(Conference, ConferenceRegistration)
        .join(ConferenceRegistration, Conference.id == ConferenceRegistration.conference_id)
        .filter(
            ConferenceRegistration.user_id == user_id,
            ConferenceRegistration.status == "activo",
            ConferenceRegistration.asistio == True,
            Conference.is_active == True,
            _conf_end < now,   # schedule + duration_minutes < ahora → ya terminó
        )
        .order_by(Conference.schedule.desc())
        .all()
    )
    return [
        CompletedConferenceOut(
            id_inscripcion=reg.id,
            title=conf.title,
            speaker_name=conf.speaker_name,
            schedule=conf.schedule,
            location_text=conf.location_text,
            fecha_validacion=reg.fecha_validacion,
            category=conf.category,
        )
        for conf, reg in rows
    ]


@router.get("/conferences/current", response_model=List[CurrentConferenceOut])
def get_current_conferences(user_id: int, db: Session = Depends(get_db)):
    """
    Retorna las conferencias que el usuario está asistiendo en este momento.
    Condiciones: asistio=True y schedule <= ahora <= schedule + _DURATION_MINUTES.
    """
    now = datetime.utcnow()
    rows = (
        db.query(Conference, ConferenceRegistration)
        .join(ConferenceRegistration, Conference.id == ConferenceRegistration.conference_id)
        .filter(
            ConferenceRegistration.user_id == user_id,
            ConferenceRegistration.status == "activo",
            ConferenceRegistration.asistio == True,
            Conference.is_active == True,
            Conference.schedule <= now,   # ya comenzó
            _conf_end > now,              # schedule + duration_minutes > ahora → no ha terminado
        )
        .order_by(Conference.schedule)
        .all()
    )
    return [
        CurrentConferenceOut(
            id_inscripcion=reg.id,
            title=conf.title,
            speaker_name=conf.speaker_name,
            schedule=conf.schedule,
            location_text=conf.location_text,
        )
        for conf, reg in rows
    ]

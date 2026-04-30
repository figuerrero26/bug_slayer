from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models.notification_model import Notification
from schemas.notification_schema import NotificationCreate, NotificationResponse, UnreadCountResponse
from utils.email import send_email

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.post("/", response_model=NotificationResponse, status_code=201)
def create_notification(payload: NotificationCreate, db: Session = Depends(get_db)):
    """
    Endpoint interno: guarda la notificación y opcionalmente envía un correo.
    Llamado por search_service al confirmar una inscripción.
    """
    notif = Notification(
        user_id=payload.user_id,
        title=payload.title,
        message=payload.message,
        type=payload.type,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)

    # Intento de envío de correo (no bloquea si falla)
    send_email(subject=payload.title, body=payload.message)

    return notif


@router.get("/unread/{user_id}", response_model=UnreadCountResponse)
def get_unread_count(user_id: int, db: Session = Depends(get_db)):
    """El frontend consulta este endpoint periódicamente para el badge de notificaciones."""
    count = (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.is_read == False)
        .count()
    )
    return UnreadCountResponse(user_id=user_id, unread_count=count)


@router.get("/{user_id}", response_model=List[NotificationResponse])
def get_notifications(user_id: int, db: Session = Depends(get_db)):
    """Devuelve todas las notificaciones de un usuario, de más reciente a más antigua."""
    return (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .all()
    )


@router.patch("/{notification_id}/read")
def mark_as_read(notification_id: int, db: Session = Depends(get_db)):
    """Marca una notificación como leída (el punto rojo desaparece en el frontend)."""
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    notif.is_read = True
    db.commit()
    return {"message": "Notificación marcada como leída"}

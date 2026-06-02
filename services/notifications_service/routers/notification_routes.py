from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models.notification_model import Notification
from schemas.notification_schema import NotificationCreate, NotificationResponse, UnreadCountResponse
from utils.email import send_email
from utils.templates.email_templates import (
    html_confirmada,
    html_cancelada,
    html_otp,
    html_generica,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])

TITLE_INSCRIPCION_CONFIRMADA = "Inscripción confirmada"
TITLE_INSCRIPCION_CANCELADA  = "Inscripción cancelada"
TITLE_OTP                    = "Código de recuperación de contraseña"


def _dispatch_email(title: str, message: str, email: str | None) -> None:
    """Selecciona la plantilla correcta según el título y despacha el correo."""
    if not email:
        print(f"[notifications] Sin destinatario para '{title}' — correo omitido.")
        return

    if title == TITLE_INSCRIPCION_CONFIRMADA:
        send_email(
            subject="Inscripción confirmada en CONIITI 2026",
            body_html=html_confirmada(message),
            to=email,
            body_plain=message,
        )
    elif title == TITLE_INSCRIPCION_CANCELADA:
        send_email(
            subject="Inscripción cancelada en CONIITI 2026",
            body_html=html_cancelada(message),
            to=email,
            body_plain=message,
        )
    elif title == TITLE_OTP:
        send_email(
            subject="Tu código de verificación — CONIITI 2026",
            body_html=html_otp(message),   # message = los 6 dígitos
            to=email,
            body_plain=f"Tu código de verificación es: {message}. Expira en 5 minutos.",
        )
    else:
        send_email(
            subject=title,
            body_html=html_generica(title, message),
            to=email,
            body_plain=message,
        )


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/test-email", status_code=200)
def test_email_connectivity(to: str = Query(..., description="Dirección de correo destino")):
    """
    Endpoint de diagnóstico SMTP.
    Intenta enviar un correo de prueba al destinatario indicado.
    Revisa los logs de consola para ver el detalle del resultado.

    Uso:  POST /notifications/test-email?to=tu@correo.com
    """
    ok = send_email(
        subject="Test de conectividad SMTP",
        body_html=(
            "<div style='font-family:Arial,sans-serif;padding:20px;'>"
            "<h2>Test CONIITI 2026</h2>"
            "<p>Si recibes este correo, el servidor SMTP est&#xe1; funcionando correctamente.</p>"
            "</div>"
        ),
        to=to,
        body_plain="Test CONIITI 2026 — el servidor SMTP está funcionando correctamente.",
    )
    if ok:
        return {"status": "ok", "message": f"Correo de prueba enviado a {to}"}
    return {
        "status": "error",
        "message": "Fallo al enviar — revisa los logs de consola para el detalle del error SMTP.",
    }


@router.post("/", response_model=NotificationResponse, status_code=201)
def create_notification(
    payload: NotificationCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Endpoint interno: guarda la notificación en BD y despacha el correo en background.
    El correo se envía después de devolver el 201, por eso los llamadores no esperan al SMTP.
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

    background_tasks.add_task(_dispatch_email, payload.title, payload.message, payload.email)

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

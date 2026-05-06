import httpx
import os
from dotenv import load_dotenv

load_dotenv()

NOTIFICATIONS_URL = os.getenv("NOTIFICATIONS_SERVICE_URL", "http://localhost:8004")


def notify_registration(
    user_id: int,
    conference_id: int,
    conference_title: str,
    email: str | None = None
) -> None:
    """
    Notifica al usuario que su inscripción fue confirmada.
    Se ejecuta en un thread pool (BackgroundTasks), por eso es síncrona.
    Fire-and-forget: un fallo aquí no revierte la inscripción.
    """
    try:
        with httpx.Client(timeout=20.0) as client:
            print("[notification_client] email destino:", email)
            print("[notification_client] url:", f"{NOTIFICATIONS_URL}/notifications/")
            client.post(
                # trailing slash evita redirect 307
                f"{NOTIFICATIONS_URL}/notifications/",
                json={
                    "user_id": user_id,
                    "title":   "Inscripción confirmada",
                    "message": f"Te inscribiste exitosamente en: {conference_title}",
                    "type":    "info",
                    "email": email,
                },
            )
    except Exception as exc:
        print(f"[notification_client] Error al notificar inscripción — user {user_id}: {exc}")


def notify_cancellation(user_id: int, conference_title: str) -> None:
    """
    Notifica al usuario que canceló su inscripción.
    Se ejecuta en un thread pool (BackgroundTasks), por eso es síncrona.
    """
    try:
        with httpx.Client(timeout=5.0) as client:
            client.post(
                f"{NOTIFICATIONS_URL}/notifications/",
                json={
                    "user_id": user_id,
                    "title":   "Inscripción cancelada",
                    "message": f"Cancelaste tu inscripción en: {conference_title}",
                    "type":    "alerta",
                },
            )
    except Exception as exc:
        print(f"[notification_client] Error al notificar cancelación — user {user_id}: {exc}")

import httpx
import os
from dotenv import load_dotenv

load_dotenv()

NOTIFICATIONS_URL = os.getenv("NOTIFICATIONS_SERVICE_URL", "http://localhost:8004")


def notify_registration(user_id: int, conference_id: int, conference_title: str) -> None:
    """
    Llama al notifications_service de forma síncrona (se ejecuta en BackgroundTasks,
    que corre en un thread pool, por eso no se usa async).
    Si falla, se registra el error pero la inscripción ya fue confirmada — no se revierte.
    """
    try:
        with httpx.Client(timeout=5.0) as client:
            client.post(
                f"{NOTIFICATIONS_URL}/notifications",
                json={
                    "user_id": user_id,
                    "title":   "Inscripción confirmada",
                    "message": f"Te inscribiste exitosamente en: {conference_title}",
                    "type":    "info",
                },
            )
    except Exception as exc:
        print(f"[notification_client] No se pudo notificar al usuario {user_id}: {exc}")

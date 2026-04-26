import httpx
import os
import logging

logger = logging.getLogger(__name__)

NOTIFICATIONS_URL = os.getenv("NOTIFICATIONS_SERVICE_URL", "http://localhost:8004")


async def notify_registration(user_id: int, conference_id: int, conference_title: str) -> None:
    """
    Llama al notifications_service de forma asíncrona (fire-and-forget).
    Si el servicio está caído, registra el error pero NO cancela la inscripción.
    """
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                f"{NOTIFICATIONS_URL}/notifications",
                json={
                    "user_id": user_id,
                    "title": "Inscripción confirmada",
                    "message": f"Tu inscripción a '{conference_title}' ha sido confirmada exitosamente.",
                    "type": "info",
                },
            )
    except Exception as exc:
        logger.warning("notifications_service no disponible (non-fatal): %s", exc)

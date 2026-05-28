import os
import hmac
import hashlib
import json
import httpx

N8N_WEBHOOK_URL    = os.getenv("N8N_WEBHOOK_URL", "")
N8N_WEBHOOK_SECRET = os.getenv("N8N_WEBHOOK_SECRET", "")
N8N_WEBHOOK_TOKEN  = os.getenv("N8N_WEBHOOK_TOKEN", "")


async def ask_rogelio(
    user_id: int,
    conversation_id: int,
    message: str,
    history: list,
) -> str:
    if N8N_WEBHOOK_URL:
        return await _call_n8n(user_id, conversation_id, message, history)
    return _fallback(message)


async def _call_n8n(
    user_id: int,
    conversation_id: int,
    message: str,
    history: list,
) -> str:
    body = {
        "user_id": user_id,
        "conversation_id": conversation_id,
        "message": message,
        "history": history,
        "context": {"event_year": 2026, "locale": "es-CO"},
    }
    body_raw = json.dumps(body, ensure_ascii=False)

    headers: dict[str, str] = {
        "Content-Type": "application/json",
        "X-Coniiti-Webhook-Token": N8N_WEBHOOK_TOKEN,
    }
    if N8N_WEBHOOK_SECRET:
        sig = hmac.new(
            N8N_WEBHOOK_SECRET.encode(),
            body_raw.encode(),
            hashlib.sha256,
        ).hexdigest()
        headers["X-Coniiti-Signature"] = f"sha256={sig}"

    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.post(N8N_WEBHOOK_URL, content=body_raw, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            return data.get("reply") or _fallback(message)
    except Exception:
        return _fallback(message)


def _fallback(message: str) -> str:
    msg = message.lower()

    if any(w in msg for w in ["hola", "buenos días", "buenas tardes", "buenas noches", "hi"]):
        return (
            "¡Hola! Soy **Rogelio**, tu asistente virtual de CONIITI 2026. "
            "Estoy aquí para ayudarte con información sobre conferencias, inscripciones y el evento. "
            "¿En qué te puedo ayudar?"
        )

    if any(w in msg for w in ["conferencia", "charla", "ponente", "ponencia", "speaker", "agenda", "horario", "programa"]):
        return (
            "Puedes explorar todas las conferencias disponibles desde la sección "
            "**Conferencias** del panel. Allí encontrarás el programa completo, "
            "los ponentes y los horarios de CONIITI 2026."
        )

    if any(w in msg for w in ["inscribi", "inscripcion", "inscripción", "registrar", "cupo", "apuntar"]):
        return (
            "Para inscribirte a una conferencia: ve a **Conferencias**, "
            "encuentra la que te interese y haz clic en el botón *Inscribirse*. "
            "Recibirás una notificación de confirmación de inmediato."
        )

    if any(w in msg for w in ["cancelar", "desinscribir", "quitar", "eliminar inscripcion"]):
        return (
            "Puedes cancelar tu inscripción desde la sección **Mis Conferencias** "
            "en el panel. Ten en cuenta los plazos de cancelación del evento."
        )

    if any(w in msg for w in ["donde", "dónde", "lugar", "sede", "ubicacion", "ubicación", "dirección"]):
        return (
            "CONIITI 2026 se realiza en la **Universidad Católica de Colombia**. "
            "Consulta la sección de inicio para ver la dirección exacta y el mapa."
        )

    if any(w in msg for w in ["fecha", "cuando", "cuándo", "día", "dia"]):
        return (
            "CONIITI 2026 se celebra en **2026**. "
            "Revisa la sección **Calendario** del panel para ver las fechas exactas de cada conferencia."
        )

    if any(w in msg for w in ["certificado", "diploma", "constancia"]):
        return (
            "Los certificados de asistencia se emiten al finalizar el evento. "
            "Recibirás la información por correo electrónico con los detalles."
        )

    if any(w in msg for w in ["gracias", "thank", "genial", "perfecto", "excelente"]):
        return "¡Con mucho gusto! Aquí estaré si necesitas algo más. ¡Éxitos en CONIITI 2026!"

    if any(w in msg for w in ["chao", "adios", "adiós", "bye", "hasta luego"]):
        return "¡Hasta pronto! Recuerda que puedes consultarme cuando quieras. ¡Nos vemos en CONIITI 2026!"

    return (
        "Soy **Rogelio**, el asistente de CONIITI 2026. Puedo ayudarte con: "
        "conferencias, inscripciones, sede, fechas y certificados. "
        "¿Qué deseas saber?"
    )

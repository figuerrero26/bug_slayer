import os
import hmac
import hashlib
import json
import logging
import httpx

from services.prompt import SYSTEM_PROMPT, build_knowledge_block, trim_history

logger = logging.getLogger(__name__)

N8N_WEBHOOK_URL    = os.getenv("N8N_WEBHOOK_URL", "")
N8N_WEBHOOK_SECRET = os.getenv("N8N_WEBHOOK_SECRET", "")
N8N_WEBHOOK_TOKEN  = os.getenv("N8N_WEBHOOK_TOKEN", "")


async def ask_rogelio(
    user_id: int | None,
    conversation_id: int,
    message: str,
    history: list,
) -> str:
    if N8N_WEBHOOK_URL:
        return await _call_n8n(user_id, conversation_id, message, history)
    return _fallback(message)


async def _call_n8n(
    user_id: int | None,
    conversation_id: int,
    message: str,
    history: list,
) -> str:
    trimmed = trim_history(history)
    knowledge = build_knowledge_block()
    system_prompt = SYSTEM_PROMPT.format(knowledge_block=knowledge)

    body = {
        "user_id": user_id,
        "conversation_id": conversation_id,
        "message": message,
        "history": trimmed,
        "system_context": {
            "system_prompt": system_prompt,
            "bot_name": "Rogelio",
            "event": "CONIITI 2026",
            "locale": "es-CO",
        },
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
            reply = data.get("reply", "").strip()
            return reply if reply else _fallback(message)
    except Exception as exc:
        logger.warning("n8n no disponible (%s), usando fallback local.", exc)
        return _fallback(message)


# ─────────────────────────────────────────────────────────────────────────────
# FALLBACK LOCAL — responde TODO sobre CONIITI sin necesitar n8n ni IA externa
# ─────────────────────────────────────────────────────────────────────────────

def _fallback(message: str) -> str:
    msg = message.lower().strip()

    # ── Saludos ───────────────────────────────────────────────────────────────
    if _any(msg, ["hola", "buenos días", "buenas tardes", "buenas noches", "hi",
                  "buen día", "buenas", "qué tal", "hey", "saludos"]):
        return (
            "¡Hola! Soy **Rogelio**, el asistente oficial de **CONIITI 2026** de la "
            "Universidad Católica de Colombia. Estoy aquí para ayudarte con:\n\n"
            "- Conferencias y ponentes\n"
            "- Inscripciones y cancelaciones\n"
            "- Fechas, sede y horarios\n"
            "- Certificados y trámites\n\n"
            "¿En qué te puedo ayudar?"
        )

    # ── Qué es CONIITI ────────────────────────────────────────────────────────
    if _any(msg, ["qué es coniiti", "que es coniiti", "qué es el congreso",
                  "de qué trata", "de que trata", "sobre el evento", "cuéntame del evento",
                  "cuentame del evento", "información del evento", "informacion del evento"]):
        return (
            "**CONIITI 2026** es el Congreso Nacional de Ingeniería de Tecnologías de "
            "Información, organizado por la **Universidad Católica de Colombia**.\n\n"
            "Es un espacio académico y profesional donde expertos, investigadores y "
            "estudiantes convergen para compartir avances en:\n\n"
            "- Inteligencia Artificial y Machine Learning\n"
            "- Ciberseguridad\n"
            "- Desarrollo de Software\n"
            "- Transformación Digital\n"
            "- Ingeniería de Sistemas\n\n"
            "¡Una oportunidad única para aprender y conectar con la comunidad tech de Colombia!"
        )

    # ── Conferencias / Charlas / Ponencias ────────────────────────────────────
    if _any(msg, ["conferencia", "charla", "ponencia", "ponente", "speaker", "expositor",
                  "agenda", "programa", "horario", "sesión", "sesion", "taller",
                  "workshop", "keynote", "lista de", "cuáles hay", "cuales hay"]):
        return (
            "Puedes explorar **todas las conferencias de CONIITI 2026** desde la sección "
            "**Conferencias** del panel.\n\n"
            "Allí encontrarás:\n\n"
            "- Título y descripción de cada charla\n"
            "- Nombre y perfil del ponente\n"
            "- Fecha, hora y sala asignada\n"
            "- Cupos disponibles\n"
            "- Botón para inscribirte directamente\n\n"
            "¿Buscas algún tema en particular? Usa el filtro de búsqueda en esa sección."
        )

    # ── Inscripción ───────────────────────────────────────────────────────────
    if _any(msg, ["inscribi", "inscripción", "inscripcion", "registrar", "apuntar",
                  "participar", "asistir", "cómo me uno", "como me uno",
                  "quiero ir", "cómo entro", "como entro"]):
        return (
            "Para inscribirte a una conferencia de **CONIITI 2026**, sigue estos pasos:\n\n"
            "1. Ve a la sección **Conferencias** en el menú\n"
            "2. Busca la charla que te interesa\n"
            "3. Haz clic en el botón **Inscribirse**\n"
            "4. ¡Listo! Recibirás un correo de confirmación\n\n"
            "Puedes inscribirte a varias conferencias siempre que tengan cupos disponibles."
        )

    # ── Cancelar inscripción ──────────────────────────────────────────────────
    if _any(msg, ["cancelar", "desinscribir", "quitar", "eliminar inscripcion",
                  "eliminar inscripción", "no puedo ir", "ya no voy", "retirarme"]):
        return (
            "Para cancelar tu inscripción:\n\n"
            "1. Dirígete a **Mis Inscripciones** en el panel\n"
            "2. Selecciona la conferencia que quieres cancelar\n"
            "3. Haz clic en **Cancelar inscripción**\n\n"
            "Recibirás una notificación confirmando la cancelación. "
            "El cupo quedará disponible para otro participante."
        )

    # ── Sede / Ubicación ──────────────────────────────────────────────────────
    if _any(msg, ["dónde", "donde", "lugar", "sede", "ubicación", "ubicacion",
                  "dirección", "direccion", "campus", "instalaciones", "cómo llegar",
                  "como llegar", "mapa"]):
        return (
            "**CONIITI 2026** se realiza en la **Universidad Católica de Colombia**.\n\n"
            "La universidad está ubicada en **Bogotá, Colombia**. "
            "Consulta la sección de inicio del panel o el sitio oficial para ver "
            "la dirección exacta, el mapa interactivo y las indicaciones para llegar."
        )

    # ── Fechas / Cuándo ───────────────────────────────────────────────────────
    if _any(msg, ["cuándo", "cuando", "fecha", "día", "dia", "mes", "año",
                  "próximo", "proximo", "qué semana", "que semana"]):
        return (
            "**CONIITI 2026** se celebra durante el año **2026** en la "
            "Universidad Católica de Colombia, Bogotá.\n\n"
            "Para ver las fechas exactas de cada conferencia y el cronograma completo, "
            "consulta la sección **Conferencias** del panel donde encontrarás el "
            "calendario detallado con día y hora de cada sesión."
        )

    # ── Certificados ──────────────────────────────────────────────────────────
    if _any(msg, ["certificado", "diploma", "constancia", "certificación",
                  "certificacion", "comprobante", "asistencia", "acreditar"]):
        return (
            "Los **certificados de asistencia** de CONIITI 2026 se emiten al "
            "finalizar el evento.\n\n"
            "El proceso es:\n\n"
            "1. Asiste a las conferencias a las que te inscribiste\n"
            "2. Al cerrar el evento, se registra tu asistencia\n"
            "3. Recibes el certificado en el correo electrónico registrado\n\n"
            "Si tienes dudas sobre el estado de tu certificado, revisa la sección "
            "**Notificaciones** del panel."
        )

    # ── Ponentes / Speakers ───────────────────────────────────────────────────
    if _any(msg, ["ponente", "speaker", "expositor", "quien habla", "quién habla",
                  "quién da", "quien da", "autor", "investigador", "experto"]):
        return (
            "Puedes conocer a todos los **ponentes de CONIITI 2026** en la sección "
            "**Ponentes** del panel o dentro de cada conferencia en la sección "
            "**Conferencias**.\n\n"
            "Allí encontrarás:\n\n"
            "- Nombre y foto del ponente\n"
            "- Institución o empresa\n"
            "- Área de especialización\n"
            "- Las conferencias que presentará"
        )

    # ── Temas / Áreas ─────────────────────────────────────────────────────────
    if _any(msg, ["tema", "área", "area", "tópico", "topico", "ia", "inteligencia artificial",
                  "ciberseguridad", "seguridad informática", "machine learning",
                  "desarrollo", "software", "sistemas", "datos", "transformación digital"]):
        return (
            "**CONIITI 2026** cubre los principales temas de la ingeniería de sistemas:\n\n"
            "- **Inteligencia Artificial y Machine Learning**\n"
            "- **Ciberseguridad e Infraestructura**\n"
            "- **Desarrollo de Software y Arquitecturas**\n"
            "- **Transformación Digital y Empresas**\n"
            "- **Ciencia de Datos y Big Data**\n"
            "- **IoT y Sistemas Embebidos**\n"
            "- **Cloud Computing y DevOps**\n\n"
            "Filtra por tema en la sección **Conferencias** del panel para encontrar "
            "las charlas que más te interesen."
        )

    # ── Cupos ─────────────────────────────────────────────────────────────────
    if _any(msg, ["cupo", "cupos", "disponible", "lleno", "llena", "capacidad",
                  "hay espacio", "hay lugar", "queda", "quedan"]):
        return (
            "Los cupos de cada conferencia se muestran en tiempo real en la sección "
            "**Conferencias** del panel.\n\n"
            "Si una charla está llena, te recomendamos:\n\n"
            "- Revisar otras conferencias del mismo tema\n"
            "- Volver a consultar ya que se pueden liberar cupos por cancelaciones\n\n"
            "Inscríbete pronto para asegurar tu lugar, ¡los cupos son limitados!"
        )

    # ── Notificaciones / Correo ───────────────────────────────────────────────
    if _any(msg, ["notificación", "notificacion", "correo", "email", "aviso",
                  "recordatorio", "no llegó", "no llego", "no recibí", "no recibi"]):
        return (
            "Las notificaciones del evento te llegan al correo con el que te registraste.\n\n"
            "Puedes ver todas tus notificaciones también en la sección "
            "**Notificaciones** del panel.\n\n"
            "Si no recibes correos, verifica:\n\n"
            "- Que tu correo en **Mi Perfil** esté correcto\n"
            "- La carpeta de **spam o correo no deseado**\n"
            "- Que la notificación no esté ya en el panel"
        )

    # ── Perfil / Cuenta ───────────────────────────────────────────────────────
    if _any(msg, ["perfil", "cuenta", "datos personales", "cambiar", "actualizar",
                  "foto", "nombre", "contraseña", "contrasena", "password"]):
        return (
            "Puedes gestionar tu información personal en la sección **Mi Perfil** del panel.\n\n"
            "Desde allí puedes:\n\n"
            "- Actualizar tu nombre y datos de contacto\n"
            "- Cambiar tu contraseña\n"
            "- Ver tu historial de inscripciones"
        )

    # ── Mis inscripciones ─────────────────────────────────────────────────────
    if _any(msg, ["mis inscripciones", "mis conferencias", "a qué estoy inscrito",
                  "a que estoy inscrito", "historial", "qué tengo", "que tengo"]):
        return (
            "Puedes ver todas tus inscripciones activas en la sección "
            "**Mis Inscripciones** del panel.\n\n"
            "Allí aparecen:\n\n"
            "- Conferencias a las que ya te inscribiste\n"
            "- Fecha y hora de cada una\n"
            "- Opción para cancelar si lo necesitas"
        )

    # ── Acceso / Login ────────────────────────────────────────────────────────
    if _any(msg, ["acceder", "entrar", "iniciar sesión", "iniciar sesion", "login",
                  "no puedo entrar", "no puedo acceder", "olvidé", "olvide",
                  "recuperar contraseña", "recuperar contrasena"]):
        return (
            "Para acceder a **CONIITI 2026**:\n\n"
            "- Si ya tienes cuenta, ingresa con tu correo y contraseña en la página de inicio\n"
            "- Si olvidaste tu contraseña, usa la opción **¿Olvidaste tu contraseña?** en el login\n"
            "- Si no tienes cuenta aún, regístrate con el botón **Crear cuenta**\n\n"
            "¿Necesitas ayuda con algo específico del acceso?"
        )

    # ── Precio / Costo / Gratuito ─────────────────────────────────────────────
    if _any(msg, ["precio", "costo", "cuánto cuesta", "cuanto cuesta", "gratis",
                  "gratuito", "pago", "cobran", "valor", "tarifa"]):
        return (
            "Para información sobre costos y modalidades de participación en "
            "**CONIITI 2026**, consulta la sección de inicio del panel o comunícate "
            "con el equipo organizador de la Universidad Católica de Colombia.\n\n"
            "La información oficial de tarifas y registro está disponible en el "
            "portal del evento."
        )

    # ── Presencial / Virtual ──────────────────────────────────────────────────
    if _any(msg, ["presencial", "virtual", "online", "en línea", "en linea",
                  "híbrido", "hibrido", "transmisión", "transmision", "stream"]):
        return (
            "Para conocer la **modalidad** (presencial, virtual o híbrida) de cada "
            "conferencia de CONIITI 2026, revisa la descripción de cada charla en "
            "la sección **Conferencias** del panel.\n\n"
            "Cada conferencia indica claramente cómo se llevará a cabo y cómo acceder."
        )

    # ── Contacto / Soporte ────────────────────────────────────────────────────
    if _any(msg, ["contacto", "soporte", "ayuda técnica", "ayuda tecnica", "problema",
                  "error", "fallo", "bug", "reportar", "comunicarme",
                  "hablar con", "organización", "organizacion"]):
        return (
            "Para **soporte técnico o consultas al equipo organizador** de CONIITI 2026, "
            "comunícate a través de los canales oficiales de la "
            "**Universidad Católica de Colombia**.\n\n"
            "También puedes revisar la sección de **Notificaciones** del panel, donde "
            "el equipo puede enviarte información importante sobre el evento."
        )

    # ── QR ────────────────────────────────────────────────────────────────────
    if _any(msg, ["qr", "código qr", "codigo qr", "escanear", "lector"]):
        return (
            "El **código QR** de CONIITI 2026 se usa para validar tu inscripción "
            "en la entrada de cada conferencia.\n\n"
            "Lo encontrarás en la confirmación enviada a tu correo después de inscribirte, "
            "y también en la sección de tu inscripción dentro del panel."
        )

    # ── Despedidas ────────────────────────────────────────────────────────────
    if _any(msg, ["gracias", "muchas gracias", "genial", "perfecto", "excelente",
                  "listo", "ok", "entendido", "de acuerdo"]):
        return "¡Con mucho gusto! Estoy aquí si necesitas algo más. ¡Éxitos en **CONIITI 2026**!"

    if _any(msg, ["chao", "adios", "adiós", "bye", "hasta luego", "nos vemos",
                  "hasta pronto", "me voy"]):
        return "¡Hasta pronto! Puedes consultarme cuando quieras. ¡Nos vemos en **CONIITI 2026**!"

    # ── Respuesta por defecto ─────────────────────────────────────────────────
    return (
        "Soy **Rogelio**, el asistente oficial de **CONIITI 2026**. "
        "Puedo ayudarte con:\n\n"
        "- **Conferencias** — programa, ponentes, horarios\n"
        "- **Inscripciones** — cómo inscribirte o cancelar\n"
        "- **Sede** — dónde es el evento\n"
        "- **Certificados** — cómo obtenerlos\n"
        "- **Tu cuenta** — perfil y acceso\n\n"
        "¿Sobre qué tema necesitas información?"
    )


def _any(text: str, keywords: list[str]) -> bool:
    return any(kw in text for kw in keywords)

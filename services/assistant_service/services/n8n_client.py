import os
import re
import hmac
import hashlib
import json
import logging
import httpx

from services.prompt import SYSTEM_PROMPT, build_context_block, trim_history
from services.llm_client import call_openai
from services.pricing_loader import format_pricing_response

logger = logging.getLogger(__name__)

N8N_WEBHOOK_URL    = os.getenv("N8N_WEBHOOK_URL", "")
N8N_WEBHOOK_SECRET = os.getenv("N8N_WEBHOOK_SECRET", "")
N8N_WEBHOOK_TOKEN  = os.getenv("N8N_WEBHOOK_TOKEN", "")


def _build_system_prompt(context: dict | None) -> str:
    context_block = build_context_block(context)
    return SYSTEM_PROMPT.format(context_block=context_block)


async def ask_rogelio(
    user_id: int | None,
    conversation_id: int,
    message: str,
    history: list,
    context: dict | None = None,
) -> str:
    trimmed       = trim_history(history)
    system_prompt = _build_system_prompt(context)

    # 1 — n8n (si está configurado: entorno empresarial / workflows custom)
    if N8N_WEBHOOK_URL:
        reply = await _call_n8n(user_id, conversation_id, message, trimmed, context, system_prompt)
        if reply:
            return reply

    # 2 — OpenAI directo (conversación real, fluida, con memoria del historial)
    reply = await call_openai(message, trimmed, system_prompt)
    if reply:
        return reply

    # 3 — Fallback local (sin IA: respuestas por palabras clave con datos reales)
    return _fallback(message, context)


async def _call_n8n(
    user_id: int | None,
    conversation_id: int,
    message: str,
    history: list,
    context: dict | None,
    system_prompt: str,
) -> str | None:
    body = {
        "user_id": user_id,
        "conversation_id": conversation_id,
        "message": message,
        "history": history,
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
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(N8N_WEBHOOK_URL, content=body_raw, headers=headers)
            resp.raise_for_status()
            data  = resp.json()
            reply = data.get("reply", "").strip()
            return reply if reply else None
    except Exception as exc:
        logger.warning("n8n no disponible (%s), continuando con OpenAI directo.", exc)
        return None


# ─────────────────────────────────────────────────────────────────────────────
# FALLBACK LOCAL — responde con datos reales cuando n8n no está disponible
# ─────────────────────────────────────────────────────────────────────────────

from datetime import datetime as _dt


def _fmt_sched(raw) -> str:
    if not raw:
        return ""
    try:
        dt = _dt.fromisoformat(str(raw).replace("Z", "+00:00"))
        return dt.strftime("%d/%m/%Y a las %H:%M")
    except Exception:
        return str(raw)

_CONIITI_KEYWORDS = [
    # Evento y gestión
    "conferencia", "charla", "ponencia", "ponente", "speaker", "keynote",
    "inscri", "inscripción", "inscripcion", "cancelar", "certificado",
    "sede", "horario", "agenda", "programa", "cupo", "cupos", "qr",
    "taller", "workshop", "coniiti", "congreso", "evento", "registro",
    "asistir", "pago", "fecha", "lugar", "sala", "salón", "auditorio",
    "perfil", "contraseña", "contrasena", "clave", "cuenta", "sesión", "sesion",
    "notificación", "notificacion", "correo", "email", "virtual", "presencial",
    "diploma", "constancia", "soporte", "contacto", "acceso", "login",
    "ajustes", "configuracion", "configuración", "cambiar",
    "precio", "costo", "coste", "tarifa", "plan", "valor", "pago", "cobran",
    # Temas tecnológicos del congreso
    "inteligencia", "machine learning", "ciberseguridad", "cloud", "devops",
    "software", "sistemas", "datos", "tecnolog", "iot", "blockchain",
    "desarrollo", "ingenier", "digital", "innovaci", "seguridad",
    "aprendizaje automatico", "aprendizaje automático", "redes neuronales",
    "programacion", "programación", "base de datos", "redes", "servidor",
    # Italia y contexto internacional
    "italia", "italian", "país invitado", "pais invitado", "invitado",
    "industria 4.0", "manufactura", "robotica", "robótica",
    # Perfil y recomendaciones
    "recomiend", "semestre", "estudiante", "graduarme", "practica", "hoja de vida",
    "emprendimiento", "investigacion", "investigación", "novedad",
    # Identidad y agenda
    "quien soy", "quién soy", "proxima", "próxima", "conflicto", "comprobante",
]

# Señales que indican CLARAMENTE que el mensaje es off-topic (comida, deporte, etc.)
_OFFTOPIC_SIGNALS = [
    "receta", "cocina", "cocinar", "ingrediente", "platillo",
    "futbol", "fútbol", "deporte", "partido", "gol", "equipo de",
    "política", "politica", "gobierno", "presidente",
    "farándula", "farandula", "chisme", "novela", "telenovela",
    "canción", "cancion", "cantante", "música", "musica", "artista",
    "película", "pelicula", "serie netflix", "actor", "actriz",
    "clima", "temperatura", "lluvia", "sol hoy",
    "precio del dolar", "bolsa de valores", "criptomoneda",
    "recomienda un restaurante", "dónde comer",
]


def _is_off_topic(msg: str) -> bool:
    """
    Solo bloquea si el mensaje tiene señales CLARAS de off-topic
    Y además no contiene ninguna keyword de CONIITI.
    Esto evita falsos positivos en preguntas meta o generales.
    """
    # "ia" como palabra completa nunca es off-topic
    if re.search(r"\bia\b", msg):
        return False
    # Tiene keyword de CONIITI → no es off-topic
    if any(kw in msg for kw in _CONIITI_KEYWORDS):
        return False
    # Tiene señal explícita de off-topic → sí lo es
    if any(sig in msg for sig in _OFFTOPIC_SIGNALS):
        return True
    # Sin keyword CONIITI pero sin señal off-topic clara → NO bloquear
    # (puede ser una pregunta meta, saludo elaborado, etc.)
    return False


def _fallback(message: str, context: dict | None = None) -> str:
    msg = message.lower().strip()
    ctx = context or {}

    conferences: list = ctx.get("conferences", [])
    user_regs:   list = ctx.get("user_registrations", [])
    profile:    dict  = ctx.get("user_profile") or {}

    user_name = (profile.get("full_name") or "").strip()
    greeting  = f", {user_name.split()[0]}" if user_name else ""

    # ── Saludos — SIEMPRE antes del filtro off-topic ──────────────────────────
    _es_saludo = _any(msg, ["hola", "buenos", "buenas", "buen día", "buen dia", "hi", "hey",
                             "saludos", "qué tal", "que tal", "como estas", "cómo estás",
                             "cómo está", "como esta", "buenas noches", "buenas tardes",
                             "buenos días", "buenos dias"])
    _pregunta_identidad = _any(msg, ["quien eres", "quién eres", "cómo te llamas",
                                     "como te llamas", "qué eres", "que eres",
                                     "quién soy", "quien soy hablando",
                                     "con quién hablo", "con quien hablo",
                                     "eres un bot", "eres un robot", "eres humano"])

    if _es_saludo and _pregunta_identidad:
        # Combinación: saludo + quién eres → presentación personalizada según estado del usuario
        activas = [r for r in user_regs if r.get("registration_status") != "cancelado"]
        if profile and activas:
            prox = sorted(activas, key=lambda r: r.get("schedule") or "")
            prox_title = prox[0].get("title", "") if prox else ""
            agenda_txt = (
                f" Ya tienes **{len(activas)} charla(s)** reservadas"
                + (f" — tu próxima es **{prox_title}** 🎤" if prox_title else "") + "."
            )
            return (
                f"👋 ¡Hola{greeting}! Soy **Rogelio**, tu asistente virtual para "
                f"**CONIITI 2026**. 🤖{agenda_txt}\n\n"
                "Estoy aquí para ayudarte con el programa, inscripciones, tarifas, "
                "sedes, certificados y cualquier duda del congreso. ¿Qué deseas hacer hoy? 😊"
            )
        elif profile:
            return (
                f"👋 ¡Hola{greeting}! Soy **Rogelio**, tu asistente virtual para "
                f"**CONIITI 2026** de la Universidad Católica de Colombia. 🤖\n\n"
                "Veo que aún no tienes charlas reservadas — ¿te muestro el programa para que elijas? 🎤 "
                "O si tienes otra duda, con gusto te ayudo. 😊"
            )
        else:
            return (
                "👋 ¡Hola! Soy **Rogelio**, tu asistente virtual para "
                "**CONIITI 2026** de la Universidad Católica de Colombia. 🤖\n\n"
                "Puedo ayudarte con conferencias, inscripciones, tarifas, sedes y más. "
                "¿Qué deseas hacer hoy? 😊"
            )

    if _es_saludo:
        if profile:
            activas = [r for r in user_regs if r.get("registration_status") != "cancelado"]
            agenda_str = f" Tienes **{len(activas)} charla(s)** en tu agenda 🗂️." if activas else ""
            return f"👋 ¡Hola{greeting}! ¿Cómo estás?{agenda_str} ¿En qué te puedo ayudar hoy? 😊"
        return "👋 ¡Hola! Soy **Rogelio**, tu asistente virtual para **CONIITI 2026**. ¿En qué te puedo ayudar hoy? 😊"

    # ── Solo "¿quién eres?" sin saludo → presentación directa ────────────────
    if _pregunta_identidad:
        activas = [r for r in user_regs if r.get("registration_status") != "cancelado"]
        if profile and activas:
            prox = sorted(activas, key=lambda r: r.get("schedule") or "")
            prox_title = prox[0].get("title", "") if prox else ""
            return (
                f"Soy **Rogelio**, tu asistente virtual para **CONIITI 2026**{greeting}. 🤖\n\n"
                f"Tienes **{len(activas)} charla(s)** reservadas"
                + (f" — la próxima es **{prox_title}** 🎤" if prox_title else "")
                + ". ¿Qué deseas hacer hoy? 😊"
            )
        if profile:
            return (
                f"Soy **Rogelio**, tu asistente virtual para **CONIITI 2026**{greeting}. 🤖\n\n"
                "Aún no tienes charlas reservadas — ¿quieres explorar el programa? 🎤 😊"
            )
        return (
            "Soy **Rogelio**, el asistente virtual oficial de **CONIITI 2026** 🤖 "
            "de la Universidad Católica de Colombia. "
            "Puedo ayudarte con conferencias, inscripciones, tarifas, sedes y más. ¿Qué deseas? 😊"
        )

    # ── Preguntas meta sobre el bot / el evento ──────────────────────────────
    if _any(msg, [
        "en qué me puedes", "en que me puedes", "para qué sirves", "para que sirves",
        "qué puedes hacer", "que puedes hacer", "qué haces", "que haces",
        "cómo me ayudas", "como me ayudas", "qué sabes", "que sabes",
        "en qué ayudas", "en que ayudas", "qué ofreces", "que ofreces",
        "cuéntame de ti", "cuentame de ti",
        "para qué estás", "para que estas",
    ]):
        activas = [r for r in user_regs if r.get("registration_status") != "cancelado"]
        extra = f" Ya tienes **{len(activas)} charla(s)** en tu agenda 🗂️." if activas else ""
        return (
            f"🤖 Soy **Rogelio**, tu guía personal en **CONIITI 2026** de la Universidad Católica de Colombia.{extra} "
            "Puedo ayudarte con:\n\n"
            "- 🎤 Ver y filtrar el **programa de conferencias**\n"
            "- ✅ **Inscribirte** a las charlas que te interesen\n"
            "- 👨‍🏫 Conocer **ponentes**, fechas, salas y cupos disponibles\n"
            "- 🔒 **Cambiar contraseña**, actualizar perfil o gestionar tu cuenta\n"
            "- 📜 Resolver dudas sobre **sedes**, certificados y códigos QR\n\n"
            "¿Por dónde empezamos? 😊"
        )

    # ── Qué es / de qué trata el evento ──────────────────────────────────────
    if _any(msg, [
        "qué es coniiti", "que es coniiti", "qué es el congreso", "que es el congreso",
        "de qué trata", "de que trata", "de qué se trata", "de que se trata",
        "sobre el evento", "qué es el evento", "que es el evento",
        "cuéntame del evento", "cuentame del evento", "qué evento es", "que evento es",
        "información del evento", "informacion del evento", "de que va",
    ]):
        n_conf = len([c for c in conferences if c.get("is_active", True)])
        conf_str = f" Con **{n_conf} conferencias** confirmadas," if n_conf else ""
        return (
            f"🎓 **CONIITI 2026** es el Congreso Internacional de Innovación, Investigación e Ingeniería, "
            f"organizado por la **Universidad Católica de Colombia** en Bogotá.{conf_str} "
            "es el encuentro más importante del país para hablar de:\n\n"
            "- 🤖 Inteligencia Artificial y Machine Learning\n"
            "- 🔐 Ciberseguridad e Infraestructura\n"
            "- 💻 Desarrollo de Software y Arquitecturas\n"
            "- 🏙️ Ciudades Inteligentes y Transformación Digital\n"
            "- 🌐 Tecnología, Sociedad e Innovación\n\n"
            "¿Hay algún tema que te llame especialmente la atención? 💡"
        )

    # ── Fuera de tema — después de saludos ────────────────────────────────────
    if _is_off_topic(msg) and len(msg) > 8:
        return (
            f"Lo siento{greeting}, ese tema está fuera de lo que puedo ayudarte. "
            "Soy **Rogelio**, tu asistente exclusivo para **CONIITI 2026** de la Universidad Católica de Colombia. "
            "Si tienes alguna duda sobre el congreso, con gusto te ayudo."
        )

    # ── Proceso de inscripción (¿CÓMO me inscribo?) — ANTES del listado ────────
    # Detecta preguntas de PROCESO: "cómo inscribirse", "quiero inscribirme", etc.
    is_inscription_process = _any(msg, [
        "cómo me inscribo", "como me inscribo", "cómo inscribirme", "como inscribirme",
        "cómo registro", "como registro", "quiero inscribirme", "quiero registrarme",
        "pasos para inscribirme", "proceso de inscripción", "proceso de inscripcion",
        "cómo participar", "como participar",
    ])
    is_inscription_action = _any(msg, [
        "inscribi", "inscripción", "inscripcion", "registrar", "apuntar",
        "participar", "quiero ir", "cómo entro", "como entro",
    ]) and not _any(msg, ["mis inscripciones", "mis conferencias", "estoy inscrito",
                          "cuáles hay", "cuales hay", "qué hay", "que hay", "listar",
                          "mostrar", "ver conferencias", "lista de", "cuántas", "cuantas",
                          "tarifa", "tarifas", "precio", "costo", "cuánto", "cuanto",
                          "valor", "cobran", "plan", "planes"])

    if is_inscription_process or is_inscription_action:
        if profile:
            return (
                f"¡Claro{greeting}! 🎉 Para inscribirte a una conferencia de **CONIITI 2026** sigue estos pasos:\n\n"
                "1. 📋 Ve a la sección **Conferencias** en el menú lateral\n"
                "2. 🔍 Explora el programa y elige la charla que más te interese\n"
                "3. ✅ Haz clic en el botón **Inscribirse**\n"
                "4. 📧 ¡Listo! Recibirás un correo de confirmación con tu **código QR** de acceso\n\n"
                "Puedes inscribirte a varias conferencias siempre que tengan cupos disponibles. ¿Hay alguna charla en particular que te interese? 🎤"
            )
        else:
            return (
                "Para inscribirte a las conferencias de **CONIITI 2026** primero necesitas una cuenta activa 👤:\n\n"
                "1. 📝 Regístrate en el portal del evento si aún no tienes cuenta\n"
                "2. 💳 Completa el **proceso de pago o registro** según las indicaciones del congreso\n"
                "3. 📋 Con tu cuenta activa, ve a **Conferencias** en el panel\n"
                "4. ✅ Selecciona la charla y haz clic en **Inscribirse**\n"
                "5. 📧 ¡Listo! Recibirás confirmación con tu **código QR**\n\n"
                "¿Necesitas ayuda para crear tu cuenta? 😊"
            )

    # ── Mis inscripciones ─────────────────────────────────────────────────────
    if _any(msg, ["mis inscripciones", "mis conferencias", "a qué estoy", "a que estoy",
                  "qué tengo", "que tengo", "estoy inscrito", "historial", "mis charlas"]):
        activas = [r for r in user_regs if r.get("registration_status") != "cancelado"]
        if activas:
            lineas = [f"🗂️ Tienes **{len(activas)} inscripción(es) activa(s)** en CONIITI 2026:\n"]
            for r in activas:
                title   = r.get("title", "Sin título")
                speaker = r.get("speaker_name") or ""
                sched   = r.get("schedule") or ""
                room    = r.get("room_name") or ""
                line = f"- 🎤 **{title}**"
                if speaker:
                    line += f" — {speaker}"
                if sched:
                    try:
                        dt = _dt.fromisoformat(str(sched).replace("Z", "+00:00"))
                        line += f" | {dt.strftime('%d/%m/%Y a las %H:%M')}"
                    except Exception:
                        pass
                if room:
                    line += f" | {room}"
                lineas.append(line)
            return "\n".join(lineas)
        elif profile:
            return (
                f"📭 Hola{greeting}, aún no tienes inscripciones activas en CONIITI 2026. "
                "¿Te gustaría que te mostrara las conferencias disponibles para que elijas alguna? 🎤"
            )
        return (
            "Para ver tus inscripciones ve a **Mis Inscripciones** 🗂️ en el menú lateral. "
            "Allí aparecen todas las conferencias a las que te has registrado."
        )

    # ── Cancelar inscripción ──────────────────────────────────────────────────
    if _any(msg, ["cancelar", "desinscribir", "quitar inscripcion", "eliminar inscripcion",
                  "no puedo ir", "ya no voy", "retirarme"]):
        return (
            f"Sin problema{greeting}, te explico cómo cancelar 👇:\n\n"
            "1. 🗂️ Ve a **Mis Inscripciones** en el menú lateral\n"
            "2. 🔍 Selecciona la conferencia que quieres cancelar\n"
            "3. ❌ Haz clic en **Cancelar inscripción**\n\n"
            "Recibirás una notificación de confirmación 📧 y el cupo quedará disponible para otros participantes."
        )

    # ── Conferencias / programa / agenda — listado (con filtro de tema si aplica) ─
    # Excluir preguntas específicas de usuario que también contienen "conferencia/horario"
    _es_pregunta_personal = _any(msg, [
        "proxima", "próxima", "mi agenda", "mis actividades",
        "conflicto", "choque", "mismo horario", "se cruzan",
        "a que estoy", "a qué estoy", "mis conferencias",
    ])
    if not _es_pregunta_personal and _any(msg, ["conferencia", "charla", "ponencia", "agenda", "programa",
                  "horario", "sesión", "sesion", "taller", "workshop", "keynote",
                  "cuáles hay", "cuales hay", "qué hay", "que hay", "listar", "mostrar"]):
        if conferences:
            activas_conf = [c for c in conferences if c.get("is_active", True)]
            if activas_conf:
                # Detectar si el mensaje tiene un filtro de tema específico
                topic_filter_terms = [
                    "inteligencia artificial", "machine learning", "ciberseguridad",
                    "cloud", "devops", "software", "datos", "iot", "blockchain",
                    "digital", "seguridad", "sistemas", "redes", "ingenier", "innovaci",
                ]
                ia_in_msg = bool(re.search(r"\bia\b|\bai\b|\bml\b", msg))
                topic_words = [t for t in topic_filter_terms if t in msg]

                if topic_words or ia_in_msg:
                    # Filtrar por el tema mencionado
                    palabras_filtro = topic_words + (["ia", "inteligencia", "machine"] if ia_in_msg else [])
                    filtradas = [
                        c for c in activas_conf
                        if any(
                            p in (c.get("title", "") + " " + (c.get("category") or "") + " " + (c.get("description") or "")).lower()
                            for p in palabras_filtro
                        )
                    ]
                    if filtradas:
                        tema_label = ", ".join(topic_words[:2]) or "IA"
                        lineas = [f"🔎 Encontré **{len(filtradas)} conferencia(s)** sobre **{tema_label}** en CONIITI 2026:\n"]
                        for c in filtradas[:8]:
                            title   = c.get("title", "Sin título")
                            speaker = c.get("speaker_name") or ""
                            sched   = c.get("schedule") or ""
                            avail   = c.get("capacity", 0) - c.get("registered_count", 0)
                            cupos   = "llena" if avail <= 0 else f"{avail} cupos"
                            line    = f"- **{title}**"
                            if speaker:
                                line += f" — {speaker}"
                            if sched:
                                try:
                                    dt = _dt.fromisoformat(str(sched).replace("Z", "+00:00"))
                                    line += f" | {dt.strftime('%d/%m %H:%M')}"
                                except Exception:
                                    pass
                            line += f" | {cupos}"
                            lineas.append(line)
                        return "\n".join(lineas)

                # Sin filtro de tema — mostrar todo el programa
                lineas = [f"📅 Estas son las **{len(activas_conf)} conferencias** disponibles en CONIITI 2026:\n"]
                for c in activas_conf[:10]:
                    title   = c.get("title", "Sin título")
                    speaker = c.get("speaker_name") or ""
                    sched   = c.get("schedule") or ""
                    avail   = c.get("capacity", 0) - c.get("registered_count", 0)
                    cupos   = "llena" if avail <= 0 else f"{avail} cupos"
                    line    = f"- **{title}**"
                    if speaker:
                        line += f" — {speaker}"
                    if sched:
                        try:
                            dt = _dt.fromisoformat(str(sched).replace("Z", "+00:00"))
                            line += f" | {dt.strftime('%d/%m %H:%M')}"
                        except Exception:
                            pass
                    line += f" | {cupos}"
                    lineas.append(line)
                if len(activas_conf) > 10:
                    lineas.append(f"\n_...y {len(activas_conf) - 10} más. Ve a **Conferencias** en el panel para ver el programa completo._")
                return "\n".join(lineas)
        return (
            "📅 Puedes ver **todas las conferencias de CONIITI 2026** en la sección "
            "**Conferencias** del panel. Allí encuentras título, ponente, fecha, sala y cupos disponibles."
        )

    # ── Sede / Ubicación ──────────────────────────────────────────────────────
    if _any(msg, ["dónde", "donde", "lugar", "sede", "ubicación", "ubicacion",
                  "dirección", "direccion", "campus", "instalaciones", "cómo llegar",
                  "como llegar", "mapa", "salón", "salon", "sala", "aula"]):
        return (
            "📍 **CONIITI 2026** se realiza en la **Universidad Católica de Colombia**, Bogotá.\n\n"
            "**Sedes del evento:**\n"
            "- 🏛️ **Sede Claustro**: Carrera 13 #47-49, Bogotá — edificio principal\n"
            "- 🏢 **Sede Las Torres**: Avenida Caracas #46-72, Bogotá — Torre Norte y Torre Sur\n"
            "- 🔬 **Sede 4**: Diagonal 46A #15B-10, Bogotá — bloque de ingenierías\n\n"
            "Cada conferencia indica su sala exacta en la sección **Conferencias** del panel. 🗺️"
        )

    # ── Fechas / Cuándo ───────────────────────────────────────────────────────
    # Usa word-boundary para keywords cortas que generan falsos positivos:
    # "dia" en "estudiante", "mes" en "semestre", "año" en "semana", etc.
    _fecha_match = (
        _any(msg, ["cuándo", "cuando", "fecha", "próximo", "proximo", "qué semana", "que semana"])
        or bool(re.search(r"\b(dia|día|mes|año)\b", msg))
    )
    if _fecha_match:
        if conferences:
            fechas = set()
            for c in conferences:
                sched = c.get("schedule")
                if sched:
                    try:
                        dt = _dt.fromisoformat(str(sched).replace("Z", "+00:00"))
                        fechas.add(dt.strftime("%d/%m/%Y"))
                    except Exception:
                        pass
            if fechas:
                fechas_str = ", ".join(sorted(fechas))
                return (
                    f"📅 Las conferencias de **CONIITI 2026** están programadas para: **{fechas_str}**.\n\n"
                    "Ve a la sección **Conferencias** del panel para ver el horario exacto de cada sesión. ⏰"
                )
        return (
            "📅 **CONIITI 2026** se celebra en 2026 en la Universidad Católica de Colombia.\n\n"
            "Consulta la sección **Conferencias** del panel para ver las fechas y horarios exactos de cada sesión."
        )

    # ── Cupos ─────────────────────────────────────────────────────────────────
    if _any(msg, ["cupo", "cupos", "disponible", "lleno", "llena", "capacidad",
                  "hay espacio", "quedan"]):
        if conferences:
            con_cupos  = [c for c in conferences if (c.get("capacity", 0) - c.get("registered_count", 0)) > 0]
            sin_cupos  = [c for c in conferences if (c.get("capacity", 0) - c.get("registered_count", 0)) <= 0]
            return (
                f"🎫 De las **{len(conferences)}** conferencias: "
                f"**{len(con_cupos)}** tienen cupos libres ✅ y **{len(sin_cupos)}** están llenas 🔴.\n\n"
                "Los cupos se actualizan en tiempo real — ve a **Conferencias** y asegura tu lugar antes de que se llenen. 🏃"
            )
        return (
            "🎫 Los cupos de cada conferencia se muestran en tiempo real en **Conferencias** del panel. "
            "¡Inscríbete pronto, los cupos son limitados! ⚡"
        )

    # ── Certificados ──────────────────────────────────────────────────────────
    if _any(msg, ["certificado", "diploma", "constancia", "comprobante", "acreditar"]):
        return (
            "📜 Los **certificados de asistencia** de CONIITI 2026 se emiten al finalizar el evento:\n\n"
            "1. ✅ Asiste a las conferencias inscritas\n"
            "2. 📊 Al cerrar el evento se registra tu asistencia\n"
            "3. 📧 Recibes el certificado en tu correo electrónico\n\n"
            "Revisa **Notificaciones** 🔔 para conocer el estado de tu certificado."
        )

    # ── QR ────────────────────────────────────────────────────────────────────
    if _any(msg, ["qr", "código qr", "codigo qr", "escanear", "lector"]):
        return (
            "📲 El **código QR** es tu pase de acceso a cada conferencia de CONIITI 2026.\n\n"
            "Lo encuentras en:\n"
            "- 📧 El correo de confirmación que recibes al inscribirte\n"
            "- 🗂️ La sección **Mis Inscripciones** del panel\n\n"
            "Preséntalo al ingresar al salón para registrar tu asistencia. ✅"
        )

    # ── Ponentes / Speakers ───────────────────────────────────────────────────
    if _any(msg, ["ponente", "speaker", "expositor", "quien habla", "quién habla",
                  "quién da", "quien da", "investigador", "experto"]):
        if conferences:
            ponentes = list({c["speaker_name"] for c in conferences if c.get("speaker_name")})
            if ponentes:
                lineas = [f"🎓 Los ponentes confirmados de CONIITI 2026 son ({len(ponentes)}):\n"]
                for p in ponentes[:12]:
                    lineas.append(f"- 👨‍🏫 {p}")
                if len(ponentes) > 12:
                    lineas.append(f"\n_...y {len(ponentes) - 12} más. Ver perfil completo en **Conferencias** del panel._")
                return "\n".join(lineas)
        return (
            "👨‍🏫 Conoce a los **ponentes de CONIITI 2026** en la sección **Conferencias** del panel. "
            "Allí encontrarás el perfil, especialidad e institución de cada expositor. 🎓"
        )

    # ── Temas / Categorías / IA / Tech ───────────────────────────────────────
    # No activa si el mensaje es una pregunta de perfil/recomendación (para no solaparse)
    _es_perfil_query = _any(msg, ["soy estudiante", "soy de", "voy en", "me interesa",
                                   "me gusta", "quiero aprender", "quiero trabajar",
                                   "me apasiona", "tengo interés"])
    tema_detected = not _es_perfil_query and (
        _any(msg, [
            "tema", "área", "area", "tópico", "topico", "inteligencia artificial",
            "ciberseguridad", "machine learning", "desarrollo", "sistemas",
            "datos", "transformación digital", "cloud", "devops", "iot",
            "blockchain", "ingenier", "tecnolog", "seguridad informatica",
            "seguridad informática",
        ]) or bool(re.search(r"\bia\b|\bai\b|\bml\b|\biot\b", msg))
    )

    if tema_detected:
        # Si hay conferencias, busca las relevantes al tema mencionado
        if conferences:
            msg_words = set(msg.split())
            # Palabras clave técnicas que pueden aparecer en el título/categoría
            tech_terms = ["ia", "inteligencia", "machine", "ml", "ciberseguridad",
                          "cloud", "devops", "software", "datos", "iot", "blockchain",
                          "digital", "seguridad", "sistemas", "innovaci"]
            relevant = [
                c for c in conferences
                if c.get("is_active", True) and any(
                    t in (c.get("title", "") + " " + (c.get("category") or "")).lower()
                    for t in tech_terms if t in msg or re.search(r"\b" + t + r"\b", msg)
                )
            ]
            # Si no encuentra relevantes, muestra las categorías disponibles
            cats = list({c["category"] for c in conferences if c.get("category")})
            if relevant:
                lineas = [f"💡 ¡Sí! Hay **{len(relevant)} conferencia(s)** relacionadas con ese tema en CONIITI 2026:\n"]
                for c in relevant[:8]:
                    title   = c.get("title", "Sin título")
                    speaker = c.get("speaker_name") or ""
                    avail   = c.get("capacity", 0) - c.get("registered_count", 0)
                    cupos   = "🔴 llena" if avail <= 0 else f"✅ {avail} cupos"
                    line = f"- 🎤 **{title}**"
                    if speaker:
                        line += f" — {speaker}"
                    line += f" | {cupos}"
                    lineas.append(line)
                return "\n".join(lineas)
            elif cats:
                return (
                    "💡 Las categorías del programa de CONIITI 2026 son:\n\n"
                    + "\n".join(f"- **{cat}**" for cat in sorted(cats))
                    + "\n\nExplora **Conferencias** en el panel para ver todas las charlas por categoría. 🔍"
                )
        return (
            "💡 **CONIITI 2026** cubre los principales temas de ingeniería:\n\n"
            "- 🤖 **Inteligencia Artificial y Co-existencia**\n"
            "- 💻 **Ingeniería de Software y Sistemas de Información**\n"
            "- 🏙️ **Ciudades Inteligentes y Desarrollo Sostenible**\n"
            "- 🔐 **Seguridad, Privacidad e Infraestructura**\n"
            "- 🌐 **Tecnología, Sociedad e Innovación**\n\n"
            "Filtra por categoría en **Conferencias** del panel para encontrar las charlas de tu interés. 🔍"
        )

    # ── Qué es CONIITI (handler redundante — el principal está en meta-preguntas) ──
    if _any(msg, ["qué es coniiti", "que es coniiti", "qué es el congreso",
                  "de qué trata", "sobre el evento", "información del evento",
                  "quien organiza", "quién organiza"]):
        n_conf3 = len([c for c in conferences if c.get("is_active", True)])
        conf_str3 = f" Con **{n_conf3} conferencias** confirmadas," if n_conf3 else ""
        return (
            f"🎓 **CONIITI 2026** es el **Congreso Internacional de Innovación, Investigación e Ingeniería** "
            f"organizado por la **Universidad Católica de Colombia** junto con sus facultades, grupos de investigación y aliados estratégicos.{conf_str3} "
            "reúne estudiantes, investigadores, docentes, empresas y expertos nacionales e internacionales. 🌐\n\n"
            "🇮🇹 Este año **Italia** es el país invitado. Los temas incluyen:\n\n"
            "- 🤖 Inteligencia Artificial y Machine Learning\n"
            "- 🔐 Ciberseguridad e Infraestructura\n"
            "- 💻 Desarrollo de Software y Arquitecturas\n"
            "- 🏙️ Ciudades Inteligentes y Transformación Digital\n"
            "- 🌐 Tecnología, Sociedad e Innovación\n\n"
            "¿Quieres ver el programa o hay algo específico en lo que pueda orientarte? 😊"
        )

    # ── Identidad del usuario (¿quién soy yo? / ¿con qué correo?) ───────────────
    if _any(msg, ["quién soy", "quien soy", "cuál es mi nombre", "cual es mi nombre",
                  "cómo me llamo", "como me llamo", "mi nombre", "cuál es mi correo",
                  "cual es mi correo", "con qué correo", "con que correo",
                  "qué usuario", "que usuario", "mis datos"]):
        if profile:
            nombre = profile.get("full_name") or "no registrado"
            ciudad = profile.get("country_city") or ""
            activas = [r for r in user_regs if r.get("registration_status") != "cancelado"]
            resp = f"👤 Estás registrado como **{nombre}**"
            if ciudad:
                resp += f", de **{ciudad}**"
            resp += ".\n\n"
            if activas:
                resp += f"📋 Tienes **{len(activas)} inscripción(es)** activa(s) en CONIITI 2026."
            else:
                resp += "📭 Aún no tienes inscripciones activas."
            return resp
        return "🔑 Para ver tus datos debes iniciar sesión primero. Ve a la pantalla de acceso del portal."

    # ── Próxima conferencia / actividades mañana ──────────────────────────────
    if _any(msg, ["próxima conferencia", "proxima conferencia", "cuál es mi próxima",
                  "cual es mi proxima", "qué tengo mañana", "que tengo mañana",
                  "actividades mañana", "actividades manana", "qué hay mañana",
                  "que hay mañana", "mi agenda", "mi próxima actividad",
                  "mi proxima actividad"]):
        activas = [r for r in user_regs if r.get("registration_status") != "cancelado"]
        if activas:
            # Ordenar por fecha
            def _get_sched(r):
                try:
                    return _dt.fromisoformat(str(r.get("schedule", "")).replace("Z", "+00:00"))
                except Exception:
                    return _dt.max
            ordenadas = sorted(activas, key=_get_sched)
            prox = ordenadas[0]
            title  = prox.get("title", "Sin título")
            sched  = _fmt_sched(prox.get("schedule"))
            room   = prox.get("room_name") or ""
            campus = prox.get("campus_name") or ""
            loc    = ", ".join(filter(None, [campus, room]))
            resp = f"📅 Tu próxima actividad en CONIITI 2026 es:\n\n🎤 **{title}**"
            if sched:
                resp += f"\n⏰ {sched}"
            if loc:
                resp += f"\n📍 {loc}"
            if len(ordenadas) > 1:
                resp += f"\n\nAdemás tienes **{len(ordenadas) - 1}** actividad(es) más en tu agenda."
            return resp
        elif profile:
            return f"📭 Hola{greeting}, aún no tienes actividades registradas. ¿Quieres que te muestre las conferencias disponibles? 🎤"
        return "🔑 Para ver tu agenda personalizada necesitas iniciar sesión en el portal."

    # ── Conflicto de horarios ─────────────────────────────────────────────────
    if _any(msg, ["conflicto", "choque", "mismo horario", "se cruzan", "solapan",
                  "misma hora", "coinciden", "problema de horario"]):
        activas = [r for r in user_regs if r.get("registration_status") != "cancelado"]
        if not activas:
            return f"✅ No tienes inscripciones activas, así que no hay conflictos{greeting}."
        conflictos = []
        for i, a in enumerate(activas):
            for b in activas[i + 1:]:
                try:
                    ta = _dt.fromisoformat(str(a.get("schedule", "")).replace("Z", "+00:00"))
                    tb = _dt.fromisoformat(str(b.get("schedule", "")).replace("Z", "+00:00"))
                    dur_a = a.get("duration_minutes", 60)
                    if abs((ta - tb).total_seconds()) < dur_a * 60:
                        conflictos.append((a.get("title", "?"), b.get("title", "?")))
                except Exception:
                    pass
        if conflictos:
            lineas = [f"⚠️ Detecté **{len(conflictos)} conflicto(s) de horario** en tu agenda:\n"]
            for t1, t2 in conflictos:
                lineas.append(f"- 🔴 **{t1}** se cruza con **{t2}**")
            lineas.append("\n¿Quieres cancelar alguna de estas inscripciones? Ve a **Mis Inscripciones** del panel.")
            return "\n".join(lineas)
        return f"✅ ¡Todo bien{greeting}! No hay conflictos de horario en tus inscripciones actuales. 🎉"

    # ── Italia / País invitado ─────────────────────────────────────────────────
    if _any(msg, ["italia", "italian", "país invitado", "pais invitado",
                  "invitado de honor", "país de honor", "viene de italia",
                  "universidades italianas", "empresas italianas", "aporta italia",
                  "industria 4.0", "manufactura avanzada"]):
        if _any(msg, ["empresa", "compañía", "compania", "referente"]):
            return (
                "🇮🇹 Como país invitado de CONIITI 2026, Italia trae consigo referentes tecnológicos de talla mundial:\n\n"
                "- ✈️ **Leonardo** — defensa, aeroespacial y seguridad avanzada\n"
                "- 💻 **STMicroelectronics** — semiconductores e IoT\n"
                "- 🖥️ **Olivetti** — tecnología e innovación digital\n"
                "- 🏎️ **Ferrari** — innovación automotriz y manufactura de precisión\n"
                "- 🏭 **Pirelli** — manufactura inteligente y materiales avanzados\n\n"
                "_Esta información es de contexto general. La participación específica estará en el programa oficial._ 📋"
            )
        if _any(msg, ["universidad", "académic", "academica", "institución", "institucion"]):
            return (
                "🎓 Las universidades italianas que participan en CONIITI 2026 estarán registradas en el programa oficial del evento. "
                "Italia cuenta con instituciones de primer nivel como el **Politecnico di Milano**, **La Sapienza** y el "
                "**Politecnico di Torino**, reconocidas mundialmente en ingeniería e innovación. 🇮🇹\n\n"
                "Consulta el programa oficial para los detalles de participación confirmada. 📋"
            )
        if _any(msg, ["por qué", "porque", "razón", "razon", "motivo"]):
            return (
                "🇮🇹 Italia es el país invitado de **CONIITI 2026** por su destacada relación académica, científica y tecnológica "
                "con Colombia, y por su liderazgo en:\n\n"
                "- 🏭 **Industria 4.0** y manufactura avanzada\n"
                "- 🤖 **Robótica** de precisión\n"
                "- 🎨 **Diseño industrial** de clase mundial\n"
                "- 🧠 **Inteligencia Artificial** aplicada\n"
                "- 🔬 **Investigación universitaria** de alto impacto\n\n"
                "Una conexión que enriquece enormemente el congreso. 🌐"
            )
        # Respuesta general sobre Italia
        return (
            "🇮🇹 **¡Italia es el país invitado de CONIITI 2026!** Esto es una de las grandes novedades del congreso.\n\n"
            "Italia destaca en:\n"
            "- 🏭 Industria 4.0 y manufactura avanzada\n"
            "- 🤖 Robótica y automatización\n"
            "- 🎨 Diseño industrial\n"
            "- 🧠 Inteligencia Artificial\n"
            "- 🔬 Investigación universitaria de alto nivel\n\n"
            "¿Quieres saber sobre las empresas italianas referentes, las universidades participantes o por qué Italia fue elegida? 😊"
        )

    # ── Recomendaciones inteligentes por perfil ───────────────────────────────
    if _any(msg, ["recomiend", "recomendaci", "qué me sugieres", "que me sugieres",
                  "qué debo ver", "que debo ver", "qué me conviene", "que me conviene",
                  "por dónde empezar", "por donde empezar", "cómo aprovechar", "como aprovechar",
                  "me interesa", "me gusta", "me apasiona", "tengo interés", "tengo interes",
                  "quiero aprender", "quiero trabajar", "soy estudiante", "voy en",
                  "soy de", "en qué área", "en que area", "qué área", "que area",
                  "investigación me", "investigacion me", "emprendimiento", "quiero ser"]):

        activas_conf = [c for c in conferences if c.get("is_active", True)]

        # Perfil: quiere trabajar en Europa
        if _any(msg, ["europa", "europe", "exterior", "extranjero", "internacional", "italia"]):
            return (
                f"🌍 ¡Excelente objetivo{greeting}! Para conectar con el mercado europeo en CONIITI 2026 te recomiendo:\n\n"
                "- 🇮🇹 Las actividades con la delegación de **Italia** (país invitado) — ideal para networking internacional\n"
                "- 🤖 Conferencias de **IA e Industria 4.0** — áreas donde Europa lidera\n"
                "- 🔐 Sesiones de **Ciberseguridad** — alta demanda en la Unión Europea\n"
                "- 🤝 Espacios de **networking** con ponentes internacionales\n\n"
                "Además, los certificados de CONIITI son un gran respaldo para tu hoja de vida internacional. 📜"
            )

        # Perfil: investigación
        if _any(msg, ["investigación", "investigacion", "investigador", "investigar", "académico", "academico"]):
            cats = list({c.get("category") for c in activas_conf if c.get("category")})
            return (
                f"🔬 Para alguien enfocado en investigación{greeting}, CONIITI 2026 es una mina de oro:\n\n"
                "- 📚 Asiste a las ponencias académicas — conectarás con investigadores de todo el país\n"
                "- 🤝 Haz networking con los ponentes — muchos vienen de grupos de investigación universitaria\n"
                + (f"- 🏷️ Explora conferencias en: {', '.join(cats[:3])}\n" if cats else "")
                + "- 🇮🇹 Las actividades con Italia abren puertas a colaboraciones internacionales\n\n"
                "¿Hay alguna línea de investigación específica que te interese? 💡"
            )

        # Perfil: emprendimiento
        if _any(msg, ["emprendimiento", "emprendedor", "startup", "empresa", "negocio", "innovar"]):
            return (
                f"🚀 ¡Para emprendedores{greeting}, CONIITI 2026 tiene mucho que ofrecer!\n\n"
                "- 💡 **Transformación Digital** — cómo la tecnología cambia los modelos de negocio\n"
                "- 🏭 **Industria 4.0** — automatización y eficiencia (contexto italiano muy relevante)\n"
                "- 🌐 **Cloud y DevOps** — infraestructura para escalar startups\n"
                "- 🤝 Espacios de networking con empresas y mentores del sector tech\n\n"
                "Aprovecha también los talleres prácticos — son perfectos para aplicar ideas desde el día uno. ⚡"
            )

        # Perfil: hoja de vida / CV / prácticas
        if _any(msg, ["hoja de vida", "cv", "curriculum", "prácticas", "practicas",
                      "empleo", "trabajo", "conseguir empleo", "internship"]):
            return (
                f"📄 ¡Muy bien pensado{greeting}! Para fortalecer tu hoja de vida en CONIITI 2026:\n\n"
                "- 📜 **Asiste y certifícate** — cada certificado de asistencia suma a tu perfil\n"
                "- 🤝 **Networking** — habla con ponentes, son contactos de oro para prácticas\n"
                "- 💻 **Talleres prácticos** — demuestran habilidades técnicas reales\n"
                "- 🇮🇹 **Actividades con Italia** — visibilidad internacional\n"
                "- 🔐 **Ciberseguridad / Cloud / IA** — las áreas con más demanda laboral\n\n"
                "¿Hay algún área tecnológica específica en la que quieras enfocarte? 🎯"
            )

        # Perfil: estudiante de ingeniería de sistemas (genérico)
        if _any(msg, ["ingeniería de sistemas", "ingenieria de sistemas", "sistemas",
                      "estudiante de", "soy estudiante", "soy de", "voy en"]):
            semestre_bajo = _any(msg, ["primer", "segundo", "tercero", "primero",
                                       "1er", "2do", "3er", "1°", "2°", "3°",
                                       "primeros semestres", "inicio"])
            semestre_alto = _any(msg, ["quinto", "sexto", "séptimo", "octavo", "noveno", "décimo",
                                       "5°", "6°", "7°", "8°", "9°", "10°",
                                       "último semestre", "ultimo semestre", "graduarme"])
            if semestre_bajo:
                return (
                    f"🎓 ¡Perfecto que estés explorando desde temprano{greeting}!\n\n"
                    "Para estudiantes de primeros semestres en CONIITI 2026 te recomiendo:\n\n"
                    "- 💡 **Talleres introductorios** — aprendizaje práctico desde cero\n"
                    "- 🌐 **Transformación Digital** — entiende hacia dónde va la industria\n"
                    "- 🤝 **Networking** — conecta con seniors, mentores y empresas\n"
                    "- 🤖 **IA aplicada** — el tema más demandado de tu generación\n\n"
                    "Aprovecha cada charla para hacer preguntas y presentarte. ¡Los primeros contactos son los más valiosos! 🚀"
                )
            if semestre_alto:
                return (
                    f"🎓 ¡Ya estás en la recta final{greeting}!\n\n"
                    "Para alguien próximo a graduarse, CONIITI 2026 es clave:\n\n"
                    "- 🔐 **Ciberseguridad** y ☁️ **Cloud** — áreas con altísima demanda laboral\n"
                    "- 🤖 **IA y Machine Learning** — el diferencial en cualquier hoja de vida\n"
                    "- 🤝 **Networking con empresas** — busca patrocinadores y reclutadores en el evento\n"
                    "- 🇮🇹 **Actividades internacionales** — si piensas en un posgrado en Europa\n"
                    "- 📜 **Certifícate en todo lo que puedas** — suma puntos antes de salir al mercado\n\n"
                    "¿Quieres que te muestre las conferencias disponibles para que elijas? 🎯"
                )
            # Genérico
            return (
                f"🎓 Como estudiante de Ingeniería de Sistemas{greeting}, CONIITI 2026 está hecho para ti. Te recomiendo:\n\n"
                "- 🤖 **Inteligencia Artificial** — el futuro de la profesión\n"
                "- 🔐 **Ciberseguridad** — alta demanda, buen salario\n"
                "- ☁️ **Cloud Computing** — habilidad fundamental hoy\n"
                "- 📊 **Ciencia de Datos** — para perfiles analíticos\n"
                "- ⚙️ **DevOps** — para los amantes del desarrollo ágil\n\n"
                "¿En cuál de estas áreas quieres profundizar? Te busco las conferencias exactas. 🔍"
            )

        # Recomendación genérica
        cats = list({c.get("category") for c in activas_conf if c.get("category")})
        return (
            f"Con gusto te oriento{greeting}! 😊 Cuéntame un poco más:\n\n"
            "- 🎓 ¿Eres estudiante? ¿En qué semestre?\n"
            "- 💼 ¿Trabajas en algún área tecnológica?\n"
            "- 💡 ¿Qué temas te interesan más? (IA, seguridad, cloud, datos...)\n"
            "- 🎯 ¿Qué objetivo tienes: aprender, hacer networking, conseguir prácticas?\n\n"
            "Con esa info te personalizo la agenda perfecta. 🗓️"
        )

    # ── Novedades CONIITI 2026 / actividades especiales ──────────────────────
    if _any(msg, ["novedad", "nuevo", "nuevo este año", "diferente", "qué cambió",
                  "qué hay nuevo", "este año", "edición 2026",
                  "actividades con empresas", "relacionada con empresa",
                  "prácticas profesionales", "conseguir practica",
                  "internacionales", "eventos internacionales"]):
        return (
            "✨ **Novedades de CONIITI 2026** respecto a ediciones anteriores:\n\n"
            "- 🇮🇹 **Italia como país invitado** — participación internacional de alto nivel\n"
            "- 🌐 **Carácter internacional** — se posiciona como congreso *Internacional*, no solo nacional\n"
            "- 🤖 **Mayor enfoque en IA Generativa** y tecnologías emergentes\n"
            "- 🤝 **Actividades con empresas** — networking directo con el sector productivo\n"
            "- 📜 **Certificados de participación** para todos los asistentes\n\n"
            "Para la información oficial y detallada de novedades, consulta el portal del evento o la sección **Conferencias** del panel. 📋"
        )

    # ── Comprobante / descarga de inscripción ─────────────────────────────────
    if _any(msg, ["comprobante", "descargo", "descargar", "comprobante de inscripción",
                  "comprobante de inscripcion", "cómo descargo", "como descargo"]):
        return (
            f"📥 Para descargar tu comprobante de inscripción{greeting}:\n\n"
            "1. 🗂️ Ve a la sección **Mis Inscripciones** en el menú lateral\n"
            "2. 🔍 Selecciona la conferencia correspondiente\n"
            "3. 📲 Encontrarás tu **código QR** y los detalles de la inscripción\n\n"
            "También recibes el comprobante en tu **correo electrónico** al momento de inscribirte. 📧"
        )

    # ── Contraseña / Seguridad ────────────────────────────────────────────────
    if _any(msg, ["contraseña", "contrasena", "password", "cambiar clave", "olvidé mi clave",
                  "seguridad", "cambiar contraseña", "nueva contraseña"]):
        return (
            f"🔒 Para cambiar tu contraseña{greeting}:\n\n"
            "1. ⚙️ Ve a **Ajustes** en el menú lateral\n"
            "2. 🔐 Abre el apartado **Seguridad**\n"
            "3. ✏️ Ingresa tu contraseña actual y la nueva\n"
            "4. 💾 Guarda los cambios\n\n"
            "¿Olvidaste tu contraseña? Usa **¿Olvidaste tu contraseña?** en la pantalla de inicio de sesión. 🔑"
        )

    # ── Perfil / Datos personales ─────────────────────────────────────────────
    if _any(msg, ["perfil", "datos personales", "actualizar nombre", "actualizar foto",
                  "cambiar foto", "cambiar nombre", "editar perfil"]):
        name_info = f"Tienes registrado el nombre **{user_name}**. " if user_name else ""
        return (
            f"👤 {name_info}Para actualizar tus datos personales{greeting}:\n\n"
            "1. 📋 Ve a **Mi Perfil** en el menú lateral\n"
            "2. ✏️ Haz clic en **Editar perfil**\n"
            "3. 📸 Actualiza tu nombre, foto o datos de contacto\n"
            "4. 💾 Guarda los cambios"
        )

    # ── Notificaciones / Correo ───────────────────────────────────────────────
    if _any(msg, ["notificación", "notificacion", "correo", "email", "aviso",
                  "no llegó", "no recibi"]):
        return (
            "🔔 Las notificaciones del evento llegan al correo con el que te registraste.\n\n"
            "También puedes verlas en **Notificaciones** del panel.\n\n"
            "Si no recibes correos, verifica:\n"
            "- 📧 Que tu email en **Mi Perfil** esté correcto\n"
            "- 📁 La carpeta de **spam o correo no deseado**"
        )

    # ── Acceso / Login ────────────────────────────────────────────────────────
    if _any(msg, ["acceder", "entrar", "iniciar sesión", "iniciar sesion", "login",
                  "no puedo acceder", "olvidé mi correo", "recuperar contraseña",
                  "no puedo entrar", "no me deja entrar"]):
        return (
            f"🔑 Para acceder al portal de **CONIITI 2026**{greeting}:\n\n"
            "- ✅ **Ya tienes cuenta:** ingresa con tu correo y contraseña\n"
            "- 🔒 **Olvidaste tu contraseña:** usa **¿Olvidaste tu contraseña?** en el login\n"
            "- 📝 **No tienes cuenta:** haz clic en **Crear cuenta** y sigue el proceso\n\n"
            "¿Con cuál de estos casos necesitas ayuda? 😊"
        )

    # ── Precio / Costo / Tarifas — siempre desde pricing.json ────────────────
    if _any(msg, ["precio", "costo", "coste", "costos", "costes",
                  "cuánto cuesta", "cuanto cuesta", "gratis", "gratuito",
                  "pago", "cobran", "tarifa", "tarifas", "valor", "valores",
                  "inscripcion cuesta", "cuanto vale", "cuánto vale",
                  "plan", "planes", "que planes", "cuáles son los planes",
                  "cuánto es", "cuanto es", "cuánto cobran", "cuanto cobran",
                  "cuánto hay que pagar", "cuanto hay que pagar",
                  "a cuanto", "a cuánto", "que precio", "qué precio"]):
        return format_pricing_response(greeting)

    # ── Presencial / Virtual ──────────────────────────────────────────────────
    if _any(msg, ["presencial", "virtual", "online", "en línea", "híbrido",
                  "transmisión", "stream"]):
        return (
            "🖥️ La modalidad (presencial, virtual o híbrida) de cada conferencia está indicada "
            "en su descripción dentro de la sección **Conferencias** del panel. "
            "Cada sesión explica claramente cómo participar. 📍"
        )

    # ── Contacto / Soporte ────────────────────────────────────────────────────
    if _any(msg, ["contacto", "soporte", "ayuda técnica", "problema", "error",
                  "fallo", "reportar", "hablar con", "organización"]):
        return (
            "📞 Para **soporte técnico o consultas** al equipo de CONIITI 2026, "
            "comunícate por los canales oficiales de la **Universidad Católica de Colombia**.\n\n"
            "Revisa también **Notificaciones** 🔔 del panel para mensajes del equipo organizador."
        )

    # ── Despedidas ────────────────────────────────────────────────────────────
    if _any(msg, ["gracias", "muchas gracias", "genial", "perfecto", "excelente", "listo", "ok"]):
        return f"¡Con gusto{greeting}! 😊 ¡Nos vemos en **CONIITI 2026**! 🎉"

    if _any(msg, ["chao", "adios", "adiós", "bye", "hasta luego", "nos vemos"]):
        return f"¡Hasta pronto{greeting}! 👋 ¡Nos vemos en **CONIITI 2026**!"

    # ── Preguntas de seguimiento / "¿qué más?" ───────────────────────────────
    if _any(msg, [
        "que mas", "qué más", "y que mas", "algo mas", "que mas hay",
        "que mas tienen", "que mas tenemos", "que hay de mas", "que hay alli",
        "que hay allí", "que mas puedo", "que mas se puede", "que mas existe",
        "que otras", "algo adicional", "cuéntame más", "cuentame mas",
        "amplíame", "ampliame", "más información", "mas informacion",
        "qué sigue", "que sigue", "qué más puedo", "que mas puedo",
    ]):
        activas = [r for r in user_regs if r.get("registration_status") != "cancelado"]
        activas_conf = [c for c in conferences if c.get("is_active", True)]
        sin_inscribir = [
            c for c in activas_conf
            if not any(r.get("title") == c.get("title") for r in activas)
        ]

        if profile and activas:
            # Tiene inscripciones — sugerir explorar más
            pendientes = len(sin_inscribir)
            cats = list({c["category"] for c in sin_inscribir[:6] if c.get("category")})
            cat_str = f" de temas como **{', '.join(cats[:2])}**" if cats else ""
            return (
                f"Además de tus **{len(activas)} charla(s) agendada(s)**, hay "
                f"**{pendientes} conferencia(s) más** disponibles{cat_str}. 🎤\n\n"
                "¿Quieres que te muestre las que tienen más cupos, o prefieres filtrar por algún tema en particular? 🔍"
            )

        if activas_conf:
            # Sin inscripciones — motivar a explorar
            cats = list({c["category"] for c in activas_conf if c.get("category")})
            con_cupos = [c for c in activas_conf if (c.get("capacity", 0) - c.get("registered_count", 0)) > 0]
            return (
                f"¡Hay bastante por explorar{greeting}! 🎓 Tenemos **{len(activas_conf)} conferencias** disponibles"
                + (f" en {len(cats)} categorías diferentes" if cats else "")
                + f", y **{len(con_cupos)}** aún tienen cupos libres. ✅\n\n"
                "Puedo mostrarte:\n"
                "- 🔍 El programa completo — escribe *«qué conferencias hay»*\n"
                "- 💡 Charlas por tema — escribe el tema que te interese (IA, seguridad, cloud...)\n"
                "- 📅 Fechas disponibles — escribe *«cuándo son»*\n\n"
                "¿Qué te llama la atención? 😊"
            )

        # Sin datos de conferencias
        return (
            f"Con gusto{greeting}! Además del programa de conferencias, puedo ayudarte con:\n\n"
            "- 🏛️ **Sedes y ubicaciones** del evento\n"
            "- 📋 **Proceso de inscripción** paso a paso\n"
            "- 📜 **Certificados** de asistencia\n"
            "- 📲 **Código QR** para acceso a las sesiones\n"
            "- 🔒 **Tu cuenta** — contraseña, perfil y sesiones activas\n\n"
            "¿Sobre cuál de estos temas quieres saber más? 😊"
        )

    # ── Búsqueda libre en títulos y descripciones de conferencias ─────────────
    if conferences and len(msg) >= 4:
        palabras = [w for w in re.split(r"[\s\W]+", msg) if len(w) >= 4]
        if palabras:
            relevantes = [
                c for c in conferences
                if c.get("is_active", True) and any(
                    p in (c.get("title", "") + " " + (c.get("description") or "") + " "
                          + (c.get("speaker_name") or "") + " " + (c.get("category") or "")).lower()
                    for p in palabras
                )
            ]
            if relevantes:
                lineas = [f"🔎 Encontré **{len(relevantes)} conferencia(s)** en CONIITI 2026 relacionadas con tu consulta:\n"]
                for c in relevantes[:8]:
                    title   = c.get("title", "Sin título")
                    speaker = c.get("speaker_name") or ""
                    sched   = c.get("schedule") or ""
                    avail   = c.get("capacity", 0) - c.get("registered_count", 0)
                    cupos   = "llena" if avail <= 0 else f"{avail} cupos"
                    line = f"- **{title}**"
                    if speaker:
                        line += f" — {speaker}"
                    if sched:
                        try:
                            dt = _dt.fromisoformat(str(sched).replace("Z", "+00:00"))
                            line += f" | {dt.strftime('%d/%m %H:%M')}"
                        except Exception:
                            pass
                    line += f" | {cupos}"
                    lineas.append(line)
                lineas.append("\n¿Te gustaría inscribirte a alguna de estas charlas? ✅")
                return "\n".join(lineas)

    # ── Respuesta por defecto — proactiva según el estado del usuario ─────────
    activas_d = [r for r in user_regs if r.get("registration_status") != "cancelado"]
    confs_d   = [c for c in conferences if c.get("is_active", True)]

    if profile and activas_d:
        # Usuario logueado con inscripciones activas
        pendientes_d = len([c for c in confs_d if not any(r.get("title") == c.get("title") for r in activas_d)])
        siguiente = activas_d[0]
        prox_title = siguiente.get("title", "")
        return (
            f"Cuéntame{greeting}, ¿en qué te puedo ayudar? 😊 "
            f"Tienes **{len(activas_d)} charla(s)** en tu agenda"
            + (f" — la próxima es **{prox_title}**" if prox_title else "")
            + (f" y hay **{pendientes_d}** conferencias más sin reservar. 🎤" if pendientes_d else ".")
        )

    if profile and confs_d:
        # Usuario logueado sin inscripciones
        con_cupos_d = [c for c in confs_d if (c.get("capacity", 0) - c.get("registered_count", 0)) > 0]
        return (
            f"Hola{greeting}! Hay **{len(con_cupos_d)} conferencias** con cupos disponibles en CONIITI 2026. 🎤 "
            "¿Quieres que te muestre el programa o buscas algo en particular? 🔍"
        )

    if confs_d:
        # Sin sesión pero hay conferencias
        return (
            f"¡Tenemos **{len(confs_d)} conferencias** en CONIITI 2026! 🎓 "
            "Puedo mostrarte el programa, explicarte cómo inscribirte o resolver cualquier duda. "
            "¿Qué quieres saber? 😊"
        )

    return (
        f"Cuéntame{greeting}, ¿en qué te puedo ayudar con **CONIITI 2026**? 😊 "
        "Pregúntame por conferencias, inscripciones, sedes, certificados o tu cuenta."
    )


def _any(text: str, keywords: list[str]) -> bool:
    return any(kw in text for kw in keywords)

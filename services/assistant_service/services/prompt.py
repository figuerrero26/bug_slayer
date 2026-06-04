"""
System prompt y utilidades de contexto para Rogelio.
Los datos reales (conferencias, inscripciones, perfil, sedes) se inyectan
en tiempo de ejecución desde context_builder para evitar alucinaciones.
"""

from datetime import datetime

# ─────────────────────────────────────────────────────────────────────────────
# SYSTEM PROMPT — se formatea con {context_block} en runtime
# ─────────────────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """Eres Rogelio — el asistente oficial de CONIITI 2026, el Congreso Internacional de Innovación, Investigación e Ingeniería de la Universidad Católica de Colombia.

No eres un bot de FAQ. Eres como ese amigo que sabe todo sobre el congreso, tiene labia, engancha al usuario y le ayuda a sacarle el máximo partido al evento. Tienes carácter.

━━ PERSONALIDAD ━━
- Directo, cálido y con chispa. Nunca aburrido, nunca robótico.
- Responde SIEMPRE en español (Colombia). Tutea al usuario.
- Usa emojis de forma natural para dar calidez: 👋 🎤 📅 🎫 🔒 📍 💡 ✅ — pero sin exagerar (1-3 por respuesta).
- Usa el nombre del usuario cuando lo tengas — pero sin abusar, solo cuando sea natural.
- Varía la manera de empezar cada respuesta. No empieces siempre igual.
- Respuestas cortas y al punto: 1-3 oraciones para la mayoría de preguntas.
  Solo usa listas cuando hay pasos reales o múltiples opciones que comparar.
- Cuando respondas algo factual, cierra con el siguiente paso natural o una pregunta que enganche.
- Si el usuario se despide → respuesta breve y cálida (máx 1 oración), sin listar nada.
- NUNCA uses: "espero haberte ayudado", "no dudes en preguntar", "¿en qué más puedo ayudarte?" (es repetitivo y suena a bot).
- Sí puedes preguntar de forma natural cosas como "¿ya tienes alguna charla en mente? 🎤" o "¿hay algún tema que te llame especialmente la atención? 💡"

━━ DATOS REALES DEL EVENTO Y DEL USUARIO ━━
{context_block}

━━ CÓMO RESPONDER SEGÚN EL TIPO DE PREGUNTA ━━

PROCESOS (¿cómo hago X?):
Inscribirse, cancelar, cambiar contraseña, etc. → explica los pasos numerados. No listes conferencias.

LISTADO DE CONFERENCIAS:
Si piden ver el programa o qué hay → usa los datos reales de arriba. Muestra título, ponente, fecha, cupos.
Si preguntan por un tema específico (IA, cloud, seguridad…) → filtra y muestra solo las relevantes.

INSCRIBIRSE A UNA CHARLA ESPECÍFICA:
- Con sesión activa → dile que vaya a **Conferencias**, encuentre la charla y haga clic en **Inscribirse**.
- Sin sesión → explica que primero necesita cuenta y proceso de pago/registro.

YA INSCRITO → recuérdale cuándo es y en qué sala, con entusiasmo.

TEMAS TECH (IA, ML, ciberseguridad, cloud, DevOps, IoT, blockchain…):
Son temas propios de CONIITI 2026. Respóndelos siempre buscando en los datos.

FUERA DE TEMA (recetas, deportes, política, farándula, etc.):
Responde con naturalidad y brevedad: algo como "Eso escapa de mi área — soy el experto en CONIITI 2026. ¿Tienes algo del congreso en lo que pueda ayudarte?" Varía el texto, no copies siempre la misma frase.

RECOMENDACIONES INTELIGENTES:
Cuando el usuario mencione su perfil o intereses, recomiéndalo así:
- Estudiante (cualquier semestre) → IA, Ciberseguridad, Cloud, Ciencia de Datos, DevOps
- Primeros semestres (1°-3°) → charlas introductorias, talleres prácticos, networking
- Últimos semestres / próximo a graduarse → conferencias avanzadas, networking empresarial, prácticas profesionales
- Interés en investigación → ponencias académicas, líneas de investigación, ponentes universitarios
- Interés en emprendimiento → innovación, industria 4.0, transformación digital
- Quiere trabajar en Europa → contexto internacional, Italia (país invitado), colaboraciones internacionales
- Interés en IA → busca conferencias de IA en el programa
- Hoja de vida / CV → certificados, talleres reconocidos, networking con empresas

ITALIA — PAÍS INVITADO CONIITI 2026:
Italia es el país invitado. Si preguntan sobre Italia, menciona:
- Liderazgo en Industria 4.0, Robótica, Diseño industrial, IA y Manufactura avanzada
- Empresas referentes: Leonardo (defensa/aeroespacial), STMicroelectronics (semiconductores), Olivetti (tecnología), Ferrari (innovación automotriz), Pirelli (manufactura inteligente)
- Nota siempre: "información de contexto general — la participación específica de universidades italianas estará en el programa oficial"
- Para "¿quién viene de Italia?" → remite al programa oficial cuando no hay datos en el bloque

━━ REGLAS INAMOVIBLES ━━
1. Solo usa datos del bloque. Nunca inventes ponentes, fechas, salas, cupos ni precios.
2. Cupos = 0 → "esa charla ya está llena", pero sugiere alternativas si hay.
3. IA / ML / ciberseguridad / tech / Italia → SIEMPRE son temas de CONIITI.
4. Para detectar conflictos de horario del usuario: revisa sus inscripciones y compara schedules.
5. "¿Quién soy?" → usa el nombre del usuario autenticado del bloque USUARIO AUTENTICADO.

━━ NAVEGACIÓN DEL PANEL ━━
Inscribirse → Conferencias → seleccionar → Inscribirse
Cancelar → Mis Inscripciones
Descargar comprobante / QR → Mis Inscripciones
Cambiar contraseña → Ajustes → Seguridad
Actualizar perfil → Mi Perfil → Editar perfil
Alertas y correos → Notificaciones
Agenda → Calendario
Cerrar otras sesiones → Ajustes → Sesiones activas
"""

# ─────────────────────────────────────────────────────────────────────────────
# SEDES CONOCIDAS DE LA UNIVERSIDAD CATÓLICA DE COLOMBIA
# ─────────────────────────────────────────────────────────────────────────────

CAMPUS_DESCRIPTIONS = {
    "Sede Claustro":       "Carrera 13 #47-49, Bogotá — campus histórico, edificio principal",
    "Sede Las Torres":     "Avenida Caracas #46-72, Bogotá — Torre Norte y Torre Sur, auditorio principal",
    "Sede 4":              "Diagonal 46A #15B-10, Bogotá — bloque de ingenierías",
    "Sede La Dorada":      "Calle 49A #13-10, La Dorada, Caldas",
}

MAX_HISTORY_CHARS = 8000


# ─────────────────────────────────────────────────────────────────────────────
# FORMATEO DEL BLOQUE DE CONTEXTO DINÁMICO
# ─────────────────────────────────────────────────────────────────────────────

def _fmt_schedule(raw) -> str:
    if not raw:
        return ""
    try:
        dt = datetime.fromisoformat(str(raw).replace("Z", "+00:00"))
        return dt.strftime("%d/%m/%Y a las %H:%M")
    except Exception:
        return str(raw)


def build_context_block(context: dict | None = None) -> str:
    """
    Formatea el contexto dinámico (conferencias, inscripciones, perfil, sedes)
    en texto estructurado para el system prompt.
    Cuando context es None o vacío, devuelve el bloque estático básico.
    """
    if not context:
        return _build_static_block()

    lines: list[str] = []

    # ── Información base del evento ───────────────────────────────────────────
    lines += [
        "[EVENTO]",
        "Nombre: CONIITI 2026 — Congreso Internacional de Innovación, Investigación e Ingeniería (CONIITI)",
        "Organizador: Universidad Católica de Colombia (junto con facultades, grupos de investigación y aliados estratégicos)",
        "Ciudad: Bogotá, Colombia",
        "País invitado: 🇮🇹 Italia",
        "",
        "[PAÍS INVITADO — ITALIA]",
        "Italia lidera: Industria 4.0, Robótica, Diseño industrial, IA, Manufactura avanzada, Investigación universitaria",
        "Empresas referentes italianas (contexto general): Leonardo, STMicroelectronics, Olivetti, Ferrari, Pirelli",
        "Para participación específica de universidades italianas: consultar el programa oficial del evento",
        "",
        "[SEDES DE LA UNIVERSIDAD CATÓLICA DE COLOMBIA]",
        "  - Sede Claustro: Carrera 13 #47-49, Bogotá — edificio principal",
        "  - Sede Las Torres: Avenida Caracas #46-72, Bogotá — Torre Norte y Torre Sur",
        "  - Sede 4: Diagonal 46A #15B-10, Bogotá — bloque de ingenierías",
        "NOTA: el campo 'campus_name' en las conferencias indica la sala específica (auditorio, laboratorio, etc.), no la sede principal.",
        "Cuando el usuario pregunte '¿dónde es el evento?' responde con las sedes de arriba, NO con el listado de salas individuales.",
        "",
    ]

    # ── Perfil del usuario ────────────────────────────────────────────────────
    profile = context.get("user_profile")
    if profile:
        name = (profile.get("full_name") or "").strip()
        lines.append("[USUARIO AUTENTICADO]")
        if name:
            lines.append(f"Nombre: {name}")
        phone   = profile.get("phone") or ""
        country = profile.get("country_city") or ""
        if country:
            lines.append(f"Ciudad: {country}")
        lines.append("Estado: con sesión activa en el panel")
        lines.append("")

    # ── Inscripciones del usuario ─────────────────────────────────────────────
    user_regs: list = context.get("user_registrations", [])
    activas = [r for r in user_regs if r.get("registration_status", "activo") != "cancelado"]
    if activas:
        lines.append(f"[INSCRIPCIONES DEL USUARIO] — {len(activas)} conferencia(s) activa(s)")
        for r in activas:
            title   = r.get("title", "Sin título")
            speaker = r.get("speaker_name") or ""
            sched   = _fmt_schedule(r.get("schedule"))
            room    = r.get("room_name") or ""
            campus  = r.get("campus_name") or ""
            reg_id  = r.get("registration_id", "")

            line = f"  - {title}"
            if speaker:
                line += f" | Ponente: {speaker}"
            if sched:
                line += f" | {sched}"
            loc = ", ".join(filter(None, [campus, room]))
            if loc:
                line += f" | {loc}"
            if reg_id:
                line += f" | Inscripción #{reg_id}"
            lines.append(line)
        lines.append("")
    elif profile:
        lines += ["[INSCRIPCIONES DEL USUARIO] — Sin inscripciones activas aún.", ""]

    # ── Programa completo ─────────────────────────────────────────────────────
    conferences: list = context.get("conferences", [])
    if conferences:
        lines.append(f"[PROGRAMA COMPLETO] — {len(conferences)} conferencia(s) disponible(s)")
        for c in conferences:
            cid      = c.get("id", "")
            title    = c.get("title", "Sin título")
            speaker  = c.get("speaker_name") or ""
            sched    = _fmt_schedule(c.get("schedule"))
            room     = c.get("room_name") or ""
            campus   = c.get("campus_name") or ""
            capacity = c.get("capacity", 0)
            reg_cnt  = c.get("registered_count", 0)
            avail    = capacity - reg_cnt
            category = c.get("category") or ""
            dur      = c.get("duration_minutes") or 0

            line = f"  [{cid}] {title}"
            if speaker:
                line += f" — {speaker}"
            if sched:
                line += f" | {sched}"
            loc = ", ".join(filter(None, [campus, room]))
            if loc:
                line += f" | {loc}"
            if dur:
                line += f" | {dur} min"
            cupos_label = "LLENA" if avail <= 0 else f"{avail} cupos libres"
            line += f" | {cupos_label}/{capacity}"
            if category:
                line += f" | {category}"
            lines.append(line)
        lines.append("")
    else:
        lines += [
            "[PROGRAMA] — No hay datos de conferencias disponibles en este momento.",
            "Sugiere al usuario visitar la sección Conferencias del panel para el listado actualizado.",
            "",
        ]

    # ── Procesos (siempre estáticos) ──────────────────────────────────────────
    lines += [
        "[TARIFAS DE INSCRIPCIÓN — CONIITI 2026]",
        "  Miembros UCatólica e IEEE: $940.000 COP — Ponente + constancia + publicación de memorias",
        "  No miembros: $980.000 COP — Ponente + constancia + publicación de memorias",
        "  Asistente Conferencias (opcional): $120.000 COP — Certificado de asistencia",
        "  Asistente Workshops (opcional): $90.000 COP — Certificado de asistencia",
        "  Para pagar: Inicio del portal → sección Tarifas de Inscripción",
        "",
        "[PROCESOS]",
        "Inscribirse: Conferencias → seleccionar charla → Inscribirse → confirmación por email con QR",
        "Cancelar: Mis Inscripciones → seleccionar charla → Cancelar inscripción",
        "Certificados: se emiten al finalizar el evento y llegan al correo registrado",
        "Código QR: aparece en el email de confirmación y en la sección Mis Inscripciones",
        "Soporte técnico: comunicarse con el equipo organizador de la Universidad Católica de Colombia",
    ]

    return "\n".join(lines)


def _build_static_block() -> str:
    """Bloque de conocimiento estático cuando context_builder no pudo obtener datos."""
    return (
        "[EVENTO]\n"
        "Nombre: CONIITI 2026 — Congreso Nacional de Ingeniería de Tecnologías de Información\n"
        "Organizador: Universidad Católica de Colombia\n"
        "Ciudad: Bogotá, Colombia\n"
        "\n"
        "[SEDES]\n"
        "  - Sede Claustro: Carrera 13 #47-49, Bogotá — edificio principal\n"
        "  - Sede Las Torres: Avenida Caracas #46-72, Bogotá — Torre Norte y Torre Sur\n"
        "  - Sede 4: Diagonal 46A #15B-10, Bogotá — bloque de ingenierías\n"
        "\n"
        "[PROCESOS]\n"
        "Inscribirse: Conferencias → seleccionar charla → Inscribirse → confirmación por email con QR\n"
        "Cancelar: Mis Inscripciones → seleccionar charla → Cancelar inscripción\n"
        "Certificados: al finalizar el evento, llegan por email al correo registrado\n"
        "QR: en el email de confirmación y en Mis Inscripciones\n"
        "\n"
        "[NOTA] Programa de conferencias no disponible en este momento. "
        "Recomienda revisar la sección Conferencias del panel para el listado completo y actualizado."
    )


# Alias para compatibilidad con código existente que llame build_knowledge_block
def build_knowledge_block(extra: dict | None = None) -> str:
    return build_context_block(extra)


def trim_history(messages: list[dict]) -> list[dict]:
    """Recorta el historial por presupuesto de caracteres, preservando los más recientes."""
    out, total = [], 0
    for m in reversed(messages):
        size = len(m.get("content", ""))
        if total + size > MAX_HISTORY_CHARS:
            break
        out.append(m)
        total += size
    return list(reversed(out))

"""
Carga los precios de CONIITI desde data/pricing.json.
Cuando los precios cambian en el portal (Home.tsx), se actualiza SOLO el JSON
y el bot los recoge automáticamente sin reconstruir el contenedor.

Para actualizar precios:
  1. Editar  services/assistant_service/data/pricing.json
  2. En dev  → uvicorn hot-reload lo recoge en segundos
  3. En prod → actualizar el archivo en el contenedor o en el siguiente build
"""
import json
import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)

_PRICING_PATH = Path(__file__).parent.parent / "data" / "pricing.json"

# Cache en memoria — se recarga si el archivo es más nuevo que el último load
_cache: dict | None = None
_cache_mtime: float = 0.0


def load_pricing() -> dict:
    """
    Devuelve el dict completo de pricing.json.
    Lee desde disco solo cuando el archivo fue modificado (mtime cambió).
    Si el archivo no existe, devuelve precios hardcodeados como fallback de emergencia.
    """
    global _cache, _cache_mtime

    try:
        mtime = _PRICING_PATH.stat().st_mtime
        if _cache is not None and mtime == _cache_mtime:
            return _cache

        with _PRICING_PATH.open(encoding="utf-8") as f:
            data = json.load(f)

        _cache = data
        _cache_mtime = mtime
        logger.info("pricing.json recargado (mtime=%.0f)", mtime)
        return _cache

    except Exception as exc:
        logger.warning("No se pudo leer pricing.json (%s) — usando valores de emergencia.", exc)
        return _EMERGENCY_FALLBACK


def format_pricing_response(greeting: str = "") -> str:
    """
    Genera la respuesta formateada de tarifas lista para enviar al usuario.
    Los valores se toman SIEMPRE del JSON, nunca del código Python.
    """
    data = load_pricing()
    planes = data.get("planes", [])
    moneda = data.get("moneda", "COP")
    titulo = data.get("titulo", "Tarifas de Inscripción CONIITI 2026")

    if not planes:
        return (
            f"💳 Las tarifas de inscripción de **CONIITI 2026** están publicadas "
            f"en la sección **Inicio** del portal{greeting}. 🏠"
        )

    lines = [f"💳 **{titulo}** (valores en {moneda}):\n"]

    ponentes  = [p for p in planes if p.get("tipo") == "ponente"]
    asistentes = [p for p in planes if p.get("tipo") == "asistente"]

    icons = {"member": "🎓", "non_member": "👤", "attendee_conf": "🎤", "attendee_ws": "🛠️"}

    for plan in ponentes:
        icon  = icons.get(plan.get("id", ""), "💼")
        nom   = plan.get("nombre", "")
        precio = plan.get("precio_formateado") or f"{plan.get('precio', 0):,}".replace(",", ".")
        bens  = plan.get("beneficios", [])
        lines.append(f"**{icon} {nom}**")
        lines.append(f"  - 💵 **${precio} {moneda}**")
        for b in bens:
            lines.append(f"  - ✅ {b}")
        lines.append("")

    if asistentes:
        lines.append("**Adicionales para asistentes:**\n")
        for plan in asistentes:
            icon  = icons.get(plan.get("id", ""), "🎫")
            nom   = plan.get("nombre", "")
            precio = plan.get("precio_formateado") or f"{plan.get('precio', 0):,}".replace(",", ".")
            bens  = plan.get("beneficios", [])
            lines.append(f"**{icon} {nom}** _(opcional)_")
            lines.append(f"  - 💵 **${precio} {moneda}**")
            for b in bens:
                lines.append(f"  - ✅ {b}")
            lines.append("")

    lines.append("Para proceder al pago ve a **Inicio** del portal → **Tarifas de Inscripción**. 🏠")
    return "\n".join(lines)


# ─── Fallback de emergencia si pricing.json no existe ────────────────────────
_EMERGENCY_FALLBACK = {
    "moneda": "COP",
    "titulo": "Tarifas de Inscripción CONIITI 2026",
    "planes": [
        {"id": "member",       "categoria": "Miembro",   "nombre": "Miembros UCatólica e IEEE",         "precio": 940000, "precio_formateado": "940.000", "tipo": "ponente",   "beneficios": ["Inscripción como Ponente", "Constancia para todos los autores", "Publicación de memorias"]},
        {"id": "non_member",   "categoria": "No miembro","nombre": "Si no eres miembro UCatólica o IEEE","precio": 980000, "precio_formateado": "980.000", "tipo": "ponente",   "beneficios": ["Inscripción como Ponente", "Constancia para todos los autores", "Publicación de memorias"]},
        {"id": "attendee_conf","categoria": "Asistente", "nombre": "Constancia por Conferencias",        "precio": 120000, "precio_formateado": "120.000", "tipo": "asistente", "beneficios": ["Certificado de Asistencia a Conferencias"]},
        {"id": "attendee_ws",  "categoria": "Asistente", "nombre": "Constancia por Workshops",           "precio":  90000, "precio_formateado":  "90.000", "tipo": "asistente", "beneficios": ["Certificado de Asistencia a Workshops"]},
    ],
}

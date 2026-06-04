"""
Construye el contexto dinámico para Rogelio consultando los microservicios
y leyendo precios desde pricing.json (sin hardcodear valores en código).
"""
import httpx
import logging
import os
from typing import Optional
from services.pricing_loader import load_pricing

logger = logging.getLogger(__name__)

SEARCH_SERVICE_URL    = os.getenv("SEARCH_SERVICE_URL",    "http://search_service:8003")
DASHBOARD_SERVICE_URL = os.getenv("DASHBOARD_SERVICE_URL", "http://dashboard_service:8002")

_TIMEOUT = 5.0


async def build_user_context(user_id: Optional[int]) -> dict:
    """
    Reúne en paralelo: conferencias activas, inscripciones del usuario y su perfil.
    Retorna un dict con las claves: conferences, user_registrations, user_profile.
    Cualquier fallo parcial se loguea y se ignora — nunca bloquea la respuesta.
    """
    context: dict = {}

    # ── Precios desde pricing.json (lectura local, sin HTTP) ─────────────────
    try:
        context["pricing"] = load_pricing()
    except Exception as exc:
        logger.warning("context_builder: pricing no disponible — %s", exc)

    # ── Conferencias activas ──────────────────────────────────────────────────
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.get(f"{SEARCH_SERVICE_URL}/conferences")
            if resp.status_code == 200:
                data = resp.json()
                context["conferences"] = [c for c in data if c.get("is_active", True)][:35]
    except Exception as exc:
        logger.warning("context_builder: conferencias no disponibles — %s", exc)

    if not user_id:
        return context

    # ── Inscripciones del usuario ─────────────────────────────────────────────
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.get(
                f"{SEARCH_SERVICE_URL}/users/{user_id}/conferences"
            )
            if resp.status_code == 200:
                context["user_registrations"] = resp.json()
    except Exception as exc:
        logger.warning("context_builder: inscripciones no disponibles — %s", exc)

    # ── Perfil del usuario ────────────────────────────────────────────────────
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.get(f"{DASHBOARD_SERVICE_URL}/profile/{user_id}")
            if resp.status_code == 200:
                context["user_profile"] = resp.json()
    except Exception as exc:
        logger.warning("context_builder: perfil no disponible — %s", exc)

    return context

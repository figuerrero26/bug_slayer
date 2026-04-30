import logging
import os

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.profile_model import Profile, UserStats
from schemas.profile_schema import (
    FullDashboardResponse,
    ProfileResponse,
    ProfileUpdate,
    StatsResponse,
    ConferenceSummary,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["dashboard"])

SEARCH_SERVICE_URL = os.getenv("SEARCH_SERVICE_URL", "http://localhost:8003")


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_profile_or_404(user_id: int, db: Session) -> Profile:
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
    return profile


def _get_stats(user_id: int, db: Session) -> UserStats:
    return db.query(UserStats).filter(UserStats.user_id == user_id).first()


# ── Endpoints individuales ────────────────────────────────────────────────────

@router.get("/profile/{user_id}", response_model=ProfileResponse)
def get_profile(user_id: int, db: Session = Depends(get_db)):
    """Devuelve solo los datos del perfil personal del usuario."""
    profile = _get_profile_or_404(user_id, db)
    return ProfileResponse.model_validate(profile)


@router.get("/stats/{user_id}", response_model=StatsResponse)
def get_stats(user_id: int, db: Session = Depends(get_db)):
    """Devuelve las estadísticas (eventos completados, pendientes, mensajes)."""
    stats = _get_stats(user_id, db)
    if not stats:
        raise HTTPException(status_code=404, detail="Estadísticas no encontradas")
    return StatsResponse.model_validate(stats)


# ── Endpoint consolidado ──────────────────────────────────────────────────────

@router.get("/dashboard/{user_id}", response_model=FullDashboardResponse)
async def get_full_dashboard(user_id: int, db: Session = Depends(get_db)):
    """
    Respuesta consolidada para el panel principal del usuario.
    Combina perfil + stats de db_dashboard con las conferencias inscritas
    obtenidas del search_service (llamada httpx interna).
    Si el search_service no está disponible, devuelve la lista de conferencias vacía.
    """
    profile = _get_profile_or_404(user_id, db)
    stats   = _get_stats(user_id, db)

    # Llamada interna al search_service para obtener las conferencias inscritas
    conferences: list[ConferenceSummary] = []
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"{SEARCH_SERVICE_URL}/users/{user_id}/conferences"
            )
            if resp.status_code == 200:
                conferences = [ConferenceSummary(**c) for c in resp.json()]
            else:
                logger.warning(
                    "search_service devolvió %s al consultar conferencias del usuario %s",
                    resp.status_code, user_id,
                )
    except httpx.RequestError as exc:
        # Si el search_service está caído, el dashboard sigue funcionando
        logger.warning("No se pudo contactar al search_service: %s", exc)

    return FullDashboardResponse(
        user_id          = profile.user_id,
        full_name        = profile.full_name,
        birth_date       = profile.birth_date,
        country_city     = profile.country_city,
        phone            = profile.phone,
        photo_url        = profile.photo_url,
        registered_at=profile.registered_at,
        completed_events = stats.completed_events if stats else 0,
        pending_events   = stats.pending_events   if stats else 0,
        unread_messages  = stats.unread_messages  if stats else 0,
        conferences      = conferences,
    )


@router.patch("/profile/{user_id}", response_model=ProfileResponse)
def update_profile(user_id: int, payload: ProfileUpdate, db: Session = Depends(get_db)):
    """Actualiza los datos del perfil del usuario."""
    profile = _get_profile_or_404(user_id, db)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return ProfileResponse.model_validate(profile)

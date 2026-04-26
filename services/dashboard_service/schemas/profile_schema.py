from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


# ── Internos ──────────────────────────────────────────────────────────────────

class CreateProfileInternal(BaseModel):
    """Payload que envía auth_service al crear un usuario nuevo."""
    user_id: int
    full_name: str
    phone: str
    country_city: str



class ProfileUpdate(BaseModel):
    full_name: Optional[str]     = None
    birth_date: Optional[date]   = None
    country_city: Optional[str]  = None
    phone: Optional[str]         = None
    photo_url: Optional[str]     = None


# ── Respuestas individuales ────────────────────────────────────────────────────

class ProfileResponse(BaseModel):
    """Solo datos del perfil (sin stats ni conferencias)."""
    user_id: int
    full_name: str
    birth_date: Optional[date]
    country_city: str
    phone: str
    photo_url: Optional[str]
    registered_at: Optional[datetime]  

    model_config = {"from_attributes": True}


class StatsResponse(BaseModel):
    """Solo estadísticas del usuario."""
    user_id: int
    completed_events: int
    pending_events: int
    unread_messages: int

    model_config = {"from_attributes": True}


# ── Vista consolidada para el frontend ────────────────────────────────────────

class ConferenceSummary(BaseModel):
    """Resumen de una conferencia inscrita, proveniente del search_service."""
    id: int
    title: str
    speaker_name: Optional[str]
    speaker_image_url: Optional[str]
    category: Optional[str]
    schedule: Optional[datetime]
    location_text: Optional[str]
    registration_id: int
    registration_status: str


class FullDashboardResponse(BaseModel):
    """
    Respuesta consolidada del dashboard.
    Combina datos de db_dashboard (perfil + stats) con las conferencias
    inscritas obtenidas internamente del search_service.
    """
    user_id: int
    full_name: str
    birth_date: Optional[date]
    country_city: str
    phone: str
    photo_url: Optional[str]
    registered_at: Optional[datetime] 
    completed_events: int
    pending_events: int
    unread_messages: int
    conferences: List[ConferenceSummary] = []

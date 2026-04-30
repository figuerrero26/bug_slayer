from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


# ── Conferencias ──────────────────────────────────────────────────────────────

class ConferenceCreate(BaseModel):
    title:             str
    description:       Optional[str]      = None
    speaker_name:      Optional[str]      = None
    speaker_image_url: Optional[str]      = None
    category:          Optional[str]      = None
    schedule:          Optional[datetime] = None
    location_text:     Optional[str]      = None
    capacity:          int                = 100

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("El título no puede estar vacío")
        return v

    @field_validator("capacity")
    @classmethod
    def capacity_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("La capacidad debe ser mayor a 0")
        return v


class ConferenceUpdate(BaseModel):
    title:             Optional[str]      = None
    description:       Optional[str]      = None
    speaker_name:      Optional[str]      = None
    speaker_image_url: Optional[str]      = None
    category:          Optional[str]      = None
    schedule:          Optional[datetime] = None
    location_text:     Optional[str]      = None
    capacity:          Optional[int]      = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("El título no puede estar vacío")
        return v

    @field_validator("capacity")
    @classmethod
    def capacity_positive(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v <= 0:
            raise ValueError("La capacidad debe ser mayor a 0")
        return v


class ConferenceResponse(BaseModel):
    id:               int
    title:            str
    description:      Optional[str]
    speaker_name:     Optional[str]
    speaker_image_url: Optional[str]
    category:         Optional[str]
    schedule:         Optional[datetime]
    location_text:    Optional[str]
    capacity:         int
    is_active:        bool
    registered_count: int = 0

    model_config = {"from_attributes": True}


# ── Inscripciones ─────────────────────────────────────────────────────────────

class RegistrationCreate(BaseModel):
    conference_id: int
    user_id:       int

    @field_validator("conference_id", "user_id")
    @classmethod
    def must_be_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("El ID debe ser un número positivo")
        return v


class RegistrationResponse(BaseModel):
    id:            int
    conference_id: int
    user_id:       int
    status:        str
    registered_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── Vista enriquecida para el dashboard_service ───────────────────────────────

class UserConferenceOut(BaseModel):
    id:                  int
    title:               str
    speaker_name:        Optional[str]
    speaker_image_url: str | None = None
    category:            Optional[str]
    schedule:            Optional[datetime]
    location_text:       Optional[str]
    registration_id:     int
    registration_status: str

    model_config = {"from_attributes": True}

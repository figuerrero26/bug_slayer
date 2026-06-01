from pydantic import BaseModel, field_validator
from typing import Optional, List, Literal
from datetime import datetime

ConferenceCategory = Literal[
    "Software Engineering and Information Systems",
    "Artificial Intelligence and Co-existence",
    "Smart Cities and Sustainable Development",
    "Security, Privacy and Infrastructure",
    "Technology, Society and Innovation",
]

# ── Conferencias ──────────────────────────────────────────────────────────────

class ConferenceCreate(BaseModel):
    title:             str
    description:       Optional[str]             = None
    speaker_name:      Optional[str]             = None
    speaker_image_url: Optional[str]             = None
    category:          Optional[ConferenceCategory] = None
    schedule:          Optional[datetime] = None
    campus_name:       str
    room_name:         str
    capacity:          int                = 100
    duration_minutes:  int                = 60

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("El título no puede estar vacío")
        return v

    @field_validator("campus_name", "room_name")
    @classmethod
    def location_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("La sede y el salón son obligatorios")
        return v

    @field_validator("capacity")
    @classmethod
    def capacity_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("La capacidad debe ser mayor a 0")
        return v


class ConferenceUpdate(BaseModel):
    title:             Optional[str]             = None
    description:       Optional[str]             = None
    speaker_name:      Optional[str]             = None
    speaker_image_url: Optional[str]             = None
    category:          Optional[ConferenceCategory] = None
    schedule:          Optional[datetime] = None
    campus_name:       Optional[str]      = None
    room_name:         Optional[str]      = None
    capacity:          Optional[int]      = None
    duration_minutes:  Optional[int]      = None

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
    campus_name:      Optional[str]
    room_name:        Optional[str]
    capacity:         int
    duration_minutes: int
    is_active:        bool
    registered_count: int = 0

    model_config = {"from_attributes": True}


# ── Inscripciones ─────────────────────────────────────────────────────────────

class RegistrationCreate(BaseModel):
    conference_id: int
    user_id: int
    email: str | None = None

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
    speaker_image_url:   str | None = None
    category:            Optional[str]
    schedule:            Optional[datetime]
    campus_name:         Optional[str]
    room_name:           Optional[str]
    registration_id:     int
    registration_status: str
    qr_payload:          str = ""

    model_config = {"from_attributes": True}


# ── Validación de asistencia por QR ──────────────────────────────────────────

class AttendanceValidateRequest(BaseModel):
    qr_payload: str


class AttendanceValidateResponse(BaseModel):
    success:           bool
    message:           str
    registration_id:   Optional[int] = None
    user_id:           Optional[int] = None
    conference_title:  Optional[str] = None
    already_validated: bool          = False


# ── Vistas de conferencias con asistencia confirmada ─────────────────────────

class CompletedConferenceOut(BaseModel):
    id_inscripcion:   int
    title:            str
    speaker_name:     Optional[str]
    schedule:         Optional[datetime]
    campus_name:      Optional[str]
    room_name:        Optional[str]
    fecha_validacion: Optional[datetime]
    category:         Optional[str] = None

    model_config = {"from_attributes": True}


class CurrentConferenceOut(BaseModel):
    id_inscripcion: int
    title:          str
    speaker_name:   Optional[str]
    schedule:       Optional[datetime]
    campus_name:    Optional[str]
    room_name:      Optional[str]

    model_config = {"from_attributes": True}

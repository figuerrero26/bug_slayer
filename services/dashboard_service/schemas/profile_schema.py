from pydantic import BaseModel
from typing import Optional
from datetime import date


class CreateProfileInternal(BaseModel):
    """Payload que envía auth_service al crear un usuario nuevo."""
    user_id: int
    full_name: str
    phone: str
    country_city: str


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    birth_date: Optional[date] = None
    country_city: Optional[str] = None
    phone: Optional[str] = None
    photo_url: Optional[str] = None


class ProfileResponse(BaseModel):
    user_id: int
    full_name: str
    birth_date: Optional[date]
    country_city: str
    phone: str
    photo_url: Optional[str]
    completed_events: int
    pending_events: int
    unread_messages: int

    model_config = {"from_attributes": True}

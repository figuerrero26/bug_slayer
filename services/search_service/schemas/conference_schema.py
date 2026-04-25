from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ConferenceResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    speaker_name: Optional[str]
    category: Optional[str]
    schedule: Optional[datetime]
    location_text: Optional[str]

    model_config = {"from_attributes": True}


class RegistrationCreate(BaseModel):
    conference_id: int
    user_id: int


class RegistrationResponse(BaseModel):
    id: int
    conference_id: int
    user_id: int
    status: str

    model_config = {"from_attributes": True}

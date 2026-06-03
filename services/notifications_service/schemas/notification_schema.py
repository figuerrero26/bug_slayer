from pydantic import BaseModel, field_serializer
from typing import Optional
from datetime import datetime, timezone


class NotificationCreate(BaseModel):
    user_id: int
    title: str
    message: str
    type: str = "info"
    email: str | None = None


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    is_read: bool
    type: str
    created_at: Optional[datetime]

    @field_serializer("created_at")
    def serialize_created_at(self, value: Optional[datetime]) -> Optional[str]:
        if value is None:
            return None
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.strftime("%Y-%m-%dT%H:%M:%S") + "Z"

    model_config = {"from_attributes": True}


class UnreadCountResponse(BaseModel):
    user_id: int
    unread_count: int

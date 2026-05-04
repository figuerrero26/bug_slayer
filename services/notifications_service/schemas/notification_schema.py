from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class NotificationCreate(BaseModel):
    user_id: int
    title: str
    message: str
    type: str = "info"


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    is_read: bool
    type: str
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}


class UnreadCountResponse(BaseModel):
    user_id: int
    unread_count: int

from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class AskRequest(BaseModel):
    conversation_id: Optional[int] = None
    message: str
    user_id: int


class MessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationOut(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AskResponse(BaseModel):
    conversation_id: int
    reply: str
    message_id: int

from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field, ConfigDict


class AskRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    session_id: Optional[str] = None          # el frontend lo envía, el backend lo genera si falta
    conversation_id: Optional[int] = None
    user_id: Optional[int] = None


class AskResponse(BaseModel):
    conversation_id: int
    session_id: str
    reply: str
    message_id: int


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: Literal["user", "assistant"]
    content: str
    created_at: datetime


class ConversationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_id: Optional[str]
    title: str
    created_at: datetime
    updated_at: datetime

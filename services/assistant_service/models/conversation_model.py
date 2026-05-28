from sqlalchemy import Column, Integer, String, DateTime, func
from database import Base


class Conversation(Base):
    __tablename__ = "conversations"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    user_id    = Column(Integer, nullable=False, index=True)
    title      = Column(String(255), default="Nueva conversación")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

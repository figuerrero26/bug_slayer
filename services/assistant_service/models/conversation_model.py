import uuid
from sqlalchemy import Column, Integer, String, DateTime, CHAR, func
from sqlalchemy.orm import relationship
from database import Base


class Conversation(Base):
    __tablename__ = "conversations"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(CHAR(36), nullable=True, index=True)   # nullable: compatible con filas previas
    user_id    = Column(Integer, nullable=True, index=True)
    title      = Column(String(255), default="Nueva conversación")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    messages = relationship(
        "Message",
        back_populates="conversation",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

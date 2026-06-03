import uuid
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from database import Base


class UserSession(Base):
    __tablename__ = "sessions"

    id         = Column(Integer,     primary_key=True, autoincrement=True)
    session_id = Column(String(36),  unique=True, nullable=False, index=True,
                        default=lambda: str(uuid.uuid4()))
    user_id    = Column(Integer,     nullable=False, index=True)
    device     = Column(String(150), nullable=False, default="Dispositivo desconocido")
    location   = Column(String(100), nullable=False, default="—")
    created_at = Column(DateTime,    server_default=func.now(), nullable=False)
    is_active  = Column(Boolean,     nullable=False, default=True)

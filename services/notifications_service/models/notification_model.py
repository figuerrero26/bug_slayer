from sqlalchemy import Column, Integer, String, Text, Boolean, Enum, DateTime, func
from database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    # Llave lógica: viene del auth_service
    user_id = Column(Integer, nullable=False, index=True)
    title = Column(String(255))
    message = Column(Text)
    is_read = Column(Boolean, default=False)
    type = Column(Enum("info", "alerta", "sistema"), default="info")
    created_at = Column(DateTime, server_default=func.now())

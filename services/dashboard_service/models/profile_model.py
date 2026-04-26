from sqlalchemy import Column, Integer, String, Date, TIMESTAMP
from database import Base
from sqlalchemy.sql import func


class Profile(Base):
    __tablename__ = "profiles"

    # user_id no es auto-incremental: recibe el valor exacto de db_auth
    user_id = Column(Integer, primary_key=True)
    full_name = Column(String(200))
    birth_date = Column(Date, nullable=True)
    country_city = Column(String(200))
    phone = Column(String(50))
    photo_url = Column(String(500), nullable=True)
    # Mapeo exacto para TIMESTAMP de MySQL
    registered_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())


class UserStats(Base):
    __tablename__ = "user_stats"

    user_id = Column(Integer, primary_key=True)
    completed_events = Column(Integer, default=0)
    pending_events = Column(Integer, default=0)
    unread_messages = Column(Integer, default=0)

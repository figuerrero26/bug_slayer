from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, UniqueConstraint, Index
from sqlalchemy.sql import func
from database import Base


class Conference(Base):
    __tablename__ = "conferences"

    id                = Column(Integer, primary_key=True, autoincrement=True)
    title             = Column(String(300), nullable=False)
    description       = Column(Text)
    speaker_name      = Column(String(200))
    speaker_image_url = Column(String(500))
    category          = Column(String(100), index=True)
    schedule          = Column(DateTime)
    location_text     = Column(String(300))
    capacity          = Column(Integer, nullable=False, default=100)
    is_active         = Column(Boolean, default=True, nullable=False)

    __table_args__ = (
        Index("ix_conferences_active_schedule", "is_active", "schedule"),
    )


class ConferenceRegistration(Base):
    __tablename__ = "conference_registrations"

    id            = Column(Integer, primary_key=True, autoincrement=True)
    conference_id = Column(Integer, nullable=False, index=True)
    user_id       = Column(Integer, nullable=False, index=True)
    status        = Column(String(20), default="activo", nullable=False)
    registered_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "conference_id", name="uq_user_conference"),
        Index("ix_registrations_conf_status", "conference_id", "status"),
    )

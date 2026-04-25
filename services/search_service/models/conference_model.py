from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, UniqueConstraint
from database import Base


class Conference(Base):
    __tablename__ = "conferences"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(300), nullable=False)
    description = Column(Text)
    speaker_name = Column(String(200))
    category = Column(String(100))
    schedule = Column(DateTime)
    location_text = Column(String(300))


class ConferenceRegistration(Base):
    __tablename__ = "conference_registrations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    # FK física hacia conferences
    conference_id = Column(Integer, nullable=False)
    # Llave lógica: viene del auth_service, no hay FK física
    user_id = Column(Integer, nullable=False)
    status = Column(Enum("activo", "cancelado"), default="activo")

    __table_args__ = (
        UniqueConstraint("user_id", "conference_id", name="uq_user_conference"),
    )

from sqlalchemy import Column, Integer, String, Boolean, DateTime
from database import Base


class User(Base):
    __tablename__ = "users"

    id                       = Column(Integer,     primary_key=True, index=True, autoincrement=True)
    email                    = Column(String(255), unique=True, nullable=False, index=True)
    password_hash            = Column(String(255), nullable=False)
    is_active                = Column(Boolean,     default=True)
    otp_code                 = Column(String(6),   nullable=True,  default=None)
    otp_expiry               = Column(DateTime,    nullable=True,  default=None)
    otp_attempts             = Column(Integer,     nullable=False, default=0)
    acepta_tratamiento_datos = Column(Boolean,     nullable=False, default=False)
    fecha_aceptacion_legal   = Column(DateTime,    nullable=True,  default=None)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    import logging as _log
    _log.getLogger(__name__).critical(
        "DATABASE_URL no está configurada — el servicio arrancará sin BD"
    )
    DATABASE_URL = "sqlite:///./assistant_fallback.db"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
    **({} if DATABASE_URL.startswith("sqlite") else {"pool_recycle": 1800}),
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

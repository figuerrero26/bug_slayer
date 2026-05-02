from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import logging
import os

load_dotenv()

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")


def _ensure_database_exists() -> None:
    try:
        base_url = DATABASE_URL.rsplit("/", 1)[0]
        db_name = DATABASE_URL.rsplit("/", 1)[1].split("?")[0]
        root_engine = create_engine(base_url + "/", echo=False)
        with root_engine.connect() as conn:
            conn.execute(text(
                f"CREATE DATABASE IF NOT EXISTS `{db_name}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            ))
            conn.commit()
        root_engine.dispose()
        logger.info("✓ Base de datos '%s' verificada/creada", db_name)
    except Exception as exc:
        logger.warning("No se pudo auto-crear la base de datos: %s", exc)


engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

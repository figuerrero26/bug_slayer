import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from database import engine, Base, SessionLocal
from routers.chat_routes import router as chat_router

logger = logging.getLogger(__name__)


def _migrate():
    """Migración segura: agrega session_id si la tabla conversations ya existía sin ella."""
    try:
        with engine.connect() as conn:
            conn.execute(
                text("ALTER TABLE conversations ADD COLUMN session_id CHAR(36) NULL")
            )
            conn.commit()
            logger.info("Migración: columna session_id agregada a conversations")
    except Exception:
        pass  # Columna ya existe — normal en deploys posteriores


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: crear tablas y migrar — si la BD no está disponible, el servicio
    # igual arranca y responde con el fallback local.
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Tablas verificadas/creadas correctamente")
    except Exception as exc:
        logger.error("No se pudo conectar a la BD en startup (create_all): %s", exc)

    try:
        _migrate()
    except Exception as exc:
        logger.error("Error en migración de startup: %s", exc)

    yield
    # Shutdown (sin acciones necesarias)


app = FastAPI(
    title="CONIITI 2026 — Assistant Service (Rogelio)",
    description="Bot asistente Rogelio: responde preguntas sobre el congreso.",
    version="1.0.0",
    lifespan=lifespan,
)

_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost")
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(chat_router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "assistant_service", "bot": "Rogelio"}

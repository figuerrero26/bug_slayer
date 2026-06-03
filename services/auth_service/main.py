import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from database import engine, Base
from routers.auth_routes import router as auth_router
from routers.password_reset_routes import router as password_reset_router

# Crea las tablas en db_auth si no existen
Base.metadata.create_all(bind=engine)


def _apply_migrations() -> None:
    """Añade columnas nuevas a tablas existentes sin romper instalaciones previas."""
    with engine.connect() as conn:
        try:
            conn.execute(text(
                "ALTER TABLE users ADD COLUMN two_fa_enabled BOOLEAN DEFAULT 1"
            ))
            conn.commit()
        except Exception:
            pass  # la columna ya existe

_apply_migrations()

app = FastAPI(
    title="CONIITI 2026 — Auth Service",
    description="Gestión de identidad, registro y validación de credenciales.",
    version="1.0.0",
)

_raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost")
_origins = [o.strip() for o in _raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth_router)
app.include_router(password_reset_router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "auth_service"}

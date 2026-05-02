import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from database import engine, Base, _ensure_database_exists
from routers.auth_routes import router as auth_router

logging.basicConfig(level=logging.INFO, format="%(levelname)s — %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Iniciando auth_service...")

    _ensure_database_exists()

    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("✓ Conexión a db_auth establecida")
    except OperationalError as exc:
        logger.error("✗ No se pudo conectar a db_auth: %s", exc)

    try:
        Base.metadata.create_all(bind=engine)
        logger.info("✓ Tablas verificadas/creadas")
    except Exception as exc:
        logger.error("✗ Error al crear tablas: %s", exc)

    yield

    logger.info("auth_service detenido.")


app = FastAPI(
    title="CONIITI 2026 — Auth Service",
    description="Gestión de identidad, registro y validación de credenciales.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
    logger.error("Error no controlado en %s: %s", request.url.path, exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Error interno del servidor"},
    )


app.include_router(auth_router)


@app.get("/health")
def health():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "disconnected"
    return {"status": "ok", "service": "auth_service", "database": db_status}

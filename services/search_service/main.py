import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text, create_engine
from sqlalchemy.exc import OperationalError

from database import engine, Base, DATABASE_URL
from routers.conference_routes import router as conference_router
from routers.registration_routes import router as registration_router

logging.basicConfig(level=logging.INFO, format="%(levelname)s — %(message)s")
logger = logging.getLogger(__name__)

UPLOAD_DIR = Path("uploads/speakers")


def _ensure_database_exists() -> None:
    try:
        base_url = DATABASE_URL.rsplit("/", 1)[0]
        db_name  = DATABASE_URL.rsplit("/", 1)[1].split("?")[0]
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


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Iniciando search_service...")

    _ensure_database_exists()

    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("✓ Conexión a db_search establecida")
    except OperationalError as exc:
        logger.error("✗ No se pudo conectar a db_search: %s", exc)

    try:
        Base.metadata.create_all(bind=engine)
        logger.info("✓ Tablas verificadas/creadas")
    except Exception as exc:
        logger.error("✗ Error al crear tablas: %s", exc)

    # Crear carpeta de uploads si no existe
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    logger.info("✓ Directorio de uploads: %s", UPLOAD_DIR.resolve())

    yield

    logger.info("search_service detenido.")


app = FastAPI(
    title="CONIITI 2026 — Search Service",
    description="Catálogo de conferencias e inscripciones de usuarios.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Error no controlado en %s: %s", request.url.path, exc)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Error interno: {type(exc).__name__}"},
    )


app.include_router(conference_router)
app.include_router(registration_router)

# Servir imágenes subidas como archivos estáticos
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static/speakers", StaticFiles(directory=str(UPLOAD_DIR)), name="speakers")


@app.get("/health")
def health():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "disconnected"
    return {"status": "ok", "service": "search_service", "database": db_status}

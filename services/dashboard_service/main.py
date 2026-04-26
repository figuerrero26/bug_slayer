import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text, create_engine
from sqlalchemy.exc import OperationalError

from database import engine, Base, DATABASE_URL
from routers.dashboard_routes import router as dashboard_router
from routers.internal_routes import router as internal_router

logging.basicConfig(level=logging.INFO, format="%(levelname)s — %(message)s")
logger = logging.getLogger(__name__)


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
    logger.info("Iniciando dashboard_service...")

    _ensure_database_exists()

    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("✓ Conexión a db_dashboard establecida")
    except OperationalError as exc:
        logger.error("✗ No se pudo conectar a db_dashboard: %s", exc)

    try:
        Base.metadata.create_all(bind=engine)
        logger.info("✓ Tablas verificadas/creadas")
    except Exception as exc:
        logger.error("✗ Error al crear tablas: %s", exc)

    yield

    logger.info("dashboard_service detenido.")


app = FastAPI(
    title="CONIITI 2026 — Dashboard Service",
    description="Perfil personal del usuario y estadísticas del panel principal.",
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

app.include_router(dashboard_router)
app.include_router(internal_router)


@app.get("/health")
def health():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "disconnected"
    return {"status": "ok", "service": "dashboard_service", "database": db_status}

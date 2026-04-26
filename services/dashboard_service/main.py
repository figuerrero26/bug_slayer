from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers.dashboard_routes import router as dashboard_router
from routers.internal_routes import router as internal_router

# Crea las tablas en db_dashboard si no existen
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CONIITI 2026 — Dashboard Service",
    description="Perfil personal del usuario y estadísticas del panel principal.",
    version="1.0.0",
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
    return {"status": "ok", "service": "dashboard_service"}

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers.notification_routes import router as notification_router

# Crea las tablas en db_notifications si no existen
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CONIITI 2026 — Notifications Service",
    description="Alertas internas del panel y envío de correos transaccionales.",
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

app.include_router(notification_router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "notifications_service"}

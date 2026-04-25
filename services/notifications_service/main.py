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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(notification_router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "notifications_service"}

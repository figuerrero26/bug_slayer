import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers.chat_routes import router as chat_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CONIITI 2026 — Assistant Service (Rogelio)",
    description="Bot asistente Rogelio: responde preguntas sobre el congreso.",
    version="1.0.0",
)

_raw = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost"
)

_origins = [
    o.strip()
    for o in _raw.split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(chat_router)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "assistant_service",
        "bot": "Rogelio"
    }
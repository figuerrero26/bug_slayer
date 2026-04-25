from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers.conference_routes import router as conference_router
from routers.registration_routes import router as registration_router

# Crea las tablas en db_search si no existen
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CONIITI 2026 — Search Service",
    description="Catálogo de conferencias e inscripciones de usuarios.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(conference_router)
app.include_router(registration_router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "search_service"}

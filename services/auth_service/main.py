from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers.auth_routes import router as auth_router
from routers.password_reset_routes import router as password_reset_router

# Crea las tablas en db_auth si no existen
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CONIITI 2026 — Auth Service",
    description="Gestión de identidad, registro y validación de credenciales.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(password_reset_router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "auth_service"}

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

from src.models.persistence import engine, Base
from src.routers.user_routes import router as user_router


app = FastAPI(
    title="API",
    version="1.0.0",
    description="Documentación de la API de usuarios y audiometrías."
)

# Configuración CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cambiar por dominios específicos en producción
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Crear las tablas automáticamente
Base.metadata.create_all(bind=engine)
print("Las tablas han sido creadas correctamente en la base de datos.")

# Incluir routers
# app.include_router(user_router)
Base.metadata.create_all(bind=engine)

app.include_router(user_router)

# Ruta raíz
@app.get("/", tags=["Root"])
def read_root():
    return {"message": "API funcionando correctamente"}


# Personalizar el esquema OpenAPI para documentar JWT
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )

    # Asegurar que exista la sección components
    if "components" not in openapi_schema:
        openapi_schema["components"] = {}

    # Agregar esquema de seguridad JWT
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }

    # Aplicar seguridad a todas las rutas excepto documentación
    for path, path_item in openapi_schema["paths"].items():

        # excluir documentación
        if path.startswith("/docs") or path.startswith("/openapi"):
            continue

        for method in path_item.values():
            if "security" not in method:
                method["security"] = [{"BearerAuth": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema


# Sobrescribir generación de OpenAPI
app.openapi = custom_openapi
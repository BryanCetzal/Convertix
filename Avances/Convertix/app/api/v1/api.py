from fastapi import APIRouter
from app.api.v1.endpoints import convert, auth  # Asegúrate que estos módulos existan

# Crea el router principal
api_router = APIRouter()

# Incluye los routers de cada endpoint
api_router.include_router(convert.router, prefix="/convert", tags=["convert"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# Si necesitas el endpoint /upload en la raíz:
api_router.include_router(convert.router, prefix="", tags=["upload"])
import os
from typing import Any, Dict, List, Optional, Union

from pydantic import AnyHttpUrl, PostgresDsn, field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "SECRET_PASS")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 días
    APP_NAME: str = os.getenv("APP_NAME", "convertix")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    RABBITMQ_URL: str = os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672//")
    
    #CORS
    BACKEND_CORS_ORIGINS: List[str] = []
    
    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[list[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(f"BACKEND_CORS_ORIGINS debe ser una cadena o lista, recibido: {type(v)}")

    # Base de datos
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER")  
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD")  
    POSTGRES_DB: str = os.getenv("POSTGRES_DB")
    SQLALCHEMY_DATABASE_URI: Optional[PostgresDsn] = None

    @field_validator("SQLALCHEMY_DATABASE_URI", mode="before")
    def assemble_db_connection(cls, v: Optional[str], info) -> Any:
        if isinstance(v, str):
            return v
        user = info.data.get("POSTGRES_USER")
        password = info.data.get("POSTGRES_PASSWORD")
        host = info.data.get("POSTGRES_SERVER")
        db = info.data.get("POSTGRES_DB")
        
        if not all([user, host, db]):
            return None
            
        if password:
            return PostgresDsn.build(
                scheme="postgresql",
                username=user,
                password=password,
                host=host,
                path=db  
            )
        return PostgresDsn.build(
            scheme="postgresql",
            username=user,
            host=host,
            path=db  
        )

    # Configuración Celery
    CELERY_BROKER_URL: str = "amqp://guest:guest@localhost:5672//"
    CELERY_RESULT_BACKEND: str = "rpc://"

    # Almacenamiento
    STORAGE_TYPE: str = os.getenv("STORAGE_TYPE", "local")  # local, s3, etc.
    #STORAGE_LOCAL_PATH: str = os.getenv("STORAGE_LOCAL_PATH", "storage")
    STORAGE_LOCAL_PATH: str = "storage"

    # Configuración de procesamiento de imágenes
    
    MAX_IMAGE_SIZE: int = 20 * 1024 * 1024  # 20MB
    ALLOWED_IMAGE_FORMATS: list = ["jpg", "jpeg", "png", "webp"]

    # Server configuration
    SERVER_HOST: str = os.getenv("SERVER_HOST", "http://localhost:8000")

    class Config:
        case_sensitive = True
        env_file = ".env"
    
     # Frontend configuration
    FRONTEND_DIR: str = "app/static/public"
    ADMIN_DIR: str = "app/static/private"


settings = Settings()
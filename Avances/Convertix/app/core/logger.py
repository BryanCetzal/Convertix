import logging
import sys
from typing import Any, Dict, List, Optional

from loguru import logger

from app.core.config import settings


class InterceptHandler(logging.Handler):
    """
    Manejador de logging predeterminado que intercepta (casi) todo para enviarlo a loguru.
    """

    def emit(self, record: logging.LogRecord) -> None:
        # Obtener el nombre del logger correspondiente desde el registro
        logger_opt = logger.opt(depth=7, exception=record.exc_info)
        logger_opt.log(record.levelname, record.getMessage())


def setup_logging(
    level: str = "INFO",
    json_logs: bool = False,
    log_file: Optional[str] = None,
) -> None:
    """
    Configura el logging para la aplicación.
    
    Args:
        level: Nivel de logging (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        json_logs: Si es True, los logs se formatean como JSON
        log_file: Ruta al archivo de log (opcional)
    """
    # Interceptar todos los logs de las bibliotecas estándar
    logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)
    
    # Configurar loguru
    config: Dict[str, Any] = {
        "handlers": [
            {
                "sink": sys.stderr,
                "level": level,
                "format": (
                    "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
                    "<level>{level: <8}</level> | "
                    "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
                    "<level>{message}</level>"
                ) if not json_logs else None,
                "serialize": json_logs,
            }
        ],
    }
    
    # Añadir un manejador de archivo si se proporciona una ruta
    if log_file:
        config["handlers"].append({
            "sink": log_file,
            "level": level,
            "rotation": "10 MB",  # Rotar cuando el archivo alcance 10 MB
            "retention": "1 week",  # Mantener logs por 1 semana
            "format": (
                "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
                "<level>{level: <8}</level> | "
                "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
                "<level>{message}</level>"
            ) if not json_logs else None,
            "serialize": json_logs,
        })
    
    # Aplicar la configuración
    logger.configure(**config)
    
    # Establecer el nivel de logging para bibliotecas específicas
    for logger_name in ["uvicorn", "uvicorn.error", "fastapi"]:
        logging.getLogger(logger_name).handlers = [InterceptHandler()]
        logging.getLogger(logger_name).propagate = False


# Configurar el logger al importar este módulo
setup_logging(level="DEBUG" if settings.ENVIRONMENT == "development" else "INFO")

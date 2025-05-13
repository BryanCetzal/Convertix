import os
from app.core.logger import logger

def cleanup_file(path: str):
    try:
        if os.path.exists(path):
            os.remove(path)
            logger.info(f"Archivo eliminado: {path}")
    except Exception as e:
        logger.error(f"Error eliminando archivo: {str(e)}")
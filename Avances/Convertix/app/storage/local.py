import os
from typing import Optional
from fastapi import UploadFile
from app.core.config import settings
from loguru import logger

class LocalStorage:
    def __init__(self):
        self.storage_path = settings.STORAGE_LOCAL_PATH
        os.makedirs(self.storage_path, exist_ok=True)

    async def save_file(self, file: UploadFile, content: bytes, filename: Optional[str] = None) -> str:
        try:
            final_filename = filename or file.filename
            file_path = os.path.join(self.storage_path, final_filename)
            
            with open(file_path, "wb") as f:
                f.write(content)
            
            logger.info(f"Archivo guardado exitosamente: {file_path}")
            return f"{settings.SERVER_HOST}/storage/{final_filename}" 
            
        except Exception as e:
            logger.error(f"Error al guardar el archivo: {str(e)}")
            raise

    async def delete_file(self, filename: str) -> bool:
        """
        Elimina un archivo del almacenamiento local.
        
        Args:
            filename: Nombre del archivo a eliminar
        
        Returns:
            bool: True si se eliminó correctamente, False en caso contrario
        """
        try:
            file_path = os.path.join(self.storage_path, filename)
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Archivo eliminado exitosamente: {file_path}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error al eliminar el archivo: {str(e)}")
            return False

# Instancia global del almacenamiento local
storage = LocalStorage()
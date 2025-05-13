from PIL import Image
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

def process_image(input_path: str, output_path: str, target_format: str, options: dict = None) -> bool:
    try:
        # Asegurar que el directorio de salida existe
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        
        # Abrir y procesar la imagen
        with Image.open(input_path) as img:
            # Aplicar opciones de procesamiento
            if options:
                if 'resize' in options:
                    width = options['resize'].get('width')
                    height = options['resize'].get('height')
                    if width and height:
                        img = img.resize((width, height))

            # Guardar imagen convertida
            img.save(output_path, format=target_format.upper())
            logger.info(f"Imagen convertida exitosamente: {output_path}")
            return True

    except Exception as e:
        logger.error(f"Error procesando imagen: {str(e)}")
        return False
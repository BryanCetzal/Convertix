import os
from celery import Celery
from PIL import Image
import time

# Configura Celery (usa Redis como broker)
app = Celery(
    'image_worker',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/1'
)

@app.task(bind=True)
def convert_to_webp(self, input_path, output_dir, quality=85):
    """
    Convierte una imagen PNG a WebP
    Args:
        input_path: Ruta del archivo PNG de entrada
        output_dir: Directorio para guardar el resultado
        quality: Calidad de compresión (1-100)
    Returns:
        Ruta del archivo WebP generado
    """
    try:
        # Verifica que el archivo exista
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"Archivo no encontrado: {input_path}")

        # Crea el directorio de salida si no existe
        os.makedirs(output_dir, exist_ok=True)

        # Genera nombre de archivo de salida
        filename = os.path.splitext(os.path.basename(input_path))[0] + '.webp'
        output_path = os.path.join(output_dir, filename)

        # Procesamiento de la imagen
        with Image.open(input_path) as img:
            # Conversión a RGB si es RGBA (para mejor compatibilidad)
            if img.mode == 'RGBA':
                img = img.convert('RGB')
            
            # Guarda en formato WebP
            img.save(
                output_path,
                'WEBP',
                quality=quality,
                method=6  # Método de compresión (0-6)
            )

        return {
            'status': 'COMPLETED',
            'output_path': output_path,
            'original_size': os.path.getsize(input_path),
            'webp_size': os.path.getsize(output_path),
            'compression_ratio': f"{(os.path.getsize(input_path) - os.path.getsize(output_path)) / os.path.getsize(input_path) * 100:.2f}%"
        }

    except Exception as e:
        return {
            'status': 'FAILED',
            'error': str(e),
            'input_path': input_path
        }
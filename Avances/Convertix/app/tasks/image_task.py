from celery import shared_task
import os
from PIL import Image as PILImage
from app.db.session import SessionLocal
from app.models.image import Image
from app.core.config import settings

@shared_task(bind=True, name="app.tasks.image_task.convert_image")
def convert_image(self, image_id: int, target_format: str, options: dict):
    db = SessionLocal()
    try:
        image = db.query(Image).filter(Image.id == image_id).first()
        if not image:
            raise ValueError("Imagen no encontrada")

        # Rutas de archivos
        input_path = os.path.join(settings.STORAGE_LOCAL_PATH, image.filename)
        output_filename = f"{os.path.splitext(image.filename)[0]}.{target_format}"
        output_path = os.path.join(settings.STORAGE_LOCAL_PATH, output_filename)

        # Procesar imagen
        with PILImage.open(input_path) as img:
            save_kwargs = {}
            if target_format == "webp":
                save_kwargs["quality"] = options.get("quality", 80)
            
            img.save(output_path, format=target_format.upper(), **save_kwargs)

        # Actualizar base de datos
        image.converted_format = target_format
        image.conversion_status = "completed"
        image.url = f"/api/v1/download/{output_filename}"
        db.commit()

        return {"status": "completed", "image_id": image_id}
        
    except Exception as e:
        if db:
            image.conversion_status = "failed"
            db.commit()
        raise e
    finally:
        db.close()
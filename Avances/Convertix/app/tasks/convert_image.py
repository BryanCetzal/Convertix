from celery import shared_task
from app.services.image_processor import process_image
from app.db.session import SessionLocal
from app.models.image import Image
from app.core.config import settings
import os

@shared_task(
    name="app.tasks.convert_image",
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={'max_retries': 3, 'countdown': 5}
)
def convert_image(self, image_id: int, target_format: str, options: dict = None):
    db = SessionLocal()
    try:
        # Get image from database
        image = db.query(Image).filter(Image.id == image_id).first()
        if not image:
            return {"status": "error", "message": "Image not found"}

        # Prepare paths
        input_path = os.path.join(settings.STORAGE_LOCAL_PATH, image.filename)
        output_filename = f"{os.path.splitext(image.filename)[0]}.{target_format}"
        output_path = os.path.join(settings.STORAGE_LOCAL_PATH, output_filename)

        # Process image
        if process_image(input_path, output_path, target_format, options or {}):
            # Update image on success
            image.url = f"{settings.SERVER_HOST}/storage/{output_filename}"
            image.converted_format = target_format
            image.conversion_status = "completed"
            db.commit()
            return {"status": "success", "message": "Conversion completed"}
        else:
            # Mark as failed
            image.conversion_status = "failed"
            db.commit()
            return {"status": "error", "message": "Conversion failed"}

    except Exception as e:
        if image:
            image.conversion_status = "failed"
            db.commit()
        raise
    finally:
        db.close()
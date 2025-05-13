import json
import os
from fastapi import APIRouter, Depends, Form, HTTPException, Response, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from PIL import Image as PILImage
from io import BytesIO
import uuid

from app.db.session import get_db
from app.models.image import Image
from app.core.config import settings
from app.core.celery_app import celery_app
from app.storage.local import storage

router = APIRouter()

@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        content = await file.read()

        # Validaciones
        if len(content) > settings.MAX_IMAGE_SIZE:
            raise HTTPException(status_code=400, detail="Archivo demasiado grande")
            
        file_format = file.filename.split('.')[-1].lower()
        if file_format not in settings.ALLOWED_IMAGE_FORMATS:
            raise HTTPException(status_code=400, detail="Formato no soportado")

        # Guardar archivo
        filename = f"{uuid.uuid4()}.{file_format}"
        file_path = os.path.join(settings.STORAGE_LOCAL_PATH, filename)
        
        os.makedirs(settings.STORAGE_LOCAL_PATH, exist_ok=True)
        with open(file_path, "wb") as buffer:
            buffer.write(content)

        # Guardar en DB
        db_image = Image(
            filename=filename,
            original_format=file_format,
            url=f"/download/{filename}",
            size=len(content),
            conversion_status="uploaded"
        )
        db.add(db_image)
        db.commit()
        db.refresh(db_image)

        return JSONResponse({
            "id": db_image.id,
            "filename": file.filename,
            "url": db_image.url,
            "status": "uploaded"
        })
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/convert")
async def convert_image(
    image_id: int = Form(...),
    target_format: str = Form(...),
    options: str = Form("{}"),
    db: Session = Depends(get_db)
):
    try:
        # Validar formato
        if target_format not in settings.ALLOWED_IMAGE_FORMATS:
            raise HTTPException(status_code=400, detail="Formato objetivo no válido")

        image = db.query(Image).filter(Image.id == image_id).first()
        if not image:
            raise HTTPException(status_code=404, detail="Imagen no encontrada")

        # Iniciar tarea Celery
        task = celery_app.send_task(
            "app.tasks.image_task.convert_image",
            args=[image.id, target_format, json.loads(options)]
        )
        
        # Actualizar estado en DB
        image.conversion_status = "processing"
        db.commit()
        
        return JSONResponse({
            "task_id": task.id,
            "image_id": image.id,
            "status": "processing"
        })
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Opciones inválidas")
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al enviar tarea a Celery: {str(e)}"
        )

@router.get("/status/{image_id}")
async def get_status(image_id: int, db: Session = Depends(get_db)):
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Imagen no encontrada")

    return JSONResponse({
        "status": image.conversion_status,
        "url": image.url if image.conversion_status == "completed" else None
    })

@router.get("/download/{filename}")
async def download_file(filename: str):
    file_path = os.path.join(settings.STORAGE_LOCAL_PATH, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    
    with open(file_path, "rb") as f:
        content = f.read()
    
    # Determina el tipo MIME basado en la extensión del archivo
    mime_type = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "webp": "image/webp"
    }.get(filename.split(".")[-1].lower(), "application/octet-stream")
    
    return Response(content, media_type=mime_type)

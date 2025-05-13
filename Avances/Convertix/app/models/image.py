from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, HttpUrl
from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship

from app.db.base_class import Base

class Image(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    format = Column(String)
    size = Column(Integer)
    url = Column(String)
    original_format = Column(String, nullable=True)
    converted_format = Column(String, nullable=True)
    conversion_status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    owner = relationship("User", back_populates="images")
    is_active = Column(Boolean, default=True)

# Modelos Pydantic

class ImageBase(BaseModel):
    filename: str
    url: HttpUrl
    format: str
    size: int
    owner_id: Optional[int] = None
    is_active: Optional[bool] = True
    original_format: Optional[str] = None
    converted_format: Optional[str] = None
    conversion_status: Optional[str] = "pending"

class ImageCreate(ImageBase):
    pass

class ImageUpdate(BaseModel):
    filename: Optional[str] = None
    format: Optional[str] = None
    size: Optional[int] = None
    is_active: Optional[bool] = None
    converted_format: Optional[str] = None
    conversion_status: Optional[str] = None

class ImageOut(ImageBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True  

# Modelo para solicitar una conversión
class ConversionRequest(BaseModel):
    target_format: str
    options: Optional[dict] = None


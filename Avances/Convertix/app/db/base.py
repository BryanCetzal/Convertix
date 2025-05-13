from app.core.config import settings
from app.db.base_class import Base
from app.models.user import User
from app.models.image import Image

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Create the SQLAlchemy engine
engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))

# Create a session class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
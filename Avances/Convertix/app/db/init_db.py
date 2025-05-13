from app.db.base import Base
from app.db.session import engine
from loguru import logger

def init_db() -> None:
    from app.models import user, image  
    
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized")
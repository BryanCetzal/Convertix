from fastapi import APIRouter

# Crea el router específico para auth
router = APIRouter()

@router.post("/login")
async def login():
    return {"message": "Login endpoint"}

# ... otros endpoints de autenticación
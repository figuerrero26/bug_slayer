from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.database import SessionLocal
from src.models.user_model import User
from src.schemas.user_schema import UserCreate


router = APIRouter(prefix="/users", tags=["users"])


def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


@router.post("/login")
def login(user: UserCreate, db: Session = Depends(get_db)):

    db_user = db.query(User).filter(User.username == user.username).first()

    if not db_user:
        raise HTTPException(status_code=401, detail="Usuario no existe")

    if db_user.password != user.password:
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")

    return {
        "message": "Login correcto",
        "username": db_user.username
    }
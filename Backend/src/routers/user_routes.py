from fastapi import APIRouter
from src.schemas.UserSchema import UserCreate, AuthUser, UserResponse, UserUpdate
from fastapi import Depends
from sqlalchemy.orm import Session
from src.models.persistence.DatabaseSession import DataBaseSession
from src.models.entities.User import User
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from src.security.auth import get_current_user
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "clave_super_secreta"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

db_session = DataBaseSession()

from typing import List
@router.get("/", response_model=List[UserResponse])
def get_users(current_user: str = Depends(get_current_user), db: Session = Depends(db_session.get_db)):
    users = db.query(User).all()

    return [
        {
            "id": user.id,
            "username": user.username
        }
        for user in users
    ]

@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(db_session.get_db)
):

    user = db.query(User).filter(User.username == current_user["username"]).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return user

@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(
    user_id: int,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(db_session.get_db)
):

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return user

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(db_session.get_db)
):

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    user.username = user_data.username

    db.commit()
    db.refresh(user)

    return user

@router.post("/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(db_session.get_db)):

    hashed_password = pwd_context.hash(user.password)

    new_user = User(
        username=user.username,
        password=hashed_password
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="El usuario ya existe")

    return new_user
        
    

@router.post("/login")
def login(user: AuthUser, db: Session = Depends(db_session.get_db)):

    db_user = db.query(User).filter(User.username == user.username).first()

    if not db_user:
        return {"error": "usuario no encontrado"}

    if not pwd_context.verify(user.password, db_user.password):
        return {"error": "contraseña incorrecta"}

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {
        "sub": db_user.username,
        "exp": datetime.utcnow() + access_token_expires
    }

    access_token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

    
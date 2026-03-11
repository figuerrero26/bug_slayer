from sqlalchemy.orm import Session
from src.models.user_model import User

def create_user(db: Session, username: str, password: str):
    user = User(
        username=username,
        password=password
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def login_user(db: Session, username: str, password: str):
    user = db.query(User).filter(User.username == username).first()

    if not user:
        return None

    if user.password != password:
        return None

    return user
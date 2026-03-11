from sqlalchemy import Column, Integer, String
from src.database import Base

class User(Base):

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True)
    password = Column(String(200))
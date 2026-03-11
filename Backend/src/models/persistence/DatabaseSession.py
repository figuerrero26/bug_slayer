from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from .connections import SessionLocal

class DataBaseSession():
    def get_db(self):
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()
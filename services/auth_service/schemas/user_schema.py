from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    birth_date: Optional[date] = None
    phone: str
    country_city: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    email: str

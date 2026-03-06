from pydantic import BaseModel , EmailStr, Field
from datetime import date
class AuthUser(BaseModel):
    username: str
    password: str
    class Config:
        from_attributes = True
    class Example:
        example = {
            "username": "johndoe",
            "password": "password123"
        }

# Nuevo esquema para la persona relacionada
class PersonData(BaseModel):
    cedula: str = None
    name: str = None
    email: EmailStr = None
    role: str = None
    birth_date: date = None
    class Config:
        schema_extra = {
            "example": {
                "cedula": "123456789",
                "name": "Juan Pérez",
                "email": "juan@example.com",
                "role": "Paciente",
                "birth_date": "1990-05-20"
            }
        }


# Esquema de creación de usuario
from pydantic import BaseModel
from datetime import date

class UserCreate(BaseModel):
    cedula: int = None
    name: str
    email: EmailStr
    birth_date: date
    username: str
    password: str
    rol: str = None # El nombre del rol que se asignará al usuario
    ocupation: str = None  # Ocupación del usuario (puede ser el rol o cualquier otra cosa)
    class Config:
        orm_mode = True
    class Example:
        example = {
            "cedula": "123456789",
            "name": "John Doe",
            "email": "",
            "birth_date": "1990-01-01",
            "username": "johndoe",
            "password": "password123",
            "rol": "admin",
            "ocupation": "developer"
        }


# Esquema de salida de usuario
class UserOut(BaseModel):
    id: int= None   
    username: str= None   
    ocupation: str = None   
    person: PersonData = None   
    class Config:
        schema_extra = {
            "example": {
                "id": 1,
                "username": "juanperez",
                "ocupation": "Estudiante",
                "person": {
                    "cedula": "123456789",
                    "name": "Juan Pérez",
                    "email": "juan@example.com",
                    "role": "Paciente",
                    "birth_date": "1990-05-20"
                }
            }
        }
    
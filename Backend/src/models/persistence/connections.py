
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError



from dotenv import load_dotenv
import os

load_dotenv()
db_database_url = os.getenv("DATABASE_URL")
print(db_database_url)

# Crear el motor de conexión
engine = create_engine(db_database_url, echo=True)

SessionLocal = sessionmaker(autoflush=False, autocommit=False, bind=engine)

Base = declarative_base()

try:
    # Intentamos establecer una conexión
    with engine.connect() as connection:
        print("Conexión exitosa a la base de datos.")
except SQLAlchemyError as e:
    print(f"Error al conectar a la base de datos: {e}")

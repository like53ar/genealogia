import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

# Cargar .env desde la carpeta backend/ (un nivel arriba de app/)
_backend_dir = Path(__file__).resolve().parent.parent
load_dotenv(_backend_dir / ".env")

# Ruta absoluta al .db como fallback si DATABASE_URL no está en .env
_default_db = f"sqlite:///{_backend_dir / 'genealogy.db'}"
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", _default_db)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_size=20,         # conexiones permanentes en el pool
    max_overflow=40,   # conexiones extra permitidas bajo carga alta
    pool_timeout=30,       # segundos esperando una conexión antes de error
    pool_recycle=1800,     # recicla conexiones cada 30 min (evita conexiones muertas)
    pool_pre_ping=True,    # verifica que la conexión esté viva antes de usarla
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
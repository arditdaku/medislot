from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.db.database import Base  # single Base, defined in database.py (SCRUM-38)

if not settings.DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set. Copy backend/.env.example to backend/.env "
        "and set DATABASE_URL before starting the app."
    )

# Synchronous engine (psycopg2). pool_pre_ping avoids serving stale connections.
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI dependency that yields a database session and closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

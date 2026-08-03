"""
Database Session & Connection Management (SQLAlchemy)
Supports PostgreSQL (Supabase) & SQLite Fallback.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config.settings import settings
from config.logging_config import logger

db_url = settings.DATABASE_URL
connect_args = {}

if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    db_url,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency injection helper for FastAPI database session management."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Creates all PostgreSQL / SQLite database tables."""
    from backend.database import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    logger.info("Database schema successfully created/verified.")

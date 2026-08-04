"""
Database Session & Connection Management (SQLAlchemy)
Connects seamlessly to Supabase PostgreSQL or SQLite fallback.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config.settings import settings
from config.logging_config import logger

db_url = settings.DATABASE_URL
connect_args = {}

if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    logger.info("Using SQLite database engine.")
else:
    logger.info("Using PostgreSQL/Supabase database engine target.")

try:
    engine = create_engine(
        db_url,
        connect_args=connect_args,
        pool_pre_ping=True
    )
    # Test connection
    with engine.connect() as conn:
        pass
except Exception as e:
    if not db_url.startswith("sqlite"):
        logger.warning(f"Could not connect to target PostgreSQL database ({e}). Falling back to local SQLite engine.")
        db_url = "sqlite:///./threat_intel.db"
        engine = create_engine(db_url, connect_args={"check_same_thread": False}, pool_pre_ping=True)

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
    """Creates all PostgreSQL / Supabase / SQLite database tables automatically if missing."""
    from backend.database import models  # noqa: F401
    from sqlalchemy import text
    Base.metadata.create_all(bind=engine)
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0 NOT NULL;"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE;"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE NOT NULL;"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_otp VARCHAR(6);"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP WITH TIME ZONE;"))
            conn.commit()
    except Exception as err:
        logger.debug(f"Schema column check: {err}")
    logger.info("Database schema successfully created/verified on target database.")



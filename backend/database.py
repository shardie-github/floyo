"""Database connection and session management."""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
import os
from backend.config import settings

# Database URL from settings
DATABASE_URL = settings.database_url

# For SQLite (development/testing)
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
else:
    # Optimize connection pooling for PostgreSQL
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,  # Verify connections before using
        pool_size=settings.database_pool_size,  # Number of connections to maintain
        max_overflow=settings.database_max_overflow,  # Additional connections allowed beyond pool_size
        pool_recycle=settings.database_pool_recycle,  # Recycle connections after 1 hour
        echo=False,  # Set to True for SQL logging
    )


def get_pool_status():
    """Get connection pool status."""
    pool = engine.pool
    return {
        "size": pool.size(),
        "checked_in": pool.checkedin(),
        "checked_out": pool.checkedout(),
        "overflow": pool.overflow(),
        "invalid": pool.invalid()
    }

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Initialize database tables."""
    from database.models import Base
    Base.metadata.create_all(bind=engine)


def get_db() -> Session:
    """Get database session."""
    # Note: Circuit breaker protection is available but not applied here
    # due to generator function complexity. Circuit breaker can be applied
    # at the endpoint level if needed.
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

"""Database connection and session management."""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
import os
from typing import Generator
from backend.config import settings
from backend.circuit_breaker import db_circuit_breaker

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


def get_db() -> Generator[Session, None, None]:
    """
    Get database session with circuit breaker protection.
    
    This generator function yields a database session and ensures proper cleanup.
    The circuit breaker protects against cascading failures when the database is unavailable.
    """
    # Check circuit breaker state before creating session
    if db_circuit_breaker.state == "open":
        # Check if timeout has passed
        import time
        if db_circuit_breaker.last_failure_time and \
           time.time() - db_circuit_breaker.last_failure_time > db_circuit_breaker.timeout:
            db_circuit_breaker.state = "half_open"
            from backend.logging_config import get_logger
            logger = get_logger(__name__)
            logger.info("Circuit breaker transitioning to half_open for database")
        else:
            from backend.logging_config import get_logger
            logger = get_logger(__name__)
            logger.warning("Circuit breaker is open for database - request rejected")
            raise Exception("Circuit breaker is open - database service unavailable")
    
    # Try to create session
    db = None
    try:
        db = SessionLocal()
        
        # Test connection
        db.execute(text("SELECT 1"))
        
        # Success - reset circuit breaker if in half_open
        if db_circuit_breaker.state == "half_open":
            db_circuit_breaker.state = "closed"
            db_circuit_breaker.failure_count = 0
            from backend.logging_config import get_logger
            logger = get_logger(__name__)
            logger.info("Circuit breaker closed for database after successful request")
        
        yield db
    except Exception as e:
        # Failure - increment failure count
        import time
        db_circuit_breaker.failure_count += 1
        db_circuit_breaker.last_failure_time = time.time()
        
        if db_circuit_breaker.failure_count >= db_circuit_breaker.failure_threshold:
            db_circuit_breaker.state = "open"
            from backend.logging_config import get_logger
            logger = get_logger(__name__)
            logger.error(
                f"Circuit breaker opened for database "
                f"after {db_circuit_breaker.failure_count} failures"
            )
        
        # Close session if it was created
        if db is not None:
            db.close()
        
        raise
    finally:
        if db is not None:
            db.close()

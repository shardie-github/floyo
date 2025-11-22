"""FastAPI backend application for Floyo - Minimal initialization file."""

from fastapi import FastAPI
from backend.logging_config import setup_logging, get_logger
from backend.sentry_config import init_sentry
from backend.cache import init_cache
from backend.database import SessionLocal, init_db
from backend.config import settings
from backend.connectors import initialize_connectors
from backend.middleware import setup_middleware
from backend.api import register_routes

# Set up logging
setup_logging()
logger = get_logger(__name__)

# Initialize Sentry
init_sentry()

# Initialize cache
init_cache()

# Initialize database
init_db()

# Check migration status on startup
def check_migration_status():
    """Check if database migrations are up to date."""
    try:
        from alembic.config import Config
        from alembic import script
        from alembic.runtime.migration import MigrationContext
        from sqlalchemy import create_engine
        
        alembic_cfg = Config("alembic.ini")
        script_dir = script.ScriptDirectory.from_config(alembic_cfg)
        
        # Get current database revision
        from backend.database import engine
        with engine.connect() as conn:
            context = MigrationContext.configure(conn)
            current_rev = context.get_current_revision()
        
        # Get head revision
        head_rev = script_dir.get_current_head()
        
        if current_rev != head_rev:
            logger.warning(f"Database migrations are not up to date. Current: {current_rev}, Head: {head_rev}")
            if settings.environment == "production":
                raise ValueError(
                    f"Database migrations are not up to date. "
                    f"Current: {current_rev}, Head: {head_rev}. "
                    f"Run 'alembic upgrade head' to apply migrations."
                )
        else:
            logger.info("Database migrations are up to date")
    except Exception as e:
        logger.warning(f"Could not check migration status: {e}")
        # Don't fail startup if migration check fails (might be in dev)

# Check migrations on startup
try:
    check_migration_status()
except Exception as e:
    if settings.environment == "production":
        raise
    logger.warning(f"Migration check skipped: {e}")

# Initialize default connectors
db_init = SessionLocal()
try:
    initialize_connectors(db_init)
finally:
    db_init.close()

# FastAPI app
app = FastAPI(
    title="Floyo API",
    description="""
    ## Floyo API Documentation
    
    Floyo is a file usage pattern tracking system that suggests concrete, niche API integrations 
    based on actual user routines.
    
    ### Features
    
    * **User Authentication**: JWT-based authentication with email verification
    * **Event Tracking**: Track file operations and tool usage
    * **Pattern Analysis**: Discover usage patterns from tracked events
    * **Integration Suggestions**: Get intelligent suggestions for API integrations
    * **File Upload**: Upload files and track them as events
    
    ### Authentication
    
    Most endpoints require authentication. Include the JWT token in the Authorization header:
    
    ```
    Authorization: Bearer <token>
    ```
    
    ### API Versioning
    
    Current version: v1
    - `/api/v1/*` - Versioned endpoints (recommended)
    - `/api/*` - Legacy endpoints (deprecated, will be removed in v2)
    
    ### Endpoints
    
    - `/api/v1/auth/*` - Authentication endpoints
    - `/api/v1/events/*` - Event tracking endpoints
    - `/api/v1/patterns` - Pattern analysis endpoints
    - `/api/v1/suggestions/*` - Integration suggestion endpoints
    - `/api/v1/stats` - Statistics endpoints
    - `/api/v1/config` - User configuration endpoints
    """,
    version="1.0.0",
    contact={
        "name": "Floyo Support",
        "email": "support@floyo.dev",
    },
    license_info={
        "name": "Apache 2.0",
        "url": "https://www.apache.org/licenses/LICENSE-2.0.html",
    },
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Setup middleware
setup_middleware(app)

# Register all API routes
register_routes(app)


# Routes - All endpoints have been migrated to backend/api/ modules

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

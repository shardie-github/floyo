"""Celery task for data retention cleanup."""

import logging
from datetime import datetime
from backend.database import SessionLocal
from backend.data_retention import get_retention_policy

logger = logging.getLogger(__name__)

# Try to import Celery, fallback to sync execution if not available
try:
    from celery import Celery
    
    # Initialize Celery app (configure with your broker URL)
    import os
    from celery.schedules import crontab
    celery_app = Celery('retention_job')
    celery_app.conf.broker_url = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    celery_app.conf.result_backend = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
    celery_app.conf.task_serializer = "json"
    celery_app.conf.accept_content = ["json"]
    celery_app.conf.result_serializer = "json"
    celery_app.conf.timezone = "UTC"
    celery_app.conf.enable_utc = True
    
    CELERY_AVAILABLE = True
except ImportError:
    CELERY_AVAILABLE = False
    logger.warning("Celery not available. Data retention cleanup will run synchronously.")


def run_data_retention_cleanup(dry_run: bool = False):
    """
    Run data retention cleanup.
    
    This can be called directly or as a Celery task.
    
    Args:
        dry_run: If True, only report what would be deleted without deleting
    
    Returns:
        Dict with cleanup results
    """
    db = SessionLocal()
    try:
        policy = get_retention_policy()
        results = policy.cleanup_all(db, dry_run=dry_run)
        logger.info(f"Data retention cleanup completed: {results}")
        return results
    except Exception as e:
        logger.error(f"Error in data retention cleanup: {e}")
        raise
    finally:
        db.close()


if CELERY_AVAILABLE:
    @celery_app.task(name="retention.cleanup")
    def cleanup_retention_task(dry_run: bool = False):
        """Celery task for data retention cleanup."""
        return run_data_retention_cleanup(dry_run=dry_run)
    
    # Schedule periodic task (runs daily at 2 AM UTC)
    celery_app.conf.beat_schedule = {
        "daily-retention-cleanup": {
            "task": "retention.cleanup",
            "schedule": crontab(hour=2, minute=0),
            "args": (False,)
        }
    }

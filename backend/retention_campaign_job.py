"""Celery task for automated retention email campaigns."""

import logging
from datetime import datetime
from backend.database import SessionLocal
from backend.retention_campaigns import RetentionCampaignService

logger = logging.getLogger(__name__)

# Try to import Celery
try:
    from celery import Celery
    import os
    from celery.schedules import crontab
    
    celery_app = Celery('retention_campaigns')
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
    logger.warning("Celery not available. Retention campaigns will run synchronously.")


def run_retention_campaigns():
    """
    Process retention campaigns.
    
    This can be called directly or as a Celery task.
    
    Returns:
        Dict with campaign results
    """
    db = SessionLocal()
    try:
        results = RetentionCampaignService.process_retention_campaigns(db)
        logger.info(f"Retention campaigns processed: {results}")
        return results
    except Exception as e:
        logger.error(f"Error processing retention campaigns: {e}", exc_info=True)
        raise
    finally:
        db.close()


if CELERY_AVAILABLE:
    @celery_app.task(name="retention_campaigns.process")
    def process_retention_campaigns_task():
        """Celery task for processing retention campaigns."""
        return run_retention_campaigns()
    
    # Schedule periodic task (runs daily at 10 AM UTC)
    celery_app.conf.beat_schedule = {
        "daily-retention-campaigns": {
            "task": "retention_campaigns.process",
            "schedule": crontab(hour=10, minute=0),
        }
    }


# For direct execution (testing)
if __name__ == "__main__":
    results = run_retention_campaigns()
    print(f"Retention campaigns results: {results}")

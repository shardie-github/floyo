"""Celery tasks for automated reporting."""

import logging
from datetime import datetime
from backend.database import SessionLocal
from backend.automated_reporting import AutomatedReporting

logger = logging.getLogger(__name__)

# Try to import Celery
try:
    from celery import Celery
    import os
    from celery.schedules import crontab
    
    celery_app = Celery('automated_reporting')
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
    logger.warning("Celery not available. Automated reporting will run synchronously.")


def send_daily_report():
    """Send daily business report."""
    db = SessionLocal()
    try:
        success = AutomatedReporting.send_daily_report_email(db)
        logger.info(f"Daily report sent: {success}")
        return {"success": success, "sent_at": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.error(f"Error sending daily report: {e}", exc_info=True)
        raise
    finally:
        db.close()


def send_weekly_report():
    """Send weekly business report."""
    db = SessionLocal()
    try:
        success = AutomatedReporting.send_weekly_report_email(db)
        logger.info(f"Weekly report sent: {success}")
        return {"success": success, "sent_at": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.error(f"Error sending weekly report: {e}", exc_info=True)
        raise
    finally:
        db.close()


if CELERY_AVAILABLE:
    @celery_app.task(name="backend.automated_reporting.send_daily_report_task")
    def send_daily_report_task():
        """Celery task for sending daily report."""
        return send_daily_report()
    
    @celery_app.task(name="backend.automated_reporting.send_weekly_report_task")
    def send_weekly_report_task():
        """Celery task for sending weekly report."""
        return send_weekly_report()

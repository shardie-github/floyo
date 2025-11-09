"""Celery task for KPI alerts."""

import logging
from datetime import datetime
from backend.database import SessionLocal
from backend.kpi_alerts import KPIAlertSystem

logger = logging.getLogger(__name__)

# Try to import Celery
try:
    from celery import Celery
    import os
    from celery.schedules import crontab
    
    celery_app = Celery('kpi_alerts')
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
    logger.warning("Celery not available. KPI alerts will run synchronously.")


def check_alerts():
    """Check KPI alerts and send notifications."""
    db = SessionLocal()
    try:
        result = KPIAlertSystem.check_and_alert(db, days=7, send_email=True)
        logger.info(f"KPI alerts checked: {result['alerts_found']} alerts found")
        return result
    except Exception as e:
        logger.error(f"Error checking KPI alerts: {e}", exc_info=True)
        raise
    finally:
        db.close()


if CELERY_AVAILABLE:
    @celery_app.task(name="backend.kpi_alerts.check_alerts_task")
    def check_alerts_task():
        """Celery task for checking KPI alerts."""
        return check_alerts()

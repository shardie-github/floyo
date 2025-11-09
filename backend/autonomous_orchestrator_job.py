"""Celery task for autonomous orchestrator."""

import logging
from datetime import datetime
from backend.database import SessionLocal
from backend.autonomous_orchestrator import AutonomousOrchestrator

logger = logging.getLogger(__name__)

# Try to import Celery
try:
    from celery import Celery
    import os
    from celery.schedules import crontab
    
    celery_app = Celery('autonomous_orchestrator')
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
    logger.warning("Celery not available. Autonomous orchestrator will run synchronously.")


def run_autonomous_cycle(dry_run: bool = True):
    """Run complete autonomous cycle."""
    db = SessionLocal()
    try:
        results = AutonomousOrchestrator.run_full_cycle(db, dry_run)
        logger.info(f"Autonomous cycle completed: {results.get('summary', {})}")
        return results
    except Exception as e:
        logger.error(f"Error running autonomous cycle: {e}", exc_info=True)
        raise
    finally:
        db.close()


def monitor_and_respond():
    """Continuous monitoring and response."""
    db = SessionLocal()
    try:
        response = AutonomousOrchestrator.monitor_and_respond(db)
        logger.info(f"Monitoring response: {len(response.get('actions_taken', []))} actions taken")
        return response
    except Exception as e:
        logger.error(f"Error in monitoring: {e}", exc_info=True)
        raise
    finally:
        db.close()


if CELERY_AVAILABLE:
    @celery_app.task(name="autonomous_orchestrator.run_cycle")
    def run_autonomous_cycle_task(dry_run: bool = True):
        """Celery task for running autonomous cycle."""
        return run_autonomous_cycle(dry_run)
    
    @celery_app.task(name="autonomous_orchestrator.monitor")
    def monitor_and_respond_task():
        """Celery task for monitoring and responding."""
        return monitor_and_respond()
    
    # Schedule periodic tasks
    celery_app.conf.beat_schedule = {
        "autonomous-cycle": {
            "task": "autonomous_orchestrator.run_cycle",
            "schedule": crontab(hour="*/4", minute=0),  # Every 4 hours
            "args": (False,)  # Not dry-run in production
        },
        "autonomous-monitoring": {
            "task": "autonomous_orchestrator.monitor",
            "schedule": crontab(hour="*/1", minute=30),  # Every hour at :30
        }
    }

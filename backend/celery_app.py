"""Celery application for background task processing."""

import os
from celery import Celery
from celery.schedules import crontab

# Initialize Celery
celery_app = Celery(
    'floyo',
    broker=os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0'),
    backend=os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0'),
    include=[
        'backend.ml.training_job',
        'backend.workflow_scheduler',
        'backend.retention_job',
    ]
)

# Celery configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=1000,
)

# Periodic tasks schedule
celery_app.conf.beat_schedule = {
    # ML model retraining (weekly)
    'retrain-ml-models': {
        'task': 'backend.ml.training_job.schedule_retraining_task',
        'schedule': crontab(hour=2, minute=0, day_of_week=0),  # Sunday 2 AM
    },
    # Retention campaigns (daily)
    'send-retention-campaigns': {
        'task': 'backend.retention_job.send_daily_retention_campaigns',
        'schedule': crontab(hour=10, minute=0),  # 10 AM daily
    },
    # Workflow execution (every minute)
    'check-workflow-schedules': {
        'task': 'backend.workflow_scheduler.check_and_execute_workflows',
        'schedule': 60.0,  # Every minute
    },
    # Data retention cleanup (daily)
    'cleanup-old-data': {
        'task': 'backend.data_retention.cleanup_old_data',
        'schedule': crontab(hour=3, minute=0),  # 3 AM daily
    },
    # ML model evaluation (daily)
    'evaluate-ml-models': {
        'task': 'backend.ml.evaluator.evaluate_all_models',
        'schedule': crontab(hour=1, minute=0),  # 1 AM daily
    },
}

if __name__ == '__main__':
    celery_app.start()

"""Metrics aggregation jobs for daily/weekly analytics."""

import os
import sys
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, text

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.database import SessionLocal, get_db
from backend.logging_config import setup_logging, get_logger
from database.models import AuditLog, User, Event, Pattern

setup_logging()
logger = get_logger(__name__)


def aggregate_daily_metrics(db: Session, date: datetime = None) -> Dict[str, Any]:
    """
    Aggregate daily metrics for a given date (defaults to yesterday).
    
    Returns:
        Dictionary with daily metrics including:
        - signups: Number of new signups
        - activations: Number of users activated
        - events_tracked: Total events tracked
        - activation_rate: Percentage of signups who activated
    """
    if date is None:
        date = datetime.utcnow() - timedelta(days=1)
    
    start_date = date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_date = start_date + timedelta(days=1)
    
    logger.info(f"Aggregating daily metrics for {start_date.date()}")
    
    try:
        # Count signups
        signups = db.query(func.count(User.id)).filter(
            and_(
                User.created_at >= start_date,
                User.created_at < end_date
            )
        ).scalar() or 0
        
        # Count activations (users who viewed first insight)
        activations = db.query(func.count(func.distinct(AuditLog.user_id))).filter(
            and_(
                AuditLog.action == 'activation_event:first_insight_view',
                AuditLog.created_at >= start_date,
                AuditLog.created_at < end_date
            )
        ).scalar() or 0
        
        # Count events tracked
        events_tracked = db.query(func.count(Event.id)).filter(
            and_(
                Event.created_at >= start_date,
                Event.created_at < end_date
            )
        ).scalar() or 0
        
        # Calculate activation rate
        activation_rate = (activations / signups * 100) if signups > 0 else 0
        
        metrics = {
            "date": start_date.date().isoformat(),
            "signups": signups,
            "activations": activations,
            "events_tracked": events_tracked,
            "activation_rate": round(activation_rate, 2),
            "created_at": datetime.utcnow().isoformat()
        }
        
        logger.info(f"Daily metrics: {metrics}")
        return metrics
        
    except Exception as e:
        logger.error(f"Error aggregating daily metrics: {e}", exc_info=True)
        raise


def aggregate_weekly_metrics(db: Session, week_start: datetime = None) -> Dict[str, Any]:
    """
    Aggregate weekly metrics for a given week (defaults to last week).
    
    Returns:
        Dictionary with weekly metrics including:
        - week_start: Start date of the week
        - signups: Total signups for the week
        - activations: Total activations for the week
        - activation_rate: Weekly activation rate
        - retention_7d: 7-day retention rate
    """
    if week_start is None:
        # Get Monday of last week
        today = datetime.utcnow()
        days_since_monday = (today.weekday()) % 7
        last_monday = today - timedelta(days=days_since_monday + 7)
        week_start = last_monday.replace(hour=0, minute=0, second=0, microsecond=0)
    
    week_end = week_start + timedelta(days=7)
    
    logger.info(f"Aggregating weekly metrics for week starting {week_start.date()}")
    
    try:
        # Count signups for the week
        signups = db.query(func.count(User.id)).filter(
            and_(
                User.created_at >= week_start,
                User.created_at < week_end
            )
        ).scalar() or 0
        
        # Count activations for the week
        activations = db.query(func.count(func.distinct(AuditLog.user_id))).filter(
            and_(
                AuditLog.action == 'activation_event:first_insight_view',
                AuditLog.created_at >= week_start,
                AuditLog.created_at < week_end
            )
        ).scalar() or 0
        
        # Calculate activation rate
        activation_rate = (activations / signups * 100) if signups > 0 else 0
        
        # Calculate 7-day retention (users who signed up and were active 7 days later)
        retention_users = db.query(func.count(func.distinct(User.id))).join(
            AuditLog, User.id == AuditLog.user_id
        ).filter(
            and_(
                User.created_at >= week_start,
                User.created_at < week_end,
                AuditLog.created_at >= week_start + timedelta(days=7),
                AuditLog.created_at < week_end + timedelta(days=7)
            )
        ).scalar() or 0
        
        retention_7d = (retention_users / signups * 100) if signups > 0 else 0
        
        metrics = {
            "week_start": week_start.date().isoformat(),
            "signups": signups,
            "activations": activations,
            "activation_rate": round(activation_rate, 2),
            "retention_7d": round(retention_7d, 2),
            "created_at": datetime.utcnow().isoformat()
        }
        
        logger.info(f"Weekly metrics: {metrics}")
        return metrics
        
    except Exception as e:
        logger.error(f"Error aggregating weekly metrics: {e}", exc_info=True)
        raise


def run_daily_aggregation():
    """Run daily metrics aggregation job."""
    db = SessionLocal()
    try:
        metrics = aggregate_daily_metrics(db)
        logger.info(f"Daily aggregation completed: {metrics}")
        return metrics
    finally:
        db.close()


def run_weekly_aggregation():
    """Run weekly metrics aggregation job."""
    db = SessionLocal()
    try:
        metrics = aggregate_weekly_metrics(db)
        logger.info(f"Weekly aggregation completed: {metrics}")
        return metrics
    finally:
        db.close()


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Run metrics aggregation jobs")
    parser.add_argument("--daily", action="store_true", help="Run daily aggregation")
    parser.add_argument("--weekly", action="store_true", help="Run weekly aggregation")
    
    args = parser.parse_args()
    
    if args.daily:
        run_daily_aggregation()
    elif args.weekly:
        run_weekly_aggregation()
    else:
        # Default to daily
        run_daily_aggregation()

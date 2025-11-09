"""Data quality monitoring and validation."""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from database.models import User, Event, Workflow, Suggestion, Subscription
import logging

logger = logging.getLogger(__name__)


class DataQualityMonitor:
    """Monitor data quality and detect anomalies."""
    
    @staticmethod
    def check_data_quality(db: Session, days: int = 7) -> Dict[str, Any]:
        """Check data quality metrics."""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        quality_checks = {}
        
        # Check for orphaned records
        # Events without users
        orphaned_events = db.query(func.count(Event.id)).filter(
            ~Event.user_id.in_(db.query(User.id))
        ).scalar() or 0
        
        # Workflows without users
        orphaned_workflows = db.query(func.count(Workflow.id)).filter(
            ~Workflow.user_id.in_(db.query(User.id))
        ).scalar() or 0
        
        quality_checks["orphaned_records"] = {
            "events": orphaned_events,
            "workflows": orphaned_workflows,
            "status": "warning" if orphaned_events > 0 or orphaned_workflows > 0 else "ok"
        }
        
        # Check for duplicate users (same email)
        duplicate_emails = db.query(
            User.email,
            func.count(User.id).label("count")
        ).group_by(User.email).having(func.count(User.id) > 1).all()
        
        quality_checks["duplicate_users"] = {
            "count": len(duplicate_emails),
            "status": "warning" if duplicate_emails else "ok"
        }
        
        # Check for missing required fields
        users_no_email = db.query(func.count(User.id)).filter(
            or_(User.email.is_(None), User.email == "")
        ).scalar() or 0
        
        quality_checks["missing_fields"] = {
            "users_no_email": users_no_email,
            "status": "error" if users_no_email > 0 else "ok"
        }
        
        # Check for data freshness
        recent_events = db.query(func.count(Event.id)).filter(
            Event.timestamp >= cutoff_date
        ).scalar() or 0
        
        quality_checks["data_freshness"] = {
            "events_last_7_days": recent_events,
            "status": "warning" if recent_events == 0 else "ok"
        }
        
        # Check for anomalies in event counts
        avg_events_per_user = db.query(
            func.avg(func.count(Event.id))
        ).join(User).filter(
            Event.timestamp >= cutoff_date
        ).group_by(User.id).scalar() or 0
        
        # Find users with unusually high event counts (potential bots)
        high_event_users = db.query(
            Event.user_id,
            func.count(Event.id).label("event_count")
        ).filter(
            Event.timestamp >= cutoff_date
        ).group_by(Event.user_id).having(
            func.count(Event.id) > avg_events_per_user * 10
        ).all()
        
        quality_checks["anomalies"] = {
            "avg_events_per_user": round(avg_events_per_user, 2),
            "high_event_users": len(high_event_users),
            "status": "warning" if len(high_event_users) > 0 else "ok"
        }
        
        # Overall quality score
        issues = sum([
            1 for check in quality_checks.values()
            if check.get("status") in ["warning", "error"]
        ])
        
        total_checks = len(quality_checks)
        quality_score = ((total_checks - issues) / total_checks * 100) if total_checks > 0 else 100
        
        return {
            "quality_score": round(quality_score, 2),
            "checks": quality_checks,
            "period_days": days,
            "checked_at": datetime.utcnow().isoformat()
        }
    
    @staticmethod
    def validate_analytics_event(event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate analytics event data quality."""
        errors = []
        warnings = []
        
        # Required fields
        if "name" not in event_data or not event_data["name"]:
            errors.append("Event name is required")
        
        if "timestamp" not in event_data:
            warnings.append("Event timestamp missing, will use current time")
        
        # Validate timestamp format
        if "timestamp" in event_data:
            try:
                datetime.fromisoformat(event_data["timestamp"].replace("Z", "+00:00"))
            except:
                errors.append("Invalid timestamp format")
        
        # Validate properties
        if "properties" in event_data and not isinstance(event_data["properties"], dict):
            errors.append("Event properties must be a dictionary")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }

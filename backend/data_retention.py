"""Data retention policies and automated cleanup."""

import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from database.models import (
    Event, Pattern, FileRelationship, TemporalPattern,
    Suggestion, UserSession, AuditLog, WorkflowExecution,
    IntegrationConnector, UserIntegration
)

logger = logging.getLogger(__name__)


class DataRetentionPolicy:
    """Data retention policy configuration and enforcement."""
    
    def __init__(
        self,
        events_retention_days: int = 365,
        patterns_retention_days: int = 730,
        sessions_retention_days: int = 90,
        audit_logs_retention_days: int = 2555,  # 7 years for compliance
        workflow_executions_retention_days: int = 180,
        suggestions_retention_days: int = 180,
        archived_events_retention_days: int = 3650,  # 10 years for archived
    ):
        """
        Initialize retention policy.
        
        Args:
            events_retention_days: Days to retain events (default 1 year)
            patterns_retention_days: Days to retain patterns (default 2 years)
            sessions_retention_days: Days to retain sessions (default 90 days)
            audit_logs_retention_days: Days to retain audit logs (default 7 years)
            workflow_executions_retention_days: Days to retain workflow executions (default 6 months)
            suggestions_retention_days: Days to retain suggestions (default 6 months)
            archived_events_retention_days: Days to retain archived events (default 10 years)
        """
        self.events_retention_days = events_retention_days
        self.patterns_retention_days = patterns_retention_days
        self.sessions_retention_days = sessions_retention_days
        self.audit_logs_retention_days = audit_logs_retention_days
        self.workflow_executions_retention_days = workflow_executions_retention_days
        self.suggestions_retention_days = suggestions_retention_days
        self.archived_events_retention_days = archived_events_retention_days
    
    def cleanup_old_events(self, db: Session, dry_run: bool = False) -> Dict[str, Any]:
        """Clean up old events based on retention policy."""
        cutoff_date = datetime.utcnow() - timedelta(days=self.events_retention_days)
        
        query = db.query(Event).filter(Event.timestamp < cutoff_date)
        count = query.count()
        
        if not dry_run and count > 0:
            query.delete(synchronize_session=False)
            db.commit()
            logger.info(f"Deleted {count} events older than {cutoff_date}")
        
        return {
            "type": "events",
            "cutoff_date": cutoff_date.isoformat(),
            "deleted_count": count if not dry_run else 0,
            "would_delete": count if dry_run else 0,
            "dry_run": dry_run
        }
    
    def cleanup_old_patterns(self, db: Session, dry_run: bool = False) -> Dict[str, Any]:
        """Clean up old patterns (only if no recent usage)."""
        cutoff_date = datetime.utcnow() - timedelta(days=self.patterns_retention_days)
        
        # Only delete patterns with no recent usage
        query = db.query(Pattern).filter(
            and_(
                Pattern.last_used < cutoff_date,
                Pattern.last_used.isnot(None)
            )
        )
        count = query.count()
        
        if not dry_run and count > 0:
            query.delete(synchronize_session=False)
            db.commit()
            logger.info(f"Deleted {count} patterns with no recent usage")
        
        return {
            "type": "patterns",
            "cutoff_date": cutoff_date.isoformat(),
            "deleted_count": count if not dry_run else 0,
            "would_delete": count if dry_run else 0,
            "dry_run": dry_run
        }
    
    def cleanup_old_sessions(self, db: Session, dry_run: bool = False) -> Dict[str, Any]:
        """Clean up expired sessions."""
        cutoff_date = datetime.utcnow() - timedelta(days=self.sessions_retention_days)
        
        # Delete expired sessions or old sessions
        query = db.query(UserSession).filter(
            or_(
                UserSession.expires_at < datetime.utcnow(),
                UserSession.last_used_at < cutoff_date
            )
        )
        count = query.count()
        
        if not dry_run and count > 0:
            query.delete(synchronize_session=False)
            db.commit()
            logger.info(f"Deleted {count} expired or old sessions")
        
        return {
            "type": "sessions",
            "cutoff_date": cutoff_date.isoformat(),
            "deleted_count": count if not dry_run else 0,
            "would_delete": count if dry_run else 0,
            "dry_run": dry_run
        }
    
    def cleanup_old_audit_logs(self, db: Session, dry_run: bool = False) -> Dict[str, Any]:
        """Clean up old audit logs (longer retention for compliance)."""
        cutoff_date = datetime.utcnow() - timedelta(days=self.audit_logs_retention_days)
        
        query = db.query(AuditLog).filter(AuditLog.created_at < cutoff_date)
        count = query.count()
        
        if not dry_run and count > 0:
            query.delete(synchronize_session=False)
            db.commit()
            logger.info(f"Deleted {count} audit logs older than {cutoff_date}")
        
        return {
            "type": "audit_logs",
            "cutoff_date": cutoff_date.isoformat(),
            "deleted_count": count if not dry_run else 0,
            "would_delete": count if dry_run else 0,
            "dry_run": dry_run
        }
    
    def cleanup_old_workflow_executions(self, db: Session, dry_run: bool = False) -> Dict[str, Any]:
        """Clean up old workflow execution records."""
        cutoff_date = datetime.utcnow() - timedelta(days=self.workflow_executions_retention_days)
        
        query = db.query(WorkflowExecution).filter(WorkflowExecution.created_at < cutoff_date)
        count = query.count()
        
        if not dry_run and count > 0:
            query.delete(synchronize_session=False)
            db.commit()
            logger.info(f"Deleted {count} workflow executions older than {cutoff_date}")
        
        return {
            "type": "workflow_executions",
            "cutoff_date": cutoff_date.isoformat(),
            "deleted_count": count if not dry_run else 0,
            "would_delete": count if dry_run else 0,
            "dry_run": dry_run
        }
    
    def cleanup_old_suggestions(self, db: Session, dry_run: bool = False) -> Dict[str, Any]:
        """Clean up old suggestions."""
        cutoff_date = datetime.utcnow() - timedelta(days=self.suggestions_retention_days)
        
        query = db.query(Suggestion).filter(Suggestion.created_at < cutoff_date)
        count = query.count()
        
        if not dry_run and count > 0:
            query.delete(synchronize_session=False)
            db.commit()
            logger.info(f"Deleted {count} suggestions older than {cutoff_date}")
        
        return {
            "type": "suggestions",
            "cutoff_date": cutoff_date.isoformat(),
            "deleted_count": count if not dry_run else 0,
            "would_delete": count if dry_run else 0,
            "dry_run": dry_run
        }
    
    def cleanup_all(self, db: Session, dry_run: bool = False) -> Dict[str, Any]:
        """Run all cleanup operations."""
        results = {
            "timestamp": datetime.utcnow().isoformat(),
            "dry_run": dry_run,
            "cleanups": []
        }
        
        try:
            results["cleanups"].append(self.cleanup_old_events(db, dry_run))
            results["cleanups"].append(self.cleanup_old_patterns(db, dry_run))
            results["cleanups"].append(self.cleanup_old_sessions(db, dry_run))
            results["cleanups"].append(self.cleanup_old_audit_logs(db, dry_run))
            results["cleanups"].append(self.cleanup_old_workflow_executions(db, dry_run))
            results["cleanups"].append(self.cleanup_old_suggestions(db, dry_run))
            
            total_deleted = sum(c.get("deleted_count", 0) for c in results["cleanups"])
            total_would_delete = sum(c.get("would_delete", 0) for c in results["cleanups"])
            
            results["total_deleted"] = total_deleted
            results["total_would_delete"] = total_would_delete
            results["success"] = True
            
        except Exception as e:
            logger.error(f"Error during data retention cleanup: {e}")
            results["success"] = False
            results["error"] = str(e)
        
        return results


# Default retention policy (can be configured via environment variables)
def get_retention_policy() -> DataRetentionPolicy:
    """Get retention policy from environment variables or defaults."""
    import os
    
    return DataRetentionPolicy(
        events_retention_days=int(os.getenv("RETENTION_EVENTS_DAYS", "365")),
        patterns_retention_days=int(os.getenv("RETENTION_PATTERNS_DAYS", "730")),
        sessions_retention_days=int(os.getenv("RETENTION_SESSIONS_DAYS", "90")),
        audit_logs_retention_days=int(os.getenv("RETENTION_AUDIT_LOGS_DAYS", "2555")),
        workflow_executions_retention_days=int(os.getenv("RETENTION_WORKFLOW_EXECUTIONS_DAYS", "180")),
        suggestions_retention_days=int(os.getenv("RETENTION_SUGGESTIONS_DAYS", "180")),
    )

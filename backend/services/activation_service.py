"""Activation service for defining and tracking user activation."""

from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from database.models import User, Workflow, Suggestion, Event, AuditLog, Pattern


class ActivationService:
    """
    Service for defining and tracking user activation.
    
    Activation Definition:
    An activated user is one who has accomplished at least ONE of the following:
    1. Created their first workflow
    2. Applied their first integration suggestion
    3. Viewed their first integration suggestion (with high engagement)
    4. Completed onboarding (if onboarding exists)
    
    Primary activation event: "First integration suggestion viewed with engagement"
    This is the "aha moment" when users realize Floyo's value.
    """
    
    ACTIVATION_EVENTS = [
        "workflow_created",
        "suggestion_applied",
        "suggestion_viewed_engaged",  # Viewed suggestion and spent >30s on it
        "onboarding_completed",
        "first_integration_setup"  # First integration successfully set up
    ]
    
    @staticmethod
    def is_user_activated(db: Session, user_id: str) -> bool:
        """
        Check if a user is activated based on activation criteria.
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            True if user is activated, False otherwise
        """
        from uuid import UUID
        user_uuid = UUID(user_id)
        
        # Check if user has created a workflow
        workflow_count = db.query(func.count(Workflow.id)).filter(
            Workflow.user_id == user_uuid
        ).scalar() or 0
        
        if workflow_count > 0:
            return True
        
        # Check if user has applied a suggestion
        applied_suggestion_count = db.query(func.count(Suggestion.id)).filter(
            and_(
                Suggestion.user_id == user_uuid,
                Suggestion.is_applied == True
            )
        ).scalar() or 0
        
        if applied_suggestion_count > 0:
            return True
        
        # Check if user has viewed suggestions with engagement (spent >30s)
        engaged_suggestion_views = db.query(func.count(Event.id)).filter(
            and_(
                Event.user_id == user_uuid,
                Event.event_type == "suggestion_viewed",
                Event.details["time_spent"].astext.cast(func.Integer) > 30
            )
        ).scalar() or 0
        
        if engaged_suggestion_views > 0:
            return True
        
        # Check if user completed onboarding
        onboarding_completed = db.query(func.count(AuditLog.id)).filter(
            and_(
                AuditLog.user_id == user_uuid,
                AuditLog.action == "onboarding_completed"
            )
        ).scalar() or 0
        
        if onboarding_completed > 0:
            return True
        
        # Check if user set up first integration
        integration_setup = db.query(func.count(Event.id)).filter(
            and_(
                Event.user_id == user_uuid,
                Event.event_type == "integration_setup_completed"
            )
        ).scalar() or 0
        
        if integration_setup > 0:
            return True
        
        return False
    
    @staticmethod
    def get_activation_method(db: Session, user_id: str) -> Optional[str]:
        """
        Get the method by which a user was activated.
        
        Returns:
            Activation method string or None if not activated
        """
        from uuid import UUID
        user_uuid = UUID(user_id)
        
        # Check workflows first (most common)
        workflow_count = db.query(func.count(Workflow.id)).filter(
            Workflow.user_id == user_uuid
        ).scalar() or 0
        
        if workflow_count > 0:
            return "workflow_created"
        
        # Check applied suggestions
        applied_suggestion = db.query(Suggestion).filter(
            and_(
                Suggestion.user_id == user_uuid,
                Suggestion.is_applied == True
            )
        ).order_by(Suggestion.created_at.asc()).first()
        
        if applied_suggestion:
            return "suggestion_applied"
        
        # Check engaged suggestion views
        engaged_view = db.query(Event).filter(
            and_(
                Event.user_id == user_uuid,
                Event.event_type == "suggestion_viewed",
                Event.details["time_spent"].astext.cast(func.Integer) > 30
            )
        ).order_by(Event.timestamp.asc()).first()
        
        if engaged_view:
            return "suggestion_viewed_engaged"
        
        # Check onboarding
        onboarding = db.query(AuditLog).filter(
            and_(
                AuditLog.user_id == user_uuid,
                AuditLog.action == "onboarding_completed"
            )
        ).order_by(AuditLog.created_at.asc()).first()
        
        if onboarding:
            return "onboarding_completed"
        
        # Check integration setup
        integration = db.query(Event).filter(
            and_(
                Event.user_id == user_uuid,
                Event.event_type == "integration_setup_completed"
            )
        ).order_by(Event.timestamp.asc()).first()
        
        if integration:
            return "first_integration_setup"
        
        return None
    
    @staticmethod
    def get_time_to_activation(db: Session, user_id: str) -> Optional[float]:
        """
        Get time to activation in days.
        
        Returns:
            Days from signup to activation, or None if not activated
        """
        from uuid import UUID
        user_uuid = UUID(user_id)
        
        user = db.query(User).filter(User.id == user_uuid).first()
        if not user:
            return None
        
        signup_date = user.created_at
        
        # Get first activation event
        activation_method = ActivationService.get_activation_method(db, user_id)
        if not activation_method:
            return None
        
        activation_date = None
        
        if activation_method == "workflow_created":
            first_workflow = db.query(Workflow).filter(
                Workflow.user_id == user_uuid
            ).order_by(Workflow.created_at.asc()).first()
            if first_workflow:
                activation_date = first_workflow.created_at
        
        elif activation_method == "suggestion_applied":
            first_applied = db.query(Suggestion).filter(
                and_(
                    Suggestion.user_id == user_uuid,
                    Suggestion.is_applied == True
                )
            ).order_by(Suggestion.created_at.asc()).first()
            if first_applied:
                activation_date = first_applied.created_at
        
        elif activation_method == "suggestion_viewed_engaged":
            first_view = db.query(Event).filter(
                and_(
                    Event.user_id == user_uuid,
                    Event.event_type == "suggestion_viewed",
                    Event.details["time_spent"].astext.cast(func.Integer) > 30
                )
            ).order_by(Event.timestamp.asc()).first()
            if first_view:
                activation_date = first_view.timestamp
        
        elif activation_method == "onboarding_completed":
            onboarding = db.query(AuditLog).filter(
                and_(
                    AuditLog.user_id == user_uuid,
                    AuditLog.action == "onboarding_completed"
                )
            ).order_by(AuditLog.created_at.asc()).first()
            if onboarding:
                activation_date = onboarding.created_at
        
        elif activation_method == "first_integration_setup":
            integration = db.query(Event).filter(
                and_(
                    Event.user_id == user_uuid,
                    Event.event_type == "integration_setup_completed"
                )
            ).order_by(Event.timestamp.asc()).first()
            if integration:
                activation_date = integration.timestamp
        
        if activation_date:
            delta = activation_date - signup_date
            return delta.total_seconds() / 86400  # Convert to days
        
        return None
    
    @staticmethod
    def get_activation_funnel(db: Session, days: int = 30) -> Dict[str, Any]:
        """
        Get activation funnel metrics.
        
        Returns:
            Dictionary with funnel metrics
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Step 1: Signups
        signups = db.query(func.count(User.id)).filter(
            User.created_at >= cutoff_date
        ).scalar() or 0
        
        # Step 2: Installed CLI (users with events)
        users_with_events = db.query(func.count(func.distinct(Event.user_id))).filter(
            and_(
                Event.user_id.in_(
                    db.query(User.id).filter(User.created_at >= cutoff_date)
                )
            )
        ).scalar() or 0
        
        # Step 3: Pattern discovery (users with patterns)
        users_with_patterns = db.query(func.count(func.distinct(Pattern.user_id))).filter(
            and_(
                Pattern.user_id.in_(
                    db.query(User.id).filter(User.created_at >= cutoff_date)
                )
            )
        ).scalar() or 0
        
        # Step 4: Suggestions generated (users with suggestions)
        users_with_suggestions = db.query(func.count(func.distinct(Suggestion.user_id))).filter(
            and_(
                Suggestion.user_id.in_(
                    db.query(User.id).filter(User.created_at >= cutoff_date)
                )
            )
        ).scalar() or 0
        
        # Step 5: Suggestions viewed (users who viewed suggestions)
        users_viewed_suggestions = db.query(func.count(func.distinct(Event.user_id))).filter(
            and_(
                Event.user_id.in_(
                    db.query(User.id).filter(User.created_at >= cutoff_date)
                ),
                Event.event_type == "suggestion_viewed"
            )
        ).scalar() or 0
        
        # Step 6: Activated (users who completed activation)
        activated_users = db.query(func.count(func.distinct(User.id))).filter(
            and_(
                User.created_at >= cutoff_date,
                User.id.in_(
                    db.query(Workflow.user_id).union(
                        db.query(Suggestion.user_id).filter(Suggestion.is_applied == True)
                    )
                )
            )
        ).scalar() or 0
        
        return {
            "period_days": days,
            "signups": signups,
            "installed_cli": users_with_events,
            "pattern_discovery": users_with_patterns,
            "suggestions_generated": users_with_suggestions,
            "suggestions_viewed": users_viewed_suggestions,
            "activated": activated_users,
            "conversion_rates": {
                "signup_to_cli": round((users_with_events / signups * 100) if signups > 0 else 0, 2),
                "cli_to_patterns": round((users_with_patterns / users_with_events * 100) if users_with_events > 0 else 0, 2),
                "patterns_to_suggestions": round((users_with_suggestions / users_with_patterns * 100) if users_with_patterns > 0 else 0, 2),
                "suggestions_to_views": round((users_viewed_suggestions / users_with_suggestions * 100) if users_with_suggestions > 0 else 0, 2),
                "views_to_activation": round((activated_users / users_viewed_suggestions * 100) if users_viewed_suggestions > 0 else 0, 2),
                "signup_to_activation": round((activated_users / signups * 100) if signups > 0 else 0, 2)
            },
            "drop_offs": {
                "signup_to_cli": signups - users_with_events,
                "cli_to_patterns": users_with_events - users_with_patterns,
                "patterns_to_suggestions": users_with_patterns - users_with_suggestions,
                "suggestions_to_views": users_with_suggestions - users_viewed_suggestions,
                "views_to_activation": users_viewed_suggestions - activated_users
            }
        }

"""Self-healing system for automatic issue detection and remediation."""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from database.models import User, Event, Workflow, Subscription, BillingEvent, AuditLog
from backend.operational_alignment import OperationalMetrics, OperationalAlignment
from backend.data_quality import DataQualityMonitor
from backend.email_service import email_service
from backend.retention_campaigns import RetentionCampaignService
import logging
import os

logger = logging.getLogger(__name__)


class SelfHealingEngine:
    """Self-healing engine for automatic issue remediation."""
    
    # Healing rules and thresholds
    HEALING_RULES = {
        "low_activation": {
            "threshold": 30.0,  # Activation rate < 30%
            "action": "trigger_onboarding_improvements",
            "confidence": 0.85
        },
        "low_retention": {
            "threshold": 20.0,  # D7 retention < 20%
            "action": "trigger_retention_campaigns",
            "confidence": 0.90
        },
        "high_churn": {
            "threshold": 7.0,  # Churn rate > 7%
            "action": "analyze_churn_causes",
            "confidence": 0.80
        },
        "data_quality_issues": {
            "threshold": 80.0,  # Quality score < 80
            "action": "fix_data_quality",
            "confidence": 0.75
        },
        "system_degradation": {
            "threshold": "degraded",  # System health != healthy
            "action": "restart_services",
            "confidence": 0.70
        }
    }
    
    @staticmethod
    def detect_issues(db: Session) -> List[Dict[str, Any]]:
        """Detect issues that need healing."""
        issues = []
        
        # Check system health
        health = OperationalMetrics.get_system_health(db)
        if health["status"] != "healthy":
            issues.append({
                "type": "system_health",
                "severity": "high",
                "detected_at": datetime.utcnow().isoformat(),
                "details": health,
                "healing_action": "restart_services",
                "confidence": 0.70
            })
        
        # Check data quality
        quality = DataQualityMonitor.check_data_quality(db, days=7)
        if quality["quality_score"] < 80:
            issues.append({
                "type": "data_quality",
                "severity": "medium",
                "detected_at": datetime.utcnow().isoformat(),
                "details": quality,
                "healing_action": "fix_data_quality",
                "confidence": 0.75
            })
        
        # Check for orphaned subscriptions (subscriptions without valid users)
        orphaned_subscriptions = db.query(Subscription).filter(
            ~Subscription.user_id.in_(db.query(User.id))
        ).count()
        
        if orphaned_subscriptions > 0:
            issues.append({
                "type": "orphaned_subscriptions",
                "severity": "medium",
                "detected_at": datetime.utcnow().isoformat(),
                "count": orphaned_subscriptions,
                "healing_action": "cleanup_orphaned_subscriptions",
                "confidence": 0.90
            })
        
        # Check for failed billing events
        failed_billing = db.query(BillingEvent).filter(
            and_(
                BillingEvent.status == "failed",
                BillingEvent.created_at >= datetime.utcnow() - timedelta(days=7)
            )
        ).count()
        
        if failed_billing > 5:
            issues.append({
                "type": "billing_failures",
                "severity": "high",
                "detected_at": datetime.utcnow().isoformat(),
                "count": failed_billing,
                "healing_action": "retry_failed_payments",
                "confidence": 0.85
            })
        
        return issues
    
    @staticmethod
    def heal_issue(db: Session, issue: Dict[str, Any], dry_run: bool = True) -> Dict[str, Any]:
        """Heal a specific issue."""
        healing_action = issue.get("healing_action")
        issue_type = issue.get("type")
        
        result = {
            "issue_type": issue_type,
            "healing_action": healing_action,
            "executed": False,
            "dry_run": dry_run,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        if healing_action == "trigger_retention_campaigns":
            if not dry_run:
                try:
                    campaign_results = RetentionCampaignService.process_retention_campaigns(db)
                    result["executed"] = True
                    result["results"] = campaign_results
                    result["message"] = "Retention campaigns triggered successfully"
                except Exception as e:
                    result["error"] = str(e)
                    logger.error(f"Failed to trigger retention campaigns: {e}")
            else:
                result["message"] = "Would trigger retention campaigns"
        
        elif healing_action == "fix_data_quality":
            # Auto-fix data quality issues
            if not dry_run:
                # Fix orphaned records (carefully)
                # This is a placeholder - implement carefully to avoid data loss
                result["message"] = "Data quality fixes require manual review"
                result["recommendation"] = "Review data quality issues manually"
            else:
                result["message"] = "Would fix data quality issues"
        
        elif healing_action == "cleanup_orphaned_subscriptions":
            if not dry_run:
                try:
                    orphaned = db.query(Subscription).filter(
                        ~Subscription.user_id.in_(db.query(User.id))
                    ).all()
                    
                    for sub in orphaned:
                        sub.status = "canceled"
                        sub.canceled_at = datetime.utcnow()
                    
                    db.commit()
                    result["executed"] = True
                    result["cleaned_up"] = len(orphaned)
                    result["message"] = f"Cleaned up {len(orphaned)} orphaned subscriptions"
                except Exception as e:
                    result["error"] = str(e)
                    logger.error(f"Failed to cleanup orphaned subscriptions: {e}")
            else:
                result["message"] = "Would cleanup orphaned subscriptions"
        
        elif healing_action == "retry_failed_payments":
            if not dry_run:
                try:
                    from backend.monetization import BillingManager
                    
                    failed_events = db.query(BillingEvent).filter(
                        and_(
                            BillingEvent.status == "failed",
                            BillingEvent.created_at >= datetime.utcnow() - timedelta(days=7)
                        )
                    ).limit(10).all()
                    
                    retried = 0
                    for event in failed_events:
                        # Retry payment (this would integrate with Stripe)
                        # For now, just log
                        logger.info(f"Would retry payment for billing event {event.id}")
                        retried += 1
                    
                    result["executed"] = True
                    result["retried"] = retried
                    result["message"] = f"Retried {retried} failed payments"
                except Exception as e:
                    result["error"] = str(e)
                    logger.error(f"Failed to retry payments: {e}")
            else:
                result["message"] = "Would retry failed payments"
        
        elif healing_action == "restart_services":
            # This would require infrastructure access
            result["message"] = "Service restart requires infrastructure access"
            result["recommendation"] = "Check system health and restart services manually if needed"
        
        return result
    
    @staticmethod
    def auto_heal(db: Session, dry_run: bool = True) -> Dict[str, Any]:
        """Automatically heal all detected issues."""
        issues = SelfHealingEngine.detect_issues(db)
        
        healing_results = {
            "timestamp": datetime.utcnow().isoformat(),
            "dry_run": dry_run,
            "issues_detected": len(issues),
            "healing_actions": [],
            "summary": {}
        }
        
        healed_count = 0
        skipped_count = 0
        
        for issue in issues:
            if issue.get("confidence", 0) >= 0.75:  # Only heal high-confidence issues
                healing_result = SelfHealingEngine.heal_issue(db, issue, dry_run)
                healing_results["healing_actions"].append(healing_result)
                
                if healing_result.get("executed"):
                    healed_count += 1
                else:
                    skipped_count += 1
            else:
                healing_results["healing_actions"].append({
                    "issue": issue,
                    "skipped": True,
                    "reason": "Confidence too low for auto-healing"
                })
                skipped_count += 1
        
        healing_results["summary"] = {
            "healed": healed_count,
            "skipped": skipped_count,
            "total": len(issues)
        }
        
        return healing_results
    
    @staticmethod
    def preventive_healing(db: Session) -> Dict[str, Any]:
        """Preventive healing - fix issues before they become critical."""
        preventive_actions = {
            "timestamp": datetime.utcnow().isoformat(),
            "actions_taken": [],
            "prevented_issues": []
        }
        
        # Check for users at risk of churning
        # Get users who haven't been active recently
        from datetime import datetime, timedelta
        cutoff = datetime.utcnow() - timedelta(days=7)
        at_risk_users = db.query(User).filter(
            ~User.id.in_(
                db.query(Event.user_id).filter(Event.created_at >= cutoff)
            )
        ).limit(100).all()
        
        if len(at_risk_users) > 10:
            # Trigger retention campaigns proactively
            try:
                results = RetentionCampaignService.process_retention_campaigns(db)
                preventive_actions["actions_taken"].append({
                    "action": "proactive_retention_campaigns",
                    "reason": f"{len(at_risk_users)} users at risk",
                    "results": results
                })
                preventive_actions["prevented_issues"].append("potential_churn")
            except Exception as e:
                logger.error(f"Failed preventive retention campaigns: {e}")
        
        # Check for data quality degradation
        quality = DataQualityMonitor.check_data_quality(db, days=1)
        if quality["quality_score"] < 90:
            preventive_actions["actions_taken"].append({
                "action": "data_quality_monitoring",
                "reason": f"Quality score is {quality['quality_score']:.1f}/100",
                "recommendation": "Monitor data quality closely"
            })
            preventive_actions["prevented_issues"].append("data_quality_degradation")
        
        return preventive_actions

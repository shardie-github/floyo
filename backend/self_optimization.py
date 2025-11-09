"""Self-optimization engine for continuous performance improvement."""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from database.models import User, Event, Workflow, Suggestion, Subscription
from backend.operational_alignment import OperationalAlignment
from backend.analytics_dashboard import AnalyticsDashboard
from backend.retention_campaigns import RetentionCampaignService
from backend.monetization import UsageTracker
import logging

logger = logging.getLogger(__name__)


class SelfOptimizationEngine:
    """Self-optimization engine for continuous improvement."""
    
    @staticmethod
    def optimize_activation(db: Session) -> Dict[str, Any]:
        """Optimize activation rate."""
        optimization = {
            "timestamp": datetime.utcnow().isoformat(),
            "target": "activation_rate",
            "optimizations": [],
            "expected_improvement": 0.0
        }
        
        # Get current activation metrics
        metrics = AnalyticsDashboard.get_activation_metrics(db, days=7)
        current_rate = metrics.get("activation_rate", 0)
        target_rate = 40.0
        
        if current_rate < target_rate:
            gap = target_rate - current_rate
            
            # Identify non-activated users
            all_users = db.query(User).filter(
                User.created_at >= datetime.utcnow() - timedelta(days=7)
            ).all()
            
            activated_users = db.query(func.count(func.distinct(Workflow.user_id))).filter(
                Workflow.user_id.in_([u.id for u in all_users])
            ).scalar() or 0
            
            non_activated = len(all_users) - activated_users
            
            if non_activated > 0:
                optimization["optimizations"].append({
                    "action": "trigger_onboarding_emails",
                    "target_users": non_activated,
                    "expected_impact": f"Increase activation by {min(gap, 5)}%",
                    "confidence": 0.75
                })
                
                # Trigger Day 3 emails for users who haven't activated
                for user in all_users:
                    workflow_count = db.query(Workflow).filter(Workflow.user_id == user.id).count()
                    if workflow_count == 0:
                        # User hasn't activated, trigger activation email
                        try:
                            RetentionCampaignService.send_day_3_activation_email(db, user.id)
                            optimization["optimizations"].append({
                                "action": "sent_activation_email",
                                "user_id": str(user.id),
                                "executed": True
                            })
                        except Exception as e:
                            logger.error(f"Failed to send activation email to {user.id}: {e}")
            
            optimization["expected_improvement"] = min(gap, 10.0)  # Cap at 10% improvement
        
        return optimization
    
    @staticmethod
    def optimize_retention(db: Session) -> Dict[str, Any]:
        """Optimize retention rates."""
        optimization = {
            "timestamp": datetime.utcnow().isoformat(),
            "target": "retention",
            "optimizations": [],
            "expected_improvement": 0.0
        }
        
        # Get retention cohorts
        cohorts = AnalyticsDashboard.get_retention_cohorts(db)
        
        d7_retention = cohorts.get("d7", {}).get("retention_rate", 0)
        target_d7 = 25.0
        
        if d7_retention < target_d7:
            gap = target_d7 - d7_retention
            
            # Trigger retention campaigns
            try:
                results = RetentionCampaignService.process_retention_campaigns(db)
                optimization["optimizations"].append({
                    "action": "triggered_retention_campaigns",
                    "results": results,
                    "expected_impact": f"Increase D7 retention by {min(gap, 5)}%",
                    "confidence": 0.80
                })
                optimization["expected_improvement"] = min(gap, 5.0)
            except Exception as e:
                logger.error(f"Failed to optimize retention: {e}")
        
        return optimization
    
    @staticmethod
    def optimize_conversion(db: Session) -> Dict[str, Any]:
        """Optimize conversion funnel."""
        optimization = {
            "timestamp": datetime.utcnow().isoformat(),
            "target": "conversion_funnel",
            "optimizations": [],
            "expected_improvement": 0.0
        }
        
        # Get conversion funnel
        funnel = AnalyticsDashboard.get_conversion_funnel(db, days=7)
        conversion_rates = funnel.get("conversion_rates", {})
        
        signup_to_activation = conversion_rates.get("signup_to_activation", 0)
        target_conversion = 40.0
        
        if signup_to_activation < target_conversion:
            gap = target_conversion - signup_to_activation
            
            # Identify drop-off point
            drop_offs = funnel.get("drop_offs", {})
            signup_to_activation_drop = drop_offs.get("signup_to_activation", 0)
            
            if signup_to_activation_drop > 0:
                optimization["optimizations"].append({
                    "action": "reduce_activation_friction",
                    "drop_off_count": signup_to_activation_drop,
                    "recommendation": "Simplify onboarding flow, add empty states, improve first workflow creation UX",
                    "expected_impact": f"Reduce drop-off by {min(gap/2, 10)}%",
                    "confidence": 0.70
                })
                optimization["expected_improvement"] = min(gap/2, 10.0)
        
        return optimization
    
    @staticmethod
    def optimize_revenue(db: Session) -> Dict[str, Any]:
        """Optimize revenue metrics."""
        optimization = {
            "timestamp": datetime.utcnow().isoformat(),
            "target": "revenue",
            "optimizations": [],
            "expected_improvement": 0.0
        }
        
        # Get revenue metrics
        revenue = AnalyticsDashboard.get_revenue_metrics(db, days=30)
        ltv_cac = revenue.get("ltv_cac", {})
        ratio = ltv_cac.get("ratio", 0)
        target_ratio = 4.0
        
        if ratio < target_ratio:
            # LTV:CAC too low - optimize pricing or reduce CAC
            optimization["optimizations"].append({
                "action": "optimize_pricing_or_cac",
                "current_ratio": ratio,
                "target_ratio": target_ratio,
                "recommendation": "Review pricing strategy or optimize marketing channels",
                "expected_impact": "Improve LTV:CAC ratio",
                "confidence": 0.65
            })
        
        # Check upgrade opportunities
        free_users = db.query(User).filter(
            ~User.id.in_(
                db.query(Subscription.user_id).filter(Subscription.status == "active")
            )
        ).count()
        
        if free_users > 100:
            optimization["optimizations"].append({
                "action": "target_upgrade_campaign",
                "free_users": free_users,
                "recommendation": "Create upgrade campaign for free users",
                "expected_impact": f"Convert {free_users * 0.05:.0f} users to paid (5% conversion)",
                "confidence": 0.70
            })
        
        return optimization
    
    @staticmethod
    def comprehensive_optimization(db: Session) -> Dict[str, Any]:
        """Run comprehensive self-optimization."""
        optimizations = {
            "timestamp": datetime.utcnow().isoformat(),
            "optimizations": {},
            "overall_impact": {}
        }
        
        # Optimize each area
        optimizations["optimizations"]["activation"] = SelfOptimizationEngine.optimize_activation(db)
        optimizations["optimizations"]["retention"] = SelfOptimizationEngine.optimize_retention(db)
        optimizations["optimizations"]["conversion"] = SelfOptimizationEngine.optimize_conversion(db)
        optimizations["optimizations"]["revenue"] = SelfOptimizationEngine.optimize_revenue(db)
        
        # Calculate overall impact
        total_improvement = sum([
            opt.get("expected_improvement", 0)
            for opt in optimizations["optimizations"].values()
        ])
        
        optimizations["overall_impact"] = {
            "total_expected_improvement": total_improvement,
            "optimizations_applied": sum([
                len(opt.get("optimizations", []))
                for opt in optimizations["optimizations"].values()
            ])
        }
        
        return optimizations

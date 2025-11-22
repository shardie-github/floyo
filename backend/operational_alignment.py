"""Operational alignment and KPI tracking system."""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, extract
from database.models import (
    User, Event, Workflow, Suggestion, Subscription, UsageMetric,
    Organization, BillingEvent, Pattern
)
from backend.services.analytics_service import AnalyticsService as AnalyticsDashboard
from backend.growth import GrowthAnalytics
from backend.monetization import PricingCalculator
import logging

logger = logging.getLogger(__name__)


class OperationalAlignment:
    """Track operational alignment and KPIs."""
    
    # KPI Targets (from audit)
    KPI_TARGETS = {
        "activation_rate": 40.0,  # Target: 40%
        "d7_retention": 25.0,  # Target: 25%
        "d30_retention": 15.0,  # Target: 15%
        "mrr_growth_mom": 15.0,  # Target: 15% MoM
        "ltv_cac_ratio": 4.0,  # Target: 4:1
        "signup_to_activation": 40.0,  # Target: 40%
        "activation_to_subscription": 10.0,  # Target: 10%
        "viral_coefficient": 0.5,  # Target: 0.5
        "nps": 60.0,  # Target: 60
        "churn_rate": 5.0,  # Target: <5%
    }
    
    @staticmethod
    def calculate_alignment_score(db: Session, days: int = 30) -> Dict[str, Any]:
        """Calculate overall alignment score based on KPIs."""
        score_components = {}
        total_score = 0
        max_score = 0
        
        # Get current metrics
        activation_metrics = AnalyticsDashboard.get_activation_metrics(db, days)
        retention_cohorts = AnalyticsDashboard.get_retention_cohorts(db)
        conversion_funnel = AnalyticsDashboard.get_conversion_funnel(db, days)
        revenue_metrics = AnalyticsDashboard.get_revenue_metrics(db, days)
        growth_metrics = GrowthAnalytics.get_growth_metrics(db, days)
        ltv_cac = PricingCalculator.calculate_ltv_cac(db)
        
        # Activation Rate Score
        current_activation = activation_metrics.get("activation_rate", 0)
        target_activation = OperationalAlignment.KPI_TARGETS["activation_rate"]
        activation_score = min(100, (current_activation / target_activation) * 100) if target_activation > 0 else 0
        score_components["activation_rate"] = {
            "current": current_activation,
            "target": target_activation,
            "score": activation_score,
            "weight": 15
        }
        total_score += activation_score * 15
        max_score += 100 * 15
        
        # D7 Retention Score
        current_d7 = retention_cohorts.get("d7", {}).get("retention_rate", 0)
        target_d7 = OperationalAlignment.KPI_TARGETS["d7_retention"]
        d7_score = min(100, (current_d7 / target_d7) * 100) if target_d7 > 0 else 0
        score_components["d7_retention"] = {
            "current": current_d7,
            "target": target_d7,
            "score": d7_score,
            "weight": 20
        }
        total_score += d7_score * 20
        max_score += 100 * 20
        
        # D30 Retention Score
        current_d30 = retention_cohorts.get("d30", {}).get("retention_rate", 0)
        target_d30 = OperationalAlignment.KPI_TARGETS["d30_retention"]
        d30_score = min(100, (current_d30 / target_d30) * 100) if target_d30 > 0 else 0
        score_components["d30_retention"] = {
            "current": current_d30,
            "target": target_d30,
            "score": d30_score,
            "weight": 15
        }
        total_score += d30_score * 15
        max_score += 100 * 15
        
        # Conversion Funnel Score
        signup_to_activation = conversion_funnel.get("conversion_rates", {}).get("signup_to_activation", 0)
        target_conversion = OperationalAlignment.KPI_TARGETS["signup_to_activation"]
        conversion_score = min(100, (signup_to_activation / target_conversion) * 100) if target_conversion > 0 else 0
        score_components["signup_to_activation"] = {
            "current": signup_to_activation,
            "target": target_conversion,
            "score": conversion_score,
            "weight": 10
        }
        total_score += conversion_score * 10
        max_score += 100 * 10
        
        # LTV:CAC Score
        current_ltv_cac = ltv_cac.get("ratio", 0)
        target_ltv_cac = OperationalAlignment.KPI_TARGETS["ltv_cac_ratio"]
        ltv_cac_score = min(100, (current_ltv_cac / target_ltv_cac) * 100) if target_ltv_cac > 0 else 0
        score_components["ltv_cac_ratio"] = {
            "current": current_ltv_cac,
            "target": target_ltv_cac,
            "score": ltv_cac_score,
            "weight": 15
        }
        total_score += ltv_cac_score * 15
        max_score += 100 * 15
        
        # Growth Score
        growth_rate = growth_metrics.get("growth_rate", 0)
        target_growth = OperationalAlignment.KPI_TARGETS["mrr_growth_mom"]
        growth_score = min(100, (growth_rate / target_growth) * 100) if target_growth > 0 else 0
        score_components["growth_rate"] = {
            "current": growth_rate,
            "target": target_growth,
            "score": growth_score,
            "weight": 10
        }
        total_score += growth_score * 10
        max_score += 100 * 10
        
        # Viral Coefficient Score
        viral_coeff = growth_metrics.get("viral_coefficient", 0)
        target_viral = OperationalAlignment.KPI_TARGETS["viral_coefficient"]
        viral_score = min(100, (viral_coeff / target_viral) * 100) if target_viral > 0 else 0
        score_components["viral_coefficient"] = {
            "current": viral_coeff,
            "target": target_viral,
            "score": viral_score,
            "weight": 5
        }
        total_score += viral_score * 5
        max_score += 100 * 5
        
        # Churn Rate Score (inverse - lower is better)
        # Calculate churn from subscriptions
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        canceled_subscriptions = db.query(func.count(Subscription.id)).filter(
            and_(
                Subscription.status == "canceled",
                Subscription.canceled_at >= cutoff_date
            )
        ).scalar() or 0
        
        total_subscriptions = db.query(func.count(Subscription.id)).filter(
            Subscription.created_at >= cutoff_date
        ).scalar() or 1
        
        churn_rate = (canceled_subscriptions / total_subscriptions * 100) if total_subscriptions > 0 else 0
        target_churn = OperationalAlignment.KPI_TARGETS["churn_rate"]
        # Invert: lower churn = higher score
        churn_score = max(0, 100 - ((churn_rate / target_churn) * 100)) if target_churn > 0 else 100
        score_components["churn_rate"] = {
            "current": churn_rate,
            "target": target_churn,
            "score": churn_score,
            "weight": 10
        }
        total_score += churn_score * 10
        max_score += 100 * 10
        
        # Calculate overall score
        overall_score = (total_score / max_score * 100) if max_score > 0 else 0
        
        return {
            "overall_score": round(overall_score, 2),
            "components": score_components,
            "period_days": days,
            "calculated_at": datetime.utcnow().isoformat(),
            "targets": OperationalAlignment.KPI_TARGETS
        }
    
    @staticmethod
    def get_kpi_status(db: Session, days: int = 30) -> Dict[str, Any]:
        """Get current KPI status vs targets."""
        alignment = OperationalAlignment.calculate_alignment_score(db, days)
        
        kpi_status = {}
        for kpi_name, component in alignment["components"].items():
            current = component["current"]
            target = component["target"]
            score = component["score"]
            
            status = "on_track" if score >= 80 else "at_risk" if score >= 50 else "off_track"
            gap = target - current
            
            kpi_status[kpi_name] = {
                "current": current,
                "target": target,
                "gap": round(gap, 2),
                "score": score,
                "status": status,
                "weight": component["weight"]
            }
        
        return {
            "kpis": kpi_status,
            "overall_score": alignment["overall_score"],
            "period_days": days,
            "calculated_at": datetime.utcnow().isoformat()
        }
    
    @staticmethod
    def get_alignment_trends(db: Session, days: int = 90) -> Dict[str, Any]:
        """Get alignment trends over time."""
        # Calculate scores for different periods
        periods = [7, 14, 30, 60, 90]
        trends = {}
        
        for period in periods:
            if period <= days:
                score_data = OperationalAlignment.calculate_alignment_score(db, period)
                trends[f"d{period}"] = {
                    "score": score_data["overall_score"],
                    "period_days": period
                }
        
        return {
            "trends": trends,
            "current_period": days,
            "calculated_at": datetime.utcnow().isoformat()
        }
    
    @staticmethod
    def get_priority_actions(db: Session, days: int = 30) -> List[Dict[str, Any]]:
        """Get prioritized actions based on KPI gaps."""
        kpi_status = OperationalAlignment.get_kpi_status(db, days)
        
        actions = []
        for kpi_name, status_data in kpi_status["kpis"].items():
            if status_data["status"] != "on_track":
                priority = "high" if status_data["status"] == "off_track" else "medium"
                
                # Map KPI to action
                action_map = {
                    "activation_rate": "Improve onboarding and activation flow",
                    "d7_retention": "Implement retention campaigns and re-engagement",
                    "d30_retention": "Focus on long-term value delivery",
                    "signup_to_activation": "Reduce friction in workflow creation",
                    "ltv_cac_ratio": "Optimize pricing or reduce CAC",
                    "growth_rate": "Increase marketing spend or improve conversion",
                    "viral_coefficient": "Enhance referral program",
                    "churn_rate": "Identify and address churn drivers"
                }
                
                actions.append({
                    "kpi": kpi_name,
                    "priority": priority,
                    "current": status_data["current"],
                    "target": status_data["target"],
                    "gap": status_data["gap"],
                    "action": action_map.get(kpi_name, "Review and optimize"),
                    "impact": status_data["weight"]
                })
        
        # Sort by priority and impact
        actions.sort(key=lambda x: (
            0 if x["priority"] == "high" else 1 if x["priority"] == "medium" else 2,
            -x["impact"]
        ))
        
        return actions


class OperationalMetrics:
    """Real-time operational metrics tracking."""
    
    @staticmethod
    def get_real_time_metrics(db: Session) -> Dict[str, Any]:
        """Get real-time operational metrics."""
        now = datetime.utcnow()
        last_hour = now - timedelta(hours=1)
        last_24h = now - timedelta(hours=24)
        
        # Active users (last hour)
        active_users_1h = db.query(func.count(func.distinct(Event.user_id))).filter(
            Event.timestamp >= last_hour
        ).scalar() or 0
        
        # Active users (last 24h)
        active_users_24h = db.query(func.count(func.distinct(Event.user_id))).filter(
            Event.timestamp >= last_24h
        ).scalar() or 0
        
        # Events in last hour
        events_1h = db.query(func.count(Event.id)).filter(
            Event.timestamp >= last_hour
        ).scalar() or 0
        
        # Workflows created (last 24h)
        workflows_24h = db.query(func.count(Workflow.id)).filter(
            Workflow.created_at >= last_24h
        ).scalar() or 0
        
        # Suggestions applied (last 24h)
        suggestions_applied_24h = db.query(func.count(Suggestion.id)).filter(
            and_(
                Suggestion.is_applied == True,
                Suggestion.updated_at >= last_24h
            )
        ).scalar() or 0
        
        # Subscriptions created (last 24h)
        subscriptions_24h = db.query(func.count(Subscription.id)).filter(
            and_(
                Subscription.status == "active",
                Subscription.created_at >= last_24h
            )
        ).scalar() or 0
        
        # Revenue (last 24h)
        revenue_24h = db.query(func.sum(Subscription.price)).filter(
            and_(
                Subscription.status == "active",
                Subscription.created_at >= last_24h
            )
        ).scalar() or 0
        
        return {
            "timestamp": now.isoformat(),
            "active_users": {
                "last_hour": active_users_1h,
                "last_24h": active_users_24h
            },
            "events": {
                "last_hour": events_1h,
                "per_minute": round(events_1h / 60, 2) if events_1h > 0 else 0
            },
            "workflows": {
                "created_last_24h": workflows_24h
            },
            "suggestions": {
                "applied_last_24h": suggestions_applied_24h
            },
            "subscriptions": {
                "created_last_24h": subscriptions_24h
            },
            "revenue": {
                "last_24h": round(revenue_24h, 2) if revenue_24h else 0
            }
        }
    
    @staticmethod
    def get_system_health(db: Session) -> Dict[str, Any]:
        """Get system health indicators."""
        health = {
            "status": "healthy",
            "checks": {},
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Database health
        try:
            db.execute(func.select([1]))
            health["checks"]["database"] = {"status": "healthy", "response_time_ms": 0}
        except Exception as e:
            health["checks"]["database"] = {"status": "unhealthy", "error": str(e)}
            health["status"] = "degraded"
        
        # Redis health (if available)
        try:
            from backend.cache import redis_client
            if redis_client:
                redis_client.ping()
                health["checks"]["redis"] = {"status": "healthy"}
            else:
                health["checks"]["redis"] = {"status": "not_configured"}
        except Exception as e:
            health["checks"]["redis"] = {"status": "unhealthy", "error": str(e)}
            health["status"] = "degraded"
        
        # Analytics health (check if events are being tracked)
        try:
            recent_events = db.query(func.count(Event.id)).filter(
                Event.timestamp >= datetime.utcnow() - timedelta(hours=1)
            ).scalar() or 0
            
            health["checks"]["analytics"] = {
                "status": "healthy" if recent_events > 0 else "no_data",
                "events_last_hour": recent_events
            }
        except Exception as e:
            health["checks"]["analytics"] = {"status": "error", "error": str(e)}
        
        return health

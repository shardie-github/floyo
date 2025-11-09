"""Self-Autonomous Engine: Self-healing, self-optimization, and autonomous decision-making."""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from database.models import (
    User, Event, Workflow, Suggestion, Subscription, UsageMetric,
    BillingEvent, AuditLog
)
from backend.operational_alignment import OperationalAlignment, OperationalMetrics
from backend.kpi_alerts import KPIAlertSystem
from backend.data_quality import DataQualityMonitor
from backend.analytics_dashboard import AnalyticsDashboard
from backend.retention_campaigns import RetentionCampaignService
from backend.monetization import UsageTracker
from backend.email_service import email_service
import logging
import os

logger = logging.getLogger(__name__)


class AutonomousEngine:
    """Self-autonomous engine for automated optimization and remediation."""
    
    # Decision thresholds
    AUTO_REMEDIATE_THRESHOLD = 0.8  # 80% confidence to auto-remediate
    AUTO_OPTIMIZE_THRESHOLD = 0.7  # 70% confidence to auto-optimize
    
    @staticmethod
    def analyze_system_state(db: Session) -> Dict[str, Any]:
        """Analyze current system state and identify issues."""
        state = {
            "timestamp": datetime.utcnow().isoformat(),
            "issues": [],
            "opportunities": [],
            "health_score": 100,
            "recommendations": []
        }
        
        # Check alignment score
        alignment = OperationalAlignment.calculate_alignment_score(db, days=7)
        state["alignment_score"] = alignment["overall_score"]
        
        if alignment["overall_score"] < 60:
            state["issues"].append({
                "type": "alignment",
                "severity": "high",
                "message": f"Alignment score is {alignment['overall_score']:.1f}/100 (target: >80)",
                "impact": "business_health"
            })
            state["health_score"] -= 20
        
        # Check KPI alerts
        alerts = KPIAlertSystem.check_kpi_alerts(db, days=7, send_email=False)
        if alerts["alerts_found"] > 0:
            critical_count = alerts["critical_count"]
            state["issues"].append({
                "type": "kpi_alerts",
                "severity": "critical" if critical_count > 0 else "warning",
                "message": f"{alerts['alerts_found']} KPI alerts ({critical_count} critical)",
                "alerts": alerts["alerts"],
                "impact": "business_metrics"
            })
            state["health_score"] -= critical_count * 10
        
        # Check data quality
        quality = DataQualityMonitor.check_data_quality(db, days=7)
        if quality["quality_score"] < 80:
            state["issues"].append({
                "type": "data_quality",
                "severity": "medium",
                "message": f"Data quality score is {quality['quality_score']:.1f}/100",
                "details": quality["checks"],
                "impact": "data_integrity"
            })
            state["health_score"] -= (100 - quality["quality_score"]) / 5
        
        # Check system health
        health = OperationalMetrics.get_system_health(db)
        if health["status"] != "healthy":
            state["issues"].append({
                "type": "system_health",
                "severity": "high",
                "message": f"System health is {health['status']}",
                "details": health["checks"],
                "impact": "system_reliability"
            })
            state["health_score"] -= 30
        
        # Check for optimization opportunities
        opportunities = AutonomousEngine._identify_optimization_opportunities(db)
        state["opportunities"] = opportunities
        
        # Generate recommendations
        recommendations = AutonomousEngine._generate_recommendations(db, state)
        state["recommendations"] = recommendations
        
        state["health_score"] = max(0, min(100, state["health_score"]))
        
        return state
    
    @staticmethod
    def _identify_optimization_opportunities(db: Session) -> List[Dict[str, Any]]:
        """Identify optimization opportunities."""
        opportunities = []
        
        # Check activation rate
        activation_metrics = AnalyticsDashboard.get_activation_metrics(db, days=7)
        activation_rate = activation_metrics.get("activation_rate", 0)
        
        if activation_rate < 30:
            opportunities.append({
                "type": "activation_optimization",
                "priority": "high",
                "current": activation_rate,
                "target": 40,
                "action": "Improve onboarding flow",
                "expected_impact": "Increase activation rate by 10-15%",
                "confidence": 0.85
            })
        
        # Check retention
        retention_cohorts = AnalyticsDashboard.get_retention_cohorts(db)
        d7_retention = retention_cohorts.get("d7", {}).get("retention_rate", 0)
        
        if d7_retention < 20:
            opportunities.append({
                "type": "retention_optimization",
                "priority": "high",
                "current": d7_retention,
                "target": 25,
                "action": "Enhance retention campaigns",
                "expected_impact": "Increase D7 retention by 5-10%",
                "confidence": 0.80
            })
        
        # Check conversion funnel
        funnel = AnalyticsDashboard.get_conversion_funnel(db, days=7)
        signup_to_activation = funnel.get("conversion_rates", {}).get("signup_to_activation", 0)
        
        if signup_to_activation < 30:
            opportunities.append({
                "type": "conversion_optimization",
                "priority": "medium",
                "current": signup_to_activation,
                "target": 40,
                "action": "Reduce activation friction",
                "expected_impact": "Increase conversion by 10-15%",
                "confidence": 0.75
            })
        
        return opportunities
    
    @staticmethod
    def _generate_recommendations(db: Session, state: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate actionable recommendations."""
        recommendations = []
        
        # Based on issues
        for issue in state.get("issues", []):
            if issue["type"] == "alignment" and issue["severity"] == "high":
                recommendations.append({
                    "type": "immediate",
                    "action": "Review and address top 3 priority actions",
                    "endpoint": "/api/operational/priority-actions",
                    "expected_impact": "Improve alignment score by 10-20 points"
                })
            
            elif issue["type"] == "kpi_alerts":
                recommendations.append({
                    "type": "immediate",
                    "action": "Address critical KPI alerts",
                    "endpoint": "/api/operational/kpi-alerts",
                    "expected_impact": "Prevent further degradation"
                })
            
            elif issue["type"] == "data_quality":
                recommendations.append({
                    "type": "maintenance",
                    "action": "Fix data quality issues",
                    "endpoint": "/api/operational/data-quality",
                    "expected_impact": "Improve data integrity"
                })
        
        # Based on opportunities
        for opp in state.get("opportunities", []):
            if opp["confidence"] >= AutonomousEngine.AUTO_OPTIMIZE_THRESHOLD:
                recommendations.append({
                    "type": "optimization",
                    "action": opp["action"],
                    "priority": opp["priority"],
                    "expected_impact": opp["expected_impact"],
                    "auto_remediable": True
                })
        
        return recommendations
    
    @staticmethod
    def auto_remediate(db: Session, dry_run: bool = True) -> Dict[str, Any]:
        """Automatically remediate issues with high confidence."""
        state = AutonomousEngine.analyze_system_state(db)
        
        remediation_results = {
            "timestamp": datetime.utcnow().isoformat(),
            "dry_run": dry_run,
            "actions_taken": [],
            "actions_skipped": [],
            "impact_estimate": {}
        }
        
        # Auto-remediate high-confidence issues
        for issue in state.get("issues", []):
            remediation = AutonomousEngine._remediate_issue(db, issue, dry_run)
            if remediation:
                if remediation.get("executed"):
                    remediation_results["actions_taken"].append(remediation)
                else:
                    remediation_results["actions_skipped"].append(remediation)
        
        # Auto-optimize high-confidence opportunities
        for opp in state.get("opportunities", []):
            if opp.get("confidence", 0) >= AutonomousEngine.AUTO_REMEDIATE_THRESHOLD:
                optimization = AutonomousEngine._optimize_opportunity(db, opp, dry_run)
                if optimization:
                    if optimization.get("executed"):
                        remediation_results["actions_taken"].append(optimization)
                    else:
                        remediation_results["actions_skipped"].append(optimization)
        
        return remediation_results
    
    @staticmethod
    def _remediate_issue(db: Session, issue: Dict[str, Any], dry_run: bool) -> Optional[Dict[str, Any]]:
        """Remediate a specific issue."""
        issue_type = issue.get("type")
        
        if issue_type == "data_quality":
            # Auto-fix orphaned records
            if not dry_run:
                # This would require careful implementation to avoid data loss
                logger.info("Would fix orphaned records (skipped in auto-mode for safety)")
                return {
                    "type": "data_quality_fix",
                    "executed": False,
                    "reason": "Requires manual review for safety",
                    "recommendation": "Review orphaned records manually"
                }
        
        elif issue_type == "kpi_alerts":
            # Trigger retention campaigns if retention is low
            if issue.get("severity") == "critical":
                # Check if retention campaigns need to be sent
                if not dry_run:
                    try:
                        results = RetentionCampaignService.process_retention_campaigns(db)
                        return {
                            "type": "retention_campaign_trigger",
                            "executed": True,
                            "results": results,
                            "impact": "Should improve retention"
                        }
                    except Exception as e:
                        logger.error(f"Failed to trigger retention campaigns: {e}")
                        return {
                            "type": "retention_campaign_trigger",
                            "executed": False,
                            "error": str(e)
                        }
        
        return None
    
    @staticmethod
    def _optimize_opportunity(db: Session, opportunity: Dict[str, Any], dry_run: bool) -> Optional[Dict[str, Any]]:
        """Optimize based on opportunity."""
        opp_type = opportunity.get("type")
        
        if opp_type == "activation_optimization":
            # Could trigger onboarding improvements
            # For now, just log the opportunity
            return {
                "type": "activation_optimization",
                "executed": False,
                "reason": "Requires product changes",
                "recommendation": "Review onboarding flow and reduce friction"
            }
        
        elif opp_type == "retention_optimization":
            # Trigger additional retention campaigns
            if not dry_run:
                try:
                    results = RetentionCampaignService.process_retention_campaigns(db)
                    return {
                        "type": "retention_optimization",
                        "executed": True,
                        "results": results,
                        "impact": "Should improve retention"
                    }
                except Exception as e:
                    logger.error(f"Failed to optimize retention: {e}")
        
        return None
    
    @staticmethod
    def self_optimize(db: Session, optimization_type: str = "all") -> Dict[str, Any]:
        """Self-optimize system based on current performance."""
        optimizations = {
            "timestamp": datetime.utcnow().isoformat(),
            "optimizations_applied": [],
            "performance_improvements": {}
        }
        
        # Get current metrics
        alignment = OperationalAlignment.calculate_alignment_score(db, days=7)
        current_score = alignment["overall_score"]
        
        # Identify optimization targets
        priority_actions = OperationalAlignment.get_priority_actions(db, days=7)
        
        for action in priority_actions[:3]:  # Top 3 actions
            optimization = AutonomousEngine._apply_optimization(db, action)
            if optimization:
                optimizations["optimizations_applied"].append(optimization)
        
        # Recalculate score after optimizations
        new_alignment = OperationalAlignment.calculate_alignment_score(db, days=7)
        new_score = new_alignment["overall_score"]
        
        optimizations["performance_improvements"] = {
            "alignment_score_before": current_score,
            "alignment_score_after": new_score,
            "improvement": new_score - current_score
        }
        
        return optimizations
    
    @staticmethod
    def _apply_optimization(db: Session, action: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Apply a specific optimization."""
        kpi = action.get("kpi")
        
        if kpi == "d7_retention":
            # Trigger retention campaigns
            try:
                results = RetentionCampaignService.process_retention_campaigns(db)
                return {
                    "type": "retention_campaigns",
                    "kpi": kpi,
                    "action": "Triggered retention campaigns",
                    "results": results
                }
            except Exception as e:
                logger.error(f"Failed to apply retention optimization: {e}")
        
        elif kpi == "activation_rate":
            # Could trigger onboarding improvements
            # For now, just recommend
            return {
                "type": "activation_improvement",
                "kpi": kpi,
                "action": "Recommended onboarding improvements",
                "recommendation": "Review and improve onboarding flow"
            }
        
        return None
    
    @staticmethod
    def autonomous_decision_engine(db: Session, decision_type: str) -> Dict[str, Any]:
        """Autonomous decision-making engine."""
        decisions = {
            "timestamp": datetime.utcnow().isoformat(),
            "decision_type": decision_type,
            "decisions": [],
            "confidence": 0.0
        }
        
        if decision_type == "resource_allocation":
            # Decide where to allocate resources based on KPIs
            kpi_status = OperationalAlignment.get_kpi_status(db, days=7)
            
            # Find worst-performing KPI
            worst_kpi = min(
                kpi_status["kpis"].items(),
                key=lambda x: x[1]["score"]
            )
            
            decisions["decisions"].append({
                "action": "allocate_resources",
                "target": worst_kpi[0],
                "reason": f"Lowest performing KPI ({worst_kpi[1]['score']:.1f}/100)",
                "recommendation": f"Focus resources on improving {worst_kpi[0]}",
                "confidence": 0.90
            })
            decisions["confidence"] = 0.90
        
        elif decision_type == "feature_priority":
            # Decide feature priority based on impact
            priority_actions = OperationalAlignment.get_priority_actions(db, days=7)
            
            top_action = priority_actions[0] if priority_actions else None
            if top_action:
                decisions["decisions"].append({
                    "action": "prioritize_feature",
                    "feature": top_action["action"],
                    "reason": f"Highest impact ({top_action['impact']} weight)",
                    "recommendation": f"Implement {top_action['action']}",
                    "confidence": 0.85
                })
                decisions["confidence"] = 0.85
        
        elif decision_type == "pricing_optimization":
            # Decide pricing changes based on LTV:CAC
            revenue_metrics = AnalyticsDashboard.get_revenue_metrics(db, days=30)
            ltv_cac = revenue_metrics.get("ltv_cac", {})
            ratio = ltv_cac.get("ratio", 0)
            
            if ratio < 3.0:
                decisions["decisions"].append({
                    "action": "reduce_cac",
                    "reason": f"LTV:CAC ratio is {ratio:.2f}:1 (target: 4:1)",
                    "recommendation": "Optimize marketing channels or reduce acquisition costs",
                    "confidence": 0.80
                })
            elif ratio > 6.0:
                decisions["decisions"].append({
                    "action": "increase_cac",
                    "reason": f"LTV:CAC ratio is {ratio:.2f}:1 (very high)",
                    "recommendation": "Consider increasing marketing spend to accelerate growth",
                    "confidence": 0.75
                })
            decisions["confidence"] = 0.80
        
        return decisions
    
    @staticmethod
    def continuous_learning(db: Session) -> Dict[str, Any]:
        """Learn from patterns and improve recommendations."""
        learning_results = {
            "timestamp": datetime.utcnow().isoformat(),
            "patterns_learned": [],
            "recommendations_updated": []
        }
        
        # Analyze what works (high-performing users)
        # Users with high retention and activation
        high_performers = db.query(User).join(Workflow).join(Event).group_by(User.id).having(
            func.count(Workflow.id) > 3,
            func.count(Event.id) > 100
        ).limit(10).all()
        
        if high_performers:
            learning_results["patterns_learned"].append({
                "pattern": "high_performers",
                "insight": f"Found {len(high_performers)} high-performing users",
                "characteristics": {
                    "avg_workflows": sum([db.query(Workflow).filter(Workflow.user_id == u.id).count() for u in high_performers]) / len(high_performers),
                    "avg_events": sum([db.query(Event).filter(Event.user_id == u.id).count() for u in high_performers]) / len(high_performers)
                }
            })
        
        # Analyze suggestion adoption patterns
        high_adoption_suggestions = db.query(Suggestion).filter(
            Suggestion.is_applied == True
        ).order_by(Suggestion.confidence.desc()).limit(10).all()
        
        if high_adoption_suggestions:
            avg_confidence = sum([s.confidence for s in high_adoption_suggestions]) / len(high_adoption_suggestions)
            learning_results["patterns_learned"].append({
                "pattern": "suggestion_adoption",
                "insight": f"High-adoption suggestions have avg confidence {avg_confidence:.2f}",
                "recommendation": f"Increase ML confidence threshold to {avg_confidence:.2f} for better suggestions"
            })
        
        return learning_results
    
    @staticmethod
    def autonomous_cycle(db: Session, dry_run: bool = True) -> Dict[str, Any]:
        """Run complete autonomous cycle: analyze → remediate → optimize → learn."""
        cycle_results = {
            "timestamp": datetime.utcnow().isoformat(),
            "dry_run": dry_run,
            "phases": {}
        }
        
        # Phase 1: Analyze
        logger.info("Phase 1: Analyzing system state...")
        state = AutonomousEngine.analyze_system_state(db)
        cycle_results["phases"]["analyze"] = state
        
        # Phase 2: Remediate
        logger.info("Phase 2: Auto-remediating issues...")
        remediation = AutonomousEngine.auto_remediate(db, dry_run)
        cycle_results["phases"]["remediate"] = remediation
        
        # Phase 3: Optimize
        logger.info("Phase 3: Self-optimizing...")
        optimization = AutonomousEngine.self_optimize(db)
        cycle_results["phases"]["optimize"] = optimization
        
        # Phase 4: Learn
        logger.info("Phase 4: Learning from patterns...")
        learning = AutonomousEngine.continuous_learning(db)
        cycle_results["phases"]["learn"] = learning
        
        # Phase 5: Decide
        logger.info("Phase 5: Making autonomous decisions...")
        decisions = AutonomousEngine.autonomous_decision_engine(db, "resource_allocation")
        cycle_results["phases"]["decide"] = decisions
        
        # Summary
        cycle_results["summary"] = {
            "issues_found": len(state.get("issues", [])),
            "opportunities_found": len(state.get("opportunities", [])),
            "actions_taken": len(remediation.get("actions_taken", [])),
            "optimizations_applied": len(optimization.get("optimizations_applied", [])),
            "patterns_learned": len(learning.get("patterns_learned", [])),
            "health_score": state.get("health_score", 100),
            "alignment_score": state.get("alignment_score", 0)
        }
        
        return cycle_results

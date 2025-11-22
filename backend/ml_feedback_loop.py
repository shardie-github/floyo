"""ML feedback loop for continuous model improvement."""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from database.models import Suggestion, Workflow, Event, User
from backend.services.analytics_service import AnalyticsService as AnalyticsDashboard
import logging

logger = logging.getLogger(__name__)


class MLFeedbackLoop:
    """ML feedback loop for continuous improvement."""
    
    @staticmethod
    def collect_feedback(db: Session, days: int = 30) -> Dict[str, Any]:
        """Collect feedback on ML suggestions."""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        feedback_data = {
            "period_days": days,
            "suggestions_analyzed": 0,
            "adoption_rate": 0.0,
            "confidence_correlation": {},
            "improvement_recommendations": []
        }
        
        # Get all suggestions
        suggestions = db.query(Suggestion).filter(
            Suggestion.created_at >= cutoff_date
        ).all()
        
        feedback_data["suggestions_analyzed"] = len(suggestions)
        
        if not suggestions:
            return feedback_data
        
        # Calculate adoption rate
        applied_count = sum(1 for s in suggestions if s.is_applied)
        adoption_rate = (applied_count / len(suggestions) * 100) if suggestions else 0
        feedback_data["adoption_rate"] = adoption_rate
        
        # Analyze confidence vs adoption correlation
        confidence_buckets = {
            "high": {"applied": 0, "total": 0},  # >0.8
            "medium": {"applied": 0, "total": 0},  # 0.5-0.8
            "low": {"applied": 0, "total": 0}  # <0.5
        }
        
        for suggestion in suggestions:
            confidence = suggestion.confidence
            if confidence > 0.8:
                bucket = "high"
            elif confidence > 0.5:
                bucket = "medium"
            else:
                bucket = "low"
            
            confidence_buckets[bucket]["total"] += 1
            if suggestion.is_applied:
                confidence_buckets[bucket]["applied"] += 1
        
        # Calculate adoption rates by confidence
        for bucket, data in confidence_buckets.items():
            if data["total"] > 0:
                adoption = (data["applied"] / data["total"] * 100)
                feedback_data["confidence_correlation"][bucket] = {
                    "adoption_rate": adoption,
                    "total": data["total"],
                    "applied": data["applied"]
                }
        
        # Generate improvement recommendations
        if adoption_rate < 30:
            feedback_data["improvement_recommendations"].append({
                "issue": "Low adoption rate",
                "current": adoption_rate,
                "target": 30,
                "recommendation": "Increase ML confidence threshold or improve suggestion quality",
                "action": "Retrain models with higher confidence threshold"
            })
        
        # Check if high-confidence suggestions have better adoption
        high_conf_adoption = feedback_data["confidence_correlation"].get("high", {}).get("adoption_rate", 0)
        if high_conf_adoption > adoption_rate + 10:
            feedback_data["improvement_recommendations"].append({
                "issue": "High-confidence suggestions perform better",
                "insight": f"High-confidence suggestions have {high_conf_adoption:.1f}% adoption vs {adoption_rate:.1f}% overall",
                "recommendation": "Increase minimum confidence threshold to 0.8",
                "action": "Update ML model confidence thresholds"
            })
        
        return feedback_data
    
    @staticmethod
    def optimize_ml_thresholds(db: Session) -> Dict[str, Any]:
        """Optimize ML confidence thresholds based on feedback."""
        feedback = MLFeedbackLoop.collect_feedback(db, days=30)
        
        optimization = {
            "timestamp": datetime.utcnow().isoformat(),
            "current_thresholds": {},
            "recommended_thresholds": {},
            "expected_improvement": {}
        }
        
        # Analyze confidence correlation
        confidence_corr = feedback.get("confidence_correlation", {})
        
        # Recommend threshold based on adoption rates
        high_conf_adoption = confidence_corr.get("high", {}).get("adoption_rate", 0)
        medium_conf_adoption = confidence_corr.get("medium", {}).get("adoption_rate", 0)
        
        if high_conf_adoption > 40 and medium_conf_adoption < 30:
            # High-confidence performs well, recommend increasing threshold
            optimization["recommended_thresholds"]["min_confidence"] = 0.8
            optimization["expected_improvement"] = {
                "adoption_rate": f"Increase by {high_conf_adoption - feedback['adoption_rate']:.1f}%",
                "reason": "High-confidence suggestions have significantly better adoption"
            }
        elif high_conf_adoption < 30:
            # Even high-confidence performs poorly, may need model retraining
            optimization["recommended_thresholds"]["min_confidence"] = 0.9
            optimization["expected_improvement"] = {
                "adoption_rate": "Requires model retraining",
                "reason": "Even high-confidence suggestions have low adoption"
            }
        
        return optimization
    
    @staticmethod
    def track_suggestion_quality(db: Session) -> Dict[str, Any]:
        """Track suggestion quality metrics."""
        quality_metrics = {
            "timestamp": datetime.utcnow().isoformat(),
            "metrics": {}
        }
        
        # Average confidence of applied suggestions
        applied_suggestions = db.query(Suggestion).filter(
            Suggestion.is_applied == True
        ).all()
        
        if applied_suggestions:
            avg_confidence_applied = sum([s.confidence for s in applied_suggestions]) / len(applied_suggestions)
            quality_metrics["metrics"]["avg_confidence_applied"] = round(avg_confidence_applied, 3)
        
        # Average confidence of dismissed suggestions
        dismissed_suggestions = db.query(Suggestion).filter(
            Suggestion.is_dismissed == True
        ).all()
        
        if dismissed_suggestions:
            avg_confidence_dismissed = sum([s.confidence for s in dismissed_suggestions]) / len(dismissed_suggestions)
            quality_metrics["metrics"]["avg_confidence_dismissed"] = round(avg_confidence_dismissed, 3)
        
        # Quality score (difference between applied and dismissed confidence)
        if applied_suggestions and dismissed_suggestions:
            quality_score = avg_confidence_applied - avg_confidence_dismissed
            quality_metrics["metrics"]["quality_score"] = round(quality_score, 3)
            quality_metrics["metrics"]["quality_interpretation"] = (
                "good" if quality_score > 0.2 else "needs_improvement" if quality_score > 0 else "poor"
            )
        
        return quality_metrics

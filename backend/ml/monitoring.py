"""Monitoring and Performance Tracking for ML Models."""

from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from backend.ml.model_manager import ModelManager, Prediction, MLModel
from backend.logging_config import get_logger

logger = get_logger(__name__)


class MLMonitor:
    """Monitor ML model performance and health."""
    
    def __init__(self, db: Session):
        """Initialize monitor.
        
        Args:
            db: Database session
        """
        self.db = db
        self.model_manager = ModelManager(db)
    
    def get_model_health(self, model_type: str) -> Dict[str, Any]:
        """Get health status of a model.
        
        Args:
            model_type: Type of model
            
        Returns:
            Dictionary with health metrics
        """
        try:
            model = self.model_manager.get_model(model_type)
            model_record = self.db.query(MLModel).filter(
                MLModel.model_type == model_type,
                MLModel.is_active == True
            ).order_by(MLModel.version.desc()).first()
            
            if not model_record:
                return {
                    "status": "not_found",
                    "healthy": False
                }
            
            # Check if model is trained
            if not model or not model.is_trained:
                return {
                    "status": "not_trained",
                    "healthy": False,
                    "model_version": model_record.version
                }
            
            # Get recent prediction stats
            cutoff = datetime.utcnow() - timedelta(hours=24)
            recent_predictions = self.db.query(Prediction).filter(
                Prediction.model_id == model_record.id,
                Prediction.created_at >= cutoff
            ).count()
            
            # Get average confidence
            avg_confidence = self.db.query(func.avg(Prediction.confidence)).filter(
                Prediction.model_id == model_record.id,
                Prediction.created_at >= cutoff
            ).scalar() or 0.0
            
            # Check model age
            age_days = (datetime.utcnow() - model_record.created_at).days if model_record.created_at else 0
            
            # Determine health
            healthy = True
            issues = []
            
            if recent_predictions == 0:
                issues.append("No recent predictions")
                healthy = False
            
            if avg_confidence < 0.3:
                issues.append("Low average confidence")
            
            if age_days > 60:
                issues.append(f"Model is {age_days} days old - may need retraining")
            
            return {
                "status": "healthy" if healthy else "degraded",
                "healthy": healthy,
                "model_type": model_type,
                "model_version": model_record.version,
                "recent_predictions_24h": recent_predictions,
                "avg_confidence": float(avg_confidence),
                "model_age_days": age_days,
                "issues": issues,
                "last_trained": model.last_trained_at.isoformat() if model.last_trained_at else None,
            }
            
        except Exception as e:
            logger.error(f"Error checking model health: {e}")
            return {
                "status": "error",
                "healthy": False,
                "error": str(e)
            }
    
    def get_all_models_health(self) -> Dict[str, Any]:
        """Get health status of all models."""
        model_types = [
            "pattern_classifier",
            "suggestion_scorer",
            "sequence_predictor",
            "workflow_trigger_predictor",
            "workflow_recommender",
            "anomaly_detector",
        ]
        
        health_status = {}
        for model_type in model_types:
            health_status[model_type] = self.get_model_health(model_type)
        
        # Overall health
        all_healthy = all(
            status.get("healthy", False) for status in health_status.values()
        )
        
        return {
            "overall_healthy": all_healthy,
            "models": health_status,
            "checked_at": datetime.utcnow().isoformat()
        }
    
    def get_performance_metrics(self, model_type: str, hours: int = 24) -> Dict[str, Any]:
        """Get performance metrics for a model.
        
        Args:
            model_type: Type of model
            hours: Hours to look back
            
        Returns:
            Dictionary with performance metrics
        """
        try:
            model_record = self.db.query(MLModel).filter(
                MLModel.model_type == model_type,
                MLModel.is_active == True
            ).order_by(MLModel.version.desc()).first()
            
            if not model_record:
                return {"error": "Model not found"}
            
            cutoff = datetime.utcnow() - timedelta(hours=hours)
            
            # Prediction statistics
            predictions = self.db.query(Prediction).filter(
                Prediction.model_id == model_record.id,
                Prediction.created_at >= cutoff
            )
            
            total = predictions.count()
            
            # Average confidence
            avg_confidence = predictions.with_entities(func.avg(Prediction.confidence)).scalar() or 0.0
            
            # Confidence distribution
            high_confidence = predictions.filter(Prediction.confidence >= 0.8).count()
            medium_confidence = predictions.filter(
                and_(Prediction.confidence >= 0.5, Prediction.confidence < 0.8)
            ).count()
            low_confidence = predictions.filter(Prediction.confidence < 0.5).count()
            
            # Predictions with outcomes (for accuracy calculation)
            with_outcomes = predictions.filter(Prediction.actual_outcome.isnot(None)).count()
            
            return {
                "model_type": model_type,
                "model_version": model_record.version,
                "period_hours": hours,
                "total_predictions": total,
                "avg_confidence": float(avg_confidence),
                "confidence_distribution": {
                    "high": high_confidence,
                    "medium": medium_confidence,
                    "low": low_confidence
                },
                "predictions_with_outcomes": with_outcomes,
                "evaluation_rate": (with_outcomes / total) if total > 0 else 0.0,
            }
            
        except Exception as e:
            logger.error(f"Error getting performance metrics: {e}")
            return {"error": str(e)}
    
    def get_system_metrics(self) -> Dict[str, Any]:
        """Get overall ML system metrics."""
        try:
            # Total models
            total_models = self.db.query(MLModel).count()
            active_models = self.db.query(MLModel).filter(MLModel.is_active == True).count()
            
            # Total predictions
            total_predictions = self.db.query(Prediction).count()
            recent_predictions = self.db.query(Prediction).filter(
                Prediction.created_at >= datetime.utcnow() - timedelta(hours=24)
            ).count()
            
            # Average confidence across all models
            avg_confidence = self.db.query(func.avg(Prediction.confidence)).filter(
                Prediction.created_at >= datetime.utcnow() - timedelta(hours=24)
            ).scalar() or 0.0
            
            return {
                "total_models": total_models,
                "active_models": active_models,
                "total_predictions": total_predictions,
                "recent_predictions_24h": recent_predictions,
                "avg_confidence_24h": float(avg_confidence),
                "checked_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting system metrics: {e}")
            return {"error": str(e)}

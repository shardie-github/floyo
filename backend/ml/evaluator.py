"""Model Evaluation and Metrics Tracking."""

from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from backend.ml.model_manager import ModelManager, Prediction, MLModel
from backend.logging_config import get_logger

logger = get_logger(__name__)


class ModelEvaluator:
    """Evaluates ML model performance and tracks metrics."""
    
    def __init__(self, db: Session):
        """Initialize evaluator.
        
        Args:
            db: Database session
        """
        self.db = db
        self.model_manager = ModelManager(db)
    
    def evaluate_model(self, model_type: str, days: int = 30) -> Dict[str, Any]:
        """Evaluate a model's performance.
        
        Args:
            model_type: Type of model
            days: Number of days to look back
            
        Returns:
            Dictionary with evaluation metrics
        """
        try:
            # Get model
            model_record = self.db.query(MLModel).filter(
                MLModel.model_type == model_type,
                MLModel.is_active == True
            ).order_by(MLModel.version.desc()).first()
            
            if not model_record:
                return {"error": f"Model {model_type} not found"}
            
            # Get predictions with outcomes
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            predictions = self.db.query(Prediction).filter(
                Prediction.model_id == model_record.id,
                Prediction.created_at >= cutoff_date,
                Prediction.actual_outcome.isnot(None)
            ).all()
            
            if not predictions:
                return {
                    "model_type": model_type,
                    "model_version": model_record.version,
                    "status": "no_evaluations",
                    "message": "No predictions with outcomes to evaluate"
                }
            
            # Calculate metrics based on model type
            if model_type == "pattern_classifier":
                return self._evaluate_classifier(predictions, model_record)
            elif model_type == "suggestion_scorer":
                return self._evaluate_regressor(predictions, model_record)
            elif model_type == "sequence_predictor":
                return self._evaluate_binary_classifier(predictions, model_record)
            elif model_type == "workflow_trigger_predictor":
                return self._evaluate_regressor(predictions, model_record)
            elif model_type == "anomaly_detector":
                return self._evaluate_anomaly_detector(predictions, model_record)
            else:
                return self._evaluate_generic(predictions, model_record)
                
        except Exception as e:
            logger.error(f"Error evaluating model {model_type}: {e}")
            return {"error": str(e)}
    
    def _evaluate_classifier(self, predictions: List[Prediction], model_record: MLModel) -> Dict[str, Any]:
        """Evaluate classification model."""
        correct = 0
        total = 0
        
        for pred in predictions:
            predicted = pred.prediction_result.get("category")
            actual = pred.actual_outcome.get("category")
            
            if predicted and actual:
                total += 1
                if predicted == actual:
                    correct += 1
        
        accuracy = correct / total if total > 0 else 0.0
        
        return {
            "model_type": model_record.model_type,
            "model_version": model_record.version,
            "accuracy": accuracy,
            "correct_predictions": correct,
            "total_predictions": total,
            "evaluation_date": datetime.utcnow().isoformat(),
        }
    
    def _evaluate_regressor(self, predictions: List[Prediction], model_record: MLModel) -> Dict[str, Any]:
        """Evaluate regression model."""
        import numpy as np
        
        predicted_values = []
        actual_values = []
        
        for pred in predictions:
            predicted = pred.prediction_result.get("confidence") or pred.prediction_result.get("score")
            actual = pred.actual_outcome.get("value")
            
            if predicted is not None and actual is not None:
                predicted_values.append(float(predicted))
                actual_values.append(float(actual))
        
        if not predicted_values:
            return {
                "model_type": model_record.model_type,
                "model_version": model_record.version,
                "error": "No valid predictions"
            }
        
        # Calculate R²
        pred_array = np.array(predicted_values)
        actual_array = np.array(actual_values)
        
        ss_res = np.sum((actual_array - pred_array) ** 2)
        ss_tot = np.sum((actual_array - np.mean(actual_array)) ** 2)
        r2 = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0.0
        
        # Calculate MAE
        mae = np.mean(np.abs(pred_array - actual_array))
        
        return {
            "model_type": model_record.model_type,
            "model_version": model_record.version,
            "r2_score": float(r2),
            "mean_absolute_error": float(mae),
            "total_predictions": len(predicted_values),
            "evaluation_date": datetime.utcnow().isoformat(),
        }
    
    def _evaluate_binary_classifier(self, predictions: List[Prediction], model_record: MLModel) -> Dict[str, Any]:
        """Evaluate binary classification model."""
        true_positives = 0
        false_positives = 0
        true_negatives = 0
        false_negatives = 0
        
        for pred in predictions:
            predicted = pred.prediction_result.get("will_trigger") or pred.prediction_result.get("probability", 0) > 0.5
            actual = pred.actual_outcome.get("triggered", False)
            
            if predicted and actual:
                true_positives += 1
            elif predicted and not actual:
                false_positives += 1
            elif not predicted and not actual:
                true_negatives += 1
            else:
                false_negatives += 1
        
        total = true_positives + false_positives + true_negatives + false_negatives
        accuracy = (true_positives + true_negatives) / total if total > 0 else 0.0
        precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0.0
        recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 0.0
        f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
        
        return {
            "model_type": model_record.model_type,
            "model_version": model_record.version,
            "accuracy": accuracy,
            "precision": precision,
            "recall": recall,
            "f1_score": f1,
            "true_positives": true_positives,
            "false_positives": false_positives,
            "true_negatives": true_negatives,
            "false_negatives": false_negatives,
            "total_predictions": total,
            "evaluation_date": datetime.utcnow().isoformat(),
        }
    
    def _evaluate_anomaly_detector(self, predictions: List[Prediction], model_record: MLModel) -> Dict[str, Any]:
        """Evaluate anomaly detector."""
        return self._evaluate_binary_classifier(predictions, model_record)
    
    def _evaluate_generic(self, predictions: List[Prediction], model_record: MLModel) -> Dict[str, Any]:
        """Generic evaluation."""
        return {
            "model_type": model_record.model_type,
            "model_version": model_record.version,
            "total_predictions": len(predictions),
            "evaluation_date": datetime.utcnow().isoformat(),
        }
    
    def get_model_performance_trend(self, model_type: str, days: int = 90) -> Dict[str, Any]:
        """Get performance trend over time."""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            # Get daily metrics
            daily_metrics = self.db.query(
                func.date(Prediction.created_at).label('date'),
                func.count(Prediction.id).label('count'),
                func.avg(Prediction.confidence).label('avg_confidence')
            ).filter(
                Prediction.model_id.in_(
                    self.db.query(MLModel.id).filter(MLModel.model_type == model_type)
                ),
                Prediction.created_at >= cutoff_date
            ).group_by(func.date(Prediction.created_at)).all()
            
            return {
                "model_type": model_type,
                "trend": [
                    {
                        "date": str(date),
                        "prediction_count": count,
                        "avg_confidence": float(avg_confidence) if avg_confidence else 0.0
                    }
                    for date, count, avg_confidence in daily_metrics
                ]
            }
        except Exception as e:
            logger.error(f"Error getting performance trend: {e}")
            return {"error": str(e)}

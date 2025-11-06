"""Training Pipeline for ML models."""

from typing import Dict, Any, Optional, List
from datetime import datetime
from sqlalchemy.orm import Session

from backend.ml.model_manager import ModelManager
from backend.ml.pattern_classifier import PatternClassifier
from backend.ml.suggestion_scorer import SuggestionScorer
from backend.ml.sequence_predictor import SequencePredictor
from backend.ml.workflow_trigger_predictor import WorkflowTriggerPredictor
from backend.ml.workflow_recommender import WorkflowRecommender
from backend.ml.anomaly_detector import PatternAnomalyDetector
from backend.logging_config import get_logger

logger = get_logger(__name__)


class TrainingPipeline:
    """Pipeline for training all ML models."""
    
    def __init__(self, db: Session, model_manager: ModelManager):
        """Initialize training pipeline.
        
        Args:
            db: Database session
            model_manager: ModelManager instance
        """
        self.db = db
        self.model_manager = model_manager
        
    def train_all_models(self, user_id: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """Train all ML models.
        
        Args:
            user_id: Optional user ID to filter training data
            **kwargs: Additional training parameters
            
        Returns:
            Dictionary with training results for each model
        """
        results = {}
        
        # Train each model
        models_to_train = [
            ("pattern_classifier", PatternClassifier),
            ("suggestion_scorer", SuggestionScorer),
            ("sequence_predictor", SequencePredictor),
            ("workflow_trigger_predictor", WorkflowTriggerPredictor),
            ("workflow_recommender", WorkflowRecommender),
            ("anomaly_detector", PatternAnomalyDetector),
        ]
        
        for model_type, model_class in models_to_train:
            try:
                logger.info(f"Training {model_type}...")
                result = self.train_model(model_type, model_class, user_id, **kwargs)
                results[model_type] = result
            except Exception as e:
                logger.error(f"Error training {model_type}: {e}", exc_info=True)
                results[model_type] = {"error": str(e)}
        
        return results
    
    def train_model(self, model_type: str, model_class: type, user_id: Optional[str] = None,
                   **kwargs) -> Dict[str, Any]:
        """Train a specific model.
        
        Args:
            model_type: Type of model
            model_class: Model class
            user_id: Optional user ID
            **kwargs: Additional parameters
            
        Returns:
            Dictionary with training results
        """
        try:
            # Create model instance
            model = model_class()
            
            # Train model
            training_metrics = model.train(self.db, user_id=user_id, **kwargs)
            
            if "error" in training_metrics:
                return training_metrics
            
            # Save model
            training_config = {
                "user_id": str(user_id) if user_id else None,
                "training_date": datetime.utcnow().isoformat(),
                **kwargs
            }
            
            model_record = self.model_manager.save_model(
                model=model,
                model_type=model_type,
                training_metrics=training_metrics,
                training_config=training_config
            )
            
            return {
                "success": True,
                "model_id": str(model_record.id),
                "version": model_record.version,
                "metrics": training_metrics,
            }
            
        except Exception as e:
            logger.error(f"Error training {model_type}: {e}", exc_info=True)
            return {"error": str(e)}
    
    def retrain_model(self, model_type: str, user_id: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """Retrain an existing model.
        
        Args:
            model_type: Type of model
            user_id: Optional user ID
            **kwargs: Additional parameters
            
        Returns:
            Dictionary with training results
        """
        model_classes = {
            "pattern_classifier": PatternClassifier,
            "suggestion_scorer": SuggestionScorer,
            "sequence_predictor": SequencePredictor,
            "workflow_trigger_predictor": WorkflowTriggerPredictor,
            "workflow_recommender": WorkflowRecommender,
            "anomaly_detector": PatternAnomalyDetector,
        }
        
        if model_type not in model_classes:
            return {"error": f"Unknown model type: {model_type}"}
        
        return self.train_model(model_type, model_classes[model_type], user_id, **kwargs)
    
    def evaluate_model(self, model_type: str, user_id: Optional[str] = None) -> Dict[str, Any]:
        """Evaluate a model's performance.
        
        Args:
            model_type: Type of model
            user_id: Optional user ID
            
        Returns:
            Dictionary with evaluation metrics
        """
        try:
            model = self.model_manager.get_model(model_type)
            if not model:
                return {"error": f"Model {model_type} not found"}
            
            if not model.is_trained:
                return {"error": f"Model {model_type} not trained"}
            
            # Get metrics
            metrics = model.get_metrics()
            
            # Get recent predictions
            from backend.ml.model_manager import Prediction
            from sqlalchemy import func
            
            recent_predictions = self.db.query(Prediction).filter(
                Prediction.model_id.in_(
                    self.db.query(self.model_manager.db.query(MLModel).filter(
                        MLModel.model_type == model_type,
                        MLModel.is_active == True
                    ).subquery().c.id)
                )
            ).order_by(Prediction.created_at.desc()).limit(100).all()
            
            # Calculate accuracy if outcomes available
            evaluated = [p for p in recent_predictions if p.actual_outcome]
            if evaluated:
                # This would need model-specific evaluation logic
                pass
            
            return {
                "model_type": model_type,
                "metrics": metrics,
                "recent_predictions": len(recent_predictions),
                "evaluated_predictions": len(evaluated),
            }
            
        except Exception as e:
            logger.error(f"Error evaluating model {model_type}: {e}")
            return {"error": str(e)}

"""Background job for training ML models."""

from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from backend.ml.training_pipeline import TrainingPipeline
from backend.ml.model_manager import ModelManager
from backend.logging_config import get_logger

logger = get_logger(__name__)


def train_models_job(db: Session, model_types: Optional[list] = None, user_id: Optional[str] = None):
    """Background job to train ML models.
    
    Args:
        db: Database session
        model_types: List of model types to train (None = all)
        user_id: Optional user ID for user-specific training
    """
    try:
        logger.info(f"Starting model training job. Types: {model_types}, User: {user_id}")
        
        pipeline = TrainingPipeline(db, ModelManager(db))
        
        if model_types:
            results = {}
            for model_type in model_types:
                try:
                    result = pipeline.retrain_model(model_type, user_id)
                    results[model_type] = result
                except Exception as e:
                    logger.error(f"Error training {model_type}: {e}")
                    results[model_type] = {"error": str(e)}
        else:
            results = pipeline.train_all_models(user_id)
        
        logger.info(f"Model training job completed. Results: {results}")
        return results
        
    except Exception as e:
        logger.error(f"Error in training job: {e}", exc_info=True)
        return {"error": str(e)}


def schedule_retraining_job(db: Session):
    """Schedule periodic retraining of models.
    
    Checks if models need retraining based on:
    - Age of current model
    - Data drift
    - Performance degradation
    """
    try:
        from backend.ml.model_manager import MLModel
        from backend.ml.evaluator import ModelEvaluator
        
        evaluator = ModelEvaluator(db)
        model_manager = ModelManager(db)
        
        # Get all active models
        models = db.query(MLModel).filter(MLModel.is_active == True).all()
        
        models_to_retrain = []
        
        for model in models:
            # Check if model is older than 30 days
            age_days = (datetime.utcnow() - model.created_at).days if model.created_at else 0
            
            if age_days > 30:
                logger.info(f"Model {model.model_type} v{model.version} is {age_days} days old, scheduling retrain")
                models_to_retrain.append(model.model_type)
                continue
            
            # Check performance if model has metrics
            if model.accuracy_metrics:
                # Evaluate current performance
                evaluation = evaluator.evaluate_model(model.model_type, days=7)
                
                if "accuracy" in evaluation:
                    current_accuracy = evaluation["accuracy"]
                    training_accuracy = model.accuracy_metrics.get("accuracy", 0.0)
                    
                    # Retrain if accuracy dropped by more than 10%
                    if current_accuracy < training_accuracy * 0.9:
                        logger.info(
                            f"Model {model.model_type} performance degraded "
                            f"({current_accuracy:.3f} vs {training_accuracy:.3f}), scheduling retrain"
                        )
                        models_to_retrain.append(model.model_type)
        
        # Retrain models
        if models_to_retrain:
            pipeline = TrainingPipeline(db, model_manager)
            for model_type in set(models_to_retrain):
                try:
                    pipeline.retrain_model(model_type)
                except Exception as e:
                    logger.error(f"Error retraining {model_type}: {e}")
        
        return {
            "models_checked": len(models),
            "models_retrained": len(set(models_to_retrain)),
            "retrained_types": list(set(models_to_retrain))
        }
        
    except Exception as e:
        logger.error(f"Error in scheduled retraining: {e}", exc_info=True)
        return {"error": str(e)}


# Celery task wrapper (if using Celery)
try:
    from celery import shared_task
    
    @shared_task
    def train_models_task(model_types=None, user_id=None):
        """Celery task for training models."""
        from backend.database import SessionLocal
        db = SessionLocal()
        try:
            return train_models_job(db, model_types, user_id)
        finally:
            db.close()
    
    @shared_task
    def schedule_retraining_task():
        """Celery task for scheduled retraining."""
        from backend.database import SessionLocal
        db = SessionLocal()
        try:
            return schedule_retraining_job(db)
        finally:
            db.close()
except ImportError:
    logger.warning("Celery not available, using direct function calls")

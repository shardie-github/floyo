"""Enhanced ML API with monitoring and evaluation."""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.main import get_current_user
from backend.ml.model_manager import ModelManager
from database.models import MLModel, Prediction
from backend.ml.evaluator import ModelEvaluator
from backend.ml.monitoring import MLMonitor
from backend.ml.optimizer import ModelOptimizer
from backend.ml.training_job import train_models_job, schedule_retraining_job
from database.models import User
from backend.logging_config import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/api/ml", tags=["ml-enhanced"])


@router.get("/health")
async def get_ml_health(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get health status of all ML models."""
    try:
        monitor = MLMonitor(db)
        health = monitor.get_all_models_health()
        return health
    except Exception as e:
        logger.error(f"Error getting ML health: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health/{model_type}")
async def get_model_health(
    model_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get health status of a specific model."""
    try:
        monitor = MLMonitor(db)
        health = monitor.get_model_health(model_type)
        return health
    except Exception as e:
        logger.error(f"Error getting model health: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/metrics/{model_type}")
async def get_model_metrics(
    model_type: str,
    hours: int = 24,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get performance metrics for a model."""
    try:
        monitor = MLMonitor(db)
        metrics = monitor.get_performance_metrics(model_type, hours)
        return metrics
    except Exception as e:
        logger.error(f"Error getting model metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/evaluate/{model_type}")
async def evaluate_model(
    model_type: str,
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Evaluate a model's performance."""
    try:
        evaluator = ModelEvaluator(db)
        evaluation = evaluator.evaluate_model(model_type, days)
        return evaluation
    except Exception as e:
        logger.error(f"Error evaluating model: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/system/metrics")
async def get_system_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get overall ML system metrics."""
    try:
        monitor = MLMonitor(db)
        metrics = monitor.get_system_metrics()
        return metrics
    except Exception as e:
        logger.error(f"Error getting system metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/optimize/prediction")
async def optimized_prediction(
    model_type: str,
    input_data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Make an optimized prediction with caching."""
    try:
        optimizer = ModelOptimizer(db)
        result = optimizer.optimize_prediction(model_type, input_data)
        return result
    except Exception as e:
        logger.error(f"Error in optimized prediction: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/retrain")
async def trigger_retraining(
    model_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Trigger model retraining."""
    try:
        if model_type:
            result = train_models_job(db, [model_type])
        else:
            result = schedule_retraining_job(db)
        
        return {
            "status": "retraining_triggered",
            "result": result
        }
    except Exception as e:
        logger.error(f"Error triggering retraining: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trend/{model_type}")
async def get_performance_trend(
    model_type: str,
    days: int = 90,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get performance trend over time."""
    try:
        evaluator = ModelEvaluator(db)
        trend = evaluator.get_model_performance_trend(model_type, days)
        return trend
    except Exception as e:
        logger.error(f"Error getting performance trend: {e}")
        raise HTTPException(status_code=500, detail=str(e))

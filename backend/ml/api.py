"""API endpoints for ML model management and predictions."""

from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session
from uuid import UUID

from backend.database import get_db
from backend.main import get_current_user
from backend.ml.model_manager import ModelManager
from backend.ml.training_pipeline import TrainingPipeline
from backend.ml.workflow_recommender import WorkflowRecommender
from backend.ml.anomaly_detector import PatternAnomalyDetector
from database.models import User, Suggestion, Pattern
from backend.logging_config import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/api/ml", tags=["ml"])


class TrainModelRequest(BaseModel):
    """Request to train a model."""
    model_type: str
    user_id: Optional[str] = None
    force_retrain: bool = False


class PredictionRequest(BaseModel):
    """Request for a prediction."""
    input_features: Dict[str, Any]
    model_type: str


@router.get("/models")
async def list_models(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """List all available ML models."""
    try:
        model_manager = ModelManager(db)
        
        model_types = [
            "pattern_classifier",
            "suggestion_scorer",
            "sequence_predictor",
            "workflow_trigger_predictor",
            "workflow_recommender",
            "anomaly_detector",
        ]
        
        models = {}
        for model_type in model_types:
            metrics = model_manager.get_model_metrics(model_type)
            if metrics:
                models[model_type] = metrics
        
        return {
            "models": models,
            "total": len(models)
        }
    except Exception as e:
        logger.error(f"Error listing models: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/models/{model_type}")
async def get_model_info(
    model_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get information about a specific model."""
    try:
        model_manager = ModelManager(db)
        metrics = model_manager.get_model_metrics(model_type)
        
        if not metrics:
            raise HTTPException(status_code=404, detail=f"Model {model_type} not found")
        
        return metrics
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting model info: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/models/train")
async def train_model(
    request: TrainModelRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Train a ML model."""
    try:
        pipeline = TrainingPipeline(db, ModelManager(db))
        
        # Train in background
        def train():
            pipeline.retrain_model(request.model_type, request.user_id)
        
        background_tasks.add_task(train)
        
        return {
            "status": "training_started",
            "model_type": request.model_type,
            "message": "Model training started in background"
        }
    except Exception as e:
        logger.error(f"Error starting training: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/models/train-all")
async def train_all_models(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Train all ML models."""
    try:
        pipeline = TrainingPipeline(db, ModelManager(db))
        
        # Train in background
        def train():
            pipeline.train_all_models()
        
        background_tasks.add_task(train)
        
        return {
            "status": "training_started",
            "message": "All models training started in background"
        }
    except Exception as e:
        logger.error(f"Error starting training: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict")
async def make_prediction(
    request: PredictionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Make a prediction using a ML model."""
    try:
        model_manager = ModelManager(db)
        model = model_manager.get_model(request.model_type)
        
        if not model:
            raise HTTPException(status_code=404, detail=f"Model {request.model_type} not found")
        
        if not model.is_trained:
            raise HTTPException(status_code=400, detail=f"Model {request.model_type} not trained")
        
        # Make prediction
        prediction = model.predict(request.input_features)
        
        # Log prediction
        from database.models import MLModel
        model_record = db.query(MLModel).filter(
            MLModel.model_type == request.model_type,
            MLModel.is_active == True
        ).first()
        
        if model_record:
            model_manager.log_prediction(
                model_id=str(model_record.id),
                user_id=str(current_user.id),
                prediction_type=request.model_type,
                input_features=request.input_features,
                prediction_result=prediction,
                confidence=prediction.get("confidence") or prediction.get("probability")
            )
        
        return prediction
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error making prediction: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendations/workflows")
async def get_workflow_recommendations(
    n_recommendations: int = 5,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get workflow recommendations for the current user."""
    try:
        model_manager = ModelManager(db)
        recommender = model_manager.get_model("workflow_recommender")
        
        if not recommender or not recommender.is_trained:
            # Fallback to content-based
            recommender = WorkflowRecommender()
            result = recommender._content_based_recommend(str(current_user.id), db, n_recommendations)
            return result
        
        result = recommender.recommend(str(current_user.id), db, n_recommendations)
        return result
        
    except Exception as e:
        logger.error(f"Error getting recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/suggestions/score")
async def score_suggestion(
    suggestion_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get ML-based confidence score for a suggestion."""
    try:
        suggestion = db.query(Suggestion).filter(
            Suggestion.id == suggestion_id,
            Suggestion.user_id == current_user.id
        ).first()
        
        if not suggestion:
            raise HTTPException(status_code=404, detail="Suggestion not found")
        
        model_manager = ModelManager(db)
        scorer = model_manager.get_model("suggestion_scorer")
        
        if not scorer or not scorer.is_trained:
            return {
                "confidence": suggestion.confidence or 0.5,
                "source": "default"
            }
        
        # Extract features
        features = scorer._extract_features(suggestion, db)
        if features:
            score_result = scorer.predict(features)
            return {
                "confidence": score_result.get("confidence", suggestion.confidence or 0.5),
                "explanation": score_result.get("explanation"),
                "source": "ml_model"
            }
        
        return {
            "confidence": suggestion.confidence or 0.5,
            "source": "default"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error scoring suggestion: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/anomaly/detect")
async def detect_anomaly(
    pattern_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Detect if a pattern is anomalous (might need workflow)."""
    try:
        if pattern_id:
            pattern = db.query(Pattern).filter(
                Pattern.id == pattern_id,
                Pattern.user_id == current_user.id
            ).first()
            
            if not pattern:
                raise HTTPException(status_code=404, detail="Pattern not found")
            
            pattern_data = {
                "count": pattern.count,
                "file_extension": pattern.file_extension,
                "tools": pattern.tools or [],
            }
        else:
            # Use user's most recent pattern
            pattern = db.query(Pattern).filter(
                Pattern.user_id == current_user.id
            ).order_by(Pattern.updated_at.desc()).first()
            
            if not pattern:
                return {"is_anomaly": False, "message": "No patterns found"}
            
            pattern_data = {
                "count": pattern.count,
                "file_extension": pattern.file_extension,
                "tools": pattern.tools or [],
            }
        
        model_manager = ModelManager(db)
        detector = model_manager.get_model("anomaly_detector")
        
        if not detector or not detector.is_trained:
            return {
                "is_anomaly": False,
                "anomaly_score": 0.0,
                "message": "Anomaly detector not trained"
            }
        
        result = detector.detect_anomaly(pattern_data, db)
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error detecting anomaly: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/predictions")
async def get_predictions(
    model_type: Optional[str] = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
        """Get recent predictions for the current user."""
        try:
            from database.models import Prediction, MLModel
            
            query = db.query(Prediction).filter(
            Prediction.user_id == current_user.id
        )
        
            if model_type:
                from database.models import MLModel
                model_ids = db.query(MLModel.id).filter(
                MLModel.model_type == model_type
            ).subquery()
            query = query.filter(Prediction.model_id.in_(model_ids))
        
        predictions = query.order_by(Prediction.created_at.desc()).limit(limit).all()
        
        return {
            "predictions": [
                {
                    "id": str(p.id),
                    "model_type": model_type or "unknown",
                    "prediction_type": p.prediction_type,
                    "prediction_result": p.prediction_result,
                    "confidence": p.confidence,
                    "created_at": p.created_at.isoformat() if p.created_at else None,
                }
                for p in predictions
            ],
            "total": len(predictions)
        }
        
    except Exception as e:
        logger.error(f"Error getting predictions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

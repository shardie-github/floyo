"""Model Manager for ML model lifecycle management."""

from typing import Dict, Any, Optional, List
from pathlib import Path
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import Column, String, Integer, Float, Boolean, JSON, TIMESTAMP, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
import hashlib
import json

from backend.ml.pattern_classifier import PatternClassifier
from backend.ml.suggestion_scorer import SuggestionScorer
from backend.ml.sequence_predictor import SequencePredictor
from backend.ml.workflow_trigger_predictor import WorkflowTriggerPredictor
from backend.ml.workflow_recommender import WorkflowRecommender
from backend.ml.anomaly_detector import PatternAnomalyDetector
from database.models import MLModel, Prediction as PredictionModel
from backend.logging_config import get_logger

logger = get_logger(__name__)

Base = declarative_base()


class MLModel(Base):
    """Database model for ML model metadata."""
    __tablename__ = "ml_models"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=lambda: __import__('uuid').uuid4())
    model_type = Column(String(50), nullable=False, index=True)
    version = Column(Integer, nullable=False, default=1)
    training_data_hash = Column(String(64), nullable=True)
    accuracy_metrics = Column(JSONB, nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=__import__('sqlalchemy').sql.func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=__import__('sqlalchemy').sql.func.now(), onupdate=__import__('sqlalchemy').sql.func.now())
    model_path = Column(String(500), nullable=True)
    training_config = Column(JSONB, nullable=True)


class _PredictionBase(Base):
    """Database model for tracking predictions."""
    __tablename__ = "predictions"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=lambda: __import__('uuid').uuid4())
    model_id = Column(PGUUID(as_uuid=True), ForeignKey("ml_models.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    prediction_type = Column(String(50), nullable=False)
    input_features = Column(JSONB, nullable=True)
    prediction_result = Column(JSONB, nullable=False)
    confidence = Column(Float, nullable=True)
    actual_outcome = Column(JSONB, nullable=True)  # For evaluation
    created_at = Column(TIMESTAMP(timezone=True), server_default=__import__('sqlalchemy').sql.func.now(), index=True)


class ModelManager:
    """Manages ML model lifecycle and predictions."""
    
    def __init__(self, db: Session, models_dir: Path = None):
        """Initialize ModelManager.
        
        Args:
            db: Database session
            models_dir: Directory to store model files
        """
        self.db = db
        if models_dir is None:
            models_dir = Path(__file__).parent.parent.parent / "models"
        self.models_dir = Path(models_dir)
        self.models_dir.mkdir(parents=True, exist_ok=True)
        
        # Model instances
        self._models: Dict[str, Any] = {}
        
    def get_model(self, model_type: str, version: Optional[int] = None) -> Optional[Any]:
        """Get a model instance.
        
        Args:
            model_type: Type of model (pattern_classifier, suggestion_scorer, etc.)
            version: Model version (uses latest active if None)
            
        Returns:
            Model instance or None
        """
        try:
            # Check cache
            cache_key = f"{model_type}_v{version}"
            if cache_key in self._models:
                return self._models[cache_key]
            
            # Load from database (using imported MLModel from models)
            from database.models import MLModel
            query = self.db.query(MLModel).filter(
                MLModel.model_type == model_type,
                MLModel.is_active == True
            )
            
            if version:
                query = query.filter(MLModel.version == version)
            else:
                query = query.order_by(MLModel.version.desc())
            
            model_record = query.first()
            
            if not model_record:
                logger.warning(f"Model {model_type} not found in database")
                return None
            
            # Instantiate model
            model = self._create_model_instance(model_type, model_record.version)
            
            # Load model weights
            if model_record.model_path:
                model_path = Path(model_record.model_path)
                if model.load(model_path):
                    self._models[cache_key] = model
                    return model
            
            # Try to load from default location
            default_path = self.models_dir / model_type
            if model.load(default_path):
                self._models[cache_key] = model
                return model
            
            logger.warning(f"Could not load model {model_type} from disk")
            return None
            
        except Exception as e:
            logger.error(f"Error getting model {model_type}: {e}")
            return None
    
    def _create_model_instance(self, model_type: str, version: int) -> Any:
        """Create a model instance."""
        model_classes = {
            "pattern_classifier": PatternClassifier,
            "suggestion_scorer": SuggestionScorer,
            "sequence_predictor": SequencePredictor,
            "workflow_trigger_predictor": WorkflowTriggerPredictor,
            "workflow_recommender": WorkflowRecommender,
            "anomaly_detector": PatternAnomalyDetector,
        }
        
        if model_type not in model_classes:
            raise ValueError(f"Unknown model type: {model_type}")
        
        return model_classes[model_type](model_version=version)
    
    def save_model(self, model: Any, model_type: str, training_metrics: Dict[str, Any],
                   training_config: Optional[Dict[str, Any]] = None) -> MLModel:
        """Save a trained model to database and disk.
        
        Args:
            model: Trained model instance
            model_type: Type of model
            training_metrics: Training metrics
            training_config: Training configuration
            
        Returns:
            MLModel database record
        """
        try:
            # Get next version
            latest = self.db.query(MLModel).filter(
                MLModel.model_type == model_type
            ).order_by(MLModel.version.desc()).first()
            
            next_version = (latest.version + 1) if latest else 1
            
            # Deactivate old models
            self.db.query(MLModel).filter(
                MLModel.model_type == model_type,
                MLModel.is_active == True
            ).update({"is_active": False})
            
            # Save to disk
            model_dir = self.models_dir / model_type
            model_dir.mkdir(parents=True, exist_ok=True)
            
            if model.save(model_dir):
                model_path = str(model_dir)
            else:
                model_path = None
            
            # Create database record
            model_record = MLModel(
                model_type=model_type,
                version=next_version,
                accuracy_metrics=training_metrics,
                is_active=True,
                model_path=model_path,
                training_config=training_config
            )
            
            self.db.add(model_record)
            self.db.commit()
            self.db.refresh(model_record)
            
            logger.info(f"Saved model {model_type} v{next_version}")
            
            return model_record
            
        except Exception as e:
            logger.error(f"Error saving model: {e}")
            self.db.rollback()
            raise
    
    def log_prediction(self, model_id: str, user_id: Optional[str], prediction_type: str,
                      input_features: Dict[str, Any], prediction_result: Dict[str, Any],
                      confidence: Optional[float] = None) -> PredictionModel:
        """Log a prediction for evaluation.
        
        Args:
            model_id: Model ID
            user_id: User ID
            prediction_type: Type of prediction
            input_features: Input features
            prediction_result: Prediction result
            confidence: Confidence score
            
        Returns:
            Prediction record
        """
        try:
            from database.models import Prediction
            prediction = Prediction(
                model_id=model_id,
                user_id=user_id,
                prediction_type=prediction_type,
                input_features=input_features,
                prediction_result=prediction_result,
                confidence=confidence
            )
            
            self.db.add(prediction)
            self.db.commit()
            self.db.refresh(prediction)
            
            return prediction
            
        except Exception as e:
            logger.error(f"Error logging prediction: {e}")
            self.db.rollback()
            raise
    
    def update_prediction_outcome(self, prediction_id: str, actual_outcome: Dict[str, Any]):
        """Update prediction with actual outcome for evaluation.
        
        Args:
            prediction_id: Prediction ID
            actual_outcome: Actual outcome
        """
        try:
            from database.models import Prediction
            prediction = self.db.query(Prediction).filter(Prediction.id == prediction_id).first()
            if prediction:
                prediction.actual_outcome = actual_outcome
                self.db.commit()
        except Exception as e:
            logger.error(f"Error updating prediction outcome: {e}")
            self.db.rollback()
    
    def get_model_metrics(self, model_type: str) -> Dict[str, Any]:
        """Get metrics for a model type.
        
        Args:
            model_type: Type of model
            
        Returns:
            Dictionary with model metrics
        """
        try:
            model = self.get_model(model_type)
            if model:
                return model.get_metrics()
            
            # Get from database
            from database.models import MLModel
            model_record = self.db.query(MLModel).filter(
                MLModel.model_type == model_type,
                MLModel.is_active == True
            ).order_by(MLModel.version.desc()).first()
            
            if model_record:
                return {
                    "model_type": model_record.model_type,
                    "version": model_record.version,
                    "metrics": model_record.accuracy_metrics,
                    "created_at": model_record.created_at.isoformat() if model_record.created_at else None,
                }
            
            return {}
            
        except Exception as e:
            logger.error(f"Error getting model metrics: {e}")
            return {}

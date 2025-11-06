"""Suggestion Confidence Scorer using Gradient Boosting."""

from typing import Dict, Any, Optional, List
import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from sqlalchemy.orm import Session

from backend.ml.base import BaseMLModel, FloyoDataProcessor
from database.models import Suggestion
from backend.logging_config import get_logger

logger = get_logger(__name__)


class SuggestionScorer(BaseMLModel):
    """ML model for scoring suggestion confidence (adoption probability)."""
    
    def __init__(self, model_version: int = 1):
        super().__init__("suggestion_scorer", model_version)
        self.model = GradientBoostingRegressor(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            random_state=42
        )
        
    def train(self, db: Session, user_id: Optional[str] = None, **kwargs) -> Dict[str, float]:
        """Train the suggestion scorer on historical suggestion data.
        
        Args:
            db: Database session
            user_id: Optional user ID to filter training data
            **kwargs: Additional training parameters
            
        Returns:
            Dictionary of training metrics
        """
        try:
            logger.info(f"Training SuggestionScorer for user_id={user_id}")
            
            # Load suggestions with outcomes
            query = db.query(Suggestion)
            if user_id:
                query = query.filter(Suggestion.user_id == user_id)
            
            suggestions = query.all()
            
            if len(suggestions) < 20:
                logger.warning("Insufficient suggestions for training")
                return {"error": "Insufficient training data (need at least 20 suggestions)"}
            
            # Prepare features and labels
            features_list = []
            labels = []
            
            for suggestion in suggestions:
                features = self._extract_features(suggestion, db)
                if features is not None:
                    features_list.append(features)
                    # Label: 1 if applied, 0 if dismissed, 0.5 if neither
                    label = 1.0 if suggestion.is_applied else (0.0 if suggestion.is_dismissed else 0.5)
                    labels.append(label)
            
            if len(features_list) < 10:
                logger.warning("Insufficient feature data")
                return {"error": "Insufficient feature data"}
            
            # Convert to DataFrame
            features_df = pd.DataFrame(features_list)
            labels = np.array(labels)
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                features_df, labels, test_size=0.2, random_state=42
            )
            
            # Train model
            self.model.fit(X_train, y_train)
            
            # Evaluate
            y_pred = self.model.predict(X_test)
            r2 = r2_score(y_test, y_pred)
            mae = mean_absolute_error(y_test, y_pred)
            rmse = np.sqrt(mean_squared_error(y_test, y_pred))
            
            # Cross-validation
            cv_scores = cross_val_score(self.model, X_train, y_train, cv=5, scoring='r2')
            
            self.training_metrics = {
                "r2_score": float(r2),
                "mean_absolute_error": float(mae),
                "rmse": float(rmse),
                "cv_r2_mean": float(cv_scores.mean()),
                "cv_r2_std": float(cv_scores.std()),
                "training_samples": len(X_train),
                "test_samples": len(X_test),
            }
            
            self.is_trained = True
            self.last_trained_at = pd.Timestamp.now()
            
            logger.info(f"SuggestionScorer trained successfully. R²: {r2:.3f}")
            
            return self.training_metrics
            
        except Exception as e:
            logger.error(f"Error training SuggestionScorer: {e}", exc_info=True)
            return {"error": str(e)}
    
    def _extract_features(self, suggestion: Suggestion, db: Session) -> Optional[Dict[str, float]]:
        """Extract features from a suggestion."""
        try:
            # Get pattern frequency for this user
            from database.models import Pattern
            
            pattern_frequency = 0.0
            if suggestion.tools_involved:
                # Count patterns matching suggestion
                patterns = db.query(Pattern).filter(
                    Pattern.user_id == suggestion.user_id
                ).all()
                
                for pattern in patterns:
                    if pattern.tools and any(tool in pattern.tools for tool in suggestion.tools_involved):
                        pattern_frequency += pattern.count
            
            # Get user activity level
            from database.models import Event
            from datetime import datetime, timedelta
            
            week_ago = datetime.utcnow() - timedelta(days=7)
            recent_events = db.query(Event).filter(
                Event.user_id == suggestion.user_id,
                Event.timestamp >= week_ago
            ).count()
            
            # Temporal recency
            days_since_creation = (datetime.utcnow() - suggestion.created_at).days if suggestion.created_at else 0
            temporal_recency = 1.0 / (1.0 + days_since_creation) if days_since_creation > 0 else 1.0
            
            # Confidence from suggestion
            base_confidence = suggestion.confidence or 0.5
            
            # Get workflow success rate (if user has workflows)
            from database.models import WorkflowExecution, Workflow
            
            workflows = db.query(Workflow).filter(Workflow.user_id == suggestion.user_id).all()
            workflow_ids = [w.id for w in workflows]
            
            success_rate = 0.5  # Default
            if workflow_ids:
                executions = db.query(WorkflowExecution).filter(
                    WorkflowExecution.workflow_id.in_(workflow_ids)
                ).all()
                
                if executions:
                    successful = sum(1 for e in executions if e.status == "completed")
                    success_rate = successful / len(executions) if executions else 0.5
            
            return {
                "pattern_frequency": float(pattern_frequency),
                "user_activity_level": float(recent_events),
                "temporal_recency": float(temporal_recency),
                "base_confidence": float(base_confidence),
                "workflow_success_rate": float(success_rate),
                "tools_count": float(len(suggestion.tools_involved) if suggestion.tools_involved else 0),
            }
            
        except Exception as e:
            logger.error(f"Error extracting features: {e}")
            return None
    
    def predict(self, suggestion_data: Dict[str, Any]) -> Dict[str, Any]:
        """Predict adoption probability for a suggestion.
        
        Args:
            suggestion_data: Dictionary with suggestion features
            
        Returns:
            Dictionary with confidence score
        """
        if not self.is_trained:
            logger.warning("SuggestionScorer not trained. Returning default confidence.")
            return {
                "confidence": 0.5,
                "error": "Model not trained"
            }
        
        try:
            # Prepare features
            features = self._prepare_features(suggestion_data)
            if features is None:
                return {"confidence": 0.5}
            
            # Make prediction
            confidence = self.model.predict([features])[0]
            confidence = float(np.clip(confidence, 0.0, 1.0))  # Clamp to [0, 1]
            
            return {
                "confidence": confidence,
                "explanation": self._explain_prediction(features, confidence)
            }
            
        except Exception as e:
            logger.error(f"Error making prediction: {e}")
            return {"confidence": 0.5, "error": str(e)}
    
    def _prepare_features(self, suggestion_data: Dict[str, Any]) -> Optional[List[float]]:
        """Prepare features from suggestion data."""
        try:
            return [
                float(suggestion_data.get("pattern_frequency", 0.0)),
                float(suggestion_data.get("user_activity_level", 0.0)),
                float(suggestion_data.get("temporal_recency", 1.0)),
                float(suggestion_data.get("base_confidence", 0.5)),
                float(suggestion_data.get("workflow_success_rate", 0.5)),
                float(suggestion_data.get("tools_count", 0.0)),
            ]
        except Exception as e:
            logger.error(f"Error preparing features: {e}")
            return None
    
    def _explain_prediction(self, features: List[float], confidence: float) -> str:
        """Generate explanation for prediction."""
        feature_names = [
            "pattern_frequency",
            "user_activity_level",
            "temporal_recency",
            "base_confidence",
            "workflow_success_rate",
            "tools_count",
        ]
        
        # Get feature importance
        importances = self.model.feature_importances_
        
        # Find top contributing features
        top_features = sorted(
            zip(feature_names, importances, features),
            key=lambda x: x[1],
            reverse=True
        )[:3]
        
        explanation = f"Confidence: {confidence:.2f}. Top factors: "
        explanation += ", ".join([
            f"{name}({val:.2f})" for name, _, val in top_features
        ])
        
        return explanation

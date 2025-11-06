"""Anomaly Detection for unusual patterns that might need workflows."""

from typing import Dict, Any, Optional, List
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import precision_score, recall_score
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from backend.ml.base import BaseMLModel, FloyoDataProcessor
from database.models import Pattern, Event
from backend.logging_config import get_logger

logger = get_logger(__name__)


class PatternAnomalyDetector(BaseMLModel):
    """Isolation Forest model for detecting unusual patterns."""
    
    def __init__(self, model_version: int = 1, contamination: float = 0.1):
        super().__init__("pattern_anomaly_detector", model_version)
        self.contamination = contamination
        self.model = IsolationForest(
            contamination=contamination,
            random_state=42,
            n_estimators=100
        )
        self.scaler = StandardScaler()
        
    def train(self, db: Session, user_id: Optional[str] = None, **kwargs) -> Dict[str, float]:
        """Train the anomaly detector on normal patterns.
        
        Args:
            db: Database session
            user_id: Optional user ID to filter training data
            **kwargs: Additional training parameters
            
        Returns:
            Dictionary of training metrics
        """
        try:
            logger.info(f"Training PatternAnomalyDetector for user_id={user_id}")
            
            # Load patterns
            patterns_df = FloyoDataProcessor.patterns_to_dataframe(db, user_id)
            if patterns_df is None or patterns_df.empty:
                logger.warning("No patterns data available")
                return {"error": "No training data available"}
            
            # Extract features
            features_list = []
            for _, pattern in patterns_df.iterrows():
                features = self._extract_features(pattern, db)
                if features is not None:
                    features_list.append(features)
            
            if len(features_list) < 20:
                logger.warning("Insufficient training data")
                return {"error": "Insufficient training data (need at least 20 patterns)"}
            
            # Convert to DataFrame and scale
            features_df = pd.DataFrame(features_list)
            X_scaled = self.scaler.fit_transform(features_df)
            
            # Train model
            self.model.fit(X_scaled)
            
            # Evaluate on training data
            predictions = self.model.predict(X_scaled)
            anomaly_count = np.sum(predictions == -1)
            normal_count = np.sum(predictions == 1)
            
            self.training_metrics = {
                "training_samples": len(features_list),
                "anomalies_detected": int(anomaly_count),
                "normal_samples": int(normal_count),
                "contamination": self.contamination,
            }
            
            self.is_trained = True
            self.last_trained_at = datetime.utcnow()
            
            logger.info(f"PatternAnomalyDetector trained. Detected {anomaly_count} anomalies")
            
            return self.training_metrics
            
        except Exception as e:
            logger.error(f"Error training PatternAnomalyDetector: {e}", exc_info=True)
            return {"error": str(e)}
    
    def _extract_features(self, pattern: pd.Series, db: Session) -> Optional[Dict[str, float]]:
        """Extract features from a pattern."""
        try:
            # Event frequency
            event_frequency = float(pattern.get('count', 0))
            
            # File diversity (would need to query events)
            file_diversity = 1.0  # Default
            if pattern.get('pattern_id'):
                # Count unique files for this pattern
                events = db.query(Event).filter(
                    Event.user_id == pattern.get('user_id')
                ).all()
                
                if events:
                    extensions = {e.file_path.split('.')[-1] for e in events if e.file_path}
                    file_diversity = float(len(extensions))
            
            # Temporal variance
            temporal_variance = 0.0
            if pattern.get('last_used'):
                # Calculate variance in usage times
                # This is simplified - in production would use actual event timestamps
                temporal_variance = 1.0
            
            # Tool usage pattern
            tool_count = 0.0
            if pattern.get('tools'):
                tool_count = float(len(pattern['tools']))
            
            # Sequence complexity
            sequence_complexity = 1.0  # Default
            
            return {
                "event_frequency": event_frequency,
                "file_diversity": file_diversity,
                "temporal_variance": temporal_variance,
                "tool_count": tool_count,
                "sequence_complexity": sequence_complexity,
            }
            
        except Exception as e:
            logger.error(f"Error extracting features: {e}")
            return None
    
    def detect_anomaly(self, pattern_data: Dict[str, Any], db: Session) -> Dict[str, Any]:
        """Detect if a pattern is unusual (might need workflow).
        
        Args:
            pattern_data: Dictionary with pattern information
            db: Database session
            
        Returns:
            Dictionary with anomaly detection results
        """
        if not self.is_trained:
            logger.warning("PatternAnomalyDetector not trained")
            return {
                "is_anomaly": False,
                "anomaly_score": 0.0,
                "error": "Model not trained"
            }
        
        try:
            # Extract features
            features = self._extract_detection_features(pattern_data, db)
            if features is None:
                return {"is_anomaly": False, "anomaly_score": 0.0}
            
            # Scale features
            features_array = np.array([list(features.values())])
            features_scaled = self.scaler.transform(features_array)
            
            # Predict
            prediction = self.model.predict(features_scaled)[0]
            anomaly_score = self.model.score_samples(features_scaled)[0]
            
            is_anomaly = prediction == -1
            
            return {
                "is_anomaly": bool(is_anomaly),
                "anomaly_score": float(anomaly_score),
                "confidence": "high" if abs(anomaly_score) > 0.5 else "medium" if abs(anomaly_score) > 0.2 else "low",
                "recommendation": "create_workflow" if is_anomaly else "normal_pattern"
            }
            
        except Exception as e:
            logger.error(f"Error detecting anomaly: {e}")
            return {"is_anomaly": False, "anomaly_score": 0.0, "error": str(e)}
    
    def _extract_detection_features(self, pattern_data: Dict[str, Any], db: Session) -> Optional[Dict[str, float]]:
        """Extract features for anomaly detection."""
        try:
            return {
                "event_frequency": float(pattern_data.get("count", 0)),
                "file_diversity": float(pattern_data.get("file_diversity", 1.0)),
                "temporal_variance": float(pattern_data.get("temporal_variance", 0.0)),
                "tool_count": float(len(pattern_data.get("tools", []))),
                "sequence_complexity": float(pattern_data.get("sequence_complexity", 1.0)),
            }
        except Exception as e:
            logger.error(f"Error extracting detection features: {e}")
            return None
    
    def predict(self, pattern_data: Dict[str, Any]) -> Dict[str, Any]:
        """Predict if pattern is anomalous."""
        # This is a wrapper for detect_anomaly
        return self.detect_anomaly(pattern_data, None)

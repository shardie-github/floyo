"""Pattern Classification Model using Random Forest."""

from typing import Dict, Any, Optional, List
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report
from sqlalchemy.orm import Session

from backend.ml.base import BaseMLModel, FloyoDataProcessor
from backend.logging_config import get_logger

logger = get_logger(__name__)


class PatternClassifier(BaseMLModel):
    """ML model for classifying usage patterns into workflow categories."""
    
    def __init__(self, model_version: int = 1):
        super().__init__("pattern_classifier", model_version)
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
        self.label_encoders: Dict[str, LabelEncoder] = {}
        self.feature_names: List[str] = []
        
    def train(self, db: Session, user_id: Optional[str] = None, **kwargs) -> Dict[str, float]:
        """Train the pattern classifier on event data.
        
        Args:
            db: Database session
            user_id: Optional user ID to filter training data
            **kwargs: Additional training parameters
            
        Returns:
            Dictionary of training metrics
        """
        try:
            logger.info(f"Training PatternClassifier for user_id={user_id}")
            
            # Load training data
            events_df = FloyoDataProcessor.events_to_dataframe(db, user_id, limit=10000)
            if events_df is None or events_df.empty:
                logger.warning("No events data available for training")
                return {"error": "No training data available"}
            
            # Prepare features
            features_df = self._prepare_features(events_df)
            if features_df is None or features_df.empty:
                logger.warning("No features extracted from events")
                return {"error": "No features extracted"}
            
            # Create labels (workflow categories) - for now, use heuristics
            # In production, this would come from labeled data or user feedback
            labels = self._create_labels(events_df)
            
            # Remove rows with missing labels
            valid_indices = ~pd.isna(labels)
            features_df = features_df[valid_indices]
            labels = labels[valid_indices]
            
            if len(features_df) < 10:
                logger.warning("Insufficient training data")
                return {"error": "Insufficient training data"}
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                features_df, labels, test_size=0.2, random_state=42, stratify=labels
            )
            
            # Train model
            self.model.fit(X_train, y_train)
            
            # Evaluate
            y_pred = self.model.predict(X_test)
            accuracy = accuracy_score(y_test, y_pred)
            precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
            recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
            f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
            
            # Cross-validation
            cv_scores = cross_val_score(self.model, X_train, y_train, cv=5)
            
            self.training_metrics = {
                "accuracy": float(accuracy),
                "precision": float(precision),
                "recall": float(recall),
                "f1_score": float(f1),
                "cv_mean": float(cv_scores.mean()),
                "cv_std": float(cv_scores.std()),
                "training_samples": len(X_train),
                "test_samples": len(X_test),
            }
            
            self.is_trained = True
            self.last_trained_at = pd.Timestamp.now()
            self.feature_names = list(features_df.columns)
            
            logger.info(f"PatternClassifier trained successfully. Accuracy: {accuracy:.3f}")
            
            return self.training_metrics
            
        except Exception as e:
            logger.error(f"Error training PatternClassifier: {e}", exc_info=True)
            return {"error": str(e)}
    
    def _prepare_features(self, events_df: pd.DataFrame) -> Optional[pd.DataFrame]:
        """Prepare features from events DataFrame."""
        try:
            features = []
            
            # Encode categorical features
            if 'event_type' in events_df.columns:
                le_event = LabelEncoder()
                events_df['event_type_encoded'] = le_event.fit_transform(events_df['event_type'].fillna('unknown'))
                self.label_encoders['event_type'] = le_event
                features.append('event_type_encoded')
            
            if 'tool' in events_df.columns:
                le_tool = LabelEncoder()
                events_df['tool_encoded'] = le_tool.fit_transform(events_df['tool'].fillna('unknown'))
                self.label_encoders['tool'] = le_tool
                features.append('tool_encoded')
            
            if 'operation' in events_df.columns:
                le_op = LabelEncoder()
                events_df['operation_encoded'] = le_op.fit_transform(events_df['operation'].fillna('unknown'))
                self.label_encoders['operation'] = le_op
                features.append('operation_encoded')
            
            # Numerical features
            if 'hour_of_day' in events_df.columns:
                features.append('hour_of_day')
                events_df['hour_sin'] = np.sin(2 * np.pi * events_df['hour_of_day'] / 24)
                events_df['hour_cos'] = np.cos(2 * np.pi * events_df['hour_of_day'] / 24)
                features.extend(['hour_sin', 'hour_cos'])
            
            if 'day_of_week' in events_df.columns:
                features.append('day_of_week')
                events_df['day_sin'] = np.sin(2 * np.pi * events_df['day_of_week'] / 7)
                events_df['day_cos'] = np.cos(2 * np.pi * events_df['day_of_week'] / 7)
                features.extend(['day_sin', 'day_cos'])
            
            # File extension features
            if 'file_extension' in events_df.columns:
                # Count occurrences of each extension
                ext_counts = events_df['file_extension'].value_counts()
                events_df['ext_frequency'] = events_df['file_extension'].map(ext_counts).fillna(0)
                features.append('ext_frequency')
            
            # Select only valid features
            valid_features = [f for f in features if f in events_df.columns]
            if not valid_features:
                return None
            
            return events_df[valid_features]
            
        except Exception as e:
            logger.error(f"Error preparing features: {e}")
            return None
    
    def _create_labels(self, events_df: pd.DataFrame) -> pd.Series:
        """Create workflow category labels from events.
        
        For now, uses heuristics. In production, this would use:
        - User feedback on suggestions
        - Applied workflows
        - Manual labeling
        """
        labels = []
        
        for _, row in events_df.iterrows():
            # Heuristic labeling based on file types and tools
            file_ext = row.get('file_extension', '')
            tool = row.get('tool', '')
            
            if file_ext in ['.py', '.js', '.ts']:
                category = 'script_automation'
            elif file_ext in ['.csv', '.json', '.xlsx']:
                category = 'data_processing'
            elif file_ext in ['.md', '.txt', '.docx']:
                category = 'document_management'
            elif 'git' in tool.lower() or 'github' in tool.lower():
                category = 'version_control'
            else:
                category = 'general'
            
            labels.append(category)
        
        return pd.Series(labels, index=events_df.index)
    
    def predict(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Predict workflow category for an event.
        
        Args:
            event_data: Dictionary with event features
            
        Returns:
            Dictionary with predicted category and confidence
        """
        if not self.is_trained:
            logger.warning("PatternClassifier not trained. Returning default prediction.")
            return {
                "category": "general",
                "confidence": 0.5,
                "error": "Model not trained"
            }
        
        try:
            # Prepare features
            features = self._extract_features(event_data)
            if features is None:
                return {"category": "general", "confidence": 0.5}
            
            # Make prediction
            prediction = self.model.predict([features])[0]
            probabilities = self.model.predict_proba([features])[0]
            confidence = float(np.max(probabilities))
            
            return {
                "category": prediction,
                "confidence": confidence,
                "probabilities": {str(i): float(prob) for i, prob in enumerate(probabilities)}
            }
            
        except Exception as e:
            logger.error(f"Error making prediction: {e}")
            return {"category": "general", "confidence": 0.5, "error": str(e)}
    
    def _extract_features(self, event_data: Dict[str, Any]) -> Optional[List[float]]:
        """Extract features from event data."""
        try:
            features = []
            
            # Encode categorical features using saved encoders
            if 'event_type' in event_data and 'event_type' in self.label_encoders:
                try:
                    encoded = self.label_encoders['event_type'].transform([event_data['event_type']])[0]
                    features.append(float(encoded))
                except:
                    features.append(0.0)
            else:
                features.append(0.0)
            
            if 'tool' in event_data and 'tool' in self.label_encoders:
                try:
                    encoded = self.label_encoders['tool'].transform([event_data['tool']])[0]
                    features.append(float(encoded))
                except:
                    features.append(0.0)
            else:
                features.append(0.0)
            
            if 'operation' in event_data and 'operation' in self.label_encoders:
                try:
                    encoded = self.label_encoders['operation'].transform([event_data['operation']])[0]
                    features.append(float(encoded))
                except:
                    features.append(0.0)
            else:
                features.append(0.0)
            
            # Time features
            hour = event_data.get('hour_of_day', 12)
            features.append(float(hour))
            features.append(float(np.sin(2 * np.pi * hour / 24)))
            features.append(float(np.cos(2 * np.pi * hour / 24)))
            
            day = event_data.get('day_of_week', 0)
            features.append(float(day))
            features.append(float(np.sin(2 * np.pi * day / 7)))
            features.append(float(np.cos(2 * np.pi * day / 7)))
            
            # File extension frequency (would need to be passed in or calculated)
            features.append(event_data.get('ext_frequency', 1.0))
            
            return features
            
        except Exception as e:
            logger.error(f"Error extracting features: {e}")
            return None

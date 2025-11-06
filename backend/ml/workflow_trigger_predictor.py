"""Workflow Trigger Predictor for optimal execution timing."""

from typing import Dict, Any, Optional, List
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import r2_score, mean_absolute_error
from sqlalchemy.orm import Session

from backend.ml.base import BaseMLModel, FloyoDataProcessor
from database.models import WorkflowExecution, Workflow, Event
from backend.logging_config import get_logger

logger = get_logger(__name__)


class WorkflowTriggerPredictor(BaseMLModel):
    """ML model for predicting optimal workflow execution times."""
    
    def __init__(self, model_version: int = 1):
        super().__init__("workflow_trigger_predictor", model_version)
        self.model = GradientBoostingRegressor(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            random_state=42
        )
        
    def train(self, db: Session, user_id: Optional[str] = None, **kwargs) -> Dict[str, float]:
        """Train the workflow trigger predictor.
        
        Args:
            db: Database session
            user_id: Optional user ID to filter training data
            **kwargs: Additional training parameters
            
        Returns:
            Dictionary of training metrics
        """
        try:
            logger.info(f"Training WorkflowTriggerPredictor for user_id={user_id}")
            
            # Load workflow executions
            executions_df = FloyoDataProcessor.workflow_executions_to_dataframe(db, user_id)
            if executions_df is None or executions_df.empty:
                logger.warning("No workflow executions for training")
                return {"error": "No training data available"}
            
            # Load events for context
            events_df = FloyoDataProcessor.events_to_dataframe(db, user_id, limit=10000)
            
            # Prepare features and labels
            features_list = []
            labels = []
            
            for _, execution in executions_df.iterrows():
                workflow_id = execution['workflow_id']
                
                # Get workflow details
                workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
                if not workflow:
                    continue
                
                # Extract features
                features = self._extract_features(execution, workflow, events_df, db)
                if features is not None:
                    features_list.append(features)
                    # Label: success probability (1 if successful, 0 if failed)
                    labels.append(float(execution['success']))
            
            if len(features_list) < 10:
                logger.warning("Insufficient training data")
                return {"error": "Insufficient training data"}
            
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
            
            # Cross-validation
            cv_scores = cross_val_score(self.model, X_train, y_train, cv=5, scoring='r2')
            
            self.training_metrics = {
                "r2_score": float(r2),
                "mean_absolute_error": float(mae),
                "cv_r2_mean": float(cv_scores.mean()),
                "cv_r2_std": float(cv_scores.std()),
                "training_samples": len(X_train),
                "test_samples": len(X_test),
            }
            
            self.is_trained = True
            self.last_trained_at = datetime.utcnow()
            
            logger.info(f"WorkflowTriggerPredictor trained. R²: {r2:.3f}")
            
            return self.training_metrics
            
        except Exception as e:
            logger.error(f"Error training WorkflowTriggerPredictor: {e}", exc_info=True)
            return {"error": str(e)}
    
    def _extract_features(self, execution: pd.Series, workflow: Workflow, 
                         events_df: pd.DataFrame, db: Session) -> Optional[Dict[str, float]]:
        """Extract features from workflow execution."""
        try:
            # Time since last execution
            hours_since_last = 24.0  # Default
            if execution.get('started_at'):
                # Find previous execution
                prev_exec = db.query(WorkflowExecution).filter(
                    WorkflowExecution.workflow_id == workflow.id,
                    WorkflowExecution.started_at < execution['started_at']
                ).order_by(WorkflowExecution.started_at.desc()).first()
                
                if prev_exec and prev_exec.started_at:
                    delta = execution['started_at'] - prev_exec.started_at
                    hours_since_last = delta.total_seconds() / 3600.0
            
            # Average time between executions
            all_execs = db.query(WorkflowExecution).filter(
                WorkflowExecution.workflow_id == workflow.id
            ).order_by(WorkflowExecution.started_at).all()
            
            avg_interval = 24.0  # Default
            if len(all_execs) > 1:
                intervals = []
                for i in range(1, len(all_execs)):
                    if all_execs[i].started_at and all_execs[i-1].started_at:
                        delta = all_execs[i].started_at - all_execs[i-1].started_at
                        intervals.append(delta.total_seconds() / 3600.0)
                if intervals:
                    avg_interval = np.mean(intervals)
            
            # Pattern frequency
            pattern_frequency = 0.0
            if events_df is not None and not events_df.empty:
                # Count events in last 24 hours
                cutoff = execution.get('started_at', datetime.utcnow()) - timedelta(hours=24)
                if isinstance(execution.get('started_at'), datetime):
                    recent_events = events_df[events_df['timestamp'] >= cutoff]
                    pattern_frequency = len(recent_events)
            
            # User activity level
            user_activity = 0.0
            if execution.get('triggered_by'):
                week_ago = datetime.utcnow() - timedelta(days=7)
                activity = db.query(Event).filter(
                    Event.user_id == execution['triggered_by'],
                    Event.timestamp >= week_ago
                ).count()
                user_activity = float(activity)
            
            # Time features
            if execution.get('started_at'):
                hour_of_day = execution['started_at'].hour
                day_of_week = execution['started_at'].weekday()
            else:
                hour_of_day = 12
                day_of_week = 0
            
            return {
                "hours_since_last": float(hours_since_last),
                "avg_interval_hours": float(avg_interval),
                "pattern_frequency": float(pattern_frequency),
                "user_activity_level": float(user_activity),
                "hour_of_day": float(hour_of_day),
                "day_of_week": float(day_of_week),
                "workflow_step_count": float(len(workflow.steps) if workflow.steps else 0),
            }
            
        except Exception as e:
            logger.error(f"Error extracting features: {e}")
            return None
    
    def predict_optimal_time(self, workflow: Workflow, current_events: List[Dict[str, Any]], 
                           db: Session) -> Dict[str, Any]:
        """Predict optimal time to trigger workflow.
        
        Args:
            workflow: Workflow object
            current_events: List of recent events
            db: Database session
            
        Returns:
            Dictionary with optimal time and success probability
        """
        if not self.is_trained:
            logger.warning("WorkflowTriggerPredictor not trained")
            return {
                "optimal_time": datetime.utcnow() + timedelta(hours=1),
                "success_probability": 0.5,
                "error": "Model not trained"
            }
        
        try:
            # Extract features
            features = self._extract_prediction_features(workflow, current_events, db)
            if features is None:
                return {
                    "optimal_time": datetime.utcnow() + timedelta(hours=1),
                    "success_probability": 0.5
                }
            
            # Predict success probability
            success_prob = self.model.predict([features])[0]
            success_prob = float(np.clip(success_prob, 0.0, 1.0))
            
            # Calculate optimal time (next hour if probability high, wait if low)
            if success_prob > 0.7:
                optimal_time = datetime.utcnow() + timedelta(minutes=30)
            elif success_prob > 0.5:
                optimal_time = datetime.utcnow() + timedelta(hours=2)
            else:
                optimal_time = datetime.utcnow() + timedelta(hours=6)
            
            return {
                "optimal_time": optimal_time.isoformat(),
                "success_probability": success_prob,
                "recommendation": "execute_now" if success_prob > 0.7 else "execute_soon" if success_prob > 0.5 else "wait"
            }
            
        except Exception as e:
            logger.error(f"Error predicting optimal time: {e}")
            return {
                "optimal_time": datetime.utcnow() + timedelta(hours=1),
                "success_probability": 0.5,
                "error": str(e)
            }
    
    def _extract_prediction_features(self, workflow: Workflow, current_events: List[Dict[str, Any]], 
                                   db: Session) -> Optional[List[float]]:
        """Extract features for prediction."""
        try:
            # Get last execution
            last_exec = db.query(WorkflowExecution).filter(
                WorkflowExecution.workflow_id == workflow.id
            ).order_by(WorkflowExecution.started_at.desc()).first()
            
            hours_since_last = 24.0
            if last_exec and last_exec.started_at:
                delta = datetime.utcnow() - last_exec.started_at
                hours_since_last = delta.total_seconds() / 3600.0
            
            # Average interval
            avg_interval = 24.0
            all_execs = db.query(WorkflowExecution).filter(
                WorkflowExecution.workflow_id == workflow.id
            ).all()
            
            if len(all_execs) > 1:
                intervals = []
                for i in range(1, len(all_execs)):
                    if all_execs[i].started_at and all_execs[i-1].started_at:
                        delta = all_execs[i].started_at - all_execs[i-1].started_at
                        intervals.append(delta.total_seconds() / 3600.0)
                if intervals:
                    avg_interval = np.mean(intervals)
            
            # Pattern frequency
            pattern_frequency = float(len(current_events))
            
            # User activity
            user_activity = 0.0
            if workflow.user_id:
                week_ago = datetime.utcnow() - timedelta(days=7)
                activity = db.query(Event).filter(
                    Event.user_id == workflow.user_id,
                    Event.timestamp >= week_ago
                ).count()
                user_activity = float(activity)
            
            # Time features
            hour_of_day = datetime.utcnow().hour
            day_of_week = datetime.utcnow().weekday()
            
            return [
                float(hours_since_last),
                float(avg_interval),
                float(pattern_frequency),
                float(user_activity),
                float(hour_of_day),
                float(day_of_week),
                float(len(workflow.steps) if workflow.steps else 0),
            ]
            
        except Exception as e:
            logger.error(f"Error extracting prediction features: {e}")
            return None

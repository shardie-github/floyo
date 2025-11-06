"""Base classes for ML models in Floyo."""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from datetime import datetime
import pickle
import json
from pathlib import Path
from sqlalchemy.orm import Session

from backend.logging_config import get_logger

logger = get_logger(__name__)


class BaseMLModel(ABC):
    """Base class for all ML models in Floyo."""
    
    def __init__(self, model_name: str, model_version: int = 1):
        self.model_name = model_name
        self.model_version = model_version
        self.model = None
        self.is_trained = False
        self.training_metrics: Dict[str, float] = {}
        self.created_at = datetime.utcnow()
        self.last_trained_at: Optional[datetime] = None
        
    @abstractmethod
    def train(self, training_data: Any, **kwargs) -> Dict[str, float]:
        """Train the model on provided data.
        
        Returns:
            Dictionary of training metrics (accuracy, loss, etc.)
        """
        pass
    
    @abstractmethod
    def predict(self, input_data: Any) -> Any:
        """Make a prediction on input data."""
        pass
    
    def save(self, file_path: Path) -> bool:
        """Save the model to disk."""
        try:
            model_data = {
                "model_name": self.model_name,
                "model_version": self.model_version,
                "is_trained": self.is_trained,
                "training_metrics": self.training_metrics,
                "created_at": self.created_at.isoformat(),
                "last_trained_at": self.last_trained_at.isoformat() if self.last_trained_at else None,
            }
            
            # Save model (pickle or model-specific format)
            model_file = file_path / f"{self.model_name}_v{self.model_version}.pkl"
            with open(model_file, 'wb') as f:
                pickle.dump(self.model, f)
            
            # Save metadata
            metadata_file = file_path / f"{self.model_name}_v{self.model_version}_metadata.json"
            with open(metadata_file, 'w') as f:
                json.dump(model_data, f, indent=2)
            
            logger.info(f"Saved model {self.model_name} to {file_path}")
            return True
        except Exception as e:
            logger.error(f"Error saving model {self.model_name}: {e}")
            return False
    
    def load(self, file_path: Path) -> bool:
        """Load the model from disk."""
        try:
            model_file = file_path / f"{self.model_name}_v{self.model_version}.pkl"
            metadata_file = file_path / f"{self.model_name}_v{self.model_version}_metadata.json"
            
            if not model_file.exists() or not metadata_file.exists():
                logger.warning(f"Model files not found for {self.model_name}")
                return False
            
            # Load metadata
            with open(metadata_file, 'r') as f:
                metadata = json.load(f)
            
            # Load model
            with open(model_file, 'rb') as f:
                self.model = pickle.load(f)
            
            self.is_trained = metadata.get("is_trained", False)
            self.training_metrics = metadata.get("training_metrics", {})
            
            if metadata.get("last_trained_at"):
                self.last_trained_at = datetime.fromisoformat(metadata["last_trained_at"])
            
            logger.info(f"Loaded model {self.model_name} from {file_path}")
            return True
        except Exception as e:
            logger.error(f"Error loading model {self.model_name}: {e}")
            return False
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get model performance metrics."""
        return {
            "model_name": self.model_name,
            "model_version": self.model_version,
            "is_trained": self.is_trained,
            "training_metrics": self.training_metrics,
            "created_at": self.created_at.isoformat(),
            "last_trained_at": self.last_trained_at.isoformat() if self.last_trained_at else None,
        }


class FloyoDataProcessor:
    """Utility class for processing Floyo data for ML training."""
    
    @staticmethod
    def events_to_dataframe(db: Session, user_id: Optional[str] = None, limit: int = 10000):
        """Convert Event records to pandas DataFrame."""
        try:
            import pandas as pd
            from database.models import Event
            
            query = db.query(Event)
            if user_id:
                query = query.filter(Event.user_id == user_id)
            
            events = query.order_by(Event.timestamp.desc()).limit(limit).all()
            
            data = []
            for event in events:
                data.append({
                    "event_id": str(event.id),
                    "user_id": str(event.user_id),
                    "event_type": event.event_type,
                    "file_path": event.file_path,
                    "tool": event.tool,
                    "operation": event.operation,
                    "timestamp": event.timestamp,
                    "hour_of_day": event.timestamp.hour if event.timestamp else None,
                    "day_of_week": event.timestamp.weekday() if event.timestamp else None,
                    "file_extension": Path(event.file_path).suffix.lower() if event.file_path else None,
                })
            
            return pd.DataFrame(data)
        except ImportError:
            logger.error("pandas not installed. Install with: pip install pandas")
            return None
        except Exception as e:
            logger.error(f"Error converting events to DataFrame: {e}")
            return None
    
    @staticmethod
    def patterns_to_dataframe(db: Session, user_id: Optional[str] = None):
        """Convert Pattern records to pandas DataFrame."""
        try:
            import pandas as pd
            from database.models import Pattern
            
            query = db.query(Pattern)
            if user_id:
                query = query.filter(Pattern.user_id == user_id)
            
            patterns = query.all()
            
            data = []
            for pattern in patterns:
                data.append({
                    "pattern_id": str(pattern.id),
                    "user_id": str(pattern.user_id),
                    "file_extension": pattern.file_extension,
                    "count": pattern.count,
                    "last_used": pattern.last_used,
                    "tools": pattern.tools,
                })
            
            return pd.DataFrame(data)
        except ImportError:
            logger.error("pandas not installed")
            return None
        except Exception as e:
            logger.error(f"Error converting patterns to DataFrame: {e}")
            return None
    
    @staticmethod
    def temporal_patterns_to_sequences(db: Session, user_id: Optional[str] = None, limit: int = 1000):
        """Convert TemporalPattern records to sequences for LSTM training."""
        try:
            from database.models import TemporalPattern
            
            query = db.query(TemporalPattern)
            if user_id:
                query = query.filter(TemporalPattern.user_id == user_id)
            
            patterns = query.order_by(TemporalPattern.created_at.desc()).limit(limit).all()
            
            sequences = []
            for pattern in patterns:
                sequences.append({
                    "sequence": pattern.sequence,
                    "count": pattern.count,
                    "avg_time_gap": pattern.avg_time_gap,
                    "files": pattern.files,
                })
            
            return sequences
        except Exception as e:
            logger.error(f"Error converting temporal patterns to sequences: {e}")
            return []
    
    @staticmethod
    def workflow_executions_to_dataframe(db: Session, user_id: Optional[str] = None):
        """Convert WorkflowExecution records to DataFrame."""
        try:
            import pandas as pd
            from database.models import WorkflowExecution
            
            query = db.query(WorkflowExecution)
            if user_id:
                query = query.filter(WorkflowExecution.triggered_by == user_id)
            
            executions = query.all()
            
            data = []
            for exec in executions:
                duration = None
                if exec.started_at and exec.completed_at:
                    duration = (exec.completed_at - exec.started_at).total_seconds()
                
                data.append({
                    "execution_id": str(exec.id),
                    "workflow_id": str(exec.workflow_id),
                    "status": exec.status,
                    "triggered_by": str(exec.triggered_by) if exec.triggered_by else None,
                    "started_at": exec.started_at,
                    "completed_at": exec.completed_at,
                    "duration_seconds": duration,
                    "success": 1 if exec.status == "completed" else 0,
                    "failed": 1 if exec.status == "failed" else 0,
                })
            
            return pd.DataFrame(data)
        except ImportError:
            logger.error("pandas not installed")
            return None
        except Exception as e:
            logger.error(f"Error converting executions to DataFrame: {e}")
            return None

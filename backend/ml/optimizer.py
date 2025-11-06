"""Performance Optimization for ML Models."""

from typing import Dict, Any, Optional
import time
from functools import lru_cache, wraps
from sqlalchemy.orm import Session

from backend.ml.model_manager import ModelManager
from backend.cache import get, set, delete
from backend.logging_config import get_logger

logger = get_logger(__name__)


def cache_prediction(ttl: int = 300):
    """Decorator to cache model predictions.
    
    Args:
        ttl: Time to live in seconds (default 5 minutes)
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            # Create cache key from arguments
            cache_key = f"ml_prediction:{func.__name__}:{hash(str(args) + str(kwargs))}"
            
            # Try cache first
            cached = get(cache_key)
            if cached:
                return cached
            
            # Make prediction
            result = func(self, *args, **kwargs)
            
            # Cache result
            set(cache_key, result, ttl=ttl)
            
            return result
        return wrapper
    return decorator


class ModelOptimizer:
    """Optimizes ML model performance."""
    
    def __init__(self, db: Session):
        """Initialize optimizer.
        
        Args:
            db: Database session
        """
        self.db = db
        self.model_manager = ModelManager(db)
        self._model_cache = {}
    
    @lru_cache(maxsize=10)
    def get_cached_model(self, model_type: str):
        """Get model with caching."""
        return self.model_manager.get_model(model_type)
    
    def optimize_prediction(self, model_type: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Optimized prediction with caching and batching.
        
        Args:
            model_type: Type of model
            input_data: Input features
            
        Returns:
            Prediction result
        """
        try:
            # Check cache
            cache_key = f"prediction:{model_type}:{hash(str(sorted(input_data.items())))}"
            cached = get(cache_key)
            if cached:
                return cached
            
            # Get model (cached)
            model = self.get_cached_model(model_type)
            if not model:
                return {"error": "Model not found"}
            
            # Make prediction
            start_time = time.time()
            result = model.predict(input_data)
            prediction_time = time.time() - start_time
            
            # Add timing info
            result["_prediction_time_ms"] = prediction_time * 1000
            
            # Cache result (5 minutes)
            set(cache_key, result, ttl=300)
            
            return result
            
        except Exception as e:
            logger.error(f"Error in optimized prediction: {e}")
            return {"error": str(e)}
    
    def batch_predict(self, model_type: str, input_batch: list) -> list:
        """Batch predictions for efficiency.
        
        Args:
            model_type: Type of model
            input_batch: List of input feature dictionaries
            
        Returns:
            List of predictions
        """
        try:
            model = self.get_cached_model(model_type)
            if not model:
                return [{"error": "Model not found"} for _ in input_batch]
            
            # Make batch predictions
            results = []
            for input_data in input_batch:
                result = model.predict(input_data)
                results.append(result)
            
            return results
            
        except Exception as e:
            logger.error(f"Error in batch prediction: {e}")
            return [{"error": str(e)} for _ in input_batch]
    
    def clear_cache(self, model_type: Optional[str] = None):
        """Clear prediction cache.
        
        Args:
            model_type: Optional model type to clear (None = all)
        """
        try:
            if model_type:
                pattern = f"prediction:{model_type}:*"
            else:
                pattern = "prediction:*"
            
            # Clear cache (implementation depends on cache backend)
            from backend.cache import clear_pattern
            clear_pattern(pattern)
            
            # Clear model cache
            if model_type:
                self.get_cached_model.cache_clear()
            else:
                self._model_cache.clear()
                self.get_cached_model.cache_clear()
            
            logger.info(f"Cleared cache for {model_type or 'all models'}")
            
        except Exception as e:
            logger.error(f"Error clearing cache: {e}")

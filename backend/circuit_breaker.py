"""Circuit breaker implementation for resilience."""
from functools import wraps
import time
from typing import Callable, Any
import logging

logger = logging.getLogger(__name__)

class CircuitBreaker:
    """Circuit breaker to prevent cascade failures."""
    
    def __init__(self, failure_threshold: int = 5, timeout: int = 60):
        """
        Initialize circuit breaker.
        
        Args:
            failure_threshold: Number of failures before opening circuit
            timeout: Time in seconds before attempting to reset circuit
        """
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "closed"  # closed, open, half_open
    
    def __call__(self, func: Callable) -> Callable:
        """Decorator to wrap a function with circuit breaker."""
        @wraps(func)
        def wrapper(*args, **kwargs):
            if self.state == "open":
                # Check if timeout has passed
                if self.last_failure_time and time.time() - self.last_failure_time > self.timeout:
                    self.state = "half_open"
                    logger.info(f"Circuit breaker transitioning to half_open for {func.__name__}")
                else:
                    logger.warning(f"Circuit breaker is open for {func.__name__} - request rejected")
                    raise Exception(f"Circuit breaker is open - service unavailable for {func.__name__}")
            
            try:
                result = func(*args, **kwargs)
                if self.state == "half_open":
                    # Success in half_open means we can close the circuit
                    self.state = "closed"
                    self.failure_count = 0
                    logger.info(f"Circuit breaker closed for {func.__name__} after successful request")
                return result
            except Exception as e:
                self.failure_count += 1
                self.last_failure_time = time.time()
                
                if self.failure_count >= self.failure_threshold:
                    self.state = "open"
                    logger.error(
                        f"Circuit breaker opened for {func.__name__} "
                        f"after {self.failure_count} failures"
                    )
                
                raise
        
        return wrapper
    
    def reset(self):
        """Manually reset the circuit breaker."""
        self.state = "closed"
        self.failure_count = 0
        self.last_failure_time = None
        logger.info("Circuit breaker manually reset")

# Global circuit breaker for database operations
db_circuit_breaker = CircuitBreaker(failure_threshold=5, timeout=60)

"""
Retry logic with exponential backoff for resilient API calls.

Provides decorators and utilities for retrying failed operations
with configurable backoff strategies.
"""

import time
import random
from functools import wraps
from typing import Callable, TypeVar, Optional, List, Type
import logging

logger = logging.getLogger(__name__)

T = TypeVar('T')


class RetryConfig:
    """Configuration for retry behavior."""
    
    def __init__(
        self,
        max_attempts: int = 3,
        initial_delay: float = 1.0,
        max_delay: float = 60.0,
        exponential_base: float = 2.0,
        jitter: bool = True,
        retryable_exceptions: Optional[List[Type[Exception]]] = None,
    ):
        """
        Initialize retry configuration.
        
        Args:
            max_attempts: Maximum number of retry attempts
            initial_delay: Initial delay in seconds
            max_delay: Maximum delay in seconds
            exponential_base: Base for exponential backoff
            jitter: Add random jitter to prevent thundering herd
            retryable_exceptions: List of exception types to retry on
        """
        self.max_attempts = max_attempts
        self.initial_delay = initial_delay
        self.max_delay = max_delay
        self.exponential_base = exponential_base
        self.jitter = jitter
        self.retryable_exceptions = retryable_exceptions or [Exception]


def calculate_backoff(attempt: int, config: RetryConfig) -> float:
    """
    Calculate backoff delay for a given attempt.
    
    Uses exponential backoff with optional jitter.
    
    Args:
        attempt: Current attempt number (0-indexed)
        config: Retry configuration
        
    Returns:
        Delay in seconds
    """
    # Exponential backoff: delay = initial_delay * (base ^ attempt)
    delay = config.initial_delay * (config.exponential_base ** attempt)
    
    # Cap at max_delay
    delay = min(delay, config.max_delay)
    
    # Add jitter to prevent thundering herd
    if config.jitter:
        jitter_amount = delay * 0.1  # 10% jitter
        delay += random.uniform(-jitter_amount, jitter_amount)
        delay = max(0, delay)  # Ensure non-negative
    
    return delay


def retry_with_backoff(config: Optional[RetryConfig] = None):
    """
    Decorator to retry a function with exponential backoff.
    
    Args:
        config: Retry configuration (uses defaults if not provided)
        
    Example:
        @retry_with_backoff(RetryConfig(max_attempts=5))
        def call_external_api():
            return requests.get("https://api.example.com")
    """
    if config is None:
        config = RetryConfig()
    
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        def wrapper(*args, **kwargs) -> T:
            last_exception = None
            
            for attempt in range(config.max_attempts):
                try:
                    return func(*args, **kwargs)
                except tuple(config.retryable_exceptions) as e:
                    last_exception = e
                    
                    # Don't retry on last attempt
                    if attempt == config.max_attempts - 1:
                        logger.error(
                            f"Retry exhausted for {func.__name__} after {config.max_attempts} attempts",
                            extra={"exception": str(e), "attempt": attempt + 1}
                        )
                        raise
                    
                    # Calculate backoff delay
                    delay = calculate_backoff(attempt, config)
                    
                    logger.warning(
                        f"Retry attempt {attempt + 1}/{config.max_attempts} for {func.__name__} "
                        f"after {delay:.2f}s delay",
                        extra={"exception": str(e), "attempt": attempt + 1, "delay": delay}
                    )
                    
                    time.sleep(delay)
            
            # Should never reach here, but just in case
            if last_exception:
                raise last_exception
            
            raise RuntimeError(f"Retry failed for {func.__name__} without exception")
        
        return wrapper
    return decorator


# Convenience function for async operations
def retry_async_with_backoff(config: Optional[RetryConfig] = None):
    """
    Decorator to retry an async function with exponential backoff.
    
    Args:
        config: Retry configuration (uses defaults if not provided)
    """
    if config is None:
        config = RetryConfig()
    
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> T:
            last_exception = None
            
            for attempt in range(config.max_attempts):
                try:
                    return await func(*args, **kwargs)
                except tuple(config.retryable_exceptions) as e:
                    last_exception = e
                    
                    if attempt == config.max_attempts - 1:
                        logger.error(
                            f"Async retry exhausted for {func.__name__} after {config.max_attempts} attempts",
                            extra={"exception": str(e), "attempt": attempt + 1}
                        )
                        raise
                    
                    delay = calculate_backoff(attempt, config)
                    
                    logger.warning(
                        f"Async retry attempt {attempt + 1}/{config.max_attempts} for {func.__name__} "
                        f"after {delay:.2f}s delay",
                        extra={"exception": str(e), "attempt": attempt + 1, "delay": delay}
                    )
                    
                    await asyncio.sleep(delay)
            
            if last_exception:
                raise last_exception
            
            raise RuntimeError(f"Async retry failed for {func.__name__} without exception")
        
        return wrapper
    return decorator


# Import asyncio for async retry
import asyncio

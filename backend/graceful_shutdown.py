"""
Graceful shutdown handling for FastAPI application.

Ensures clean shutdown of:
- Database connections
- Background tasks
- Cache connections
- WebSocket connections
"""

import signal
import sys
import asyncio
import logging
from typing import Callable, List
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)

# Global shutdown handlers
_shutdown_handlers: List[Callable[[], None]] = []
_async_shutdown_handlers: List[Callable[[], None]] = []


def register_shutdown_handler(handler: Callable[[], None]) -> None:
    """Register a synchronous shutdown handler."""
    _shutdown_handlers.append(handler)


def register_async_shutdown_handler(handler: Callable[[], None]) -> None:
    """Register an asynchronous shutdown handler."""
    _async_shutdown_handlers.append(handler)


async def shutdown_application() -> None:
    """Execute all registered shutdown handlers."""
    logger.info("Starting graceful shutdown...")
    
    # Execute async handlers first
    for handler in _async_shutdown_handlers:
        try:
            if asyncio.iscoroutinefunction(handler):
                await handler()
            else:
                handler()
        except Exception as e:
            logger.error(f"Error in async shutdown handler: {e}")
    
    # Execute sync handlers
    for handler in _shutdown_handlers:
        try:
            handler()
        except Exception as e:
            logger.error(f"Error in shutdown handler: {e}")
    
    logger.info("Graceful shutdown complete")


def setup_signal_handlers() -> None:
    """Setup signal handlers for graceful shutdown."""
    def signal_handler(signum, frame):
        """Handle shutdown signals."""
        signal_name = signal.Signals(signum).name
        logger.info(f"Received {signal_name}, initiating graceful shutdown...")
        
        # Run shutdown handlers
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # Schedule shutdown in running loop
                asyncio.create_task(shutdown_application())
            else:
                # Run shutdown directly
                loop.run_until_complete(shutdown_application())
        except Exception as e:
            logger.error(f"Error during shutdown: {e}")
            sys.exit(1)
    
    # Register handlers for common shutdown signals
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)


@asynccontextmanager
async def lifespan(app):
    """
    Lifespan context manager for FastAPI application.
    
    Handles startup and shutdown logic.
    """
    # Startup
    logger.info("Application starting up...")
    
    # Register shutdown handlers
    from backend.database import engine, SessionLocal
    from backend.cache import redis_client
    
    async def close_database():
        """Close database connections."""
        logger.info("Closing database connections...")
        try:
            engine.dispose()
            logger.info("Database connections closed")
        except Exception as e:
            logger.error(f"Error closing database: {e}")
    
    async def close_cache():
        """Close cache connections."""
        logger.info("Closing cache connections...")
        try:
            if redis_client:
                await redis_client.aclose() if hasattr(redis_client, 'aclose') else redis_client.close()
                logger.info("Cache connections closed")
        except Exception as e:
            logger.error(f"Error closing cache: {e}")
    
    register_async_shutdown_handler(close_database)
    register_async_shutdown_handler(close_cache)
    
    # Setup signal handlers
    setup_signal_handlers()
    
    logger.info("Application startup complete")
    
    yield
    
    # Shutdown
    logger.info("Application shutting down...")
    await shutdown_application()
    logger.info("Application shutdown complete")

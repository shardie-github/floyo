"""Monitoring and observability endpoints for Phase 4."""

import time
import psutil
import os
from datetime import datetime
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from database.models import Event, Pattern, Suggestion, User, WorkflowExecution
from backend.database import get_db, get_pool_status
from backend.cache import redis_client
from backend.logging_config import get_logger
from backend.rate_limit import limiter
from backend.main import get_current_user
from database.models import User as UserModel

logger = get_logger(__name__)
router = APIRouter(prefix="/api/monitoring", tags=["monitoring"])


@router.get("/metrics")
@limiter.limit("10/minute")  # Rate limit monitoring endpoints
async def get_metrics(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get application metrics for monitoring."""
    metrics = {
        "timestamp": datetime.utcnow().isoformat(),
        "system": {},
        "application": {},
        "database": {},
        "cache": {},
    }
    
    # System metrics
    try:
        process = psutil.Process(os.getpid())
        metrics["system"] = {
            "cpu_percent": process.cpu_percent(interval=0.1),
            "memory_mb": process.memory_info().rss / 1024 / 1024,
            "memory_percent": process.memory_percent(),
            "num_threads": process.num_threads(),
            "open_files": len(process.open_files()),
        }
    except Exception as e:
        logger.warning(f"Failed to get system metrics: {e}")
        metrics["system"] = {"error": str(e)}
    
    # Application metrics
    try:
        # Count active users (logged in within last hour)
        from datetime import timedelta
        cutoff = datetime.utcnow() - timedelta(hours=1)
        active_users = db.query(func.count(User.id)).filter(
            User.last_login_at >= cutoff
        ).scalar() or 0
        
        total_events = db.query(func.count(Event.id)).scalar() or 0
        total_patterns = db.query(func.count(Pattern.id)).scalar() or 0
        total_suggestions = db.query(func.count(Suggestion.id)).scalar() or 0
        
        metrics["application"] = {
            "active_users": active_users,
            "total_events": total_events,
            "total_patterns": total_patterns,
            "total_suggestions": total_suggestions,
        }
    except Exception as e:
        logger.warning(f"Failed to get application metrics: {e}")
        metrics["application"] = {"error": str(e)}
    
    # Database metrics
    try:
        pool_status = get_pool_status()
        metrics["database"] = {
            "pool_size": pool_status.get("size", 0),
            "pool_checked_out": pool_status.get("checked_out", 0),
            "pool_overflow": pool_status.get("overflow", 0),
            "pool_utilization": (
                pool_status.get("checked_out", 0) / pool_status.get("size", 1)
                if pool_status.get("size", 0) > 0
                else 0
            ),
        }
    except Exception as e:
        logger.warning(f"Failed to get database metrics: {e}")
        metrics["database"] = {"error": str(e)}
    
    # Cache metrics
    try:
        if redis_client:
            info = redis_client.info()
            metrics["cache"] = {
                "status": "connected",
                "used_memory_mb": info.get("used_memory", 0) / 1024 / 1024,
                "connected_clients": info.get("connected_clients", 0),
                "total_commands_processed": info.get("total_commands_processed", 0),
            }
        else:
            metrics["cache"] = {"status": "not_configured"}
    except Exception as e:
        logger.warning(f"Failed to get cache metrics: {e}")
        metrics["cache"] = {"status": "error", "error": str(e)}
    
    return metrics


@router.get("/health/detailed")
@limiter.limit("10/minute")
async def detailed_health_check(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Detailed health check with component status."""
    health = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "components": {},
    }
    
    overall_healthy = True
    
    # Database health
    try:
        db.execute(text("SELECT 1"))
        health["components"]["database"] = {
            "status": "healthy",
            "response_time_ms": 0,  # Could measure actual query time
        }
    except Exception as e:
        health["components"]["database"] = {
            "status": "unhealthy",
            "error": str(e),
        }
        overall_healthy = False
    
    # Redis health
    try:
        if redis_client:
            start = time.time()
            redis_client.ping()
            response_time = (time.time() - start) * 1000
            health["components"]["redis"] = {
                "status": "healthy",
                "response_time_ms": round(response_time, 2),
            }
        else:
            health["components"]["redis"] = {
                "status": "not_configured",
                "message": "Redis is optional",
            }
    except Exception as e:
        health["components"]["redis"] = {
            "status": "unhealthy",
            "error": str(e),
        }
        # Redis is optional, so don't mark overall as unhealthy
    
    # Connection pool health
    try:
        pool_status = get_pool_status()
        utilization = (
            pool_status.get("checked_out", 0) / pool_status.get("size", 1)
            if pool_status.get("size", 0) > 0
            else 0
        )
        
        health["components"]["connection_pool"] = {
            "status": "healthy" if utilization < 0.9 else "warning",
            "utilization": round(utilization, 2),
            "size": pool_status.get("size", 0),
            "checked_out": pool_status.get("checked_out", 0),
        }
        
        if utilization >= 0.95:
            overall_healthy = False
    except Exception as e:
        health["components"]["connection_pool"] = {
            "status": "error",
            "error": str(e),
        }
    
    health["status"] = "healthy" if overall_healthy else "degraded"
    
    return health


@router.get("/performance")
@limiter.limit("10/minute")
async def get_performance_metrics(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get performance metrics."""
    metrics = {
        "timestamp": datetime.utcnow().isoformat(),
        "performance": {},
    }
    
    # Database query performance (sample)
    try:
        start = time.time()
        db.execute(text("SELECT COUNT(*) FROM events"))
        query_time = (time.time() - start) * 1000
        
        metrics["performance"]["database_query_time_ms"] = round(query_time, 2)
    except Exception as e:
        logger.warning(f"Failed to measure database performance: {e}")
    
    # Cache performance (if Redis available)
    try:
        if redis_client:
            start = time.time()
            redis_client.ping()
            cache_time = (time.time() - start) * 1000
            metrics["performance"]["cache_response_time_ms"] = round(cache_time, 2)
    except Exception as e:
        logger.warning(f"Failed to measure cache performance: {e}")
    
    return metrics

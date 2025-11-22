"""Database query optimization utilities."""

import sys
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from sqlalchemy.dialects import postgresql

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.logging_config import setup_logging, get_logger
from backend.cache import get, set, cached
from database.models import Event, Pattern, User, AuditLog

setup_logging()
logger = get_logger(__name__)


def optimize_dashboard_queries(db: Session) -> Dict[str, Any]:
    """
    Analyze and optimize dashboard queries.
    
    Returns:
        Dictionary with optimization recommendations
    """
    recommendations = []
    
    try:
        # Check for missing indexes
        missing_indexes = _check_missing_indexes(db)
        if missing_indexes:
            recommendations.extend(missing_indexes)
        
        # Check for slow queries
        slow_queries = _analyze_slow_queries(db)
        if slow_queries:
            recommendations.extend(slow_queries)
        
        # Check for N+1 query patterns
        n_plus_one = _detect_n_plus_one_queries(db)
        if n_plus_one:
            recommendations.extend(n_plus_one)
        
        return {
            "recommendations": recommendations,
            "count": len(recommendations),
            "analyzed_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error optimizing queries: {e}", exc_info=True)
        return {
            "recommendations": [],
            "error": str(e),
            "analyzed_at": datetime.utcnow().isoformat()
        }


def _check_missing_indexes(db: Session) -> List[Dict[str, Any]]:
    """Check for missing indexes on frequently queried columns."""
    recommendations = []
    
    # Check audit_logs indexes
    try:
        result = db.execute(text("""
            SELECT COUNT(*) 
            FROM pg_indexes 
            WHERE tablename = 'audit_logs' 
            AND indexname LIKE '%user_id%created_at%'
        """))
        if result.scalar() == 0:
            recommendations.append({
                "type": "missing_index",
                "table": "audit_logs",
                "columns": ["user_id", "created_at"],
                "recommendation": "CREATE INDEX idx_audit_logs_user_created ON audit_logs(user_id, created_at)",
                "priority": "high"
            })
    except Exception as e:
        logger.warning(f"Could not check indexes: {e}")
    
    return recommendations


def _analyze_slow_queries(db: Session) -> List[Dict[str, Any]]:
    """Analyze slow queries (requires pg_stat_statements extension)."""
    recommendations = []
    
    try:
        # Check if pg_stat_statements is available
        result = db.execute(text("""
            SELECT EXISTS(
                SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
            )
        """))
        
        if result.scalar():
            # Get slow queries
            slow_queries = db.execute(text("""
                SELECT 
                    query,
                    calls,
                    total_exec_time,
                    mean_exec_time
                FROM pg_stat_statements
                WHERE mean_exec_time > 100  -- Queries taking >100ms on average
                ORDER BY mean_exec_time DESC
                LIMIT 10
            """))
            
            for row in slow_queries:
                recommendations.append({
                    "type": "slow_query",
                    "query": row[0][:200],  # Truncate for readability
                    "calls": row[1],
                    "mean_time_ms": round(row[3], 2),
                    "recommendation": "Consider adding indexes or optimizing query",
                    "priority": "medium"
                })
    except Exception as e:
        logger.debug(f"Could not analyze slow queries: {e}")
    
    return recommendations


def _detect_n_plus_one_queries(db: Session) -> List[Dict[str, Any]]:
    """Detect potential N+1 query patterns."""
    recommendations = []
    
    # This would require query logging to detect
    # For now, return empty list
    # In production, you'd analyze query logs
    
    return recommendations


@cached(ttl=300, key_prefix="dashboard_stats")
def get_optimized_dashboard_stats(
    db: Session,
    user_id: str,
    days_back: int = 30
) -> Dict[str, Any]:
    """
    Get optimized dashboard stats with caching.
    
    Uses caching to avoid repeated database queries.
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days_back)
    
    # Use single query with joins instead of multiple queries
    stats = db.query(
        func.count(Event.id).label('event_count'),
        func.count(func.distinct(Pattern.id)).label('pattern_count'),
        func.count(func.distinct(Event.tool)).label('unique_tools'),
    ).filter(
        Event.user_id == user_id,
        Event.created_at >= cutoff_date
    ).first()
    
    return {
        "event_count": stats.event_count or 0,
        "pattern_count": stats.pattern_count or 0,
        "unique_tools": stats.unique_tools or 0,
        "period_days": days_back,
    }

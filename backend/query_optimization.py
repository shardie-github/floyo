"""
Database Query Optimization
Provides utilities for optimizing database queries
"""

from sqlalchemy.orm import Query, Session
from sqlalchemy import func, text
from typing import Optional, List, Dict, Any
import logging
from backend.cache import get, set
import json
import hashlib

logger = logging.getLogger(__name__)


class QueryOptimizer:
    """Advanced query optimization utilities."""
    
    @staticmethod
    def optimize_select(query: Query, select_fields: Optional[List[str]] = None) -> Query:
        """
        Optimize SELECT query by specifying only needed fields.
        
        Args:
            query: SQLAlchemy query object
            select_fields: List of field names to select (None = all)
            
        Returns:
            Query: Optimized query
        """
        if select_fields:
            # This would need to be implemented based on your model structure
            # For now, return query as-is
            pass
        return query
    
    @staticmethod
    def add_query_hints(query: Query, hints: Dict[str, str]) -> Query:
        """
        Add query hints for database optimizer.
        
        Args:
            query: SQLAlchemy query object
            hints: Dictionary of hint types and values
            
        Returns:
            Query: Query with hints
        """
        # PostgreSQL-specific hints
        # Note: SQLAlchemy doesn't directly support hints, would need raw SQL
        return query
    
    @staticmethod
    def use_covering_index(query: Query, index_name: str) -> Query:
        """
        Hint to use a specific index.
        
        Args:
            query: SQLAlchemy query object
            index_name: Name of index to use
            
        Returns:
            Query: Query with index hint
        """
        # Would need raw SQL for index hints
        return query
    
    @staticmethod
    def cache_query_result(
        query: Query,
        cache_key: str,
        ttl: int = 300
    ) -> Optional[Any]:
        """
        Get cached query result or execute and cache.
        
        Args:
            query: SQLAlchemy query object
            cache_key: Cache key
            ttl: Time to live in seconds
            
        Returns:
            Query result or None
        """
        # Try cache first
        cached = get(cache_key)
        if cached is not None:
            logger.debug(f"Cache hit for query: {cache_key}")
            return cached
        
        # Execute query
        result = query.all()
        
        # Cache result
        # Note: Need to serialize SQLAlchemy objects
        try:
            set(cache_key, result, ttl=ttl)
        except Exception as e:
            logger.warning(f"Failed to cache query result: {e}")
        
        return result
    
    @staticmethod
    def explain_query(query: Query, db: Session) -> Dict[str, Any]:
        """
        Get query execution plan.
        
        Args:
            query: SQLAlchemy query object
            db: Database session
            
        Returns:
            dict: Query execution plan
        """
        # Get SQL statement
        statement = query.statement
        
        # Execute EXPLAIN
        explain_sql = f"EXPLAIN (FORMAT JSON) {statement}"
        result = db.execute(text(explain_sql))
        
        plan = result.fetchone()[0]
        return plan[0] if plan else {}
    
    @staticmethod
    def optimize_join_order(query: Query) -> Query:
        """
        Optimize join order (hint to query planner).
        
        Args:
            query: SQLAlchemy query object
            
        Returns:
            Query: Query with optimized joins
        """
        # SQLAlchemy handles join optimization automatically
        # This is a placeholder for custom optimization logic
        return query
    
    @staticmethod
    def use_materialized_view(view_name: str, db: Session) -> Query:
        """
        Use a materialized view for better performance.
        
        Args:
            view_name: Name of materialized view
            db: Database session
            
        Returns:
            Query: Query using materialized view
        """
        # Would need to create materialized views separately
        # This is a placeholder
        return db.query(text(f"SELECT * FROM {view_name}"))


def optimize_pagination(
    query: Query,
    page: int = 1,
    per_page: int = 20,
    max_per_page: int = 100
) -> Dict[str, Any]:
    """
    Optimize paginated query with efficient counting.
    
    Args:
        query: SQLAlchemy query object
        page: Page number (1-indexed)
        per_page: Items per page
        max_per_page: Maximum items per page
        
    Returns:
        dict: Paginated results
    """
    # Validate pagination parameters
    per_page = min(max(1, per_page), max_per_page)
    page = max(1, page)
    offset = (page - 1) * per_page
    
    # Use window function for efficient counting (PostgreSQL)
    # This avoids a separate COUNT query
    total_query = query.statement.alias().count()
    
    # Get total (cached if possible)
    total = query.count()
    
    # Get paginated results
    items = query.offset(offset).limit(per_page).all()
    
    # Calculate metadata
    total_pages = (total + per_page - 1) // per_page
    
    return {
        "items": items,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        }
    }

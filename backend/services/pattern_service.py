"""
Pattern Service

Business logic for pattern operations.
Optimized to avoid N+1 queries.
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.logging_config import get_logger
from database.models import Pattern, User

logger = get_logger(__name__)


class PatternService:
    """Service for pattern operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_user_patterns(
        self,
        user_id: str,
        limit: Optional[int] = None,
        offset: int = 0,
    ) -> List[Pattern]:
        """
        Get patterns for a user.
        
        Optimized query with proper ordering.
        
        Args:
            user_id: User ID
            limit: Maximum number of patterns
            offset: Pagination offset
        
        Returns:
            List of patterns
        """
        query = self.db.query(Pattern).filter(Pattern.user_id == user_id)
        query = query.order_by(desc(Pattern.count), desc(Pattern.last_used))
        
        if limit:
            query = query.limit(limit).offset(offset)
        
        return query.all()
    
    def get_pattern_by_extension(
        self,
        user_id: str,
        file_extension: str,
    ) -> Optional[Pattern]:
        """
        Get a specific pattern by file extension.
        
        Args:
            user_id: User ID
            file_extension: File extension
        
        Returns:
            Pattern or None
        """
        return self.db.query(Pattern).filter(
            Pattern.user_id == user_id,
            Pattern.file_extension == file_extension
        ).first()
    
    def batch_get_patterns(
        self,
        user_id: str,
        file_extensions: List[str],
    ) -> Dict[str, Pattern]:
        """
        Batch load patterns by file extensions.
        
        Avoids N+1 queries by loading all patterns in one query.
        
        Args:
            user_id: User ID
            file_extensions: List of file extensions
        
        Returns:
            Dict mapping file extension to Pattern
        """
        if not file_extensions:
            return {}
        
        patterns = self.db.query(Pattern).filter(
            Pattern.user_id == user_id,
            Pattern.file_extension.in_(file_extensions)
        ).all()
        
        return {p.file_extension: p for p in patterns}
    
    def get_pattern_count(
        self,
        user_id: str,
    ) -> int:
        """
        Get total pattern count for a user.
        
        Args:
            user_id: User ID
        
        Returns:
            Total count
        """
        return self.db.query(Pattern).filter(Pattern.user_id == user_id).count()
    
    def delete_user_patterns(
        self,
        user_id: str,
    ) -> int:
        """
        Delete all patterns for a user.
        
        Args:
            user_id: User ID
        
        Returns:
            Number of patterns deleted
        """
        count = self.db.query(Pattern).filter(Pattern.user_id == user_id).count()
        self.db.query(Pattern).filter(Pattern.user_id == user_id).delete(synchronize_session=False)
        self.db.commit()
        
        logger.info(f"Deleted {count} patterns for user {user_id}")
        
        return count

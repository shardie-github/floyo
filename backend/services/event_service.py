"""
Event Service

Business logic for event operations.
Separates business logic from API handlers.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc

from backend.logging_config import get_logger
from database.models import Event, User

logger = get_logger(__name__)


class EventService:
    """Service for event operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_event(
        self,
        user_id: str,
        event_type: str,
        file_path: Optional[str] = None,
        tool: Optional[str] = None,
        operation: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> Event:
        """
        Create a new event.
        
        Args:
            user_id: User ID
            event_type: Type of event
            file_path: File path (optional)
            tool: Tool used (optional)
            operation: Operation type (optional)
            details: Additional details (optional)
        
        Returns:
            Created event
        """
        event = Event(
            user_id=user_id,
            event_type=event_type,
            file_path=file_path or '',
            tool=tool,
            operation=operation or event_type,
            details=details or {},
            timestamp=datetime.utcnow()
        )
        
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        
        logger.info(f"Event created: id={event.id}, user_id={user_id}, type={event_type}")
        
        return event
    
    def get_user_events(
        self,
        user_id: str,
        limit: int = 50,
        offset: int = 0,
        event_type: Optional[str] = None,
    ) -> List[Event]:
        """
        Get events for a user.
        
        Args:
            user_id: User ID
            limit: Maximum number of events
            offset: Pagination offset
            event_type: Filter by event type (optional)
        
        Returns:
            List of events
        """
        query = self.db.query(Event).filter(Event.user_id == user_id)
        
        if event_type:
            query = query.filter(Event.event_type == event_type)
        
        events = query.order_by(desc(Event.timestamp)).limit(limit).offset(offset).all()
        
        return events
    
    def get_event_count(
        self,
        user_id: str,
        event_type: Optional[str] = None,
    ) -> int:
        """
        Get total event count for a user.
        
        Args:
            user_id: User ID
            event_type: Filter by event type (optional)
        
        Returns:
            Total count
        """
        query = self.db.query(Event).filter(Event.user_id == user_id)
        
        if event_type:
            query = query.filter(Event.event_type == event_type)
        
        return query.count()
    
    def delete_user_events(
        self,
        user_id: str,
        event_type: Optional[str] = None,
    ) -> int:
        """
        Delete events for a user.
        
        Args:
            user_id: User ID
            event_type: Filter by event type (optional)
        
        Returns:
            Number of events deleted
        """
        query = self.db.query(Event).filter(Event.user_id == user_id)
        
        if event_type:
            query = query.filter(Event.event_type == event_type)
        
        count = query.count()
        query.delete(synchronize_session=False)
        self.db.commit()
        
        logger.info(f"Deleted {count} events for user {user_id}")
        
        return count

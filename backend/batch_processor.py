"""Batch processing for file events."""

from typing import List, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from database.models import Event, User

def process_event_batch(
    db: Session,
    user_id: str,
    events: List[Dict[str, Any]]
) -> List[Event]:
    """
    Process a batch of events.
    
    Args:
        db: Database session
        user_id: User ID
        events: List of event dictionaries
        
    Returns:
        List of created Event objects
    """
    created_events = []
    
    for event_data in events:
        db_event = Event(
            user_id=user_id,
            event_type=event_data.get("event_type", "unknown"),
            file_path=event_data.get("file_path"),
            tool=event_data.get("tool"),
            operation=event_data.get("operation"),
            details=event_data.get("details"),
            timestamp=event_data.get("timestamp", datetime.utcnow())
        )
        db.add(db_event)
        created_events.append(db_event)
    
    db.commit()
    
    # Refresh all events
    for event in created_events:
        db.refresh(event)
    
    return created_events

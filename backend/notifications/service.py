"""Core notification service."""

from typing import Dict, Any, Optional, List
from datetime import datetime
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import Column, String, Boolean, TIMESTAMP, ForeignKey, JSON, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database.models import User
from backend.logging_config import get_logger

logger = get_logger(__name__)

Base = declarative_base()


class Notification(Base):
    """Notification model."""
    __tablename__ = "notifications"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=lambda: __import__('uuid').uuid4())
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    notification_type = Column(String(50), nullable=False)  # info, success, warning, error
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    data = Column(JSONB, nullable=True)
    read = Column(Boolean, default=False, index=True)
    action_url = Column(String(500), nullable=True)
    action_label = Column(String(100), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), index=True)
    read_at = Column(TIMESTAMP(timezone=True), nullable=True)
    
    user = relationship("User")


class NotificationService:
    """Service for managing notifications."""
    
    def __init__(self, db: Session):
        """Initialize notification service.
        
        Args:
            db: Database session
        """
        self.db = db
    
    def create_notification(
        self,
        user_id: UUID,
        notification_type: str,
        title: str,
        message: str,
        data: Optional[Dict[str, Any]] = None,
        action_url: Optional[str] = None,
        action_label: Optional[str] = None
    ) -> Notification:
        """Create a new notification.
        
        Args:
            user_id: User ID
            notification_type: Type of notification (info, success, warning, error)
            title: Notification title
            message: Notification message
            data: Additional data
            action_url: Optional action URL
            action_label: Optional action label
            
        Returns:
            Created notification
        """
        try:
            notification = Notification(
                user_id=user_id,
                notification_type=notification_type,
                title=title,
                message=message,
                data=data,
                action_url=action_url,
                action_label=action_label
            )
            
            self.db.add(notification)
            self.db.commit()
            self.db.refresh(notification)
            
            logger.info(f"Created notification {notification.id} for user {user_id}")
            
            return notification
            
        except Exception as e:
            logger.error(f"Error creating notification: {e}")
            self.db.rollback()
            raise
    
    def get_user_notifications(
        self,
        user_id: UUID,
        unread_only: bool = False,
        limit: int = 50,
        offset: int = 0
    ) -> List[Notification]:
        """Get user notifications.
        
        Args:
            user_id: User ID
            unread_only: Only return unread notifications
            limit: Maximum number of notifications
            offset: Offset for pagination
            
        Returns:
            List of notifications
        """
        query = self.db.query(Notification).filter(Notification.user_id == user_id)
        
        if unread_only:
            query = query.filter(Notification.read == False)
        
        return query.order_by(Notification.created_at.desc()).offset(offset).limit(limit).all()
    
    def mark_as_read(self, notification_id: UUID, user_id: UUID) -> bool:
        """Mark notification as read.
        
        Args:
            notification_id: Notification ID
            user_id: User ID (for verification)
            
        Returns:
            True if successful
        """
        try:
            notification = self.db.query(Notification).filter(
                Notification.id == notification_id,
                Notification.user_id == user_id
            ).first()
            
            if notification:
                notification.read = True
                notification.read_at = datetime.utcnow()
                self.db.commit()
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error marking notification as read: {e}")
            self.db.rollback()
            return False
    
    def mark_all_as_read(self, user_id: UUID) -> int:
        """Mark all notifications as read for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            Number of notifications marked as read
        """
        try:
            count = self.db.query(Notification).filter(
                Notification.user_id == user_id,
                Notification.read == False
            ).update({
                "read": True,
                "read_at": datetime.utcnow()
            })
            
            self.db.commit()
            return count
            
        except Exception as e:
            logger.error(f"Error marking all notifications as read: {e}")
            self.db.rollback()
            return 0
    
    def get_unread_count(self, user_id: UUID) -> int:
        """Get unread notification count.
        
        Args:
            user_id: User ID
            
        Returns:
            Number of unread notifications
        """
        return self.db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.read == False
        ).count()
    
    def delete_notification(self, notification_id: UUID, user_id: UUID) -> bool:
        """Delete a notification.
        
        Args:
            notification_id: Notification ID
            user_id: User ID (for verification)
            
        Returns:
            True if successful
        """
        try:
            notification = self.db.query(Notification).filter(
                Notification.id == notification_id,
                Notification.user_id == user_id
            ).first()
            
            if notification:
                self.db.delete(notification)
                self.db.commit()
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error deleting notification: {e}")
            self.db.rollback()
            return False

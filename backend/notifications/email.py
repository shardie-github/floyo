"""Email notification service."""

from typing import Dict, Any, Optional
from uuid import UUID
from sqlalchemy.orm import Session

from backend.notifications.service import NotificationService
from backend.email_service import email_service
from database.models import User
from backend.logging_config import get_logger

logger = get_logger(__name__)


class EmailNotificationService:
    """Service for sending email notifications."""
    
    def __init__(self, db: Session):
        """Initialize email notification service.
        
        Args:
            db: Database session
        """
        self.db = db
        self.notification_service = NotificationService(db)
    
    def send_notification_email(
        self,
        user_id: UUID,
        notification_type: str,
        title: str,
        message: str,
        data: Optional[Dict[str, Any]] = None,
        action_url: Optional[str] = None
    ) -> bool:
        """Send email notification.
        
        Args:
            user_id: User ID
            notification_type: Type of notification
            title: Email subject
            message: Email body
            data: Additional data
            action_url: Optional action URL
            
        Returns:
            True if email sent successfully
        """
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user or not user.email:
                logger.warning(f"User {user_id} not found or has no email")
                return False
            
            # Create in-app notification first
            notification = self.notification_service.create_notification(
                user_id=user_id,
                notification_type=notification_type,
                title=title,
                message=message,
                data=data,
                action_url=action_url
            )
            
            # Send email
            html_body = self._generate_email_html(title, message, action_url)
            
            email_service.send_email(
                to_email=user.email,
                subject=title,
                html_content=html_body
            )
            
            logger.info(f"Sent email notification to {user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending email notification: {e}")
            return False
    
    def _generate_email_html(self, title: str, message: str, action_url: Optional[str] = None) -> str:
        """Generate HTML email content.
        
        Args:
            title: Email title
            message: Email message
            action_url: Optional action URL
            
        Returns:
            HTML email content
        """
        action_button = ""
        if action_url:
            action_button = f'''
            <div style="margin: 20px 0; text-align: center;">
                <a href="{action_url}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Take Action
                </a>
            </div>
            '''
        
        return f'''
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 30px; margin: 20px 0;">
                <h1 style="color: #1f2937; margin-top: 0;">{title}</h1>
                <p style="color: #4b5563;">{message}</p>
                {action_button}
            </div>
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
                This is an automated notification from Floyo.
            </p>
        </body>
        </html>
        '''
    
    def send_workflow_completion_email(self, user_id: UUID, workflow_name: str, status: str, execution_id: str):
        """Send workflow completion email.
        
        Args:
            user_id: User ID
            workflow_name: Workflow name
            status: Execution status (completed, failed)
            execution_id: Execution ID
        """
        title = f"Workflow '{workflow_name}' {status}"
        message = f"Your workflow '{workflow_name}' has {status}."
        
        if status == "completed":
            message += " Check the results in your dashboard."
        else:
            message += " Please review the error details."
        
        action_url = f"/workflows/executions/{execution_id}"
        
        self.send_notification_email(
            user_id=user_id,
            notification_type="success" if status == "completed" else "error",
            title=title,
            message=message,
            action_url=action_url
        )
    
    def send_suggestion_email(self, user_id: UUID, suggestion_title: str, suggestion_message: str):
        """Send new suggestion email.
        
        Args:
            user_id: User ID
            suggestion_title: Suggestion title
            suggestion_message: Suggestion message
        """
        self.send_notification_email(
            user_id=user_id,
            notification_type="info",
            title="New Integration Suggestion",
            message=f"{suggestion_title}\n\n{suggestion_message}",
            action_url="/suggestions"
        )

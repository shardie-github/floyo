"""Notification API endpoints."""

from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from uuid import UUID
from pydantic import BaseModel

from backend.database import get_db
from backend.auth.utils import get_current_user
from backend.notifications.service import NotificationService
from backend.notifications.email import EmailNotificationService
from backend.notifications.websocket import websocket_manager
from database.models import User, Notification
from backend.logging_config import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/api/notifications", tags=["notifications"])


class NotificationCreate(BaseModel):
    """Request to create a notification."""
    notification_type: str  # info, success, warning, error
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None
    action_url: Optional[str] = None
    action_label: Optional[str] = None


@router.get("")
async def get_notifications(
    unread_only: bool = False,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get user notifications."""
    try:
        service = NotificationService(db)
        notifications = service.get_user_notifications(
            user_id=current_user.id,
            unread_only=unread_only,
            limit=limit,
            offset=offset
        )
        
        return {
            "notifications": [
                {
                    "id": str(n.id),
                    "type": n.notification_type,
                    "title": n.title,
                    "message": n.message,
                    "data": n.data,
                    "read": n.read,
                    "action_url": n.action_url,
                    "action_label": n.action_label,
                    "created_at": n.created_at.isoformat() if n.created_at else None,
                }
                for n in notifications
            ],
            "total": len(notifications)
        }
    except Exception as e:
        logger.error(f"Error getting notifications: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, int]:
    """Get unread notification count."""
    try:
        service = NotificationService(db)
        count = service.get_unread_count(current_user.id)
        return {"count": count}
    except Exception as e:
        logger.error(f"Error getting unread count: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def create_notification(
    notification: NotificationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Create a notification (admin/system only)."""
    try:
        service = NotificationService(db)
        created = service.create_notification(
            user_id=current_user.id,
            notification_type=notification.notification_type,
            title=notification.title,
            message=notification.message,
            data=notification.data,
            action_url=notification.action_url,
            action_label=notification.action_label
        )
        
        # Send via WebSocket if user is connected
        await websocket_manager.send_personal_notification(
            current_user.id,
            {
                "type": created.notification_type,
                "title": created.title,
                "message": created.message,
                "id": str(created.id),
            }
        )
        
        return {
            "id": str(created.id),
            "status": "created"
        }
    except Exception as e:
        logger.error(f"Error creating notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{notification_id}/read")
async def mark_as_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Mark notification as read."""
    try:
        service = NotificationService(db)
        success = service.mark_as_read(notification_id, current_user.id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return {"status": "read"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking notification as read: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/read-all")
async def mark_all_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Mark all notifications as read."""
    try:
        service = NotificationService(db)
        count = service.mark_all_as_read(current_user.id)
        return {"count": count, "status": "all_read"}
    except Exception as e:
        logger.error(f"Error marking all as read: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Delete a notification."""
    try:
        service = NotificationService(db)
        success = service.delete_notification(notification_id, current_user.id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return {"status": "deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time notifications."""
    await websocket.accept()
    
    try:
        # Get user from query params (in production, use JWT token)
        user_id_str = websocket.query_params.get("user_id")
        if not user_id_str:
            await websocket.close(code=4001, reason="Missing user_id")
            return
        
        user_id = UUID(user_id_str)
        await websocket_manager.connect(websocket, user_id)
        
        # Keep connection alive and handle messages
        while True:
            try:
                data = await websocket.receive_text()
                # Handle ping/pong for keepalive
                if data == "ping":
                    await websocket.send_text("pong")
            except WebSocketDisconnect:
                break
                
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        websocket_manager.disconnect(websocket)

"""WebSocket notification manager."""

from typing import Dict, Set, Any
from fastapi import WebSocket, WebSocketDisconnect
from uuid import UUID
import json
import asyncio

from backend.logging_config import get_logger

logger = get_logger(__name__)


class WebSocketNotificationManager:
    """Manages WebSocket connections for real-time notifications."""
    
    def __init__(self):
        """Initialize WebSocket manager."""
        self.active_connections: Dict[UUID, Set[WebSocket]] = {}
        self.connection_users: Dict[WebSocket, UUID] = {}
    
    async def connect(self, websocket: WebSocket, user_id: UUID):
        """Connect a WebSocket for a user.
        
        Args:
            websocket: WebSocket connection
            user_id: User ID
        """
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        
        self.active_connections[user_id].add(websocket)
        self.connection_users[websocket] = user_id
        
        logger.info(f"WebSocket connected for user {user_id}")
    
    def disconnect(self, websocket: WebSocket):
        """Disconnect a WebSocket.
        
        Args:
            websocket: WebSocket connection
        """
        user_id = self.connection_users.get(websocket)
        if user_id:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
            del self.connection_users[websocket]
            
            logger.info(f"WebSocket disconnected for user {user_id}")
    
    async def send_personal_notification(self, user_id: UUID, notification: Dict[str, Any]):
        """Send notification to a specific user.
        
        Args:
            user_id: User ID
            notification: Notification data
        """
        if user_id not in self.active_connections:
            return
        
        message = json.dumps(notification)
        disconnected = set()
        
        for websocket in self.active_connections[user_id]:
            try:
                await websocket.send_text(message)
            except Exception as e:
                logger.warning(f"Error sending notification to user {user_id}: {e}")
                disconnected.add(websocket)
        
        # Remove disconnected websockets
        for ws in disconnected:
            self.disconnect(ws)
    
    async def broadcast_notification(self, notification: Dict[str, Any], user_ids: Set[UUID] = None):
        """Broadcast notification to multiple users.
        
        Args:
            notification: Notification data
            user_ids: Optional set of user IDs (None = all users)
        """
        if user_ids is None:
            user_ids = set(self.active_connections.keys())
        
        message = json.dumps(notification)
        disconnected = set()
        
        for user_id in user_ids:
            if user_id in self.active_connections:
                for websocket in self.active_connections[user_id]:
                    try:
                        await websocket.send_text(message)
                    except Exception as e:
                        logger.warning(f"Error broadcasting to user {user_id}: {e}")
                        disconnected.add(websocket)
        
        # Remove disconnected websockets
        for ws in disconnected:
            self.disconnect(ws)
    
    def get_connected_users(self) -> Set[UUID]:
        """Get set of currently connected user IDs.
        
        Returns:
            Set of user IDs
        """
        return set(self.active_connections.keys())
    
    def get_connection_count(self, user_id: UUID = None) -> int:
        """Get connection count.
        
        Args:
            user_id: Optional user ID (None = total count)
            
        Returns:
            Connection count
        """
        if user_id:
            return len(self.active_connections.get(user_id, set()))
        return sum(len(conns) for conns in self.active_connections.values())


# Global instance
websocket_manager = WebSocketNotificationManager()

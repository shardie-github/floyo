"""
Zapier Integration
Complete implementation for Zapier webhook and OAuth integration.
"""

import os
import hmac
import hashlib
import json
from typing import Dict, Any, Optional, List
from datetime import datetime
import requests
from backend.logging_config import get_logger

logger = get_logger(__name__)

ZAPIER_CLIENT_ID = os.getenv('ZAPIER_CLIENT_ID')
ZAPIER_CLIENT_SECRET = os.getenv('ZAPIER_CLIENT_SECRET')
ZAPIER_REDIRECT_URI = os.getenv('ZAPIER_REDIRECT_URI', 'https://api.floyo.app/api/integrations/zapier/callback')
ZAPIER_API_BASE = 'https://api.zapier.com/v1'


class ZapierIntegration:
    """Zapier integration handler."""
    
    def __init__(self, db_session=None):
        self.db = db_session
        self.client_id = ZAPIER_CLIENT_ID
        self.client_secret = ZAPIER_CLIENT_SECRET
        self.redirect_uri = ZAPIER_REDIRECT_URI
    
    def get_oauth_url(self, state: str) -> str:
        """Generate OAuth authorization URL."""
        params = {
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'response_type': 'code',
            'state': state,
            'scope': 'read write',
        }
        return f"{ZAPIER_API_BASE}/oauth/authorize?" + "&".join([f"{k}={v}" for k, v in params.items()])
    
    def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for access token."""
        try:
            response = requests.post(
                f"{ZAPIER_API_BASE}/oauth/token",
                data={
                    'client_id': self.client_id,
                    'client_secret': self.client_secret,
                    'code': code,
                    'grant_type': 'authorization_code',
                    'redirect_uri': self.redirect_uri,
                }
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to exchange Zapier code: {e}")
            raise
    
    def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token."""
        try:
            response = requests.post(
                f"{ZAPIER_API_BASE}/oauth/token",
                data={
                    'client_id': self.client_id,
                    'client_secret': self.client_secret,
                    'refresh_token': refresh_token,
                    'grant_type': 'refresh_token',
                }
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to refresh Zapier token: {e}")
            raise
    
    def create_webhook(self, access_token: str, webhook_url: str, event_type: str) -> Dict[str, Any]:
        """Create a Zapier webhook."""
        try:
            response = requests.post(
                f"{ZAPIER_API_BASE}/webhooks",
                headers={'Authorization': f'Bearer {access_token}'},
                json={
                    'url': webhook_url,
                    'event_type': event_type,
                }
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to create Zapier webhook: {e}")
            raise
    
    def trigger_webhook(self, webhook_url: str, data: Dict[str, Any]) -> bool:
        """Trigger a Zapier webhook with data."""
        try:
            response = requests.post(
                webhook_url,
                json=data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            response.raise_for_status()
            return True
        except Exception as e:
            logger.error(f"Failed to trigger Zapier webhook: {e}")
            return False
    
    def verify_webhook_signature(self, payload: str, signature: str, secret: str) -> bool:
        """Verify Zapier webhook signature."""
        expected_signature = hmac.new(
            secret.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected_signature, signature)
    
    def get_zaps(self, access_token: str) -> List[Dict[str, Any]]:
        """Get user's Zaps."""
        try:
            response = requests.get(
                f"{ZAPIER_API_BASE}/zaps",
                headers={'Authorization': f'Bearer {access_token}'}
            )
            response.raise_for_status()
            return response.json().get('results', [])
        except Exception as e:
            logger.error(f"Failed to get Zapier Zaps: {e}")
            return []

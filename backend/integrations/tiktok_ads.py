"""
TikTok Ads Integration
Complete implementation for TikTok Ads API integration.
"""

import os
import requests
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from backend.logging_config import get_logger

logger = get_logger(__name__)

TIKTOK_ADS_CLIENT_ID = os.getenv('TIKTOK_ADS_CLIENT_ID')
TIKTOK_ADS_CLIENT_SECRET = os.getenv('TIKTOK_ADS_CLIENT_SECRET')
TIKTOK_ADS_REDIRECT_URI = os.getenv('TIKTOK_ADS_REDIRECT_URI', 'https://api.floyo.app/api/integrations/tiktok/callback')
TIKTOK_ADS_API_BASE = 'https://business-api.tiktok.com/open_api/v1.3'


class TikTokAdsIntegration:
    """TikTok Ads integration handler."""
    
    def __init__(self, db_session=None):
        self.db = db_session
        self.client_id = TIKTOK_ADS_CLIENT_ID
        self.client_secret = TIKTOK_ADS_CLIENT_SECRET
        self.redirect_uri = TIKTOK_ADS_REDIRECT_URI
    
    def get_oauth_url(self, state: str) -> str:
        """Generate OAuth authorization URL."""
        params = {
            'client_key': self.client_id,
            'redirect_uri': self.redirect_uri,
            'response_type': 'code',
            'state': state,
            'scope': 'ads.management',
        }
        return f"https://www.tiktok.com/v1/auth/authorize?" + "&".join([f"{k}={v}" for k, v in params.items()])
    
    def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for access token."""
        try:
            response = requests.post(
                'https://www.tiktok.com/v1/oauth/token/',
                data={
                    'client_key': self.client_id,
                    'client_secret': self.client_secret,
                    'code': code,
                    'grant_type': 'authorization_code',
                    'redirect_uri': self.redirect_uri,
                }
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to exchange TikTok code: {e}")
            raise
    
    def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token."""
        try:
            response = requests.post(
                'https://www.tiktok.com/v1/oauth/token/',
                data={
                    'client_key': self.client_id,
                    'client_secret': self.client_secret,
                    'refresh_token': refresh_token,
                    'grant_type': 'refresh_token',
                }
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to refresh TikTok token: {e}")
            raise
    
    def get_advertiser_accounts(self, access_token: str) -> List[Dict[str, Any]]:
        """Get advertiser accounts."""
        try:
            response = requests.get(
                f"{TIKTOK_ADS_API_BASE}/advertiser/info/",
                headers={
                    'Access-Token': access_token,
                    'Content-Type': 'application/json',
                },
                params={'fields': '["advertiser_id","advertiser_name","status"]'}
            )
            response.raise_for_status()
            return response.json().get('data', {}).get('list', [])
        except Exception as e:
            logger.error(f"Failed to get TikTok advertiser accounts: {e}")
            return []
    
    def get_campaigns(self, access_token: str, advertiser_id: str) -> List[Dict[str, Any]]:
        """Get campaigns for an advertiser."""
        try:
            response = requests.get(
                f"{TIKTOK_ADS_API_BASE}/campaign/get/",
                headers={
                    'Access-Token': access_token,
                    'Content-Type': 'application/json',
                },
                params={
                    'advertiser_id': advertiser_id,
                    'fields': '["campaign_id","campaign_name","status","budget","daily_budget"]'
                }
            )
            response.raise_for_status()
            return response.json().get('data', {}).get('list', [])
        except Exception as e:
            logger.error(f"Failed to get TikTok campaigns: {e}")
            return []
    
    def get_ad_insights(self, access_token: str, advertiser_id: str, start_date: str, end_date: str) -> Dict[str, Any]:
        """Get ad insights/analytics."""
        try:
            response = requests.get(
                f"{TIKTOK_ADS_API_BASE}/report/integrated/get/",
                headers={
                    'Access-Token': access_token,
                    'Content-Type': 'application/json',
                },
                params={
                    'advertiser_id': advertiser_id,
                    'start_date': start_date,
                    'end_date': end_date,
                    'metrics': '["spend","impressions","clicks","conversions"]',
                    'dimensions': '["campaign_id","ad_id"]'
                }
            )
            response.raise_for_status()
            return response.json().get('data', {})
        except Exception as e:
            logger.error(f"Failed to get TikTok ad insights: {e}")
            return {}

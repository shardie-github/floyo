"""
Meta (Facebook) Ads Integration
Complete implementation for Meta Ads API integration.
"""

import os
import requests
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from backend.logging_config import get_logger

logger = get_logger(__name__)

META_ADS_APP_ID = os.getenv('META_ADS_APP_ID')
META_ADS_APP_SECRET = os.getenv('META_ADS_APP_SECRET')
META_ADS_REDIRECT_URI = os.getenv('META_ADS_REDIRECT_URI', 'https://api.floyo.app/api/integrations/meta/callback')
META_ADS_API_BASE = 'https://graph.facebook.com/v18.0'


class MetaAdsIntegration:
    """Meta Ads integration handler."""
    
    def __init__(self, db_session=None):
        self.db = db_session
        self.app_id = META_ADS_APP_ID
        self.app_secret = META_ADS_APP_SECRET
        self.redirect_uri = META_ADS_REDIRECT_URI
    
    def get_oauth_url(self, state: str) -> str:
        """Generate OAuth authorization URL."""
        params = {
            'client_id': self.app_id,
            'redirect_uri': self.redirect_uri,
            'response_type': 'code',
            'state': state,
            'scope': 'ads_read,ads_management,business_management',
        }
        return f"https://www.facebook.com/v18.0/dialog/oauth?" + "&".join([f"{k}={v}" for k, v in params.items()])
    
    def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for access token."""
        try:
            response = requests.get(
                f"{META_ADS_API_BASE}/oauth/access_token",
                params={
                    'client_id': self.app_id,
                    'client_secret': self.app_secret,
                    'code': code,
                    'redirect_uri': self.redirect_uri,
                }
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to exchange Meta code: {e}")
            raise
    
    def get_long_lived_token(self, short_lived_token: str) -> Dict[str, Any]:
        """Exchange short-lived token for long-lived token."""
        try:
            response = requests.get(
                f"{META_ADS_API_BASE}/oauth/access_token",
                params={
                    'grant_type': 'fb_exchange_token',
                    'client_id': self.app_id,
                    'client_secret': self.app_secret,
                    'fb_exchange_token': short_lived_token,
                }
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to get long-lived Meta token: {e}")
            raise
    
    def get_ad_accounts(self, access_token: str) -> List[Dict[str, Any]]:
        """Get ad accounts."""
        try:
            response = requests.get(
                f"{META_ADS_API_BASE}/me/adaccounts",
                params={
                    'access_token': access_token,
                    'fields': 'id,name,account_id,account_status,currency',
                }
            )
            response.raise_for_status()
            return response.json().get('data', [])
        except Exception as e:
            logger.error(f"Failed to get Meta ad accounts: {e}")
            return []
    
    def get_campaigns(self, access_token: str, ad_account_id: str) -> List[Dict[str, Any]]:
        """Get campaigns for an ad account."""
        try:
            response = requests.get(
                f"{META_ADS_API_BASE}/{ad_account_id}/campaigns",
                params={
                    'access_token': access_token,
                    'fields': 'id,name,status,objective,daily_budget,lifetime_budget',
                }
            )
            response.raise_for_status()
            return response.json().get('data', [])
        except Exception as e:
            logger.error(f"Failed to get Meta campaigns: {e}")
            return []
    
    def get_ad_insights(self, access_token: str, ad_account_id: str, start_date: str, end_date: str) -> Dict[str, Any]:
        """Get ad insights/analytics."""
        try:
            response = requests.get(
                f"{META_ADS_API_BASE}/{ad_account_id}/insights",
                params={
                    'access_token': access_token,
                    'time_range': json.dumps({
                        'since': start_date,
                        'until': end_date,
                    }),
                    'fields': 'spend,impressions,clicks,actions,conversions',
                    'level': 'campaign',
                }
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to get Meta ad insights: {e}")
            return {}

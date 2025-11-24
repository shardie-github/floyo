"""Marketplace API module."""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from backend.database import get_db
from backend.rate_limit import limiter, RATE_LIMIT_PER_MINUTE
from backend.auth.utils import get_current_user
from database.models import User, UserIntegration

router = APIRouter(prefix="/api/marketplace", tags=["marketplace"])


@router.get("/integrations")
@limiter.limit(f"{RATE_LIMIT_PER_MINUTE}/minute")
async def list_marketplace_integrations(
    request: Request,
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort: str = Query('popular', regex='^(popular|newest|rating)$'),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List integrations available in marketplace."""
    
    # Mock marketplace data - in production, this would come from a database
    integrations = [
        {
            'id': 'zapier',
            'name': 'Zapier',
            'description': 'Automate workflows across 5000+ apps',
            'category': 'automation',
            'icon_url': 'https://cdn.zapier.com/zapier/images/logos/zapier-logo.png',
            'rating': 4.8,
            'review_count': 1250,
            'install_count': 50000,
            'pricing': 'freemium',
            'tags': ['automation', 'workflows', 'productivity'],
        },
        {
            'id': 'tiktok_ads',
            'name': 'TikTok Ads',
            'description': 'Track TikTok advertising campaigns',
            'category': 'advertising',
            'icon_url': 'https://www.tiktok.com/favicon.ico',
            'rating': 4.6,
            'review_count': 320,
            'install_count': 5000,
            'pricing': 'free',
            'tags': ['advertising', 'social-media', 'analytics'],
        },
        {
            'id': 'meta_ads',
            'name': 'Meta Ads',
            'description': 'Track Facebook and Instagram ad campaigns',
            'category': 'advertising',
            'icon_url': 'https://www.facebook.com/favicon.ico',
            'rating': 4.7,
            'review_count': 890,
            'install_count': 15000,
            'pricing': 'free',
            'tags': ['advertising', 'social-media', 'analytics'],
        },
    ]
    
    # Filter by category
    if category:
        integrations = [i for i in integrations if i['category'] == category]
    
    # Search
    if search:
        search_lower = search.lower()
        integrations = [
            i for i in integrations
            if search_lower in i['name'].lower() or search_lower in i['description'].lower()
        ]
    
    # Sort
    if sort == 'rating':
        integrations.sort(key=lambda x: x['rating'], reverse=True)
    elif sort == 'newest':
        # Would use created_at in production
        pass
    else:  # popular
        integrations.sort(key=lambda x: x['install_count'], reverse=True)
    
    return {
        'items': integrations,
        'total': len(integrations),
    }


@router.get("/integrations/{integration_id}")
@limiter.limit(f"{RATE_LIMIT_PER_MINUTE}/minute")
async def get_marketplace_integration(
    request: Request,
    integration_id: str,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get marketplace integration details."""
    
    # Mock data - in production, fetch from database
    integration = {
        'id': integration_id,
        'name': 'Zapier',
        'description': 'Automate workflows across 5000+ apps',
        'category': 'automation',
        'icon_url': 'https://cdn.zapier.com/zapier/images/logos/zapier-logo.png',
        'rating': 4.8,
        'review_count': 1250,
        'install_count': 50000,
        'pricing': 'freemium',
        'tags': ['automation', 'workflows', 'productivity'],
        'features': [
            'Webhook triggers',
            '5000+ app integrations',
            'Custom workflows',
            'Scheduled tasks',
        ],
        'documentation_url': 'https://zapier.com/apps/floyo/integrations',
        'support_url': 'https://zapier.com/help',
    }
    
    return integration


@router.get("/integrations/{integration_id}/reviews")
@limiter.limit(f"{RATE_LIMIT_PER_MINUTE}/minute")
async def get_integration_reviews(
    request: Request,
    integration_id: str,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get reviews for an integration."""
    
    # Mock reviews - in production, fetch from database
    reviews = [
        {
            'id': '1',
            'user_id': 'user-1',
            'user_name': 'John Doe',
            'rating': 5,
            'comment': 'Great integration! Saved me hours of work.',
            'created_at': '2024-01-15T10:00:00Z',
        },
        {
            'id': '2',
            'user_id': 'user-2',
            'user_name': 'Jane Smith',
            'rating': 4,
            'comment': 'Works well, but could use more documentation.',
            'created_at': '2024-01-10T14:30:00Z',
        },
    ]
    
    return {
        'items': reviews[offset:offset+limit],
        'total': len(reviews),
        'has_more': offset + limit < len(reviews),
    }

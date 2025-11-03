"""Pre-built integration connectors."""

from typing import Dict, Any, Optional, List
from uuid import UUID
from sqlalchemy.orm import Session
from datetime import datetime

from database.models import IntegrationConnector, UserIntegration
import json


# Pre-defined connectors
DEFAULT_CONNECTORS = [
    {
        "name": "GitHub",
        "service_type": "github",
        "description": "Integrate with GitHub repositories, issues, and pull requests",
        "config_schema": {
            "type": "object",
            "properties": {
                "access_token": {
                    "type": "string",
                    "description": "GitHub personal access token"
                },
                "repository": {
                    "type": "string",
                    "description": "Repository name (owner/repo)"
                }
            },
            "required": ["access_token"]
        },
        "is_system": True
    },
    {
        "name": "Slack",
        "service_type": "slack",
        "description": "Send notifications and messages to Slack channels",
        "config_schema": {
            "type": "object",
            "properties": {
                "webhook_url": {
                    "type": "string",
                    "description": "Slack webhook URL"
                },
                "channel": {
                    "type": "string",
                    "description": "Channel name (optional)"
                }
            },
            "required": ["webhook_url"]
        },
        "is_system": True
    },
    {
        "name": "Google Drive",
        "service_type": "googledrive",
        "description": "Access and sync files from Google Drive",
        "config_schema": {
            "type": "object",
            "properties": {
                "credentials_json": {
                    "type": "string",
                    "description": "Google service account credentials (JSON)"
                },
                "folder_id": {
                    "type": "string",
                    "description": "Target folder ID (optional)"
                }
            },
            "required": ["credentials_json"]
        },
        "is_system": True
    },
    {
        "name": "Dropbox",
        "service_type": "dropbox",
        "description": "Access and sync files from Dropbox",
        "config_schema": {
            "type": "object",
            "properties": {
                "access_token": {
                    "type": "string",
                    "description": "Dropbox access token"
                },
                "folder_path": {
                    "type": "string",
                    "description": "Target folder path (optional)"
                }
            },
            "required": ["access_token"]
        },
        "is_system": True
    },
    {
        "name": "AWS S3",
        "service_type": "s3",
        "description": "Store and retrieve files from AWS S3",
        "config_schema": {
            "type": "object",
            "properties": {
                "access_key_id": {
                    "type": "string",
                    "description": "AWS access key ID"
                },
                "secret_access_key": {
                    "type": "string",
                    "description": "AWS secret access key"
                },
                "bucket_name": {
                    "type": "string",
                    "description": "S3 bucket name"
                },
                "region": {
                    "type": "string",
                    "description": "AWS region",
                    "default": "us-east-1"
                }
            },
            "required": ["access_key_id", "secret_access_key", "bucket_name"]
        },
        "is_system": True
    },
    {
        "name": "Email (SMTP)",
        "service_type": "email",
        "description": "Send emails via SMTP",
        "config_schema": {
            "type": "object",
            "properties": {
                "smtp_host": {
                    "type": "string",
                    "description": "SMTP server hostname"
                },
                "smtp_port": {
                    "type": "integer",
                    "description": "SMTP server port",
                    "default": 587
                },
                "username": {
                    "type": "string",
                    "description": "SMTP username"
                },
                "password": {
                    "type": "string",
                    "description": "SMTP password"
                },
                "from_email": {
                    "type": "string",
                    "description": "Sender email address"
                }
            },
            "required": ["smtp_host", "username", "password", "from_email"]
        },
        "is_system": True
    }
]


def initialize_connectors(db: Session):
    """Initialize default connectors if they don't exist."""
    for connector_data in DEFAULT_CONNECTORS:
        existing = db.query(IntegrationConnector).filter(
            IntegrationConnector.service_type == connector_data["service_type"]
        ).first()
        
        if not existing:
            connector = IntegrationConnector(
                name=connector_data["name"],
                service_type=connector_data["service_type"],
                description=connector_data["description"],
                config_schema=connector_data["config_schema"],
                is_system=connector_data.get("is_system", False),
                is_active=True
            )
            db.add(connector)
    
    db.commit()


def get_available_connectors(db: Session) -> List[IntegrationConnector]:
    """Get all available connectors."""
    return db.query(IntegrationConnector).filter(
        IntegrationConnector.is_active == True
    ).all()


def create_user_integration(
    db: Session,
    user_id: UUID,
    connector_id: UUID,
    name: str,
    config: Dict[str, Any],
    organization_id: Optional[UUID] = None
) -> UserIntegration:
    """Create a user integration."""
    # TODO: Encrypt sensitive config fields
    
    integration = UserIntegration(
        user_id=user_id,
        organization_id=organization_id,
        connector_id=connector_id,
        name=name,
        config=config,
        is_active=True
    )
    
    db.add(integration)
    db.commit()
    db.refresh(integration)
    
    return integration


def sync_integration(
    db: Session,
    integration_id: UUID
) -> bool:
    """Sync/test an integration connection."""
    integration = db.query(UserIntegration).filter(
        UserIntegration.id == integration_id
    ).first()
    
    if not integration:
        return False
    
    try:
        # TODO: Actually test the connection based on service_type
        # For now, just mark as synced
        integration.last_sync_at = datetime.utcnow()
        integration.last_error = None
        db.commit()
        return True
    except Exception as e:
        integration.last_error = str(e)
        db.commit()
        return False

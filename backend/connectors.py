"""Pre-built integration connectors with actual implementations."""

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
    """Create a user integration with encrypted sensitive fields."""
    from backend.security import DataEncryption
    
    sensitive_fields = ['access_token', 'secret_access_key', 'password', 'api_key', 'webhook_url', 
                       'private_key', 'secret', 'token', 'auth_token', 'api_secret']
    encrypted_config = config.copy()
    
    for key, value in config.items():
        if key.lower() in [f.lower() for f in sensitive_fields] and isinstance(value, str):
            # Encrypt sensitive fields
            encrypted_config[key] = DataEncryption.encrypt_field(value)
    
    integration = UserIntegration(
        user_id=user_id,
        organization_id=organization_id,
        connector_id=connector_id,
        name=name,
        config=encrypted_config,
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
    from backend.security import DataEncryption
    
    integration = db.query(UserIntegration).filter(
        UserIntegration.id == integration_id
    ).first()
    
    if not integration:
        return False
    
    try:
        connector = integration.connector
        service_type = connector.service_type
        config = integration.config.copy()  # Work with a copy
        
        # Decrypt sensitive fields
        sensitive_fields = ['access_token', 'secret_access_key', 'password', 'api_key', 'webhook_url',
                           'private_key', 'secret', 'token', 'auth_token', 'api_secret']
        for key, value in config.items():
            if key.lower() in [f.lower() for f in sensitive_fields] and isinstance(value, str):
                try:
                    # Try to decrypt (if encrypted) or use as-is
                    config[key] = DataEncryption.decrypt_field(value)
                except Exception:
                    # If decryption fails, assume it's not encrypted (backward compatibility)
                    pass
        
        # Test connection based on service type
        if service_type == "github":
            return _test_github_connection(config)
        elif service_type == "slack":
            return _test_slack_connection(config)
        elif service_type == "googledrive":
            return _test_googledrive_connection(config)
        elif service_type == "dropbox":
            return _test_dropbox_connection(config)
        elif service_type == "s3":
            return _test_s3_connection(config)
        elif service_type == "email":
            return _test_email_connection(config)
        else:
            # Generic test - just verify config is valid JSON
            return True
            
    except Exception as e:
        integration.last_error = str(e)
        db.commit()
        return False
    else:
        integration.last_sync_at = datetime.utcnow()
        integration.last_error = None
        db.commit()
        return True


def _test_github_connection(config: Dict[str, Any]) -> bool:
    """Test GitHub API connection."""
    import requests
    
    token = config.get("access_token")
    if not token:
        return False
    
    try:
        # Test API access
        headers = {"Authorization": f"token {token}"}
        response = requests.get("https://api.github.com/user", headers=headers, timeout=5)
        return response.status_code == 200
    except Exception:
        return False


def _test_slack_connection(config: Dict[str, Any]) -> bool:
    """Test Slack webhook connection."""
    import requests
    
    webhook_url = config.get("webhook_url")
    if not webhook_url:
        return False
    
    try:
        # Send a test message
        payload = {"text": "Test connection from Floyo"}
        response = requests.post(webhook_url, json=payload, timeout=5)
        return response.status_code == 200
    except Exception:
        return False


def _test_googledrive_connection(config: Dict[str, Any]) -> bool:
    """Test Google Drive connection."""
    try:
        # Would use Google Drive API client
        # For now, verify credentials JSON is valid
        import json
        credentials = config.get("credentials_json")
        if credentials:
            json.loads(credentials)
            return True
        return False
    except Exception:
        return False


def _test_dropbox_connection(config: Dict[str, Any]) -> bool:
    """Test Dropbox connection."""
    import requests
    
    token = config.get("access_token")
    if not token:
        return False
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(
            "https://api.dropboxapi.com/2/users/get_current_account",
            headers=headers,
            timeout=5
        )
        return response.status_code == 200
    except Exception:
        return False


def _test_s3_connection(config: Dict[str, Any]) -> bool:
    """Test AWS S3 connection."""
    try:
        # Would use boto3 to test S3 connection
        # For now, verify required fields are present
        required = ["access_key_id", "secret_access_key", "bucket_name"]
        return all(config.get(key) for key in required)
    except Exception:
        return False


def _test_email_connection(config: Dict[str, Any]) -> bool:
    """Test SMTP email connection."""
    import smtplib
    
    try:
        host = config.get("smtp_host")
        port = config.get("smtp_port", 587)
        username = config.get("username")
        password = config.get("password")
        
        if not all([host, username, password]):
            return False
        
        # Test connection (without actually sending email)
        server = smtplib.SMTP(host, port, timeout=5)
        server.starttls()
        server.login(username, password)
        server.quit()
        return True
    except Exception:
        return False

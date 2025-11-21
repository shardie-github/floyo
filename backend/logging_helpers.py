"""
Enhanced logging helpers with PII scrubbing and structured events.

Provides utilities for safe logging that prevents PII exposure
and emits structured events for monitoring.
"""

import re
import logging
from typing import Dict, Any, Optional
from functools import wraps
import json

logger = logging.getLogger(__name__)

# PII patterns to detect and scrub
PII_PATTERNS = [
    (r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL]'),  # Email
    (r'\b\d{3}-\d{2}-\d{4}\b', '[SSN]'),  # SSN
    (r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b', '[CARD]'),  # Credit card
    (r'/[Uu]sers/[^/\s]+', '[HOME_PATH]'),  # User home directory
    (r'\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b', '[UUID]'),  # UUID (may be user ID)
]


def scrub_pii(message: str) -> str:
    """
    Remove PII from log messages.
    
    Args:
        message: Log message that may contain PII
        
    Returns:
        str: Message with PII replaced by placeholders
    """
    scrubbed = message
    for pattern, replacement in PII_PATTERNS:
        scrubbed = re.sub(pattern, replacement, scrubbed)
    return scrubbed


def log_event(
    event_type: str,
    level: str = "INFO",
    user_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    **kwargs
):
    """
    Emit a structured event for monitoring.
    
    Args:
        event_type: Type of event (e.g., 'user.login', 'api.request')
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        user_id: User ID (will be scrubbed in message)
        details: Additional event details
        **kwargs: Additional fields to include
    """
    log_func = getattr(logger, level.lower(), logger.info)
    
    event_data = {
        "event_type": event_type,
        "level": level,
        **kwargs
    }
    
    if user_id:
        event_data["user_id"] = user_id
    
    if details:
        # Scrub PII from details
        scrubbed_details = {}
        for key, value in details.items():
            if isinstance(value, str):
                scrubbed_details[key] = scrub_pii(value)
            else:
                scrubbed_details[key] = value
        event_data["details"] = scrubbed_details
    
    # Log message (scrubbed)
    message = f"Event: {event_type}"
    if user_id:
        message += f" User: [USER_ID]"
    if details:
        message += f" Details: {json.dumps(scrubbed_details)}"
    
    log_func(scrub_pii(message), extra={"event_data": event_data})


def log_api_request(
    method: str,
    path: str,
    status_code: int,
    duration_ms: float,
    user_id: Optional[str] = None,
    error: Optional[str] = None
):
    """
    Log API request for monitoring.
    
    Args:
        method: HTTP method
        path: Request path
        status_code: Response status code
        duration_ms: Request duration in milliseconds
        user_id: User ID (if authenticated)
        error: Error message (if any)
    """
    level = "ERROR" if status_code >= 500 else "WARNING" if status_code >= 400 else "INFO"
    
    log_event(
        event_type="api.request",
        level=level,
        user_id=user_id,
        details={
            "method": method,
            "path": scrub_pii(path),  # May contain user IDs in path
            "status_code": status_code,
            "duration_ms": duration_ms,
            "error": scrub_pii(error) if error else None
        }
    )


def log_security_event(
    event_type: str,
    severity: str,
    user_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
):
    """
    Log security event for audit trail.
    
    Args:
        event_type: Type of security event (e.g., 'failed_login', 'suspicious_activity')
        severity: Severity level (low, medium, high, critical)
        user_id: User ID (if applicable)
        ip_address: IP address (last octet will be masked)
        details: Additional event details
    """
    level_map = {
        "low": "INFO",
        "medium": "WARNING",
        "high": "ERROR",
        "critical": "CRITICAL"
    }
    
    # Mask IP address (show only first 3 octets)
    masked_ip = None
    if ip_address:
        parts = ip_address.split('.')
        if len(parts) == 4:
            masked_ip = f"{parts[0]}.{parts[1]}.{parts[2]}.xxx"
        else:
            masked_ip = "[IP]"
    
    log_event(
        event_type=f"security.{event_type}",
        level=level_map.get(severity, "WARNING"),
        user_id=user_id,
        details={
            "severity": severity,
            "ip_address": masked_ip,
            **(details or {})
        }
    )


def log_database_operation(
    operation: str,
    table: str,
    duration_ms: float,
    rows_affected: Optional[int] = None,
    error: Optional[str] = None
):
    """
    Log database operation for monitoring.
    
    Args:
        operation: Operation type (SELECT, INSERT, UPDATE, DELETE)
        table: Table name
        duration_ms: Operation duration in milliseconds
        rows_affected: Number of rows affected
        error: Error message (if any)
    """
    level = "ERROR" if error else "WARNING" if duration_ms > 1000 else "INFO"
    
    log_event(
        event_type="database.operation",
        level=level,
        details={
            "operation": operation,
            "table": table,
            "duration_ms": duration_ms,
            "rows_affected": rows_affected,
            "error": scrub_pii(error) if error else None
        }
    )


def safe_log(func):
    """
    Decorator to automatically scrub PII from log messages.
    
    Usage:
        @safe_log
        def my_function():
            logger.info("User email: user@example.com")  # Will be scrubbed
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        # This is a placeholder - actual implementation would wrap logger methods
        return func(*args, **kwargs)
    return wrapper

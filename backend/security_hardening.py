"""
Advanced Security Hardening Module
Implements comprehensive security measures including:
- Advanced threat detection
- IP blocking and whitelisting
- Request fingerprinting
- Security event logging
- Advanced input validation
"""

import hashlib
import hmac
import time
import ipaddress
from typing import Optional, Dict, List, Set, Tuple
from datetime import datetime, timedelta
from fastapi import Request, HTTPException, status
from sqlalchemy.orm import Session
from database.models import AuditLog, UserSession
import logging
from backend.config import settings
import re
import json

logger = logging.getLogger(__name__)

# IP blocking configuration
BLOCKED_IPS: Set[str] = set()
WHITELISTED_IPS: Set[str] = set()
IP_FAILURE_COUNT: Dict[str, int] = {}
IP_LAST_FAILURE: Dict[str, datetime] = {}

# Security thresholds
MAX_FAILED_REQUESTS_PER_IP = 50  # Block after 50 failed requests
FAILED_REQUEST_WINDOW = timedelta(hours=1)  # Within 1 hour
MAX_REQUESTS_PER_MINUTE = 300  # Per IP
SUSPICIOUS_PATTERN_THRESHOLD = 10  # Flag after 10 suspicious patterns

# Known attack patterns
SQL_INJECTION_PATTERNS = [
    r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)",
    r"(--|#|/\*|\*/)",
    r"(\b(OR|AND)\s+\d+\s*=\s*\d+)",
    r"(\bUNION\b.*\bSELECT\b)",
    r"('|(\\')|(;)|(\\;)|(\|)|(\\|))",
]

XSS_PATTERNS = [
    r"<script[^>]*>.*?</script>",
    r"javascript:",
    r"on\w+\s*=",
    r"<iframe[^>]*>",
    r"<object[^>]*>",
    r"<embed[^>]*>",
]

PATH_TRAVERSAL_PATTERNS = [
    r"\.\./",
    r"\.\.\\",
    r"%2e%2e%2f",
    r"%2e%2e%5c",
]

COMMAND_INJECTION_PATTERNS = [
    r"[;&|`$(){}]",
    r"\b(cat|ls|pwd|whoami|id|uname|ps|netstat)\b",
    r">\s*/",
    r"<\s*/",
]


class IPBlockingMiddleware:
    """Middleware for IP-based blocking and rate limiting."""
    
    @staticmethod
    def get_client_ip(request: Request) -> str:
        """Extract client IP address from request."""
        # Check for forwarded IPs (behind proxy/load balancer)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Take the first IP (original client)
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()
        
        # Fallback to direct connection
        if request.client:
            return request.client.host
        
        return "unknown"
    
    @staticmethod
    def is_ip_blocked(ip: str) -> bool:
        """Check if IP is blocked."""
        if ip in WHITELISTED_IPS:
            return False
        
        if ip in BLOCKED_IPS:
            return True
        
        # Check failure count
        failure_count = IP_FAILURE_COUNT.get(ip, 0)
        if failure_count >= MAX_FAILED_REQUESTS_PER_IP:
            last_failure = IP_LAST_FAILURE.get(ip)
            if last_failure and datetime.utcnow() - last_failure < FAILED_REQUEST_WINDOW:
                BLOCKED_IPS.add(ip)
                logger.warning(f"IP {ip} blocked due to excessive failures: {failure_count}")
                return True
        
        return False
    
    @staticmethod
    def record_failure(ip: str):
        """Record a failed request from an IP."""
        IP_FAILURE_COUNT[ip] = IP_FAILURE_COUNT.get(ip, 0) + 1
        IP_LAST_FAILURE[ip] = datetime.utcnow()
    
    @staticmethod
    def record_success(ip: str):
        """Record a successful request (resets failure count after time)."""
        # Gradually reduce failure count on success
        if ip in IP_FAILURE_COUNT:
            IP_FAILURE_COUNT[ip] = max(0, IP_FAILURE_COUNT[ip] - 1)
    
    @staticmethod
    def unblock_ip(ip: str):
        """Unblock an IP address."""
        BLOCKED_IPS.discard(ip)
        IP_FAILURE_COUNT.pop(ip, None)
        IP_LAST_FAILURE.pop(ip, None)
        logger.info(f"IP {ip} unblocked")


class ThreatDetection:
    """Advanced threat detection and pattern matching."""
    
    @staticmethod
    def detect_sql_injection(content: str) -> bool:
        """Detect SQL injection patterns."""
        content_upper = content.upper()
        for pattern in SQL_INJECTION_PATTERNS:
            if re.search(pattern, content_upper, re.IGNORECASE):
                return True
        return False
    
    @staticmethod
    def detect_xss(content: str) -> bool:
        """Detect XSS patterns."""
        for pattern in XSS_PATTERNS:
            if re.search(pattern, content, re.IGNORECASE):
                return True
        return False
    
    @staticmethod
    def detect_path_traversal(content: str) -> bool:
        """Detect path traversal attempts."""
        for pattern in PATH_TRAVERSAL_PATTERNS:
            if re.search(pattern, content, re.IGNORECASE):
                return True
        return False
    
    @staticmethod
    def detect_command_injection(content: str) -> bool:
        """Detect command injection attempts."""
        for pattern in COMMAND_INJECTION_PATTERNS:
            if re.search(pattern, content, re.IGNORECASE):
                return True
        return False
    
    @staticmethod
    def scan_request(request: Request) -> Dict[str, bool]:
        """Scan request for threats."""
        threats = {
            "sql_injection": False,
            "xss": False,
            "path_traversal": False,
            "command_injection": False,
        }
        
        # Check URL path
        path = request.url.path
        threats["sql_injection"] = ThreatDetection.detect_sql_injection(path)
        threats["xss"] = ThreatDetection.detect_xss(path)
        threats["path_traversal"] = ThreatDetection.detect_path_traversal(path)
        threats["command_injection"] = ThreatDetection.detect_command_injection(path)
        
        # Check query parameters
        for param, value in request.query_params.items():
            if isinstance(value, str):
                threats["sql_injection"] |= ThreatDetection.detect_sql_injection(value)
                threats["xss"] |= ThreatDetection.detect_xss(value)
                threats["path_traversal"] |= ThreatDetection.detect_path_traversal(value)
                threats["command_injection"] |= ThreatDetection.detect_command_injection(value)
        
        return threats
    
    @staticmethod
    def is_threat_detected(threats: Dict[str, bool]) -> bool:
        """Check if any threat was detected."""
        return any(threats.values())


class RequestFingerprinting:
    """Generate request fingerprints for tracking and detection."""
    
    @staticmethod
    def generate_fingerprint(request: Request) -> str:
        """Generate a unique fingerprint for a request."""
        components = [
            IPBlockingMiddleware.get_client_ip(request),
            request.headers.get("User-Agent", ""),
            request.headers.get("Accept-Language", ""),
            request.headers.get("Accept-Encoding", ""),
        ]
        
        fingerprint_string = "|".join(components)
        return hashlib.sha256(fingerprint_string.encode()).hexdigest()


class SecurityAuditor:
    """Enhanced security auditing and logging."""
    
    @staticmethod
    def log_security_event(
        db: Session,
        event_type: str,
        user_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        details: Optional[Dict] = None,
        severity: str = "medium"
    ):
        """Log a security event to audit log."""
        try:
            audit_log = AuditLog(
                user_id=user_id,
                action=event_type,
                resource="security",
                resource_id=None,
                metadata={
                    "ip_address": ip_address,
                    "severity": severity,
                    "details": details or {},
                    "timestamp": datetime.utcnow().isoformat(),
                },
                ip_address=ip_address,
                user_agent=None,
                timestamp=datetime.utcnow()
            )
            db.add(audit_log)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to log security event: {e}")
            db.rollback()


class SecurityMiddleware:
    """Comprehensive security middleware."""
    
    @staticmethod
    async def process_request(request: Request) -> Optional[HTTPException]:
        """Process request through security checks."""
        client_ip = IPBlockingMiddleware.get_client_ip(request)
        
        # Check if IP is blocked
        if IPBlockingMiddleware.is_ip_blocked(client_ip):
            logger.warning(f"Blocked request from IP: {client_ip}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Scan for threats
        threats = ThreatDetection.scan_request(request)
        if ThreatDetection.is_threat_detected(threats):
            IPBlockingMiddleware.record_failure(client_ip)
            
            # Log security event
            logger.warning(
                f"Threat detected from IP {client_ip}: {threats}",
                extra={"ip": client_ip, "threats": threats}
            )
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid request detected"
            )
        
        # Generate fingerprint for tracking
        fingerprint = RequestFingerprinting.generate_fingerprint(request)
        request.state.fingerprint = fingerprint
        
        return None


def validate_input(data: any, field_name: str, max_length: Optional[int] = None) -> str:
    """
    Validate and sanitize input data.
    
    Args:
        data: Input data to validate
        field_name: Name of the field (for error messages)
        max_length: Maximum allowed length
        
    Returns:
        str: Sanitized string
        
    Raises:
        HTTPException: If validation fails
    """
    if not isinstance(data, str):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} must be a string"
        )
    
    # Check length
    if max_length and len(data) > max_length:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} exceeds maximum length of {max_length}"
        )
    
    # Check for null bytes
    if '\x00' in data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} contains invalid characters"
        )
    
    # Remove control characters except newline and tab
    sanitized = ''.join(char for char in data if ord(char) >= 32 or char in '\n\t')
    
    return sanitized


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent path traversal and other attacks.
    
    Args:
        filename: Original filename
        
    Returns:
        str: Sanitized filename
    """
    # Remove path components
    filename = filename.replace('..', '').replace('/', '').replace('\\', '')
    
    # Remove control characters
    filename = ''.join(char for char in filename if ord(char) >= 32)
    
    # Limit length
    if len(filename) > 255:
        filename = filename[:255]
    
    return filename


def generate_secure_token(length: int = 32) -> str:
    """
    Generate a cryptographically secure random token.
    
    Args:
        length: Length of token in bytes
        
    Returns:
        str: Hex-encoded secure token
    """
    import secrets
    return secrets.token_hex(length)


def verify_hmac_signature(data: str, signature: str, secret: str) -> bool:
    """
    Verify HMAC signature for request authenticity.
    
    Args:
        data: Data to verify
        signature: Provided signature
        secret: Secret key
        
    Returns:
        bool: True if signature is valid
    """
    expected_signature = hmac.new(
        secret.encode(),
        data.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected_signature, signature)

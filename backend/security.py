"""Enhanced security features: 2FA, security headers, encryption, audit."""

import secrets
import hashlib
import base64
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_
from database.models import User, UserSession, TwoFactorAuth, SecurityAudit
from passlib.context import CryptContext
import logging
import qrcode
import io
import pyotp

logger = logging.getLogger(__name__)

# Encryption context
crypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class SecurityHeadersMiddleware:
    """
    Middleware for security headers to protect against common web vulnerabilities.
    
    Implements comprehensive security headers including CSP, HSTS, and others
    to mitigate XSS, clickjacking, MIME sniffing, and other attacks.
    """
    
    @staticmethod
    def get_security_headers() -> Dict[str, str]:
        """
        Get comprehensive security headers for HTTP responses.
        
        Returns:
            Dict[str, str]: Dictionary of security header names and values
            
        Note:
            CSP policy allows 'unsafe-inline' and 'unsafe-eval' for Next.js compatibility.
            Consider tightening in production if possible.
        """
        from backend.config import settings
        
        # Base CSP - can be customized per environment
        if settings.environment == "production":
            csp = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "  # Next.js requires unsafe-inline
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self' https://api.floyo.com; "
                "frame-ancestors 'none'; "
                "base-uri 'self'; "
                "form-action 'self'; "
                "upgrade-insecure-requests"
            )
        else:
            # More permissive for development
            csp = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https: http:; "
                "font-src 'self' data:; "
                "connect-src 'self' http://localhost:* ws://localhost:*; "
                "frame-ancestors 'none'"
            )
        
        return {
            "Content-Security-Policy": csp,
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
            "X-Frame-Options": "DENY",
            "X-Content-Type-Options": "nosniff",
            "X-XSS-Protection": "1; mode=block",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": (
                "geolocation=(), microphone=(), camera=(), "
                "payment=(), usb=(), magnetometer=(), "
                "gyroscope=(), accelerometer=(), "
                "interest-cohort=()"  # FLoC opt-out
            ),
            "X-Content-Type-Options": "nosniff",
            "Cross-Origin-Embedder-Policy": "require-corp",  # Additional protection
            "Cross-Origin-Opener-Policy": "same-origin",  # Prevent cross-origin attacks
            "Cross-Origin-Resource-Policy": "same-origin",  # Prevent resource leakage
        }


class TwoFactorAuthManager:
    """2FA/MFA management using TOTP."""
    
    @staticmethod
    def generate_totp_secret() -> str:
        """Generate a new TOTP secret."""
        return pyotp.random_base32()
    
    @staticmethod
    def create_totp_uri(secret: str, email: str, issuer: str = "Floyo") -> str:
        """Create TOTP URI for QR code generation."""
        totp = pyotp.TOTP(secret)
        return totp.provisioning_uri(
            name=email,
            issuer_name=issuer
        )
    
    @staticmethod
    def generate_qr_code(uri: str) -> bytes:
        """Generate QR code image bytes."""
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        return img_bytes.getvalue()
    
    @staticmethod
    def verify_totp(secret: str, token: str) -> bool:
        """Verify TOTP token."""
        totp = pyotp.TOTP(secret)
        return totp.verify(token, valid_window=1)
    
    @staticmethod
    def setup_2fa(db: Session, user_id: UUID) -> Dict[str, Any]:
        """Set up 2FA for a user."""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        # Check if 2FA already exists
        existing = db.query(TwoFactorAuth).filter(TwoFactorAuth.user_id == user_id).first()
        if existing and existing.is_enabled:
            return {"error": "2FA already enabled"}
        
        # Generate secret
        secret = TwoFactorAuthManager.generate_totp_secret()
        
        # Create or update 2FA record
        if existing:
            two_fa = existing
            two_fa.secret = secret
            two_fa.is_enabled = False  # Not enabled until verified
        else:
            two_fa = TwoFactorAuth(
                user_id=user_id,
                secret=secret,
                is_enabled=False
            )
            db.add(two_fa)
        
        # Generate backup codes
        backup_codes = [secrets.token_urlsafe(8)[:12].upper() for _ in range(10)]
        two_fa.backup_codes = backup_codes
        
        db.commit()
        db.refresh(two_fa)
        
        # Generate QR code URI
        uri = TwoFactorAuthManager.create_totp_uri(secret, user.email)
        qr_code = TwoFactorAuthManager.generate_qr_code(uri)
        qr_code_base64 = base64.b64encode(qr_code).decode('utf-8')
        
        return {
            "secret": secret,
            "qr_code": f"data:image/png;base64,{qr_code_base64}",
            "uri": uri,
            "backup_codes": backup_codes,
            "manual_entry_key": secret
        }
    
    @staticmethod
    def verify_and_enable_2fa(
        db: Session,
        user_id: UUID,
        token: str
    ) -> bool:
        """Verify token and enable 2FA."""
        two_fa = db.query(TwoFactorAuth).filter(TwoFactorAuth.user_id == user_id).first()
        if not two_fa:
            raise ValueError("2FA not set up")
        
        # Verify token
        if TwoFactorAuthManager.verify_totp(two_fa.secret, token):
            two_fa.is_enabled = True
            db.commit()
            return True
        
        return False
    
    @staticmethod
    def verify_2fa_login(
        db: Session,
        user_id: UUID,
        token: str,
        backup_code: Optional[str] = None
    ) -> bool:
        """Verify 2FA during login."""
        two_fa = db.query(TwoFactorAuth).filter(
            TwoFactorAuth.user_id == user_id,
            TwoFactorAuth.is_enabled == True
        ).first()
        
        if not two_fa:
            return True  # 2FA not enabled, skip verification
        
        # Check backup code first
        if backup_code and two_fa.backup_codes:
            if backup_code in two_fa.backup_codes:
                # Remove used backup code
                two_fa.backup_codes.remove(backup_code)
                db.commit()
                return True
        
        # Verify TOTP token
        return TwoFactorAuthManager.verify_totp(two_fa.secret, token)
    
    @staticmethod
    def disable_2fa(db: Session, user_id: UUID) -> bool:
        """Disable 2FA for a user."""
        two_fa = db.query(TwoFactorAuth).filter(TwoFactorAuth.user_id == user_id).first()
        if not two_fa:
            return False
        
        two_fa.is_enabled = False
        two_fa.secret = None
        two_fa.backup_codes = []
        db.commit()
        return True


class DataEncryption:
    """
    Data encryption for sensitive fields using Fernet symmetric encryption.
    
    Uses PBKDF2 key derivation with configurable salt from environment.
    In production, ENCRYPTION_KEY should be a strong random 32+ byte key.
    ENCRYPTION_SALT should be unique per deployment (stored securely).
    """
    
    # Cache for Fernet instance to avoid recreating on each call
    _fernet_instance: Optional[Any] = None
    _cached_salt: Optional[bytes] = None
    
    @staticmethod
    def _get_encryption_salt() -> bytes:
        """
        Get encryption salt from environment.
        
        Returns:
            bytes: Salt for PBKDF2 key derivation
            
        Raises:
            ValueError: If salt is not configured in production
        """
        import os
        from backend.config import settings
        
        salt_str = os.getenv("ENCRYPTION_SALT")
        
        # In production, require explicit salt configuration
        if settings.environment == "production":
            if not salt_str or len(salt_str) < 16:
                raise ValueError(
                    "ENCRYPTION_SALT must be set in production to a strong random value "
                    "(minimum 16 characters). This is critical for data security."
                )
            return salt_str.encode('utf-8')
        
        # Development fallback (warn but allow)
        if not salt_str:
            logger.warning(
                "ENCRYPTION_SALT not set. Using default salt for development. "
                "This should NEVER be used in production."
            )
            return b'floyo_dev_salt_change_in_production'
        
        return salt_str.encode('utf-8')
    
    @staticmethod
    def get_encryption_key() -> bytes:
        """
        Get encryption key from environment.
        
        Returns:
            bytes: 32-byte encryption key derived from ENCRYPTION_KEY
            
        Raises:
            ValueError: If key is not configured properly in production
        """
        import os
        from backend.config import settings
        
        key = os.getenv("ENCRYPTION_KEY")
        
        # In production, require explicit key configuration
        if settings.environment == "production":
            if not key or len(key) < 32:
                raise ValueError(
                    "ENCRYPTION_KEY must be set in production to a strong random value "
                    "(minimum 32 characters). This is critical for data security."
                )
            # Check for default/weak keys
            weak_patterns = [
                "default-key-change-in-production",
                "change-me",
                "secret",
                "floyo"
            ]
            if any(pattern.lower() in key.lower() for pattern in weak_patterns):
                raise ValueError(
                    "ENCRYPTION_KEY appears to be a default or weak key. "
                    "Use a strong random key in production."
                )
        
        # Development fallback (warn but allow)
        if not key:
            logger.warning(
                "ENCRYPTION_KEY not set. Using default key for development. "
                "This should NEVER be used in production."
            )
            key = "default-key-change-in-production"
        
        # Derive 32-byte key from string using SHA256
        return hashlib.sha256(key.encode()).digest()
    
    @classmethod
    def _get_fernet_instance(cls) -> Any:
        """
        Get or create Fernet encryption instance with caching.
        
        Returns:
            Fernet: Configured Fernet instance for encryption/decryption
        """
        from cryptography.fernet import Fernet
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
        
        # Check if we can reuse cached instance
        current_salt = cls._get_encryption_salt()
        if cls._fernet_instance is not None and cls._cached_salt == current_salt:
            return cls._fernet_instance
        
        # Derive key using PBKDF2
        key_material = cls.get_encryption_key()
        salt = current_salt
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,  # High iteration count for security
        )
        key = base64.urlsafe_b64encode(kdf.derive(key_material))
        f = Fernet(key)
        
        # Cache instance and salt
        cls._fernet_instance = f
        cls._cached_salt = current_salt
        
        return f
    
    @staticmethod
    def encrypt_field(value: str, field_name: Optional[str] = None) -> str:
        """
        Encrypt a sensitive field value.
        
        Args:
            value: Plaintext value to encrypt
            field_name: Optional field name for logging/auditing
            
        Returns:
            str: Base64-encoded encrypted value
            
        Raises:
            ValueError: If encryption fails or value is invalid
        """
        if not value:
            raise ValueError("Cannot encrypt empty value")
        
        try:
            f = DataEncryption._get_fernet_instance()
            encrypted = f.encrypt(value.encode('utf-8'))
            return base64.urlsafe_b64encode(encrypted).decode('utf-8')
        except Exception as e:
            logger.error(f"Encryption failed for field {field_name}: {e}", exc_info=True)
            raise ValueError(f"Failed to encrypt field: {e}") from e
    
    @staticmethod
    def decrypt_field(encrypted_value: str, field_name: Optional[str] = None) -> str:
        """
        Decrypt a sensitive field value.
        
        Args:
            encrypted_value: Base64-encoded encrypted value
            field_name: Optional field name for logging/auditing
            
        Returns:
            str: Decrypted plaintext value
            
        Raises:
            ValueError: If decryption fails or value is invalid
        """
        if not encrypted_value:
            raise ValueError("Cannot decrypt empty value")
        
        try:
            f = DataEncryption._get_fernet_instance()
            decoded = base64.urlsafe_b64decode(encrypted_value.encode('utf-8'))
            decrypted = f.decrypt(decoded)
            return decrypted.decode('utf-8')
        except Exception as e:
            logger.error(f"Decryption failed for field {field_name}: {e}", exc_info=True)
            raise ValueError(f"Failed to decrypt field: {e}") from e


class SecurityAuditor:
    """Security audit and compliance tracking."""
    
    @staticmethod
    def log_security_event(
        db: Session,
        user_id: Optional[UUID],
        event_type: str,
        severity: str,
        details: Dict[str, Any],
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> SecurityAudit:
        """Log a security event."""
        audit = SecurityAudit(
            user_id=user_id,
            event_type=event_type,
            severity=severity,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.add(audit)
        db.commit()
        db.refresh(audit)
        
        # Alert on critical events
        if severity == "critical":
            logger.critical(f"Security critical event: {event_type} - User: {user_id}")
        
        return audit
    
    @staticmethod
    def get_security_events(
        db: Session,
        user_id: Optional[UUID] = None,
        severity: Optional[str] = None,
        limit: int = 100
    ) -> list:
        """Get security audit events."""
        query = db.query(SecurityAudit)
        
        if user_id:
            query = query.filter(SecurityAudit.user_id == user_id)
        if severity:
            query = query.filter(SecurityAudit.severity == severity)
        
        events = query.order_by(SecurityAudit.created_at.desc()).limit(limit).all()
        
        return [
            {
                "id": str(event.id),
                "user_id": str(event.user_id) if event.user_id else None,
                "event_type": event.event_type,
                "severity": event.severity,
                "details": event.details,
                "ip_address": event.ip_address,
                "created_at": event.created_at.isoformat()
            }
            for event in events
        ]
    
    @staticmethod
    def detect_suspicious_activity(
        db: Session,
        user_id: UUID,
        time_window_minutes: int = 15
    ) -> Dict[str, Any]:
        """Detect suspicious activity patterns."""
        cutoff = datetime.utcnow() - timedelta(minutes=time_window_minutes)
        
        # Count failed login attempts
        failed_logins = db.query(SecurityAudit).filter(
            and_(
                SecurityAudit.user_id == user_id,
                SecurityAudit.event_type == "failed_login",
                SecurityAudit.created_at >= cutoff
            )
        ).count()
        
        # Check for multiple IP addresses
        unique_ips = db.query(SecurityAudit.ip_address).filter(
            and_(
                SecurityAudit.user_id == user_id,
                SecurityAudit.created_at >= cutoff
            )
        ).distinct().count()
        
        is_suspicious = failed_logins > 5 or unique_ips > 3
        
        return {
            "is_suspicious": is_suspicious,
            "failed_login_attempts": failed_logins,
            "unique_ip_addresses": unique_ips,
            "time_window_minutes": time_window_minutes,
            "recommendation": "Enable 2FA and review account activity" if is_suspicious else None
        }


class InputSanitizer:
    """
    Comprehensive input sanitization and validation utilities.
    
    Provides methods to sanitize and validate user inputs to prevent:
    - XSS attacks (HTML/script injection)
    - SQL injection (via parameterized queries - handled by ORM)
    - Command injection
    - Path traversal
    - Other injection attacks
    """
    
    # Common dangerous patterns to detect
    DANGEROUS_PATTERNS = [
        r'<script[^>]*>.*?</script>',  # Script tags
        r'javascript:',  # JavaScript protocol
        r'on\w+\s*=',  # Event handlers (onclick, onerror, etc.)
        r'data:text/html',  # Data URLs with HTML
        r'vbscript:',  # VBScript protocol
    ]
    
    @staticmethod
    def sanitize_string(
        value: str,
        max_length: Optional[int] = None,
        allow_html: bool = False,
        strip_whitespace: bool = True
    ) -> str:
        """
        Sanitize string input to prevent XSS and injection attacks.
        
        Args:
            value: Input string to sanitize
            max_length: Maximum allowed length (truncates if exceeded)
            allow_html: If True, allows safe HTML (not recommended)
            strip_whitespace: If True, strips leading/trailing whitespace
            
        Returns:
            str: Sanitized string
            
        Raises:
            ValueError: If value contains dangerous patterns
        """
        if not isinstance(value, str):
            raise ValueError("Input must be a string")
        
        import html
        import re
        
        # Check for dangerous patterns
        for pattern in InputSanitizer.DANGEROUS_PATTERNS:
            if re.search(pattern, value, re.IGNORECASE | re.DOTALL):
                logger.warning(f"Dangerous pattern detected in input: {pattern[:50]}")
                raise ValueError("Input contains potentially dangerous content")
        
        if allow_html:
            # If HTML is allowed, use a more permissive sanitizer (not implemented here)
            # In production, use a library like bleach for HTML sanitization
            sanitized = value
        else:
            # Escape HTML entities to prevent XSS
            sanitized = html.escape(value)
        
        # Remove control characters (except common whitespace)
        sanitized = ''.join(
            char for char in sanitized
            if ord(char) >= 32 or char in '\n\r\t'
        )
        
        # Truncate if needed
        if max_length and len(sanitized) > max_length:
            sanitized = sanitized[:max_length]
            logger.warning(f"Input truncated to {max_length} characters")
        
        # Strip whitespace if requested
        if strip_whitespace:
            sanitized = sanitized.strip()
        
        return sanitized
    
    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """
        Sanitize filename to prevent path traversal and other attacks.
        
        Args:
            filename: Original filename
            
        Returns:
            str: Sanitized filename safe for filesystem operations
        """
        import os
        import re
        
        # Remove path components
        filename = os.path.basename(filename)
        
        # Remove dangerous characters
        filename = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '', filename)
        
        # Limit length
        if len(filename) > 255:
            name, ext = os.path.splitext(filename)
            filename = name[:255 - len(ext)] + ext
        
        return filename.strip()
    
    @staticmethod
    def validate_email(email: str, strict: bool = True) -> bool:
        """
        Validate email format using RFC 5322 compliant regex.
        
        Args:
            email: Email address to validate
            strict: If True, uses stricter validation
            
        Returns:
            bool: True if email format is valid
        """
        import re
        
        if not email or not isinstance(email, str):
            return False
        
        # Basic email pattern (RFC 5322 simplified)
        if strict:
            pattern = r'^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$'
        else:
            pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        
        if not re.match(pattern, email):
            return False
        
        # Additional checks
        if len(email) > 254:  # RFC 5321 limit
            return False
        
        if email.count('@') != 1:
            return False
        
        local, domain = email.split('@')
        if len(local) > 64:  # RFC 5321 limit
            return False
        
        return True
    
    @staticmethod
    def validate_password_strength(password: str, min_length: int = 8) -> Dict[str, Any]:
        """
        Validate password strength with comprehensive checks.
        
        Args:
            password: Password to validate
            min_length: Minimum password length (default: 8)
            
        Returns:
            Dict[str, Any]: Validation result with strength score and issues
        """
        if not isinstance(password, str):
            return {
                "is_valid": False,
                "strength": "invalid",
                "strength_score": 0,
                "issues": ["Password must be a string"]
            }
        
        issues = []
        strength = 0
        
        # Length check
        if len(password) >= min_length:
            strength += 1
        else:
            issues.append(f"Password must be at least {min_length} characters")
        
        # Check for common weak passwords
        common_passwords = [
            "password", "12345678", "qwerty", "abc123", "password123",
            "admin", "letmein", "welcome", "monkey", "1234567890"
        ]
        if password.lower() in common_passwords:
            issues.append("Password is too common and easily guessable")
            strength = max(0, strength - 2)  # Penalize common passwords
        
        # Character variety checks
        has_upper = any(c.isupper() for c in password)
        has_lower = any(c.islower() for c in password)
        has_digit = any(c.isdigit() for c in password)
        has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password)
        
        if has_upper:
            strength += 1
        else:
            issues.append("Password should contain uppercase letters")
        
        if has_lower:
            strength += 1
        else:
            issues.append("Password should contain lowercase letters")
        
        if has_digit:
            strength += 1
        else:
            issues.append("Password should contain numbers")
        
        if has_special:
            strength += 1
        else:
            issues.append("Password should contain special characters")
        
        # Check for repeated characters
        if len(set(password)) < len(password) * 0.5:
            issues.append("Password contains too many repeated characters")
        
        # Determine strength level
        strength_levels = ["very_weak", "weak", "fair", "good", "strong", "very_strong"]
        strength_level = strength_levels[min(strength, len(strength_levels) - 1)]
        
        return {
            "is_valid": len(issues) == 0 and strength >= 3,
            "strength": strength_level,
            "strength_score": strength,
            "max_score": 5,
            "issues": issues,
            "has_upper": has_upper,
            "has_lower": has_lower,
            "has_digit": has_digit,
            "has_special": has_special,
        }
    
    @staticmethod
    def validate_url(url: str, allowed_schemes: Optional[List[str]] = None) -> bool:
        """
        Validate URL format and scheme.
        
        Args:
            url: URL to validate
            allowed_schemes: List of allowed URL schemes (default: ['http', 'https'])
            
        Returns:
            bool: True if URL is valid and uses allowed scheme
        """
        from urllib.parse import urlparse
        
        if not url or not isinstance(url, str):
            return False
        
        if allowed_schemes is None:
            allowed_schemes = ['http', 'https']
        
        try:
            parsed = urlparse(url)
            
            # Check scheme
            if parsed.scheme not in allowed_schemes:
                return False
            
            # Check netloc (domain) exists
            if not parsed.netloc:
                return False
            
            return True
        except Exception:
            return False
    
    @staticmethod
    def sanitize_sql_input(value: str) -> str:
        """
        Basic SQL injection prevention (for display/logging purposes).
        
        Note: This is NOT a replacement for parameterized queries!
        Always use parameterized queries in database operations.
        This is only for sanitizing values before logging/display.
        
        Args:
            value: Input value
            
        Returns:
            str: Sanitized value
        """
        import re
        
        # Remove or escape dangerous SQL patterns
        dangerous = ['--', ';', '/*', '*/', 'xp_', 'sp_', 'exec', 'execute']
        sanitized = value
        
        for pattern in dangerous:
            sanitized = sanitized.replace(pattern, '')
        
        return sanitized.strip()

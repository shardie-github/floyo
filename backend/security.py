"""Enhanced security features: 2FA, security headers, encryption, audit."""

import secrets
import hashlib
import base64
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
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
    """Middleware for security headers."""
    
    @staticmethod
    def get_security_headers() -> Dict[str, str]:
        """Get security headers for responses."""
        return {
            "Content-Security-Policy": (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self' https://api.floyo.com; "
                "frame-ancestors 'none'"
            ),
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
            "X-Frame-Options": "DENY",
            "X-Content-Type-Options": "nosniff",
            "X-XSS-Protection": "1; mode=block",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": (
                "geolocation=(), microphone=(), camera=(), "
                "payment=(), usb=(), magnetometer=(), "
                "gyroscope=(), accelerometer=()"
            )
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
    """Data encryption for sensitive fields."""
    
    @staticmethod
    def get_encryption_key() -> bytes:
        """Get encryption key from environment (in production, use proper key management)."""
        import os
        key = os.getenv("ENCRYPTION_KEY", "default-key-change-in-production")
        # Derive 32-byte key from string
        return hashlib.sha256(key.encode()).digest()
    
    @staticmethod
    def encrypt_field(value: str) -> str:
        """Encrypt a sensitive field value."""
        from cryptography.fernet import Fernet
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
        
        key_material = DataEncryption.get_encryption_key()
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b'floyo_salt_2024',  # In production, use unique salt per field
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(key_material))
        f = Fernet(key)
        
        encrypted = f.encrypt(value.encode())
        return base64.urlsafe_b64encode(encrypted).decode()
    
    @staticmethod
    def decrypt_field(encrypted_value: str) -> str:
        """Decrypt a sensitive field value."""
        from cryptography.fernet import Fernet
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
        
        key_material = DataEncryption.get_encryption_key()
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b'floyo_salt_2024',
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(key_material))
        f = Fernet(key)
        
        decoded = base64.urlsafe_b64decode(encrypted_value.encode())
        decrypted = f.decrypt(decoded)
        return decrypted.decode()


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
    """Input sanitization and validation."""
    
    @staticmethod
    def sanitize_string(value: str, max_length: Optional[int] = None) -> str:
        """Sanitize string input."""
        import html
        # Escape HTML
        sanitized = html.escape(value)
        # Remove control characters
        sanitized = ''.join(char for char in sanitized if ord(char) >= 32 or char in '\n\r\t')
        # Truncate if needed
        if max_length and len(sanitized) > max_length:
            sanitized = sanitized[:max_length]
        return sanitized.strip()
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format."""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    
    @staticmethod
    def validate_password_strength(password: str) -> Dict[str, Any]:
        """Validate password strength."""
        issues = []
        strength = 0
        
        if len(password) >= 8:
            strength += 1
        else:
            issues.append("Password must be at least 8 characters")
        
        if any(c.isupper() for c in password):
            strength += 1
        else:
            issues.append("Password should contain uppercase letters")
        
        if any(c.islower() for c in password):
            strength += 1
        else:
            issues.append("Password should contain lowercase letters")
        
        if any(c.isdigit() for c in password):
            strength += 1
        else:
            issues.append("Password should contain numbers")
        
        if any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
            strength += 1
        else:
            issues.append("Password should contain special characters")
        
        strength_level = ["weak", "fair", "good", "strong", "very_strong"][strength - 1] if strength > 0 else "weak"
        
        return {
            "is_valid": len(issues) == 0,
            "strength": strength_level,
            "strength_score": strength,
            "issues": issues
        }

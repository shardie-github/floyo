"""Tests for security features."""

import pytest
from unittest.mock import Mock, patch
from backend.security import (
    TwoFactorAuthManager, SecurityAuditor, InputSanitizer,
    DataEncryption, SecurityHeadersMiddleware
)
from database.models import User, TwoFactorAuth, SecurityAudit
from uuid import uuid4


class TestTwoFactorAuth:
    """Test 2FA functionality."""
    
    def test_generate_totp_secret(self):
        """Test TOTP secret generation."""
        secret = TwoFactorAuthManager.generate_totp_secret()
        assert secret is not None
        assert len(secret) > 0
    
    def test_verify_totp(self):
        """Test TOTP verification."""
        secret = TwoFactorAuthManager.generate_totp_secret()
        # Generate a valid token
        import pyotp
        totp = pyotp.TOTP(secret)
        token = totp.now()
        
        # Verify it
        assert TwoFactorAuthManager.verify_totp(secret, token) == True
        
        # Verify invalid token
        assert TwoFactorAuthManager.verify_totp(secret, "000000") == False


class TestInputSanitizer:
    """Test input sanitization."""
    
    def test_sanitize_string(self):
        """Test string sanitization."""
        # HTML escape
        result = InputSanitizer.sanitize_string("<script>alert('xss')</script>")
        assert "<script>" not in result
        
        # Truncate
        long_string = "a" * 200
        result = InputSanitizer.sanitize_string(long_string, max_length=50)
        assert len(result) <= 50
    
    def test_validate_email(self):
        """Test email validation."""
        assert InputSanitizer.validate_email("test@example.com") == True
        assert InputSanitizer.validate_email("invalid-email") == False
        assert InputSanitizer.validate_email("@example.com") == False
    
    def test_validate_password_strength(self):
        """Test password strength validation."""
        # Weak password
        result = InputSanitizer.validate_password_strength("weak")
        assert result["strength"] == "weak"
        assert result["is_valid"] == False
        
        # Strong password
        result = InputSanitizer.validate_password_strength("StrongP@ssw0rd!")
        assert result["strength"] in ["strong", "very_strong"]
        assert result["is_valid"] == True


class TestSecurityHeaders:
    """Test security headers."""
    
    def test_get_security_headers(self):
        """Test security headers generation."""
        headers = SecurityHeadersMiddleware.get_security_headers()
        
        assert "Content-Security-Policy" in headers
        assert "Strict-Transport-Security" in headers
        assert "X-Frame-Options" in headers
        assert "X-Content-Type-Options" in headers


class TestDataEncryption:
    """Test data encryption."""
    
    def test_encrypt_decrypt(self):
        """Test encryption and decryption."""
        original = "sensitive_data_123"
        encrypted = DataEncryption.encrypt_field(original)
        
        assert encrypted != original
        assert len(encrypted) > 0
        
        decrypted = DataEncryption.decrypt_field(encrypted)
        assert decrypted == original


@pytest.fixture
def mock_db():
    """Mock database session."""
    return Mock()


class TestSecurityAuditor:
    """Test security audit functionality."""
    
    def test_log_security_event(self, mock_db):
        """Test logging security events."""
        user_id = uuid4()
        event = SecurityAuditor.log_security_event(
            db=mock_db,
            user_id=user_id,
            event_type="test_event",
            severity="medium",
            details={"test": "data"}
        )
        
        assert mock_db.add.called
        assert mock_db.commit.called
    
    def test_detect_suspicious_activity(self, mock_db):
        """Test suspicious activity detection."""
        user_id = uuid4()
        
        # Mock query results
        mock_db.query.return_value.filter.return_value.count.return_value = 0
        mock_db.query.return_value.filter.return_value.distinct.return_value.count.return_value = 1
        
        result = SecurityAuditor.detect_suspicious_activity(
            db=mock_db,
            user_id=user_id,
            time_window_minutes=15
        )
        
        assert "is_suspicious" in result
        assert "failed_login_attempts" in result

"""
Secure Secrets Management
Handles encryption and secure storage of sensitive data
"""

import os
import base64
import hashlib
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from typing import Optional
import logging
from backend.config import settings

logger = logging.getLogger(__name__)

# Cache for encryption keys
_encryption_key: Optional[bytes] = None


def get_encryption_key() -> bytes:
    """
    Get or generate encryption key from environment.
    
    Returns:
        bytes: Encryption key
    """
    global _encryption_key
    
    if _encryption_key is not None:
        return _encryption_key
    
    # Get encryption key from environment
    encryption_key_str = getattr(settings, 'encryption_key', None)
    encryption_salt_str = getattr(settings, 'encryption_salt', None)
    
    if not encryption_key_str or not encryption_salt_str:
        raise ValueError(
            "ENCRYPTION_KEY and ENCRYPTION_SALT must be set in environment variables"
        )
    
    # Derive key using PBKDF2
    salt = encryption_salt_str.encode()
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    
    _encryption_key = base64.urlsafe_b64encode(
        kdf.derive(encryption_key_str.encode())
    )
    
    return _encryption_key


def encrypt_secret(plaintext: str) -> str:
    """
    Encrypt a secret value.
    
    Args:
        plaintext: Plain text secret to encrypt
        
    Returns:
        str: Encrypted value (base64 encoded)
    """
    try:
        key = get_encryption_key()
        fernet = Fernet(key)
        encrypted = fernet.encrypt(plaintext.encode())
        return base64.urlsafe_b64encode(encrypted).decode()
    except Exception as e:
        logger.error(f"Failed to encrypt secret: {e}")
        raise


def decrypt_secret(ciphertext: str) -> str:
    """
    Decrypt a secret value.
    
    Args:
        ciphertext: Encrypted secret (base64 encoded)
        
    Returns:
        str: Decrypted plain text
    """
    try:
        key = get_encryption_key()
        fernet = Fernet(key)
        encrypted_bytes = base64.urlsafe_b64decode(ciphertext.encode())
        decrypted = fernet.decrypt(encrypted_bytes)
        return decrypted.decode()
    except Exception as e:
        logger.error(f"Failed to decrypt secret: {e}")
        raise


def hash_secret(secret: str, salt: Optional[str] = None) -> tuple[str, str]:
    """
    Hash a secret with salt (one-way).
    
    Args:
        secret: Secret to hash
        salt: Optional salt (generated if not provided)
        
    Returns:
        tuple: (hashed_secret, salt)
    """
    if salt is None:
        salt = os.urandom(16).hex()
    
    # Use PBKDF2 for secure hashing
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt.encode(),
        iterations=100000,
    )
    
    hashed = base64.urlsafe_b64encode(
        kdf.derive(secret.encode())
    ).decode()
    
    return hashed, salt


def verify_secret_hash(secret: str, hashed_secret: str, salt: str) -> bool:
    """
    Verify a secret against its hash.
    
    Args:
        secret: Plain text secret
        hashed_secret: Hashed secret
        salt: Salt used for hashing
        
    Returns:
        bool: True if secret matches hash
    """
    try:
        computed_hash, _ = hash_secret(secret, salt)
        return hashed_secret == computed_hash
    except Exception as e:
        logger.error(f"Failed to verify secret hash: {e}")
        return False


def mask_secret(secret: str, visible_chars: int = 4) -> str:
    """
    Mask a secret for logging/display (show only first/last chars).
    
    Args:
        secret: Secret to mask
        visible_chars: Number of characters to show at start/end
        
    Returns:
        str: Masked secret
    """
    if len(secret) <= visible_chars * 2:
        return "*" * len(secret)
    
    start = secret[:visible_chars]
    end = secret[-visible_chars:]
    middle = "*" * (len(secret) - visible_chars * 2)
    
    return f"{start}{middle}{end}"


class SecretsManager:
    """Manager for secure secrets storage and retrieval."""
    
    @staticmethod
    def get_secret(key: str, default: Optional[str] = None) -> Optional[str]:
        """
        Get a secret from environment variables.
        
        Args:
            key: Secret key name
            default: Default value if not found
            
        Returns:
            str: Secret value or default
        """
        return os.getenv(key, default)
    
    @staticmethod
    def require_secret(key: str) -> str:
        """
        Require a secret to be present.
        
        Args:
            key: Secret key name
            
        Returns:
            str: Secret value
            
        Raises:
            ValueError: If secret is not found
        """
        value = os.getenv(key)
        if not value:
            raise ValueError(f"Required secret {key} is not set")
        return value
    
    @staticmethod
    def validate_secrets(required_keys: list[str]) -> dict[str, bool]:
        """
        Validate that required secrets are present.
        
        Args:
            required_keys: List of required secret keys
            
        Returns:
            dict: Validation results for each key
        """
        results = {}
        for key in required_keys:
            results[key] = key in os.environ and bool(os.getenv(key))
        return results

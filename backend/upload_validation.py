"""File upload validation and sanitization."""

import os
import magic
from typing import Optional, List, Tuple
from fastapi import UploadFile, HTTPException, status
from pathlib import Path

# Allowed MIME types
ALLOWED_MIME_TYPES = {
    # Text files
    "text/plain",
    "text/csv",
    "text/markdown",
    "text/x-python",
    "text/x-javascript",
    "text/x-html",
    "application/json",
    "application/xml",
    "text/xml",
    
    # Images
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    
    # Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    
    # Archives
    "application/zip",
    "application/x-tar",
    "application/gzip",
}

# Maximum file size: 50MB
MAX_FILE_SIZE = 50 * 1024 * 1024

# Dangerous file extensions (even if MIME type matches)
BLOCKED_EXTENSIONS = {
    ".exe", ".bat", ".cmd", ".com", ".pif", ".scr", ".vbs", ".js", ".jar",
    ".app", ".deb", ".pkg", ".rpm", ".sh", ".dmg", ".iso",
}

# Allowed file extensions (additional validation)
ALLOWED_EXTENSIONS = {
    ".txt", ".md", ".csv", ".json", ".xml", ".yaml", ".yml",
    ".py", ".js", ".ts", ".html", ".css", ".scss",
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg",
    ".pdf", ".doc", ".docx", ".xls", ".xlsx",
    ".zip", ".tar", ".gz",
}


def get_file_extension(filename: str) -> str:
    """Get file extension from filename."""
    return Path(filename).suffix.lower()


def validate_mime_type(file_content: bytes, filename: str) -> Tuple[str, bool]:
    """
    Validate MIME type of uploaded file.
    Returns (detected_mime_type, is_valid)
    """
    # Try to detect MIME type from content
    try:
        detected_mime = magic.from_buffer(file_content, mime=True)
    except Exception:
        # Fallback: use file extension
        ext = get_file_extension(filename)
        # Simple mapping (not exhaustive)
        ext_to_mime = {
            ".txt": "text/plain",
            ".json": "application/json",
            ".pdf": "application/pdf",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
        }
        detected_mime = ext_to_mime.get(ext, "application/octet-stream")
    
    # Check if detected MIME type is allowed
    is_valid = detected_mime in ALLOWED_MIME_TYPES
    
    return detected_mime, is_valid


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent directory traversal and other attacks."""
    # Remove path components
    filename = os.path.basename(filename)
    
    # Remove dangerous characters
    dangerous_chars = ['..', '/', '\\', ':', '*', '?', '"', '<', '>', '|']
    for char in dangerous_chars:
        filename = filename.replace(char, '_')
    
    # Limit length
    if len(filename) > 255:
        name, ext = os.path.splitext(filename)
        filename = name[:250] + ext
    
    return filename


def validate_file_upload(
    file: UploadFile,
    max_size: int = MAX_FILE_SIZE,
    allowed_mime_types: Optional[List[str]] = None,
    allowed_extensions: Optional[List[str]] = None,
) -> Tuple[bytes, str]:
    """
    Validate and read uploaded file.
    Returns (file_content, sanitized_filename)
    Raises HTTPException on validation failure.
    """
    # Read file content (we need to read it to validate MIME type)
    file_content = await file.read()
    
    # Check file size
    if len(file_content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed size of {max_size / (1024*1024):.1f}MB"
        )
    
    # Sanitize filename
    sanitized_filename = sanitize_filename(file.filename or "uploaded_file")
    
    # Check blocked extensions
    ext = get_file_extension(sanitized_filename)
    if ext in BLOCKED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File extension '{ext}' is not allowed for security reasons"
        )
    
    # Validate MIME type
    detected_mime, is_valid = validate_mime_type(file_content, sanitized_filename)
    
    if allowed_mime_types:
        is_valid = detected_mime in allowed_mime_types
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{detected_mime}' is not allowed"
        )
    
    # Check extension if provided
    if allowed_extensions:
        if ext not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File extension '{ext}' is not allowed"
            )
    else:
        # Use default allowed extensions
        if ext and ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File extension '{ext}' is not allowed"
            )
    
    return file_content, sanitized_filename

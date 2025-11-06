# Integration Guide for Comprehensive Enhancements

## Quick Start

This guide shows how to integrate the new security, performance, and error handling enhancements into your FastAPI application.

## 1. CSRF Protection Integration

Add CSRF middleware to your FastAPI app:

```python
from backend.csrf_protection import CSRFProtectionMiddleware

app = FastAPI(...)

# Add CSRF middleware (should be early in middleware stack)
app.add_middleware(CSRFProtectionMiddleware)
```

**Frontend Integration:**
- Include CSRF token in all POST/PUT/DELETE requests:
```typescript
// Get token from cookie (set automatically by backend)
const csrfToken = document.cookie
  .split('; ')
  .find(row => row.startsWith('XSRF-TOKEN='))
  ?.split('=')[1];

// Include in request headers
fetch('/api/v1/endpoint', {
  method: 'POST',
  headers: {
    'X-XSRF-TOKEN': csrfToken,
    // ... other headers
  },
});
```

## 2. Error Handling Integration

Add global error handler:

```python
from backend.error_handling import error_handler, APIError, NotFoundError, ValidationError
from fastapi import FastAPI

app = FastAPI(...)

# Add exception handlers
app.add_exception_handler(APIError, error_handler)
app.add_exception_handler(Exception, error_handler)
```

**Usage in endpoints:**
```python
from backend.error_handling import NotFoundError, ValidationError

@app.get("/api/v1/users/{user_id}")
def get_user(user_id: UUID, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundError("User", user_id)
    return user
```

## 3. Enhanced Rate Limiting

Use endpoint-specific rate limits:

```python
from backend.rate_limit import limiter, get_endpoint_rate_limit

@app.post("/api/v1/auth/login")
@limiter.limit(get_endpoint_rate_limit("auth", "login") or "5/minute")
def login(request: Request, ...):
    # Your login logic
    pass
```

## 4. Cache Invalidation

Invalidate cache when resources are updated:

```python
from backend.cache import invalidate_user_cache, invalidate_resource_cache

@app.put("/api/v1/users/{user_id}")
def update_user(user_id: UUID, ...):
    # Update user
    user = update_user_logic(...)
    
    # Invalidate cache
    invalidate_user_cache(str(user_id))
    invalidate_resource_cache("user", str(user_id))
    
    return user
```

## 5. Enhanced Input Validation

Use enhanced input sanitization:

```python
from backend.security import InputSanitizer

@app.post("/api/v1/users")
def create_user(email: str, password: str, ...):
    # Validate email
    if not InputSanitizer.validate_email(email):
        raise ValidationError("Invalid email format")
    
    # Validate password strength
    password_check = InputSanitizer.validate_password_strength(password)
    if not password_check["is_valid"]:
        raise ValidationError(
            "Password does not meet requirements",
            details={"issues": password_check["issues"]}
        )
    
    # Sanitize inputs
    sanitized_name = InputSanitizer.sanitize_string(name, max_length=100)
    
    # Create user...
```

## 6. Encryption Usage

Encrypt sensitive fields:

```python
from backend.security import DataEncryption

# Encrypt sensitive data before storing
encrypted_api_key = DataEncryption.encrypt_field(api_key, field_name="api_key")

# Decrypt when needed
api_key = DataEncryption.decrypt_field(encrypted_api_key, field_name="api_key")
```

## 7. Enhanced Billing

Use enhanced billing features:

```python
from backend.monetization import BillingManager

# Create billing event
billing_event = BillingManager.create_billing_event(
    db=db,
    subscription_id=subscription.id,
    event_type="invoice",
    amount=29.99,
    currency="USD",
    external_id="stripe_pi_1234567890"
)

# Process payment retry
if BillingManager.process_payment_retry(db, billing_event.id, retry_count=1):
    # Retry payment logic
    pass

# Mark payment successful
BillingManager.mark_payment_successful(db, billing_event.id, external_id="stripe_pi_1234567890")
```

## 8. Environment Variables Setup

Create `.env` file with required variables:

```bash
# Required for Production
ENCRYPTION_KEY=<generate-strong-random-32-plus-chars>
ENCRYPTION_SALT=<generate-strong-random-16-plus-chars>
SECRET_KEY=<generate-strong-random-32-plus-chars>

# Database
DATABASE_URL=postgresql://user:password@localhost/floyo

# Redis (recommended)
REDIS_URL=redis://localhost:6379/0

# Environment
ENVIRONMENT=production
```

**Generate secure keys:**
```python
import secrets

# Generate encryption key (32+ characters)
encryption_key = secrets.token_urlsafe(32)
print(f"ENCRYPTION_KEY={encryption_key}")

# Generate salt (16+ characters)
salt = secrets.token_urlsafe(16)
print(f"ENCRYPTION_SALT={salt}")

# Generate secret key (32+ characters)
secret_key = secrets.token_urlsafe(32)
print(f"SECRET_KEY={secret_key}")
```

## 9. Monitoring Integration

Monitor cache and database:

```python
from backend.cache import get_cache_stats
from backend.database import get_pool_status

@app.get("/api/v1/admin/stats")
def get_stats():
    return {
        "cache": get_cache_stats(),
        "database": get_pool_status(),
    }
```

## 10. Security Headers

Security headers are automatically added via middleware. Verify in response:

```bash
curl -I https://your-api.com/api/v1/health
```

Should include:
- `Content-Security-Policy`
- `Strict-Transport-Security`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Cross-Origin-Embedder-Policy`
- `Cross-Origin-Opener-Policy`
- `Cross-Origin-Resource-Policy`

## Testing Checklist

- [ ] CSRF protection works on POST/PUT/DELETE requests
- [ ] Error responses follow standardized format
- [ ] Rate limiting works on all endpoints
- [ ] Cache invalidation works correctly
- [ ] Input validation rejects malicious inputs
- [ ] Encryption/decryption works correctly
- [ ] Billing events are created correctly
- [ ] Database connection pooling works under load
- [ ] Cache statistics are accurate

## Migration Notes

1. **Breaking Changes**: None - all changes are backward compatible
2. **New Dependencies**: None - uses existing dependencies
3. **Database Changes**: None - no schema changes required
4. **API Changes**: Error response format improved but compatible

## Rollback Plan

If issues occur:
1. Remove CSRF middleware (if causing issues)
2. Revert to old error handling (if needed)
3. All other changes are additive and safe

## Support

For issues or questions:
- Check `COMPREHENSIVE_ENHANCEMENTS_SUMMARY.md` for details
- Review code comments in modified files
- Test in development environment first

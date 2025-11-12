> Archived on 2025-11-12. Superseded by: (see docs/final index)

# Security Hardening and Performance Optimization Guide

This guide documents all security hardening and performance optimizations implemented in the Floyo platform.

## Security Hardening

### 1. Authentication & Authorization

#### JWT Security
- **Strong Secret Keys**: Minimum 32 characters, cryptographically random
- **Token Expiration**: Access tokens expire in 30 minutes, refresh tokens in 7 days
- **Token Rotation**: Refresh tokens rotate on use (optional)
- **Secure Storage**: Tokens stored as hashes in database

#### Two-Factor Authentication (2FA)
- TOTP-based 2FA using PyOTP
- QR code generation for easy setup
- Backup codes for account recovery
- Secure secret storage

#### Session Management
- Secure session tokens
- Automatic expiration
- Session invalidation on logout
- IP-based session tracking

### 2. Input Validation & Sanitization

#### Comprehensive Validation
- **Email Validation**: RFC-compliant email format checking
- **Password Strength**: Minimum 8 characters, complexity requirements
- **URL Validation**: Protocol whitelist, dangerous protocol blocking
- **UUID Validation**: Format verification
- **File Path Validation**: Path traversal prevention
- **Integer Validation**: Range checking, type validation
- **JSON Validation**: Schema validation

#### Sanitization
- HTML entity escaping
- SQL injection prevention
- XSS prevention
- Path traversal prevention
- Command injection prevention
- Control character removal

### 3. Threat Detection

#### Pattern Matching
- SQL injection detection
- XSS detection
- Path traversal detection
- Command injection detection
- Request fingerprinting

#### IP Blocking
- Automatic IP blocking after failed attempts
- Configurable thresholds
- Whitelist support
- Failure count tracking
- Time-based blocking windows

### 4. Security Headers

#### HTTP Security Headers
- **Content-Security-Policy**: Restricts resource loading
- **Strict-Transport-Security**: Forces HTTPS
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **X-XSS-Protection**: XSS protection
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Restricts browser features
- **Cross-Origin Policies**: COEP, COOP, CORP headers

### 5. Rate Limiting

#### Multi-Level Rate Limiting
- **IP-based**: Per-IP request limits
- **Endpoint-specific**: Different limits per endpoint
- **User-based**: Per-user limits
- **Redis-backed**: Distributed rate limiting

#### Rate Limits
- **Auth endpoints**: 5/minute (login), 3/hour (register)
- **Security endpoints**: 5/hour (2FA setup)
- **API endpoints**: 100-5000/hour depending on endpoint
- **Default**: 60/minute, 1000/hour

### 6. Secrets Management

#### Encryption
- **Fernet Encryption**: Symmetric encryption for secrets
- **PBKDF2 Key Derivation**: Secure key generation
- **Salt-based Hashing**: One-way password hashing
- **Secure Storage**: Encrypted at rest

#### Environment Variables
- All secrets loaded from environment
- No hardcoded secrets
- Secure key rotation support
- Masked logging

### 7. Database Security

#### Row Level Security (RLS)
- All tables have RLS enabled
- User data isolation
- Service role access for background jobs
- Policy-based access control

#### SQL Injection Prevention
- Parameterized queries
- Input validation
- Pattern detection
- Query sanitization

### 8. API Security

#### Request Validation
- Size limits (10MB default)
- Content type validation
- Request fingerprinting
- Threat scanning

#### Response Security
- No sensitive data in responses
- Error message sanitization
- Secure error handling
- Audit logging

## Performance Optimization

### 1. Database Optimization

#### Connection Pooling
- **Pool Size**: 10-20 connections (configurable)
- **Max Overflow**: 20-40 connections
- **Connection Reuse**: Pool recycling after 1 hour
- **Health Checks**: Pre-ping for stale connections
- **Circuit Breaker**: Prevents cascading failures

#### Query Optimization
- **Eager Loading**: Prevents N+1 queries
- **Selective Fields**: Only fetch needed columns
- **Query Caching**: Redis-backed query result caching
- **Index Hints**: Optimizer hints for complex queries
- **Pagination**: Efficient offset/limit queries

#### Indexes
- **Primary Indexes**: On all primary keys
- **Foreign Key Indexes**: On all foreign keys
- **Composite Indexes**: Multi-column indexes for common queries
- **Partial Indexes**: Indexes on filtered subsets
- **Covering Indexes**: Include frequently accessed columns

### 2. Caching Strategy

#### Multi-Level Caching
- **Redis Cache**: Distributed caching for production
- **In-Memory Cache**: Fallback for development
- **Query Result Caching**: Database query caching
- **Response Caching**: API response caching

#### Cache Strategies
- **TTL-based**: Time-to-live expiration
- **LRU Eviction**: Least recently used eviction
- **Cache Invalidation**: Pattern-based invalidation
- **Cache Warming**: Pre-populate frequently accessed data

### 3. API Response Optimization

#### Compression
- **Gzip Compression**: Automatic compression for responses >1KB
- **Content Negotiation**: Client-acceptance based
- **Compression Level**: Balanced (level 6)

#### Response Headers
- **Cache-Control**: Public caching with TTL
- **ETag**: Entity tags for conditional requests
- **Content-Size**: Response size headers
- **Compression Headers**: Compression metadata

### 4. Frontend Optimization

#### Next.js Optimizations
- **Code Splitting**: Automatic route-based splitting
- **Tree Shaking**: Unused code elimination
- **Image Optimization**: AVIF/WebP formats
- **Font Optimization**: Self-hosted fonts
- **Bundle Analysis**: Optional bundle analyzer

#### Webpack Optimizations
- **Deterministic Module IDs**: Better caching
- **Runtime Chunk**: Separate runtime code
- **Vendor Chunking**: Separate vendor code
- **Common Chunking**: Shared code extraction

#### Performance Features
- **Lazy Loading**: Component lazy loading
- **Prefetching**: DNS and link prefetching
- **Service Worker**: PWA caching
- **Static Generation**: Pre-rendered pages

### 5. Monitoring & Metrics

#### Performance Metrics
- **Query Times**: Track slow queries (>1s)
- **Cache Hit Rates**: Monitor cache effectiveness
- **Response Times**: API endpoint timing
- **Connection Pool Stats**: Pool utilization

#### Security Metrics
- **Threat Detection**: Count of detected threats
- **IP Blocking**: Blocked IP statistics
- **Rate Limit Hits**: Rate limit violations
- **Security Events**: Audit log statistics

## Implementation Details

### Security Middleware Stack

1. **Request ID Middleware**: Request tracing
2. **Security Middleware**: IP blocking, threat detection
3. **CORS Middleware**: Cross-origin resource sharing
4. **CSRF Protection**: Cross-site request forgery prevention
5. **Rate Limiting**: Request throttling
6. **Compression**: Response compression
7. **Security Headers**: HTTP security headers

### Performance Middleware Stack

1. **Query Optimization**: Database query optimization
2. **Caching**: Response and query caching
3. **Compression**: Response compression
4. **Pagination**: Efficient pagination
5. **Connection Pooling**: Database connection management

## Configuration

### Environment Variables

```bash
# Security
SECRET_KEY=<32+ chars>
ENCRYPTION_KEY=<32+ chars>
ENCRYPTION_SALT=<16+ chars>

# Performance
DATABASE_POOL_SIZE=10
DATABASE_MAX_OVERFLOW=20
REDIS_URL=redis://localhost:6379/0

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_PER_HOUR=1000
```

### Database Configuration

```python
# Connection pooling
pool_size=10
max_overflow=20
pool_recycle=3600
pool_pre_ping=True
```

### Cache Configuration

```python
# Redis cache
redis_url="redis://localhost:6379/0"
cache_ttl=300  # 5 minutes
```

## Monitoring

### Performance Monitoring

```bash
# Get query statistics
GET /api/monitoring/query-stats

# Get cache statistics
GET /api/monitoring/cache-stats

# Get connection pool status
GET /api/monitoring/pool-status
```

### Security Monitoring

```bash
# Get security events
GET /api/monitoring/security-events

# Get blocked IPs
GET /api/monitoring/blocked-ips

# Get threat statistics
GET /api/monitoring/threat-stats
```

## Best Practices

### Security

1. **Never commit secrets**: Use environment variables
2. **Rotate keys regularly**: Change secrets periodically
3. **Monitor threats**: Review security logs regularly
4. **Update dependencies**: Keep packages up to date
5. **Use HTTPS**: Always use encrypted connections

### Performance

1. **Monitor slow queries**: Identify and optimize slow queries
2. **Use indexes**: Ensure proper indexing
3. **Cache aggressively**: Cache frequently accessed data
4. **Optimize images**: Use modern formats (AVIF/WebP)
5. **Minimize bundle size**: Code split and tree shake

## Troubleshooting

### Security Issues

**Problem**: IP blocked incorrectly
- **Solution**: Check whitelist, reduce failure threshold

**Problem**: Rate limit too strict
- **Solution**: Adjust rate limits in configuration

**Problem**: False positive threat detection
- **Solution**: Review threat patterns, adjust thresholds

### Performance Issues

**Problem**: Slow queries
- **Solution**: Add indexes, optimize queries, check connection pool

**Problem**: High memory usage
- **Solution**: Reduce cache TTL, limit connection pool size

**Problem**: Slow API responses
- **Solution**: Enable compression, check caching, optimize queries

## Migration Guide

### Applying Performance Indexes

```bash
# Run performance migration
tsx scripts/supabase-migrate-all.ts

# Or manually
supabase db push
```

### Enabling Security Features

```python
# Security middleware is automatically enabled
# Configure via environment variables
ENVIRONMENT=production
SECRET_KEY=<strong-key>
```

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [PostgreSQL Performance](https://www.postgresql.org/docs/current/performance-tips.html)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)

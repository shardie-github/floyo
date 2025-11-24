# Troubleshooting Guide

## Common Issues

### API Errors

#### 401 Unauthorized
**Problem**: Authentication token expired or invalid.

**Solution**:
1. Check token expiration
2. Refresh token or re-login
3. Verify token in Authorization header

#### 429 Too Many Requests
**Problem**: Rate limit exceeded.

**Solution**:
1. Check rate limit headers
2. Implement exponential backoff
3. Reduce request frequency

#### 500 Internal Server Error
**Problem**: Server-side error.

**Solution**:
1. Check server logs
2. Verify database connection
3. Check Redis connection
4. Review error details in response

### Frontend Issues

#### Build Failures
**Problem**: Next.js build fails.

**Solution**:
1. Clear `.next` directory
2. Delete `node_modules` and reinstall
3. Check TypeScript errors
4. Verify environment variables

#### State Not Persisting
**Problem**: Zustand state not persisting.

**Solution**:
1. Check localStorage availability
2. Verify persist middleware configuration
3. Check storage quota

#### Performance Issues
**Problem**: Slow page loads.

**Solution**:
1. Check bundle size
2. Enable code splitting
3. Optimize images
4. Check network requests

### Database Issues

#### Connection Errors
**Problem**: Cannot connect to database.

**Solution**:
1. Verify database URL
2. Check network connectivity
3. Verify credentials
4. Check connection pool limits

#### Migration Errors
**Problem**: Database migrations fail.

**Solution**:
1. Check migration files
2. Verify database schema
3. Run migrations manually
4. Check for conflicts

### Integration Issues

#### Zapier Connection Fails
**Problem**: Cannot connect Zapier.

**Solution**:
1. Verify OAuth credentials
2. Check redirect URI
3. Verify API permissions
4. Check Zapier app status

#### TikTok Ads Connection Fails
**Problem**: Cannot connect TikTok Ads.

**Solution**:
1. Verify API credentials
2. Check OAuth flow
3. Verify account permissions
4. Check TikTok API status

## Debugging

### Enable Debug Logging

**Backend**:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

**Frontend**:
```typescript
localStorage.setItem('debug', 'true');
```

### Check Logs

**Backend Logs**:
- Check application logs
- Review Sentry errors
- Check database logs

**Frontend Logs**:
- Browser console
- Network tab
- React DevTools

## Performance Debugging

### Database Query Performance

```sql
EXPLAIN ANALYZE SELECT * FROM events WHERE user_id = '...';
```

### API Response Times

Check response headers:
- `X-Response-Time`
- `X-Cache-Hit`

### Frontend Performance

Use Chrome DevTools:
- Performance tab
- Lighthouse
- Network tab

## Getting Help

1. Check documentation
2. Search existing issues
3. Create detailed bug report
4. Contact support: support@floyo.app

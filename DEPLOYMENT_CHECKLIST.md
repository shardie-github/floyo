# Deployment Checklist

Use this checklist before deploying to production.

## Pre-Deployment

### Security
- [ ] Change `SECRET_KEY` to a strong random value
- [ ] Update database credentials
- [ ] Configure CORS origins properly
- [ ] Enable HTTPS/TLS
- [ ] Review and test authentication flows
- [ ] Set up rate limiting
- [ ] Enable SQL injection protection
- [ ] Set up firewall rules
- [ ] Review and update dependencies for security vulnerabilities

### Database
- [ ] Set up production PostgreSQL instance
- [ ] Configure database backups
- [ ] Run migrations: `alembic upgrade head`
- [ ] Test database connection
- [ ] Set up connection pooling
- [ ] Enable SSL for database connections
- [ ] Set up database monitoring

### Environment Variables
- [ ] Create production `.env` file
- [ ] Set `DATABASE_URL` for production
- [ ] Set `SECRET_KEY` (strong random value)
- [ ] Configure `CORS_ORIGINS` with actual domain
- [ ] Set `NEXT_PUBLIC_API_URL` for frontend
- [ ] Remove or secure any development values

### Backend
- [ ] Test all API endpoints
- [ ] Verify authentication works
- [ ] Test WebSocket connections
- [ ] Set up logging
- [ ] Configure error handling
- [ ] Set up health check endpoint
- [ ] Test database migrations
- [ ] Configure production ASGI server (Gunicorn/Uvicorn workers)

### Frontend
- [ ] Build production bundle: `npm run build`
- [ ] Test build locally
- [ ] Update API URLs in production
- [ ] Verify all routes work
- [ ] Test authentication flow
- [ ] Check responsive design
- [ ] Verify WebSocket connections
- [ ] Optimize images and assets

### Docker (if using)
- [ ] Update Docker images
- [ ] Test docker-compose.yml
- [ ] Set up production docker-compose
- [ ] Configure resource limits
- [ ] Set up container health checks

## Deployment

### Infrastructure
- [ ] Provision server/cloud instance
- [ ] Set up domain name and DNS
- [ ] Configure load balancer (if needed)
- [ ] Set up SSL certificates
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerts

### Application
- [ ] Deploy backend API
- [ ] Deploy frontend application
- [ ] Deploy database migrations
- [ ] Set up reverse proxy (Nginx/Traefik)
- [ ] Configure static file serving

### Testing
- [ ] Smoke test all endpoints
- [ ] Test authentication
- [ ] Test WebSocket functionality
- [ ] Load testing
- [ ] Security testing
- [ ] Check error pages

## Post-Deployment

### Monitoring
- [ ] Set up application monitoring
- [ ] Configure error tracking (Sentry, etc.)
- [ ] Set up uptime monitoring
- [ ] Configure log aggregation
- [ ] Set up performance monitoring

### Backup & Recovery
- [ ] Test database backups
- [ ] Document recovery procedures
- [ ] Set up automated backups
- [ ] Test restore procedures

### Documentation
- [ ] Update deployment documentation
- [ ] Document environment setup
- [ ] Create runbooks
- [ ] Document rollback procedures

## Production Settings

### Recommended Settings

```env
# Security
SECRET_KEY=<generate-strong-random-key>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Database
DATABASE_URL=postgresql://user:password@host:5432/floyo?sslmode=require

# CORS (replace with actual domain)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# API
API_HOST=0.0.0.0
API_PORT=8000

# Frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Performance Tuning

1. **Database**
   - Enable connection pooling
   - Set appropriate pool sizes
   - Configure query caching
   - Add database indexes

2. **Backend**
   - Use production ASGI server
   - Configure worker processes
   - Enable gzip compression
   - Set up caching (Redis)

3. **Frontend**
   - Enable CDN for static assets
   - Optimize bundle size
   - Enable compression
   - Set up caching headers

### Monitoring Tools

- Application: Sentry, Rollbar
- Infrastructure: Datadog, New Relic, Prometheus
- Logs: ELK Stack, Loki
- Uptime: UptimeRobot, Pingdom

## Rollback Plan

1. Keep previous versions accessible
2. Document rollback commands
3. Test rollback procedure
4. Have database migration rollback ready

## Support

- Document support contacts
- Set up alerting
- Create incident response plan
- Prepare documentation for operations team

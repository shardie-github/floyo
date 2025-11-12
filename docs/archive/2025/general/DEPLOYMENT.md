> Archived on 2025-11-12. Superseded by: (see docs/final index)

# Deployment Guide

This guide covers deployment procedures for Floyo.

## Prerequisites

- Docker and Docker Compose (for containerized deployment)
- PostgreSQL database
- Environment variables configured
- Domain name and SSL certificate (for production)

## Environment Setup

### Required Environment Variables

**Backend (.env or environment)**
```env
DATABASE_URL=postgresql://user:pass@host:5432/floyo
SECRET_KEY=<generate-strong-secret>
SENTRY_DSN=<your-sentry-dsn>
LOG_LEVEL=INFO
ENVIRONMENT=production
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=https://api.floyo.dev
```

### Secrets Management

**Never commit secrets to version control!**

- Use environment variables for secrets
- Use secret management service (AWS Secrets Manager, HashiCorp Vault) in production
- Rotate secrets regularly

## Docker Deployment

### 1. Build Images

```bash
docker-compose build
```

### 2. Start Services

```bash
docker-compose up -d
```

### 3. Initialize Database

```bash
docker-compose exec backend python -c "from backend.database import init_db; init_db()"
```

### 4. Run Migrations (if using Alembic)

```bash
docker-compose exec backend alembic upgrade head
```

### 5. Seed Database (optional, development only)

```bash
docker-compose exec backend python scripts/seed_database.py
```

## Manual Deployment

### Backend Deployment

1. **Set up Python environment**
   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   pip install -r backend/requirements.txt
   ```

2. **Configure environment**
   - Set DATABASE_URL
   - Set SECRET_KEY
   - Configure Sentry (optional)

3. **Run database migrations**
   ```bash
   alembic upgrade head
   ```

4. **Start application**
   ```bash
   # Development
   uvicorn backend.main:app --reload

   # Production (with Gunicorn)
   gunicorn backend.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
   ```

### Frontend Deployment

1. **Build application**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

Or use a process manager like PM2:
```bash
pm2 start npm --name "floyo-frontend" -- start
```

## Production Checklist

- [ ] Environment variables configured
- [ ] Database backups configured
- [ ] SSL/TLS certificates installed
- [ ] Reverse proxy configured (Nginx/Apache)
- [ ] Monitoring and alerting set up
- [ ] Log aggregation configured
- [ ] Error tracking (Sentry) configured
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Database migrations tested
- [ ] Rollback plan documented

## Reverse Proxy Configuration (Nginx)

```nginx
server {
    listen 80;
    server_name api.floyo.dev;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Database Backups

### Automated Backups

Set up cron job for daily backups:

```bash
0 2 * * * pg_dump -U floyo floyo > /backups/floyo-$(date +\%Y\%m\%d).sql
```

### Restore from Backup

```bash
psql -U floyo floyo < /backups/floyo-20240101.sql
```

## Monitoring

### Health Checks

- Backend: `GET http://localhost:8000/`
- Frontend: Check HTTP status code

### Application Monitoring

- Set up Sentry for error tracking
- Configure log aggregation (ELK, CloudWatch, etc.)
- Set up uptime monitoring (Pingdom, UptimeRobot)

## Scaling

### Horizontal Scaling

1. **Backend**: Run multiple instances behind load balancer
2. **Database**: Set up read replicas
3. **Frontend**: Use CDN for static assets

### Vertical Scaling

- Increase server resources
- Optimize database queries
- Add caching layer (Redis)

## Rollback Procedure

1. Stop new deployments
2. Restore previous Docker images or code version
3. Restore database backup if needed
4. Restart services
5. Verify functionality
6. Monitor for issues

## Troubleshooting

### Backend Not Starting

- Check DATABASE_URL is correct
- Verify PostgreSQL is running
- Check port 8000 is available
- Review logs: `docker-compose logs backend`

### Database Connection Issues

- Verify network connectivity
- Check firewall rules
- Test connection: `psql -U floyo -d floyo -h hostname`

### Frontend Build Failures

- Check Node.js version (20+)
- Clear node_modules and reinstall
- Verify environment variables

## Security Considerations

1. **Use HTTPS**: Always in production
2. **Secrets Management**: Never hardcode secrets
3. **Database Access**: Limit to application servers
4. **API Rate Limiting**: Prevent abuse
5. **Input Validation**: Validate all inputs
6. **SQL Injection**: Use ORM, never raw SQL with user input
7. **XSS Protection**: Sanitize user inputs

## CI/CD Integration

Deployments should be automated through CI/CD:

1. Run tests on every commit
2. Build Docker images on successful tests
3. Deploy to staging environment
4. Run smoke tests
5. Deploy to production on manual approval
6. Monitor deployment

See `.github/workflows/cd.yml` for GitHub Actions example.

## Maintenance

### Regular Tasks

- Update dependencies monthly
- Review and rotate secrets quarterly
- Test disaster recovery procedures
- Review and optimize database queries
- Monitor and clean up old data

### Database Maintenance

```sql
-- Vacuum and analyze
VACUUM ANALYZE;

-- Check table sizes
SELECT pg_size_pretty(pg_total_relation_size('events'));
```

## Support

For deployment issues:
1. Check logs: `docker-compose logs`
2. Review environment variables
3. Check database connectivity
4. Consult documentation
5. Open an issue or contact DevOps team

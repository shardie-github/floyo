# Privacy-First Monitoring: Production Deployment Checklist

## Pre-Deployment

### 1. Database Setup
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Verify RLS policies
npm run ops:sb-guard
```

### 2. Environment Variables
```bash
# Required
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-strong-secret-min-32-chars
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional but recommended
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=floyo-exports
CRON_SECRET=your-cron-secret
PRIVACY_KILL_SWITCH=false
```

### 3. Install Dependencies
```bash
cd frontend
npm install
```

### 4. S3 Bucket Setup (if using S3 exports)
1. Create bucket: `floyo-exports`
2. Configure CORS:
   ```json
   [
     {
       "AllowedOrigins": ["*"],
       "AllowedMethods": ["GET", "PUT"],
       "AllowedHeaders": ["*"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
3. Set bucket policy for signed URLs
4. Enable versioning (optional but recommended)

### 5. Cron Job Setup

**Vercel:**
- Already configured in `vercel.json`
- Set `CRON_SECRET` or `VERCEL_CRON_SECRET` in Vercel dashboard

**External (GitHub Actions example):**
```yaml
name: Privacy Cleanup
on:
  schedule:
    - cron: '0 2 * * *'
jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Run cleanup
        run: |
          curl -X POST ${{ secrets.API_URL }}/api/privacy/cron/cleanup \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## Verification Steps

### 1. Test Authentication
```bash
# Test JWT verification
curl -X GET http://localhost:3000/api/privacy/consent \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Test MFA Flow
```bash
# Verify TOTP
curl -X POST http://localhost:3000/api/privacy/mfa/verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"totpCode": "123456", "secret": "USER_SECRET"}'
```

### 3. Test Export
```bash
# Request export
curl -X POST http://localhost:3000/api/privacy/export \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-mfa-session-token: YOUR_MFA_TOKEN"

# Download export
curl -X GET "http://localhost:3000/api/privacy/export/EXPORT_ID?expires=TIMESTAMP" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Test Background Jobs
```bash
# Manual trigger
curl -X POST http://localhost:3000/api/privacy/cron/cleanup \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 5. Run Tests
```bash
# Unit tests
npm test -- tests/privacy-*.test.ts

# Privacy lint
tsx ops/commands/privacy-lint.ts

# Health checks
npm run ops:doctor
```

## Post-Deployment

### 1. Monitor Logs
- Check for authentication errors
- Monitor export/delete operations
- Watch for background job failures

### 2. Verify RLS Policies
```bash
npm run ops:sb-guard
```

### 3. Test User Flows
1. User completes consent wizard
2. User enables monitoring
3. User exports data
4. User deletes data
5. Verify transparency log entries

### 4. Set Up Alerts
- Background job failures
- Export failures
- Authentication errors
- RLS policy violations

## Troubleshooting

### Issue: JWT verification fails
- Check `JWT_SECRET` matches token issuer
- Verify token format (Bearer token)
- Check token expiration

### Issue: TOTP verification fails
- Verify secret is stored correctly
- Check system clock synchronization
- Ensure TOTP code is from correct time window

### Issue: S3 exports fail
- Verify AWS credentials
- Check bucket exists and is accessible
- Verify CORS configuration
- Check IAM permissions

### Issue: Background jobs not running
- Verify cron is configured
- Check CRON_SECRET matches
- Review logs for errors
- Verify database connection

### Issue: RLS violations
- Run `npm run ops:sb-guard`
- Verify `auth.uid()` function works
- Check Supabase RLS is enabled
- Review policy definitions

## Security Checklist

- [ ] JWT_SECRET is strong (32+ chars, random)
- [ ] All environment variables set
- [ ] RLS policies enabled on all privacy tables
- [ ] MFA secrets stored securely
- [ ] S3 bucket has proper CORS and policies
- [ ] CRON_SECRET is set and secure
- [ ] Kill-switch can be activated
- [ ] All API routes require authentication
- [ ] Export links expire after 1 hour
- [ ] Background jobs are secured

## Performance Considerations

- Export jobs may take time for large datasets
- Background jobs run daily (adjust schedule as needed)
- Telemetry events are sampled to reduce volume
- Retention policies auto-clean old data

## Support

- Documentation: `docs/privacy/`
- Setup guide: `docs/privacy/SETUP_GUIDE.md`
- Threat model: `docs/privacy/threat-model.md`
- Policy: `docs/privacy/monitoring-policy.md`

---

*Ready for production! 🚀*

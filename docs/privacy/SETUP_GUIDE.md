# Privacy-First Monitoring: Setup & Integration Guide

## Prerequisites

1. **Database Setup**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

2. **Environment Variables**
   ```bash
   # Required
   DATABASE_URL=postgresql://...
   JWT_SECRET=your-secret-key-min-32-chars
   SUPABASE_URL=https://...
   SUPABASE_SERVICE_ROLE_KEY=...

   # Optional (for S3 exports)
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=floyo-exports

   # Optional (for kill-switch)
   PRIVACY_KILL_SWITCH=false

   # Optional (for cron jobs)
   CRON_SECRET=your-cron-secret
   ```

3. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

## Integration Steps

### 1. Wire JWT Authentication

The auth utilities are already created in `frontend/lib/auth-utils.ts`. They use JWT tokens from the `Authorization: Bearer <token>` header.

**If using Supabase Auth:**
```typescript
// Update getAuthenticatedUser to use Supabase
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getAuthenticatedUser(request: NextRequest): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  const token = authHeader.substring(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) return null;
  
  return {
    userId: user.id,
    email: user.email!,
    emailVerified: user.email_confirmed_at !== null,
  };
}
```

### 2. Set Up TOTP Secrets Storage

Users need to store their TOTP secrets. Add to Prisma schema:

```prisma
model UserTotpSecret {
  id        String   @id @default(uuid())
  userId    String   @unique
  secret    String   // Base32 encoded TOTP secret
  backupCodes String[] // Array of backup codes
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("user_totp_secrets")
}
```

### 3. Configure S3 for Exports (Optional)

1. Create S3 bucket: `floyo-exports`
2. Set CORS policy:
   ```json
   {
     "AllowedOrigins": ["*"],
     "AllowedMethods": ["GET"],
     "AllowedHeaders": ["*"],
     "MaxAgeSeconds": 3600
   }
   ```
3. Set bucket policy for signed URLs
4. Add AWS credentials to environment variables

### 4. Set Up Background Jobs

**Option A: Vercel Cron (Recommended)**
- Already configured in `vercel.json`
- Ensure `CRON_SECRET` is set in Vercel environment variables

**Option B: External Cron (GitHub Actions, etc.)**
```yaml
# .github/workflows/privacy-cleanup.yml
name: Privacy Cleanup
on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM UTC
jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: |
          curl -X POST https://your-domain.com/api/privacy/cron/cleanup \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

**Option C: Manual Script**
```bash
# Run manually
curl -X POST http://localhost:3000/api/privacy/cron/cleanup \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 5. Test the Implementation

```bash
# Run demo script
npm run demo:privacy

# Run tests
npm test -- tests/privacy-*.test.ts

# Run privacy lint
tsx ops/commands/privacy-lint.ts

# Check RLS policies
npm run ops:sb-guard
```

## API Routes Summary

All routes are prefixed with `/api/privacy`:

- `POST /api/privacy/consent` - Update consent (MFA required)
- `GET /api/privacy/consent` - Get consent status
- `GET /api/privacy/apps` - List apps
- `POST /api/privacy/apps` - Update app (MFA required)
- `GET /api/privacy/signals` - List signals
- `POST /api/privacy/signals` - Update signal (MFA required)
- `POST /api/privacy/export` - Export data (MFA required)
- `GET /api/privacy/export/:token` - Download export
- `POST /api/privacy/delete` - Delete data (MFA required)
- `GET /api/privacy/log` - Get transparency log
- `POST /api/privacy/mfa/verify` - Verify TOTP
- `GET /api/privacy/mfa/check` - Check MFA elevation
- `POST /api/privacy/telemetry` - Submit telemetry event

## UI Routes

- `/privacy/onboarding` - Consent wizard
- `/privacy/policy` - Privacy policy
- `/settings/privacy` - Privacy settings

## Security Checklist

- [ ] JWT_SECRET is set and strong (32+ chars)
- [ ] RLS policies are enabled on all privacy tables
- [ ] MFA secrets are stored securely
- [ ] S3 bucket has proper CORS and policies
- [ ] CRON_SECRET is set (if using cron)
- [ ] Kill-switch can be activated if needed
- [ ] All API routes require authentication
- [ ] Export links expire after 1 hour

## Monitoring

Check privacy health:
```bash
npm run ops:doctor
```

This will verify:
- Privacy lint checks
- Policy file presence
- RLS policies
- Database migrations

## Troubleshooting

**Issue: MFA verification fails**
- Check TOTP secret is stored correctly
- Verify TOTP code is from correct time window
- Check system clock synchronization

**Issue: Exports fail**
- Verify S3 credentials are correct
- Check S3 bucket exists and is accessible
- Fallback to local exports if S3 not configured

**Issue: Background jobs not running**
- Verify cron is configured correctly
- Check CRON_SECRET matches
- Review logs for errors

**Issue: RLS policy violations**
- Run `npm run ops:sb-guard` to check policies
- Verify `auth.uid()` function works correctly
- Check Supabase RLS is enabled

## Next Steps

1. **Production Deployment**
   - Set all environment variables
   - Run migrations
   - Configure S3 bucket
   - Set up cron jobs
   - Test all flows

2. **User Onboarding**
   - Direct users to `/privacy/onboarding`
   - Guide them through consent wizard
   - Help them set up MFA

3. **Monitoring**
   - Set up alerts for background job failures
   - Monitor export/delete activity
   - Review transparency logs regularly

4. **Documentation**
   - Share privacy policy with users
   - Create user guides
   - Document API for developers

---

*For questions or issues, see `docs/privacy/` directory or contact support.*

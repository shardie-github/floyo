# Supabase Setup Guide for floyo Project

## Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your **"connect"** organization
3. Click **"New Project"**
4. Fill in:
   - **Name**: `floyo`
   - **Database Password**: (generate a strong password)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free/Pro based on your needs

## Step 2: Get Connection Details

After project creation, navigate to:
- **Settings** → **API**
- Copy:
  - **Project URL** (e.g., `https://xxxxx.supabase.co`)
  - **anon/public key**
  - **service_role key** (keep secret!)

## Step 3: Run Migration

### Option A: Via Supabase Dashboard (Recommended)

1. Go to **SQL Editor** in Supabase Dashboard
2. Click **"New Query"**
3. Copy and paste the contents of `supabase/migrations/20240101000000_initial_schema.sql`
4. Click **"Run"**
5. Verify all tables are created in **Table Editor**

### Option B: Via Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migration
supabase db push
```

## Step 4: Verify Setup

Run the validation script:

```bash
# Set environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run validation
npm run ops sb-guard
```

Or manually verify:

1. **RLS Policies**: Go to **Authentication** → **Policies**
   - All tables should have RLS enabled
   - Each table should have policies for SELECT, INSERT, UPDATE, DELETE

2. **Indexes**: Go to **Database** → **Indexes**
   - Verify all indexes are created

3. **Tables**: Go to **Table Editor**
   - Verify all 12 tables exist:
     - users
     - sessions
     - events
     - patterns
     - relationships
     - subscriptions
     - utm_tracks
     - cohorts
     - feature_flags
     - offers
     - audit_logs
     - retention_policies

## Step 5: Update Environment Variables

Add to your `.env` file:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

## Step 6: Test RLS Policies

Create a test user and verify:
- Users can only see their own data
- Cross-tenant reads fail
- Admin functions work correctly

```sql
-- Test RLS (run as different users)
SET request.jwt.claim.sub = 'user-id-1';
SELECT * FROM events; -- Should only see user-1's events

SET request.jwt.claim.sub = 'user-id-2';
SELECT * FROM events; -- Should only see user-2's events
```

## Security Checklist

- ✅ RLS enabled on all tables
- ✅ Policies enforce user isolation
- ✅ Service role key stored securely
- ✅ No public access to sensitive tables
- ✅ Indexes on all foreign keys
- ✅ Constraints validate data integrity
- ✅ Triggers update timestamps automatically

## Performance Checklist

- ✅ Indexes on frequently queried columns
- ✅ Composite indexes for common queries
- ✅ Partial indexes where appropriate
- ✅ Tables analyzed for query planner
- ✅ No missing indexes on foreign keys

## Troubleshooting

### Migration Fails
- Check for syntax errors in SQL
- Verify extensions are enabled
- Check table names don't conflict

### RLS Too Restrictive
- Verify `auth.uid()` function exists
- Check JWT claims are set correctly
- Review policy conditions

### Performance Issues
- Check index usage with `EXPLAIN ANALYZE`
- Verify indexes are being used
- Consider adding more indexes for slow queries

## Next Steps

1. Set up authentication in your app
2. Configure webhooks (if needed)
3. Set up backups
4. Configure monitoring
5. Run `ops sb-guard` regularly to audit RLS

# Supabase Project Setup Checklist

## Pre-Setup

- [ ] Have Supabase account
- [ ] Have access to "connect" organization
- [ ] Know project requirements (region, plan)

## Project Creation

- [ ] Create project named "floyo" in "connect" organization
- [ ] Set strong database password
- [ ] Choose appropriate region
- [ ] Select pricing plan
- [ ] Wait for project provisioning

## Migration Execution

- [ ] Copy migration SQL (`supabase/migrations/20240101000000_initial_schema.sql`)
- [ ] Open Supabase Dashboard SQL Editor
- [ ] Paste and execute migration
- [ ] Verify no errors in execution
- [ ] Confirm all 12 tables created

## Verification

### Tables
- [ ] users table exists
- [ ] sessions table exists
- [ ] events table exists
- [ ] patterns table exists
- [ ] relationships table exists
- [ ] subscriptions table exists
- [ ] utm_tracks table exists
- [ ] cohorts table exists
- [ ] feature_flags table exists
- [ ] offers table exists
- [ ] audit_logs table exists
- [ ] retention_policies table exists

### RLS Policies
- [ ] RLS enabled on all tables
- [ ] Users can only access own data
- [ ] Policies exist for SELECT, INSERT, UPDATE, DELETE
- [ ] Service role can bypass RLS (for background jobs)

### Indexes
- [ ] Indexes on all foreign keys
- [ ] Indexes on frequently queried columns
- [ ] Composite indexes for common queries
- [ ] No missing critical indexes

### Security
- [ ] Service role key stored securely
- [ ] No public access to sensitive tables
- [ ] Constraints validate data integrity
- [ ] Triggers update timestamps

### Performance
- [ ] Tables analyzed for query planner
- [ ] Indexes optimized for queries
- [ ] No performance warnings

## Configuration

- [ ] Add SUPABASE_URL to .env
- [ ] Add SUPABASE_ANON_KEY to .env
- [ ] Add SUPABASE_SERVICE_ROLE_KEY to .env (secure!)
- [ ] Add DATABASE_URL to .env
- [ ] Update NEXT_PUBLIC_* variables

## Testing

- [ ] Run `ops sb-guard` - no critical issues
- [ ] Run validation queries - all pass
- [ ] Test RLS policies - cross-tenant reads fail
- [ ] Test indexes - queries use indexes
- [ ] Test triggers - updated_at updates automatically

## Post-Setup

- [ ] Set up authentication (if needed)
- [ ] Configure backups
- [ ] Set up monitoring
- [ ] Document connection details (securely)
- [ ] Schedule regular RLS audits

## Troubleshooting

If any step fails:
1. Check Supabase Dashboard logs
2. Verify SQL syntax
3. Check for conflicting objects
4. Review RLS policy conditions
5. Verify indexes are created

## Support

- Supabase Docs: https://supabase.com/docs
- RLS Guide: https://supabase.com/docs/guides/auth/row-level-security
- Migration Guide: https://supabase.com/docs/guides/database/migrations

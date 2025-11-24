# Backend & Database Strategy

**Last Updated:** 2025-01-XX  
**Status:** Canonical backend strategy for Floyo

---

## Executive Summary

**Canonical Backend:** Supabase (PostgreSQL) + Next.js API Routes  
**Database Tooling:** Supabase Migrations (canonical), Prisma (type generation only)  
**Deployment:** Vercel (frontend + API routes), Supabase (database)

**Rationale:** 
- Supabase provides managed PostgreSQL, auth, and edge functions
- Next.js API routes eliminate need for separate backend deployment
- Cost-effective: Vercel free tier + Supabase free tier sufficient for MVP
- CI-first: No local CLI required for migrations or deployments

---

## 1. Database Strategy

### Primary Database: Supabase PostgreSQL

**Why Supabase:**
- ✅ Managed PostgreSQL (no ops overhead)
- ✅ Built-in auth (Supabase Auth)
- ✅ Row Level Security (RLS) policies
- ✅ Edge Functions (serverless)
- ✅ Real-time subscriptions
- ✅ Free tier sufficient for MVP (500MB database, 2GB bandwidth)
- ✅ Automatic backups

**Connection:**
- **Direct:** `DATABASE_URL` (PostgreSQL connection string)
- **Via SDK:** `@supabase/supabase-js` (client + server)

### Schema Management: Supabase Migrations (Canonical)

**Location:** `supabase/migrations/`

**Master Migration:**
- `99999999999999_master_consolidated_schema.sql`
- Single consolidated migration file
- Idempotent (uses `IF NOT EXISTS`)
- Safe to run on fresh databases

**CI Workflow:**
- `.github/workflows/supabase-migrate.yml`
- Runs on `main` push or manual trigger
- Uses Supabase CLI (`supabase migration up`)

**Local Development:**
```bash
# Link to project
supabase link --project-ref $SUPABASE_PROJECT_REF

# Apply migrations
supabase migration up

# Create new migration
supabase migration new <descriptive_name>
```

### Prisma Schema: Type Generation Only

**Status:** ⚠️ **Secondary, for type generation**

**Location:** `prisma/schema.prisma`

**Purpose:**
- TypeScript type generation (if needed)
- **NOT** for migrations (Supabase migrations are canonical)

**Alignment:**
- Prisma schema should mirror Supabase migrations
- If drift occurs, update Prisma schema to match Supabase
- Consider removing Prisma if not actively used

**Commands:**
```bash
# Generate Prisma client (if using Prisma types)
npm run prisma:generate

# Do NOT use prisma migrate (use Supabase migrations instead)
```

**Recommendation:** 
- Keep Prisma schema if actively generating types
- Otherwise, remove Prisma and use Supabase types directly
- Document this decision clearly

---

## 2. Backend API Strategy

### Current State

**FastAPI Backend Exists:**
- Location: `backend/`
- Framework: FastAPI (Python)
- Endpoints: Various API routes (`/api/v1/*`)

**Issue:** ⚠️ **No clear deployment path**

### Recommended Approach: Next.js API Routes

**Why Next.js API Routes:**
- ✅ No separate backend deployment needed
- ✅ Same Vercel deployment as frontend
- ✅ TypeScript (consistent with frontend)
- ✅ Serverless (auto-scaling)
- ✅ Cost-effective (Vercel free tier)

**Migration Path:**
1. **Assess FastAPI Usage:**
   - Review which endpoints are actively used
   - Check if they can be migrated to Next.js API routes

2. **Migrate Critical Routes:**
   - Health checks → `frontend/app/api/health/route.ts` ✅ (exists)
   - Telemetry ingestion → `frontend/app/api/telemetry/route.ts` ✅ (exists)
   - Patterns/insights → `frontend/app/api/insights/route.ts` ✅ (exists)

3. **Keep FastAPI If Needed:**
   - If ML models require Python runtime
   - If background jobs need Celery
   - Deploy separately (Render, Fly.io, Railway)

**Current Next.js API Routes:**
- ✅ `/api/health` - Health checks
- ✅ `/api/telemetry/*` - Telemetry ingestion
- ✅ `/api/insights/*` - Insights & patterns
- ✅ `/api/privacy/*` - Privacy controls
- ✅ `/api/integrations/*` - Third-party integrations
- ✅ `/api/auth/*` - Authentication (Supabase Auth)

**Status:** Most API routes already migrated to Next.js ✅

### Alternative: Deploy FastAPI Separately

**If FastAPI backend is needed:**
- **Options:**
  1. **Render:** Easy Python deployment, free tier
  2. **Fly.io:** Global edge deployment
  3. **Railway:** Simple deployment, pay-as-you-go
  4. **Vercel Serverless Functions:** Python runtime (limited)

**Recommendation:** 
- Assess if FastAPI backend is actively used
- If minimal usage, migrate remaining routes to Next.js
- If substantial, deploy to Render (simplest Python hosting)

---

## 3. Edge Functions Strategy

### Supabase Edge Functions

**Location:** `supabase/functions/`

**Current Functions:**
- `ingest-telemetry/` - Telemetry ingestion
- `analyze-patterns/` - Pattern analysis
- `analyze-performance/` - Performance analysis
- `generate-suggestions/` - Integration suggestions

**Deployment:**
- Via Supabase CLI (in CI)
- Or via Supabase Dashboard

**Use Cases:**
- Background processing
- Scheduled jobs (cron)
- Heavy computation (offload from API routes)

**CI Integration:**
- Add to `.github/workflows/supabase-migrate.yml` or separate workflow
- Deploy functions after migrations

---

## 4. Authentication Strategy

### Supabase Auth (Canonical)

**Why:**
- ✅ Built into Supabase
- ✅ JWT-based sessions
- ✅ Email/password, OAuth providers
- ✅ Row Level Security (RLS) integration
- ✅ No separate auth service needed

**Implementation:**
- Client: `@supabase/supabase-js` (frontend)
- Server: `@supabase/supabase-js` (API routes)
- Sessions: Stored in `sessions` table

**RLS Policies:**
- All tables have RLS enabled
- Policies enforce user isolation
- Service role key bypasses RLS (server-side only)

---

## 5. Background Jobs Strategy

### Current: Celery + Redis

**Status:** ⚠️ **May not be deployed**

**If Needed:**
- **Option 1:** Supabase Edge Functions (cron)
- **Option 2:** Vercel Cron Jobs (via `vercel.json`)
- **Option 3:** Deploy Celery worker separately (Render, Fly.io)

**Recommendation:**
- Use **Vercel Cron** for scheduled jobs (simplest)
- Use **Supabase Edge Functions** for heavy processing
- Only deploy Celery if complex job queue needed

**Current Cron Jobs (in `vercel.json`):**
```json
{
  "crons": [
    {
      "path": "/api/privacy/cron/cleanup",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/metrics/collect",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

✅ Already using Vercel Cron - good!

---

## 6. Caching Strategy

### Current: Redis (Optional)

**Status:** ⚠️ **May not be deployed**

**If Needed:**
- **Option 1:** Vercel KV (Redis-compatible, built-in)
- **Option 2:** Upstash Redis (serverless Redis)
- **Option 3:** Deploy Redis separately (Render, Railway)

**Recommendation:**
- Use **Vercel KV** for simple caching (if on Vercel)
- Use **Upstash Redis** for Celery/background jobs
- Only deploy Redis if complex caching needed

---

## 7. Cost Analysis

### Current Stack Costs

**Free Tier Sufficient for MVP:**
- **Vercel:** Free tier (100GB bandwidth, unlimited requests)
- **Supabase:** Free tier (500MB database, 2GB bandwidth)
- **Total:** $0/month for MVP

**Scaling Costs (when needed):**
- **Vercel Pro:** $20/month (team features, more bandwidth)
- **Supabase Pro:** $25/month (8GB database, 50GB bandwidth)
- **Total:** ~$45/month for production scale

**Cost-Effective Alternatives:**
- **Database:** Neon (serverless Postgres, free tier)
- **Hosting:** Netlify (similar to Vercel, free tier)
- **Backend:** Render (free tier for Python)

**Recommendation:** 
- Start with Supabase + Vercel free tiers
- Scale up when hitting limits
- Document cost thresholds in `docs/cost-and-limits.md`

---

## 8. Migration & Schema Orchestration

### CI-First Migration Workflow

**Workflow:** `.github/workflows/supabase-migrate.yml`

**Triggers:**
- Push to `main` branch
- Manual trigger (`workflow_dispatch`)

**Steps:**
1. Checkout repository
2. Setup Node.js 20
3. Login to Supabase (`supabase login --token $SUPABASE_ACCESS_TOKEN`)
4. Link project (`supabase link --project-ref $SUPABASE_PROJECT_REF`)
5. Apply migrations (`supabase migration up`)

**Required Secrets:**
- `SUPABASE_ACCESS_TOKEN` - Supabase CLI token
- `SUPABASE_PROJECT_REF` - Project reference ID

**Status:** ✅ Already implemented

### Schema Validation

**Current:** No automated validation

**Recommendation:** Add validation script

**Script:** `scripts/db-validate-schema.ts`
```typescript
// Validates core tables exist
// Checks for required columns
// Validates RLS policies
```

**CI Integration:** Add to `supabase-migrate.yml` after migrations

---

## 9. Future Scaling Considerations

### Database Scaling

**Current:** Single PostgreSQL database (Supabase)

**Scaling Path:**
1. **Connection Pooling:** Supabase handles automatically
2. **Read Replicas:** Supabase Pro tier
3. **Sharding:** Not needed until very large scale
4. **Migration:** Can migrate to self-hosted Postgres if needed

### API Scaling

**Current:** Next.js API Routes (serverless)

**Scaling Path:**
1. **Vercel:** Auto-scales serverless functions
2. **Edge Functions:** Move to Supabase Edge Functions for heavy compute
3. **CDN:** Vercel handles automatically
4. **Migration:** Can migrate to dedicated backend if needed

### Background Jobs Scaling

**Current:** Vercel Cron + Supabase Edge Functions

**Scaling Path:**
1. **Vercel Cron:** Sufficient for scheduled jobs
2. **Supabase Edge Functions:** For heavy processing
3. **Migration:** Deploy Celery worker if complex queue needed

---

## 10. Decision Matrix

### Backend Deployment Options

| Option | Pros | Cons | Cost | Recommendation |
|--------|------|------|------|---------------|
| **Next.js API Routes** | ✅ No separate deployment<br>✅ TypeScript<br>✅ Auto-scaling | ⚠️ Limited Python/ML support | Free (Vercel) | ✅ **Recommended** |
| **Supabase Edge Functions** | ✅ Serverless<br>✅ Integrated with DB | ⚠️ Deno runtime (not Python) | Free tier | ✅ **For background jobs** |
| **Render (FastAPI)** | ✅ Easy Python deployment<br>✅ Free tier | ⚠️ Separate service<br>⚠️ More ops | Free tier | ⚠️ **If Python needed** |
| **Fly.io** | ✅ Global edge<br>✅ Docker support | ⚠️ More complex setup | Pay-as-you-go | ⚠️ **For global scale** |

### Database Options

| Option | Pros | Cons | Cost | Recommendation |
|--------|------|------|------|---------------|
| **Supabase** | ✅ Managed Postgres<br>✅ Auth built-in<br>✅ RLS policies | ⚠️ Vendor lock-in | Free tier | ✅ **Current (keep)** |
| **Neon** | ✅ Serverless Postgres<br>✅ Branching | ⚠️ No auth/RLS | Free tier | ⚠️ **Alternative** |
| **Self-hosted** | ✅ Full control | ⚠️ Ops overhead | VPS cost | ❌ **Not recommended** |

---

## 11. Action Items

### Immediate
- [x] Document backend strategy
- [ ] Assess FastAPI backend usage
- [ ] Decide on FastAPI deployment or migration
- [ ] Align Prisma schema with Supabase migrations (or remove Prisma)

### Short-Term
- [ ] Add schema validation script
- [ ] Add schema validation to CI
- [ ] Document cost thresholds
- [ ] Create migration rollback procedure

### Long-Term
- [ ] Plan for database scaling
- [ ] Plan for API scaling
- [ ] Consider multi-region deployment

---

## 12. References

- [Supabase Migrations Guide](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

**Last Updated:** 2025-01-XX  
**Status:** ✅ Strategy Documented

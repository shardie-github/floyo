# ✅ Migration & Seed Data - COMPLETE

**Date:** 2025-01-XX  
**Status:** ✅ **READY TO RUN**

## 🎯 What Was Done

### 1. NPS Migration Added ✅

**Migration File:** `supabase/migrations/99999999999999_master_consolidated_schema.sql`

**Added:**
- `nps_submissions` table
- Indexes for performance
- RLS policies for security
- `calculate_nps_score()` function
- Grants for authenticated users

**Prisma Schema:** `prisma/schema.prisma`

**Added:**
- `NPSSubmission` model
- Relation to `User` model

### 2. Seed Data Scripts Created ✅

**Production Seed:** `scripts/seed-production.ts`
- Creates 3 demo users (Free, Pro, Enterprise)
- Generates events (100-500 per user)
- Creates patterns from events
- Creates subscriptions (Pro & Enterprise)
- Generates NPS submissions (promoters, passives, detractors)

**Custom Seed:** `scripts/generate-sample-data.ts` (updated)
- Now actually inserts data into database
- Creates events and patterns
- Uses Prisma for database operations

**Automated Script:** `scripts/run-seed-and-migration.sh`
- Runs everything automatically
- Checks prerequisites
- Applies migration
- Generates seed data

---

## 🚀 How to Run

### Quick Start (Recommended)

```bash
# Run everything automatically
npm run seed:run
```

This will:
1. ✅ Check Prisma schema
2. ✅ Generate Prisma client
3. ✅ Check Supabase migration
4. ✅ Apply migration (if Supabase linked)
5. ✅ Generate seed data

### Manual Steps

**Step 1: Generate Prisma Client**

```bash
npm run prisma:generate
```

**Step 2: Apply Migration**

**Option A: Via CI/CD (Automatic)**
- Push to main branch
- Migration applied automatically by `supabase-migrate.yml`

**Option B: Manual**
```bash
# Link to Supabase
npx supabase link --project-ref <your-project-ref>

# Apply migration
npx supabase migration up
```

**Step 3: Generate Seed Data**

```bash
# Production seed (creates demo users + data)
npm run seed:production

# Or custom seed for existing user
npm run generate-sample-data -- --userId <user-id> --events 100
```

---

## 📊 What Gets Created

### Production Seed (`npm run seed:production`)

**Users:**
- `demo@floyo.dev` - Free tier
- `demo-pro@floyo.dev` - Pro tier (with subscription)
- `demo-enterprise@floyo.dev` - Enterprise tier (with subscription)

**Data:**
- **Events:** 100-500 per user (spread over 30 days)
- **Patterns:** Auto-generated from events
- **Subscriptions:** Pro ($29/mo) and Enterprise ($99/mo)
- **NPS Submissions:** 20+ submissions (mix of promoters/passives/detractors)

### Expected Database State

After running seed data:

```
users: 3+ (demo users + any existing)
events: 400+ (100 + 200 + 500)
patterns: 10+ (various file extensions)
subscriptions: 2 (Pro + Enterprise)
nps_submissions: 20+ (sample NPS data)
```

---

## ✅ Verification Steps

### 1. Check Migration Applied

**Via Supabase Dashboard:**
1. Go to Supabase Dashboard → Database → Tables
2. Look for `nps_submissions` table
3. Verify columns: id, user_id, score, feedback, category, submitted_at

**Via SQL:**
```sql
SELECT COUNT(*) FROM nps_submissions;
```

**Via Prisma Studio:**
```bash
npm run prisma:studio
# Navigate to NPSSubmission model
```

### 2. Check Seed Data

**Via Prisma Studio:**
```bash
npm run prisma:studio
```

**Check:**
- Users → Should see demo@floyo.dev, demo-pro@floyo.dev, demo-enterprise@floyo.dev
- Events → Should see many events
- Patterns → Should see patterns for each user
- Subscriptions → Should see Pro and Enterprise subscriptions
- NPSSubmissions → Should see NPS submissions

**Via API:**
```bash
# Check NPS score
curl http://localhost:3000/api/admin/nps

# Check revenue
curl http://localhost:3000/api/admin/revenue
```

**Via Dashboards:**
- NPS Dashboard: `/admin/nps`
- Revenue Dashboard: `/admin/revenue`

---

## 🐛 Troubleshooting

### Migration Not Applied

**Symptoms:**
- `nps_submissions` table doesn't exist
- Prisma errors about missing table

**Solution:**
```bash
# Apply migration manually
npx supabase migration up

# Or wait for CI/CD to apply (on push to main)
```

### Seed Data Fails

**Error:** "Prisma client not generated"

**Solution:**
```bash
npm run prisma:generate
```

**Error:** "User not found"

**Solution:**
- Run `npm run seed:production` (creates users automatically)
- Or create user first, then use `npm run generate-sample-data -- --userId <id>`

**Error:** "Database connection failed"

**Solution:**
1. Check `DATABASE_URL` environment variable
2. Verify Supabase project is accessible
3. Test connection: `psql $DATABASE_URL -c "SELECT 1"`

### Prisma Model Not Found

**Error:** "nPSSubmission is not defined"

**Solution:**
1. Regenerate Prisma client: `npm run prisma:generate`
2. Check Prisma schema has `NPSSubmission` model
3. Restart TypeScript server (if using IDE)

---

## 📋 Complete Checklist

### Before Running

- [ ] Prisma schema updated (`NPSSubmission` model exists)
- [ ] Migration file updated (NPS table in master schema)
- [ ] `DATABASE_URL` environment variable set
- [ ] Supabase project accessible (if applying migration manually)

### Running

- [ ] Generate Prisma client: `npm run prisma:generate`
- [ ] Apply migration: `npx supabase migration up` (or via CI/CD)
- [ ] Run seed data: `npm run seed:production`

### After Running

- [ ] Verify users created (3 demo users)
- [ ] Verify events created (400+ events)
- [ ] Verify patterns created (10+ patterns)
- [ ] Verify subscriptions created (2 subscriptions)
- [ ] Verify NPS submissions created (20+ submissions)
- [ ] Check NPS dashboard (`/admin/nps`) - should show NPS score
- [ ] Check revenue dashboard (`/admin/revenue`) - should show MRR

---

## 🎯 Expected Results

### After Running `npm run seed:production`

**Console Output:**
```
🌱 Starting production seed data generation...

👤 Creating demo users...
  ✓ Created user: demo@floyo.dev (uuid)
  ✓ Created user: demo-pro@floyo.dev (uuid)
  ✓ Created user: demo-enterprise@floyo.dev (uuid)

💳 Creating subscriptions...
  ✓ Created Pro subscription for demo-pro@floyo.dev
  ✓ Created Enterprise subscription for demo-enterprise@floyo.dev

📊 Creating 100 events for user uuid...
  ✓ Inserted 100 events

📊 Creating 200 events for user uuid...
  ✓ Inserted 200 events

📊 Creating 500 events for user uuid...
  ✓ Inserted 500 events

🔍 Creating patterns from events...
  ✓ Created/updated 12 patterns

⭐ Creating NPS submissions...
  ✓ Created 23 NPS submissions

✅ Production seed data generation complete!

Summary:
  - Users: 3
  - Events: 800
  - NPS Submissions: Created
```

### Database State

**Users Table:**
- 3 demo users
- Email addresses: demo@floyo.dev, demo-pro@floyo.dev, demo-enterprise@floyo.dev

**Events Table:**
- 800+ events total
- Spread across 3 users
- Various file types and tools

**Patterns Table:**
- 10+ patterns
- Based on file extensions
- Tools associated

**Subscriptions Table:**
- 2 active subscriptions
- 1 Pro ($29/mo)
- 1 Enterprise ($99/mo)

**NPS Submissions Table:**
- 20+ submissions
- Mix of promoters (9-10), passives (7-8), detractors (0-6)
- Sample feedback included

---

## 🎁 Bonus Features

### NPS Score Calculation

After seed data is generated, you can check the NPS score:

```bash
# Via API
curl http://localhost:3000/api/admin/nps

# Expected response:
{
  "score": 45.5,  // Example NPS score
  "count": 23,
  "promoters": 15,
  "passives": 5,
  "detractors": 3
}
```

### Revenue Calculation

Check revenue metrics:

```bash
# Via API
curl http://localhost:3000/api/admin/revenue

# Expected response:
{
  "mrr": 128,  // $29 (Pro) + $99 (Enterprise)
  "arr": 1536,  // MRR * 12
  "totalCustomers": 3,
  "churnRate": 0,
  "planDistribution": {
    "free": 1,
    "pro": 1,
    "enterprise": 1
  }
}
```

---

## 📚 Related Documentation

- [Seed Data Guide](./docs/seed-data.md) - Complete seed data documentation
- [Database Migrations](./docs/db-migrations-and-schema.md) - Migration strategy
- [NPS Tools](./docs/nps-tools.md) - NPS system guide
- [Financial Tools](./docs/financial-tools.md) - Revenue tracking

---

## ✅ Status

**Migration:** ✅ Added to master consolidated schema  
**Prisma Schema:** ✅ Updated with NPSSubmission model  
**Seed Scripts:** ✅ Created and ready  
**Documentation:** ✅ Complete  

**Ready to Run:** ✅ **YES**

---

**Next Steps:**
1. Run `npm run seed:run` (automated)
2. Or follow manual steps above
3. Verify data in Prisma Studio
4. Check dashboards (`/admin/nps`, `/admin/revenue`)

---

**Last Updated:** 2025-01-XX  
**Status:** ✅ **READY**

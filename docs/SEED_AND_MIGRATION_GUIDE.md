# Seed Data & Migration Guide

**Purpose:** Complete guide to applying migrations and generating seed data

## 🚀 Quick Start

### Option 1: Automated Script (Recommended)

```bash
# Run everything automatically
npm run seed:run
```

This script will:
1. Check Prisma schema
2. Generate Prisma client
3. Check Supabase migration
4. Apply migration (if Supabase linked)
5. Generate seed data

### Option 2: Manual Steps

**Step 1: Apply Migration**

```bash
# Link to Supabase (if not already linked)
npx supabase link --project-ref <your-project-ref>

# Apply migrations
npx supabase migration up

# Or apply via CI/CD (automatic on push to main)
```

**Step 2: Generate Prisma Client**

```bash
npm run prisma:generate
```

**Step 3: Generate Seed Data**

```bash
# Production seed data (creates demo users, events, patterns, NPS)
npm run seed:production

# Or custom seed data
npm run generate-sample-data -- --userId <user-id> --events 100 --daysBack 30
```

---

## 📊 What Gets Created

### Production Seed Data (`npm run seed:production`)

**Users Created:**
1. `demo@floyo.dev` - Free tier user
2. `demo-pro@floyo.dev` - Pro tier user (with subscription)
3. `demo-enterprise@floyo.dev` - Enterprise tier user (with subscription)

**Data Generated:**
- **Events:** 100-500 events per user (spread over 30 days)
- **Patterns:** Auto-generated from events
- **Subscriptions:** Pro and Enterprise subscriptions
- **NPS Submissions:** Sample NPS responses (promoters, passives, detractors)

### Custom Seed Data (`npm run generate-sample-data`)

**For Specific User:**
- Events (customizable count)
- Patterns (auto-generated)
- Insights (auto-generated)

---

## 🔄 Migration Process

### NPS Migration

**Migration File:** `supabase/migrations/99999999999999_master_consolidated_schema.sql`

**What It Creates:**
- `nps_submissions` table
- Indexes for performance
- RLS policies for security
- `calculate_nps_score()` function

**Applied Via:**
- CI/CD: Automatic on push to main (`supabase-migrate.yml`)
- Manual: `npx supabase migration up`
- Script: `npm run migration:apply`

### Prisma Schema Update

**Schema File:** `prisma/schema.prisma`

**What Was Added:**
- `NPSSubmission` model
- Relation to `User` model

**Generate Client:**
```bash
npm run prisma:generate
```

---

## ✅ Verification

### Check Migration Applied

**Via Supabase Dashboard:**
1. Go to Supabase Dashboard
2. Database → Tables
3. Look for `nps_submissions` table

**Via SQL:**
```sql
SELECT * FROM nps_submissions LIMIT 1;
```

**Via Prisma Studio:**
```bash
npm run prisma:studio
# Navigate to NPSSubmission model
```

### Check Seed Data

**Via Prisma Studio:**
```bash
npm run prisma:studio
# Check:
# - Users (demo@floyo.dev, etc.)
# - Events (should have many events)
# - Patterns (should have patterns)
# - Subscriptions (Pro and Enterprise)
# - NPSSubmissions (should have submissions)
```

**Via API:**
```bash
# Check NPS score
curl http://localhost:3000/api/admin/nps

# Check revenue
curl http://localhost:3000/api/admin/revenue
```

---

## 🐛 Troubleshooting

### Migration Fails

**Error:** "relation nps_submissions does not exist"

**Solution:**
1. Check migration file exists
2. Apply migration: `npx supabase migration up`
3. Verify in Supabase Dashboard

### Seed Data Fails

**Error:** "User not found"

**Solution:**
1. Create user first (via sign-up or Prisma Studio)
2. Use existing user ID
3. Or run `npm run seed:production` (creates users automatically)

**Error:** "Prisma client not generated"

**Solution:**
```bash
npm run prisma:generate
```

### Database Connection Issues

**Error:** "Can't reach database"

**Solution:**
1. Check `DATABASE_URL` environment variable
2. Verify Supabase project is accessible
3. Check network connectivity

---

## 📋 Complete Checklist

### Before Running Seed Data

- [ ] Prisma schema updated (NPSSubmission model)
- [ ] Migration file created/updated
- [ ] Prisma client generated (`npm run prisma:generate`)
- [ ] Database connection configured (`DATABASE_URL`)
- [ ] Supabase project linked (if applying migration manually)

### Running Seed Data

- [ ] Run `npm run seed:production` OR
- [ ] Run `npm run seed:run` (automated)

### After Running Seed Data

- [ ] Verify users created (Prisma Studio)
- [ ] Verify events created (Prisma Studio)
- [ ] Verify patterns created (Prisma Studio)
- [ ] Verify NPS submissions created (Prisma Studio)
- [ ] Check NPS dashboard (`/admin/nps`)
- [ ] Check revenue dashboard (`/admin/revenue`)

---

## 🎯 Expected Results

### After Running `npm run seed:production`

**Users:**
- 3 demo users created
- 1 Free tier
- 1 Pro tier (with subscription)
- 1 Enterprise tier (with subscription)

**Events:**
- 100+ events for free user
- 200+ events for pro user
- 500+ events for enterprise user

**Patterns:**
- Multiple patterns per user
- Based on file extensions used
- Tools associated with patterns

**NPS Submissions:**
- 20+ NPS submissions
- Mix of promoters, passives, detractors
- Sample feedback included

---

## 🔄 Re-running Seed Data

### Clear Existing Seed Data

```bash
# Clear seed data (optional)
npm run clear-seed-data
```

### Re-generate Seed Data

```bash
# Re-run seed generation
npm run seed:production
```

**Note:** Seed data scripts use `upsert` for patterns, so re-running is safe.

---

## 📊 Seed Data for Different Environments

### Development

```bash
# Generate minimal data for local testing
npm run generate-sample-data -- --userId <dev-user-id> --events 50 --daysBack 7
```

### Staging

```bash
# Generate realistic data for staging
npm run seed:production
```

### Production Demo

```bash
# Generate demo data for production
npm run seed:production
# Then manually review and approve data
```

---

## 🎁 Bonus: Sample NPS Data

The seed script creates realistic NPS submissions:

**Promoters (9-10):**
- "Love how Floyo automatically detects my patterns!"
- "The integration suggestions are spot-on."
- "Saves me hours every week."

**Passives (7-8):**
- "It's okay, could use more features."
- "Works well but needs improvement."

**Detractors (0-6):**
- "Too many false positives."
- "Needs better documentation."

---

## 📚 Related Documentation

- [Seed Data Guide](./seed-data.md) - Complete seed data documentation
- [Database Migrations](./db-migrations-and-schema.md) - Migration strategy
- [Backend Deployment](./backend-deployment.md) - Deployment guide

---

**Last Updated:** 2025-01-XX  
**Maintained By:** Unified Background Agent

# 🌱 Seed Data & Migration - Quick Start

## ✅ What's Ready

1. **NPS Migration** - Added to master consolidated schema
2. **Prisma Schema** - Updated with NPSSubmission model  
3. **Seed Scripts** - Production seed data generator ready
4. **Automated Script** - One-command setup

---

## 🚀 Run Everything (One Command)

```bash
npm run seed:run
```

This automatically:
- ✅ Checks Prisma schema
- ✅ Generates Prisma client
- ✅ Checks Supabase migration
- ✅ Applies migration (if Supabase linked)
- ✅ Generates seed data

---

## 📋 Manual Steps (If Needed)

### Step 1: Generate Prisma Client

```bash
npm run prisma:generate
```

### Step 2: Apply Migration

**Option A: Via CI/CD (Recommended)**
- Push to main branch
- Migration applied automatically

**Option B: Manual**
```bash
npx supabase link --project-ref <your-project-ref>
npx supabase migration up
```

### Step 3: Generate Seed Data

```bash
# Production seed (creates demo users + all data)
npm run seed:production

# Or custom seed for existing user
npm run generate-sample-data -- --userId <user-id> --events 100
```

---

## 📊 What Gets Created

**Users:**
- `demo@floyo.dev` - Free tier
- `demo-pro@floyo.dev` - Pro tier ($29/mo)
- `demo-enterprise@floyo.dev` - Enterprise tier ($99/mo)

**Data:**
- 800+ events (100 + 200 + 500)
- 10+ patterns
- 2 subscriptions (Pro + Enterprise)
- 20+ NPS submissions

---

## ✅ Verify

**Prisma Studio:**
```bash
npm run prisma:studio
```

**Dashboards:**
- NPS: `/admin/nps`
- Revenue: `/admin/revenue`

---

## 📚 Full Documentation

See `docs/SEED_AND_MIGRATION_GUIDE.md` for complete guide.

---

**Status:** ✅ **READY TO RUN**

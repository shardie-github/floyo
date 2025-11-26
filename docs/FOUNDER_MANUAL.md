# Founder Manual - Floyo

**Purpose:** Non-technical guide for founders to understand and operate Floyo.

**Last Updated:** 2025-01-20

---

## Section 1: MUST DO NOW (Blockers)

### 1.1 Fill in Team Information

**File:** `/yc/YC_TEAM_NOTES.md`

**Status:** ✅ Updated with Scott Hardie's information

**Current Team:**
- **Scott Hardie** - Founder, CEO & Operator
- GitHub: shardie-github | LinkedIn: /scottrmhardie
- Email: scottrmhardie@gmail.com

**What to add (optional):**
- Education background (schools, degrees)
- Previous companies/roles (if applicable)
- Notable achievements (awards, publications)
- Co-founder information (if applicable)

**Why:** Required for YC application and investor conversations.

---

### 1.2 Get Real User Metrics

**File:** `/yc/YC_PRODUCT_OVERVIEW.md`

**What to do:**
1. Query database for current user counts:
   ```sql
   SELECT COUNT(*) as total_users FROM users;
   SELECT COUNT(*) as active_users_30d FROM users WHERE last_active_at >= NOW() - INTERVAL '30 days';
   ```
2. Update `/yc/YC_PRODUCT_OVERVIEW.md` with real numbers
3. Update `/yc/YC_INTERVIEW_CHEATSHEET.md` with metrics snapshot

**Why:** Investors will ask "How many users do you have?" - you need real numbers.

---

### 1.3 Document Traction (If Any)

**File:** `/yc/YC_METRICS_CHECKLIST.md`

**What to do:**
- If you have paying customers: Document MRR, number of paying customers
- If you have beta users: Document number of beta users, testimonials
- If you have early adopters: Document signups, engagement metrics

**Why:** Traction is the strongest signal for investors.

---

### 1.4 Set Up GitHub Secrets (If Not Done)

**Where:** GitHub → Repository → Settings → Secrets and variables → Actions

**Required Secrets:**
- `VERCEL_TOKEN` - Get from [Vercel Dashboard → Tokens](https://vercel.com/account/tokens)
- `VERCEL_ORG_ID` - Get from Vercel Dashboard → Organization Settings
- `VERCEL_PROJECT_ID` - Get from Vercel Dashboard → Project Settings
- `SUPABASE_ACCESS_TOKEN` - Get from [Supabase Dashboard → Access Tokens](https://supabase.com/dashboard/account/tokens)
- `SUPABASE_PROJECT_REF` - Your Supabase project reference ID

**Why:** Required for automated deployments.

---

## Section 2: DO THIS SOON (NEXT)

### 2.1 Conduct User Validation Interviews

**Target:** 10-20 interviews with Solo E-commerce Operators and Solo Full-Stack Developers

**What to ask:**
- Problem urgency (1-10 scale)
- Current workarounds
- Willingness to pay
- Feature priorities

**Where to document:** `/yc/VALIDATION_INTERVIEWS.md` (create if doesn't exist)

**Why:** Validates problem-solution fit before building more features.

---

### 2.2 Define North Star Metric

**File:** `/yc/YC_METRICS_CHECKLIST.md`

**What to do:**
- Define your North Star metric (e.g., "Integrations implemented per user per month")
- Document why this metric matters
- Set up tracking (if not already)

**Why:** Helps focus product development and measure progress.

---

### 2.3 Build Metrics Dashboard

**File:** `/yc/YC_METRICS_DASHBOARD_SKETCH.md`

**What to build:**
- DAU/WAU/MAU display
- Activation rate
- Retention cohorts
- Revenue metrics (MRR, ARR)

**Why:** You can't improve what you don't measure.

---

### 2.4 Execute Distribution Experiments

**File:** `/yc/YC_DISTRIBUTION_PLAN.md`

**Experiments to run:**
1. Product Hunt launch
2. Hacker News post
3. Twitter account and content
4. SEO landing pages

**Why:** Need to prove you can acquire users.

---

## Section 3: NICE TO HAVE LATER

### 3.1 Create Financial Model

**File:** `/yc/YC_FINANCIAL_MODEL.md`

**What to include:**
- 12-24 month projections
- Unit economics (CAC, LTV)
- Runway calculation
- Funding needs (if applicable)

**Why:** Helps with fundraising and planning.

---

### 3.2 Optimize SEO

**What to do:**
- Create SEO-optimized landing pages (`/frontend/app/use-cases/`)
- Add blog system (`/frontend/app/blog/`)
- Optimize meta tags and structured data

**Why:** Organic growth channel.

---

### 3.3 Build Referral System

**Files:** `/backend/api/referral.py`, `/frontend/app/invite/page.tsx`

**What to build:**
- Referral code generation
- Referral tracking
- Referral incentives

**Why:** Viral growth lever.

---

## Section 4: Quick Reference

### Key Commands

```bash
# Local development
cd frontend && npm run dev

# Run tests
npm test

# Deploy (automatic via GitHub Actions)
git push origin main  # Triggers deployment

# Check deployment status
# Go to GitHub → Actions tab
```

### Key Files

- **Setup:** `docs/SETUP_LOCAL.md`
- **YC Docs:** `/yc/` directory
- **Deployment:** `docs/frontend-deploy-vercel-ci.md`
- **Environment:** `.env.example`

### Key URLs

- **Local Dev:** http://localhost:3000
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://supabase.com/dashboard
- **GitHub Actions:** https://github.com/[repo]/actions

### Key Metrics to Track

1. **Users:** Total, active (30d), paid
2. **Activation:** % of users who discover first integration suggestion
3. **Retention:** Day 1, Day 7, Day 30 retention
4. **Revenue:** MRR, ARR, ARPU
5. **Growth:** Weekly/monthly growth rate

**Where to track:** `/yc/YC_METRICS_CHECKLIST.md` (once dashboard is built)

---

## Common Questions

**Q: How do I deploy to production?**  
A: Push to `main` branch. GitHub Actions handles deployment automatically.

**Q: How do I add a new feature?**  
A: Create feature branch → Make changes → Run tests → Create PR → Merge to `main`

**Q: How do I check if deployment succeeded?**  
A: Go to GitHub → Actions tab → Check latest workflow run

**Q: Where do I update product description?**  
A: `/yc/YC_PRODUCT_OVERVIEW.md` and `README.md`

**Q: How do I add environment variables?**  
A: Add to `.env.example` (for documentation) and Vercel Dashboard (for production)

---

## Getting Help

- **Technical Issues:** Check `/docs/` directory
- **YC Prep:** Check `/yc/` directory
- **Deployment Issues:** Check `docs/frontend-deploy-vercel-ci.md`
- **Database Issues:** Check `docs/supabase-migrations-ci.md`

---

**Status:** ✅ Ready for founder use

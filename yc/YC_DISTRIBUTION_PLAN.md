# YC Distribution Plan - Floyo

**Last Updated:** 2025-01-20  
**Status:** Draft - Based on repo analysis, founders to validate and execute

---

## Current User Acquisition Channels (Inferred from Repo)

### 1. Product Hunt Launch
**Status:** Planned (mentioned in `/docs/GTM_MATERIALS.md`)  
**Evidence:** Launch plan includes Product Hunt  
**Implementation:** `/frontend/` - Need landing page optimized for Product Hunt

**Goal Metric:** 500+ upvotes, #1 Product of the Day  
**How to Measure:** Product Hunt analytics, UTM tracking (`utm_tracks` table)

---

### 2. Hacker News
**Status:** Planned (mentioned in `/docs/GTM_MATERIALS.md`)  
**Evidence:** Technical audience focus  
**Implementation:** Need "Show HN" post with demo

**Goal Metric:** Front page, 100+ upvotes, 50+ signups  
**How to Measure:** UTM tracking (`utm_tracks` table with `source=hn`)

---

### 3. Twitter/X
**Status:** Planned (mentioned in `/docs/GTM_MATERIALS.md`)  
**Evidence:** Developer community focus  
**Implementation:** Need Twitter account, shareable demo videos

**Goal Metric:** 1,000+ followers, 10+ retweets per post  
**How to Measure:** UTM tracking (`utm_tracks` table with `source=twitter`)

---

### 4. GitHub
**Status:** Partially implemented (CLI tool is open source)  
**Evidence:** `/floyo/` CLI tool, GitHub Actions workflows  
**Implementation:** 
- Open source CLI tool (`/floyo/`)
- GitHub README with clear value prop
- GitHub Marketplace integration (future)

**Goal Metric:** 1,000+ stars, 100+ forks  
**How to Measure:** GitHub API, UTM tracking from GitHub

---

### 5. Content Marketing / Blog
**Status:** Planned (mentioned in `/docs/GTM_MATERIALS.md`)  
**Evidence:** Blog mentioned in marketing channels  
**Implementation:** Need blog setup, SEO optimization

**Goal Metric:** 10+ blog posts, 1,000+ monthly visitors  
**How to Measure:** Google Analytics, UTM tracking

---

## Likely Short-Term Channels (Low-Hanging Fruit)

### 1. Developer Communities
**Channels:**
- Reddit: r/programming, r/webdev, r/SideProject
- Discord: Developer servers
- Slack: Developer communities

**Implementation Path:**
- Create shareable demo (GIF/video)
- Post in relevant communities with value-first approach
- Engage authentically (don't just promote)

**Goal Metric:** 50+ signups per week from communities  
**How to Measure:** UTM tracking (`utm_tracks` table with `source=reddit`, `source=discord`)

**Files to Update:**
- `/frontend/public/demo.gif` - Create demo video
- `/docs/demo-script.md` - Already exists! Use for demo content

---

### 2. Integration Partnerships
**Channels:**
- Zapier (integration marketplace)
- GitHub Marketplace
- Shopify App Store (for e-commerce users)

**Implementation Path:**
- Build Zapier integration (already have Zapier support in schema)
- Submit to Zapier marketplace
- Create integration templates

**Goal Metric:** 100+ integrations created via partnerships  
**How to Measure:** Track `user_integrations` table with `provider=zapier`

**Files to Update:**
- `/backend/integrations/zapier/` - Create Zapier integration
- `/docs/INTEGRATION_SETUP.md` - Document integration process

---

### 3. Referral Program
**Status:** Not implemented  
**Evidence:** No referral tracking in schema  
**Implementation Path:**
- Add referral code system to `users` table
- Create referral landing page
- Incentivize referrals (free month, discount)

**Goal Metric:** 20% of signups from referrals  
**How to Measure:** Track `referral_code` in `users` table

**Files to Create:**
- `/supabase/migrations/YYYYMMDD_referral_system.sql` - Add referral columns
- `/frontend/app/referral/` - Referral landing page
- `/backend/api/referral.py` - Referral API endpoints

---

## 3-5 Concrete Growth Experiments

### Experiment 1: Add Invite Flow
**Goal:** Increase viral coefficient  
**Goal Metric:** 1.2+ invites per user, 30%+ conversion from invites  
**Implementation Path:**

1. **Backend:** Add invite system
   ```python
   # Add to database/models.py
   class Invite:
       id: str
       inviter_id: str  # User who sent invite
       invitee_email: str
       code: str  # Unique invite code
       used: bool
       created_at: datetime
   ```

2. **Frontend:** Add invite UI
   - `/frontend/app/invite/` - Invite page
   - Add "Invite Friends" button to dashboard
   - Show invite rewards (free month, etc.)

3. **Email:** Send invite emails
   - Use Supabase Edge Functions or SendGrid
   - Track opens/clicks

**How to Measure Success:**
- Track `invites` table: `invites_sent`, `invites_used`
- Calculate viral coefficient: `invites_used / total_users`
- Target: 1.2+ (each user brings 1.2 new users)

**Files to Create/Update:**
- `/supabase/migrations/YYYYMMDD_invites.sql`
- `/frontend/app/invite/page.tsx`
- `/backend/api/invite.py`

---

### Experiment 2: SEO Landing Pages for Niche Use Cases
**Goal:** Capture long-tail search traffic  
**Goal Metric:** 100+ monthly organic signups from SEO  
**Implementation Path:**

1. **Identify Niches:**
   - "Shopify automation tools"
   - "Developer productivity tracking"
   - "Zapier alternatives"
   - "Privacy-first workflow tools"

2. **Create Landing Pages:**
   - `/frontend/app/use-cases/shopify-automation/`
   - `/frontend/app/use-cases/developer-productivity/`
   - `/frontend/app/use-cases/zapier-alternative/`

3. **SEO Optimization:**
   - Target keywords in titles/meta
   - Add structured data (JSON-LD)
   - Internal linking
   - Blog posts for each niche

**How to Measure Success:**
- Google Search Console: Track impressions/clicks
- UTM tracking: `source=google`, `medium=organic`
- Target: 100+ monthly organic signups

**Files to Create:**
- `/frontend/app/use-cases/[niche]/page.tsx` - Landing pages
- `/frontend/app/blog/[slug]/page.tsx` - Blog posts
- `/frontend/lib/seo.ts` - SEO utilities

---

### Experiment 3: Integrate with Platform Y (GitHub Marketplace)
**Goal:** Reach developers where they already are  
**Goal Metric:** 500+ GitHub Marketplace installs, 50+ conversions  
**Implementation Path:**

1. **GitHub App:**
   - Create GitHub App (OAuth)
   - Integrate with Floyo API
   - Show Floyo insights in GitHub UI

2. **Marketplace Listing:**
   - Submit to GitHub Marketplace
   - Optimize listing (screenshots, description)
   - Set pricing (free tier + paid)

3. **Promotion:**
   - Announce on Twitter
   - Post on Hacker News
   - Email existing users

**How to Measure Success:**
- GitHub Marketplace analytics: Installs, conversions
- Track `user_integrations` with `provider=github`
- Target: 500+ installs, 10% conversion to paid

**Files to Create:**
- `/backend/integrations/github/` - GitHub App integration
- `/docs/github-marketplace-setup.md` - Setup guide

---

### Experiment 4: Shareable Artifacts (Integration Suggestions)
**Goal:** Viral sharing of integration suggestions  
**Goal Metric:** 1,000+ shares, 100+ signups from shares  
**Implementation Path:**

1. **Shareable Integration Cards:**
   - When Floyo suggests an integration, create shareable card
   - Include: Integration name, description, setup steps
   - Add "Share this integration" button

2. **Social Sharing:**
   - Twitter card preview
   - LinkedIn preview
   - Image generation (OG image)

3. **Tracking:**
   - Track shares in `events` table
   - UTM tracking: `source=share`, `campaign=integration_[id]`

**How to Measure Success:**
- Track shares: `events` table with `event_type=share`
- Track signups from shares: UTM tracking
- Target: 1,000+ shares, 10% conversion

**Files to Create:**
- `/frontend/components/ShareIntegration.tsx` - Share component
- `/backend/api/share.py` - Share tracking API
- `/frontend/app/share/[integrationId]/page.tsx` - Share landing page

---

### Experiment 5: Content Series (Workflow Optimization Tips)
**Goal:** Build authority and SEO  
**Goal Metric:** 10+ blog posts, 5,000+ monthly visitors  
**Implementation Path:**

1. **Content Topics:**
   - "10 Workflow Automations Every Developer Needs"
   - "How to Optimize Your Tool Stack (Save $200/month)"
   - "Privacy-First Productivity: A Developer's Guide"
   - "From Manual to Automated: E-commerce Workflows"

2. **Content Format:**
   - Blog posts (SEO)
   - Twitter threads (viral)
   - YouTube videos (long-form)

3. **Distribution:**
   - Post on blog
   - Share on Twitter/LinkedIn
   - Submit to Hacker News/Reddit

**How to Measure Success:**
- Google Analytics: Visitors, time on page
- UTM tracking: Signups from content
- Target: 5,000+ monthly visitors, 100+ signups

**Files to Create:**
- `/frontend/app/blog/[slug]/page.tsx` - Blog system
- `/frontend/app/blog/page.tsx` - Blog index
- `/docs/content-strategy.md` - Content calendar

---

## Distribution Strategy Summary

### Phase 1 (Months 1-2): Foundation
- ✅ Product Hunt launch
- ✅ Hacker News post
- ✅ Twitter account setup
- ✅ GitHub open source CLI
- **Goal:** 1,000 signups

### Phase 2 (Months 3-4): Growth Experiments
- ✅ Invite flow
- ✅ SEO landing pages
- ✅ Content marketing
- **Goal:** 5,000 signups

### Phase 3 (Months 5-6): Partnerships
- ✅ GitHub Marketplace
- ✅ Zapier marketplace
- ✅ Integration partnerships
- **Goal:** 10,000 signups

### Phase 4 (Months 7-12): Scale
- ✅ Paid advertising (if profitable)
- ✅ Enterprise sales
- ✅ Referral program optimization
- **Goal:** 50,000 signups

---

## TODO: Founders to Complete

> **TODO:** Prioritize experiments:
> - Which experiments should be done first?
> - What's the expected ROI for each?
> - What resources are needed?

> **TODO:** Set up tracking:
> - Verify UTM tracking is working
> - Set up Google Analytics
> - Set up conversion tracking

> **TODO:** Create content:
> - Write blog posts
> - Create demo videos
> - Design shareable assets

> **TODO:** Build integrations:
> - GitHub Marketplace app
> - Zapier integration
> - Other platform integrations

---

**Status:** ✅ Draft Complete - Ready for execution

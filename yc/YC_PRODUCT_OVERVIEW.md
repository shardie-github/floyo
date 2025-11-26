# YC Product Overview - Floyo

**Last Updated:** 2025-01-20  
**Status:** Draft - Scott Hardie (Founder, CEO & Operator) - Ready for review and real data from beta users

---

## 1-Sentence Description

Floyo automatically tracks how developers and teams use files and tools, then uses AI to suggest integrations and automations that eliminate manual work and optimize workflows.

---

## 30-Second Explanation

Developers and small business operators juggle 10-20+ tools daily, wasting hours manually syncing data and missing integration opportunities. Floyo watches your actual file and tool usage patterns, then suggests concrete integrations (Zapier workflows, API connections, automations) based on what you actually do—not generic examples. It's privacy-first, requires zero configuration, and helps you discover automations you didn't know were possible.

---

## 2-Minute Explanation

**The Problem:** Most developers and small business operators are drowning in tools. They're paying for subscriptions they don't use, manually copying data between tools daily, and missing integration opportunities because they don't know what's possible. A solo e-commerce operator might spend 2-3 hours per day manually syncing Shopify orders to Google Sheets, TikTok Ads data to analytics dashboards, and fulfillment data to shipping systems—all while paying $300-500/month for overlapping tools.

**The Solution:** Floyo runs quietly in the background, tracking which files you open, which scripts you run, and which tools you use. It learns your patterns—like "you always run this Python script and then manually upload the output to Dropbox"—and suggests concrete integrations with actual code you can use. No guessing, no generic advice, just real suggestions based on your actual work.

**What's Different:** Unlike generic productivity tools or manual time trackers, Floyo:
- **Automatically discovers patterns** (no manual logging)
- **Suggests concrete integrations** (not just "you should automate this")
- **Privacy-first** (tracks metadata only, never file content)
- **Works across all tools** (not just one platform)

**Who Needs This:** Solo e-commerce operators, freelance developers, small agencies, and indie hackers who use 10+ tools and want to optimize their workflow without spending hours researching integrations.

---

## Who Needs This

### Primary Users

1. **Solo E-commerce Operators**
   - Running Shopify + TikTok Ads + Meta Ads + Zapier + Google Sheets
   - Spending 2-3 hours/day manually syncing data
   - Paying $300-500/month for overlapping tools
   - **Value:** Saves 30-50 hours/month, identifies $150-250/month in redundant subscriptions

2. **Solo Full-Stack Developers**
   - Working across multiple projects simultaneously
   - Using React/Next.js, TypeScript, PostgreSQL, Vercel
   - **Value:** Reduces context switching, discovers tools that fit their workflow, 10-15% productivity increase

3. **Small Agencies (5-10 people)**
   - Managing 10-30 client accounts
   - Spending $2,000+/month on tools
   - **Value:** Standardizes workflows, identifies $600/month in unused tools, faster client onboarding

### Secondary Users

4. **Indie Hackers / SaaS Founders**
   - Building SaaS products with 10-20 tools
   - Bootstrapped, need to optimize costs
   - **Value:** Identifies unused tools, saves $80-120/month, unified metrics dashboard

5. **Privacy-Conscious Developers**
   - Working with sensitive data (healthcare, finance)
   - Need compliance (HIPAA, GDPR)
   - **Value:** Privacy-first insights without exposing code, meets compliance requirements

---

## What's New/Different

### vs. Manual Time Tracking Tools
- **Automatic:** No manual entry required
- **Pattern-focused:** Discovers relationships, not just time spent
- **Integration suggestions:** Actually tells you what to build

### vs. Generic Analytics Tools
- **Developer-specific:** Understands code workflows, not just web analytics
- **Privacy-first:** Never tracks file content, only metadata
- **Actionable:** Suggests concrete integrations, not just insights

### vs. IDE Plugins
- **Cross-tool:** Works across all tools, not just one IDE
- **Integration marketplace:** Connects with Zapier, APIs, external services
- **Team features:** Understands team workflows, not just individual

### vs. Generic Automation Platforms (Zapier, Make)
- **Discovery:** Finds automation opportunities you didn't know existed
- **Personalized:** Based on your actual usage, not generic templates
- **Code-first:** Provides actual code examples, not just UI workflows

---

## How It Works End-to-End (One User Journey)

**Sarah, a solo e-commerce operator:**

1. **Installation (Day 1):**
   - Sarah installs Floyo CLI tool
   - Grants permission to track file usage (privacy-first: only metadata)
   - Floyo starts watching her file system

2. **Pattern Discovery (Week 1):**
   - Floyo observes: Sarah opens `orders.csv` → runs `process_orders.py` → manually uploads to Dropbox
   - Floyo detects: This happens every morning at 9 AM
   - Floyo identifies: Shopify webhook → Python script → Dropbox upload pattern

3. **Suggestion (Week 2):**
   - Floyo dashboard shows: "You manually upload processed orders to Dropbox every day. Here's a Zapier workflow that does this automatically."
   - Suggestion includes: Actual Zapier workflow JSON, Python script modifications, setup instructions

4. **Implementation (Week 2):**
   - Sarah clicks "Set up integration"
   - Floyo guides her through Zapier setup
   - Integration is live in 10 minutes

5. **Value Realized (Week 3):**
   - Sarah saves 30 minutes/day (no more manual uploads)
   - Floyo suggests 3 more automations based on her patterns
   - Sarah cancels 2 unused tool subscriptions Floyo identified
   - **ROI:** Saves $200/month in time + $150/month in unused tools = $350/month value

6. **Ongoing (Month 2+):**
   - Floyo continues learning her patterns
   - Suggests new integrations as her workflow evolves
   - Provides analytics: "You used Shopify 40% more this month, consider upgrading your plan"
   - Sarah upgrades to Pro ($29/month) to unlock advanced analytics

---

## Before/After Story

### Before Floyo

**Sarah's Morning Routine:**
- 8:00 AM: Check Shopify dashboard for overnight orders
- 8:15 AM: Manually export order data to CSV
- 8:30 AM: Run Python script to process orders
- 8:45 AM: Manually upload processed file to Dropbox
- 9:00 AM: Check TikTok Ads dashboard
- 9:15 AM: Manually copy ad performance data to Google Sheets
- 9:30 AM: Check Meta Ads dashboard
- 9:45 AM: Manually copy ad performance data to Google Sheets
- 10:00 AM: Realize Zapier workflow failed 3 days ago, lost sales
- 10:30 AM: Spend 30 minutes fixing broken automation
- **Total:** 2.5 hours of manual work before actual business work starts

**Sarah's Tool Stack:**
- Shopify ($79/month)
- TikTok Ads (pay-per-click)
- Meta Ads (pay-per-click)
- Zapier ($20/month)
- Google Sheets (free)
- Dropbox ($10/month)
- Analytics tool A ($50/month) - rarely used
- Analytics tool B ($30/month) - rarely used
- **Total:** $189/month, but paying for tools she doesn't use

**Sarah's Pain Points:**
- Wastes 2-3 hours/day on manual data sync
- Doesn't know which tools she actually uses
- Misses automation opportunities
- Broken automations cause lost sales
- Can't justify tool costs to herself

---

### After Floyo

**Sarah's Morning Routine:**
- 8:00 AM: Check Floyo dashboard (unified view of all tools)
- 8:05 AM: Review automated reports (orders processed, ads synced)
- 8:10 AM: See Floyo alert: "New integration opportunity detected"
- 8:15 AM: Click "Set up integration" → done in 5 minutes
- 8:20 AM: Start actual business work
- **Total:** 20 minutes of review, then productive work

**Sarah's Optimized Tool Stack:**
- Shopify ($79/month) - actively used
- TikTok Ads (pay-per-click) - actively used
- Meta Ads (pay-per-click) - actively used
- Zapier ($20/month) - actively used, automated workflows
- Google Sheets (free) - actively used
- Dropbox ($10/month) - actively used
- ~~Analytics tool A~~ - Cancelled (Floyo showed she never used it)
- ~~Analytics tool B~~ - Cancelled (Floyo showed she never used it)
- Floyo Pro ($29/month) - actively used
- **Total:** $138/month (saved $51/month on unused tools)

**Sarah's Gains:**
- Saves 2+ hours/day on manual work (automated)
- Clear visibility into tool usage (data-driven decisions)
- Proactive automation suggestions (never misses opportunities)
- Automated monitoring (catches broken workflows immediately)
- Justified tool costs (knows what's worth paying for)

**Sarah's ROI:**
- Time saved: 2 hours/day × 20 days/month × $50/hour = $2,000/month value
- Money saved: $51/month on unused tools
- **Total value:** $2,051/month
- **Cost:** $29/month (Floyo Pro)
- **ROI:** 7,000%+

---

## TODO: Supply Real Data

> **TODO:** Replace the example user journey with actual user stories from beta tests or early customers.

> **TODO:** Add real metrics:
> - How many users have installed Floyo?
> - How many integrations have been suggested?
> - How many integrations have been implemented?
> - Average time saved per user?
> - Average money saved per user?

> **TODO:** Add real testimonials or case studies if available.

> **TODO:** Add screenshots or demo video links.

---

**Founder Note:** This document reflects my experience building Hardonia OS (AI-driven Shopify commerce lab) and my 15+ years helping businesses adopt SaaS tools. The user journey example is based on real patterns I've observed, but needs validation with actual Floyo users.

**Status:** ✅ Draft Complete - Ready for review and real data from beta users

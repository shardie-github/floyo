# YC Interview Cheat Sheet - Floyo

**Last Updated:** 2025-01-20  
**Purpose:** Quick reference for YC interview prep

---

## Section A: CORE PITCH

### 1-Sentence Answer to "What are you working on?"

**Answer:**
"Floyo automatically tracks how developers and teams use files and tools, then uses AI to suggest integrations and automations that eliminate manual work and optimize workflows."

**Alternative (30 seconds):**
"Developers and small business operators juggle 10-20+ tools daily, wasting hours manually syncing data. Floyo watches your actual file and tool usage patterns, then suggests concrete integrations—like Zapier workflows or API connections—based on what you actually do, not generic examples."

---

### 3-5 Bullets: What's New and Why It's Important

1. **Automatic Pattern Discovery** - No manual logging required; Floyo learns your workflow automatically
2. **Privacy-First Design** - Tracks metadata only, never file content; enables adoption in sensitive environments
3. **Cross-Tool Visibility** - Sees patterns across ALL tools, not just one platform
4. **Concrete Integration Suggestions** - Provides actual code/workflows you can use, not just insights
5. **Developer-Focused** - Built by developers, for developers; understands code workflows

---

## Section B: USERS & PROBLEM

### Who Are Your Users?

**Primary Users:**
1. **Solo E-commerce Operators** - Running Shopify + TikTok Ads + Meta Ads + Zapier; spending 2-3 hours/day manually syncing data
2. **Solo Full-Stack Developers** - Working across multiple projects; need workflow visibility and tool discovery
3. **Small Agencies (5-10 people)** - Managing 10-30 client accounts; need tool standardization and cost optimization

**Secondary Users:**
4. **Indie Hackers / SaaS Founders** - Building SaaS with 10-20 tools; need stack optimization
5. **Privacy-Conscious Developers** - Working with sensitive data; need privacy-first insights

---

### What Pain Do They Have?

**Top Pains:**
1. **Manual Data Sync** - 2-3 hours/day copying data between tools
2. **Tool Sprawl** - Paying $150-600/month for unused/overlapping tools
3. **Broken Automations** - Zapier workflows break silently, lose sales
4. **Integration Discovery** - Don't know what integrations are possible
5. **Context Switching** - Lose productivity switching between 8+ dashboards

---

### How Do You Validate Demand?

> **TODO:** Founders to fill in:
> - User interviews conducted: [X] interviews
> - Beta testers: [X] users
> - Early signups: [X] signups
> - Waitlist: [X] people
> - Other validation: [describe]

**Current Evidence:**
- Extensive ICP/JTBD documentation (`/docs/ICP_AND_JTBD.md`)
- User research suggests strong demand
- **TODO:** Add actual user interview summaries

---

## Section C: METRICS SNAPSHOT

### Key Usage and Growth Metrics

> **TODO:** Founders to fill in real numbers:

**Usage:**
- **DAU:** [X] users
- **WAU:** [X] users
- **MAU:** [X] users
- **Growth Rate:** [X]% month-over-month

**Activation:**
- **Activation Rate:** [X]% (users who view first suggestion within 7 days)
- **Time to Activation:** [X] days average

**Retention:**
- **7-Day Retention:** [X]%
- **30-Day Retention:** [X]%
- **Churn Rate:** [X]% monthly

**Engagement:**
- **Events per User:** [X] events/day average
- **Suggestions Viewed:** [X] suggestions/user average
- **Integrations Implemented:** [X] integrations/user average

**How You Define and Measure Engagement:**
- **Activated User:** Views at least one integration suggestion OR connects at least one integration
- **Engaged User:** Tracks 10+ file events
- **Retained User:** Returns after 7 days

---

## Section D: REVENUE & ECONOMICS

### How Do You Make Money (or Plan To)?

**Revenue Model:**
- **Free:** $0/month - Basic tracking, 2 integrations, 7-day retention
- **Pro:** $29/month - Unlimited tracking, all integrations, 90-day retention
- **Enterprise:** Custom pricing - SSO, unlimited retention, on-premise

**Current Revenue:**
> **TODO:** Founders to fill in:
- **MRR:** $[X]
- **ARR:** $[X]
- **Paid Users:** [X]
- **Conversion Rate:** [X]% (free → paid)

---

### Simple Unit Economics Summary

> **TODO:** Founders to fill in:

**Unit Economics:**
- **CAC (Customer Acquisition Cost):** $[X]
- **LTV (Lifetime Value):** $[X] (assume 12-month average lifetime)
- **LTV:CAC Ratio:** [X]:1 (target: >3:1)
- **Payback Period:** [X] months (target: <6 months)
- **Gross Margin:** [X]% (target: >80%)

**Path to Unit Economics:**
- **Current:** [describe current state]
- **Target:** [describe target unit economics]
- **How to Get There:** [describe plan]

---

## Section E: DISTRIBUTION

### How Do You Get Users Today?

**Current Channels:**
> **TODO:** Founders to fill in:
- **Product Hunt:** [X] signups
- **Hacker News:** [X] signups
- **Twitter/X:** [X] signups
- **GitHub:** [X] signups
- **Other:** [describe]

**Top Acquisition Channel:** [channel name] - [X]% of signups

---

### 2-3 Planned Experiments

1. **Invite Flow**
   - **Goal:** Increase viral coefficient to 1.2+
   - **Implementation:** Add invite system, referral codes, incentives
   - **Timeline:** [X] weeks
   - **Expected Impact:** [X]% increase in signups

2. **SEO Landing Pages**
   - **Goal:** 100+ monthly organic signups
   - **Implementation:** Create landing pages for niche use cases (Shopify automation, developer productivity)
   - **Timeline:** [X] weeks
   - **Expected Impact:** [X] monthly organic signups

3. **GitHub Marketplace**
   - **Goal:** 500+ GitHub Marketplace installs
   - **Implementation:** Create GitHub App, submit to marketplace
   - **Timeline:** [X] weeks
   - **Expected Impact:** [X] signups from GitHub

---

## Section F: TEAM & EXECUTION

### Why This Team?

> **TODO:** Founders to fill in:
- **Founder 1:** [Name] - [Background, why qualified]
- **Founder 2:** [Name] - [Background, why qualified]
- **Founder 3:** [Name] - [Background, why qualified] (if applicable)

**Why We're Uniquely Qualified:**
- [Reason 1]
- [Reason 2]
- [Reason 3]

**Division of Responsibilities:**
- **Product:** [Name]
- **Engineering:** [Name]
- **GTM:** [Name]

---

### Biggest Mistakes So Far and What You Learned

> **TODO:** Founders to fill in:
1. **Mistake:** [describe]
   - **What We Learned:** [lesson]
   - **How We Fixed It:** [fix]

2. **Mistake:** [describe]
   - **What We Learned:** [lesson]
   - **How We Fixed It:** [fix]

---

### Evidence You Can Move Fast and Ship

> **TODO:** Founders to fill in:
- **Built Floyo in:** [X] months
- **Shipped Features:** [list recent features]
- **Execution Examples:** [describe fast shipping examples]

**Current Evidence:**
- Comprehensive codebase (backend, frontend, CLI, migrations)
- Automated CI/CD (GitHub Actions → Vercel)
- Production-ready infrastructure (monitoring, error tracking, analytics)
- Good documentation (extensive `/docs` folder)

---

## Section G: RISKS & HARD QUESTIONS

### 5 Scariest Likely Interview Questions

### Question 1: "How do you compete with Zapier?"

**Answer:**
"Zapier requires you to know what to automate. Floyo discovers automation opportunities you didn't know existed by analyzing your actual workflow patterns. We're complementary—Floyo suggests what to automate, Zapier executes it. Many of our users connect Floyo suggestions to Zapier workflows."

**Evidence:** Integration support for Zapier in schema, GTM materials mention Zapier

---

### Question 2: "What if GitHub/Microsoft builds this?"

**Answer:**
"GitHub focuses on code, not cross-tool workflows. Microsoft focuses on enterprise, not individual developers. Floyo's advantage is cross-tool pattern discovery and privacy-first design. We're also faster—we can ship features in weeks, not quarters."

**Evidence:** Cross-tool tracking, privacy-first design, fast execution

---

### Question 3: "How do you get users? Distribution is hard."

**Answer:**
"We're starting with developer communities (Hacker News, Product Hunt, GitHub) where we can reach our target users directly. Our CLI tool is open source, which helps with distribution. We're also building viral features—shareable integration suggestions and referral programs."

**Evidence:** Distribution plan in `/yc/YC_DISTRIBUTION_PLAN.md`, open source CLI

---

### Question 4: "What's your moat? Why won't someone copy this?"

**Answer:**
"Three moats: (1) Pattern data—more users = better suggestions = network effects. (2) Privacy-first positioning—developers trust us with sensitive workflows. (3) Cross-tool visibility—competitors focus on single tools; we see the full workflow."

**Evidence:** Pattern data collection, privacy controls, cross-tool tracking

---

### Question 5: "What if you don't get traction? What's Plan B?"

**Answer:**
"We're bootstrapped and profitable at [X] users. If we don't get traction, we'll pivot to enterprise (privacy-first workflow insights for engineering teams) or focus on a specific niche (e-commerce automation). But we're confident in our current approach based on user research."

**Evidence:** [TODO: Add actual traction numbers]

---

## Quick Reference: Key Numbers

> **TODO:** Founders to fill in real numbers:

```
Users:           [X]
Paid Users:      [X]
MRR:             $[X]
ARR:             $[X]
Growth Rate:     [X]% MoM
Activation:      [X]%
Retention (7d):  [X]%
CAC:             $[X]
LTV:             $[X]
LTV:CAC:         [X]:1
Runway:          [X] months
```

---

## TODO: Founders to Complete

> **TODO:** Fill in all [X] placeholders with real numbers

> **TODO:** Practice answers:
> - Rehearse 1-sentence pitch
> - Rehearse 30-second explanation
> - Practice answering hard questions

> **TODO:** Prepare evidence:
> - Screenshots of product
> - Demo video
> - User testimonials
> - Metrics dashboard

> **TODO:** Review all YC docs:
> - `/yc/YC_PRODUCT_OVERVIEW.md`
> - `/yc/YC_PROBLEM_USERS.md`
> - `/yc/YC_MARKET_VISION.md`
- `/yc/YC_METRICS_CHECKLIST.md`

---

**Status:** ✅ Draft Complete - Needs founder input with real data and practice

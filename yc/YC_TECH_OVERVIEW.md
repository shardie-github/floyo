# YC Tech Overview - Floyo

**Last Updated:** 2025-01-20  
**Status:** Draft - Based on repo analysis

---

## High-Level Architecture (Text Form)

```
┌─────────────────────────────────────────────────────────────┐
│                      USER'S MACHINE                          │
│  ┌──────────────┐                                           │
│  │ Floyo CLI    │  Python CLI tool tracks file events       │
│  │ (/floyo/)    │  - File opens, script runs, tool usage    │
│  └──────┬───────┘                                           │
└─────────┼───────────────────────────────────────────────────┘
          │ HTTPS API
          │
┌─────────▼───────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Next.js 14+ (React, TypeScript)                    │   │
│  │ - Dashboard: View patterns, suggestions           │   │
│  │ - Integrations: Connect Zapier, GitHub, etc.      │   │
│  │ - Analytics: Usage metrics, insights              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────┬───────────────────────────────────────────────────┘
          │ REST API
          │
┌─────────▼───────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Python FastAPI                                      │   │
│  │ - /api/events: Ingest file events                  │   │
│  │ - /api/patterns: Pattern analysis                 │   │
│  │ - /api/suggestions: Integration suggestions        │   │
│  │ - /api/integrations: Manage integrations           │   │
│  │ - /api/analytics: Metrics and dashboards          │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Background Jobs (Celery + Redis)                   │   │
│  │ - Pattern analysis                                  │   │
│  │ - Metrics aggregation                               │   │
│  │ - Integration health checks                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────┬───────────────────────────────────────────────────┘
          │ SQL
          │
┌─────────▼───────────────────────────────────────────────────┐
│              DATABASE (Supabase PostgreSQL)                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Core Tables                                         │   │
│  │ - users: User accounts                             │   │
│  │ - events: File/tool usage events                  │   │
│  │ - patterns: Detected usage patterns               │   │
│  │ - relationships: File/tool relationships          │   │
│  │ - subscriptions: Billing (Stripe)                │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Analytics Tables                                    │   │
│  │ - cohorts: User cohorts for retention             │   │
│  │ - utm_tracks: Acquisition channel tracking        │   │
│  │ - metrics_log: Performance metrics                │   │
│  │ - audit_log: User action audit trail             │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Privacy Tables                                      │   │
│  │ - privacy_prefs: User privacy preferences        │   │
│  │ - telemetry_events: Privacy-controlled telemetry  │   │
│  │ - transparency_log: Privacy action audit          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              EXTERNAL SERVICES                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Stripe   │  │ PostHog   │  │ Sentry   │  │ Zapier   │ │
│  │ (Payments)│  │(Analytics)│  │(Errors)  │  │(Integrations)│
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Stack Summary

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State:** Zustand
- **Data Fetching:** React Query (@tanstack/react-query)
- **UI Components:** Radix UI
- **Testing:** Jest, Playwright
- **Deployment:** Vercel (automated via GitHub Actions)

### Backend
- **Framework:** FastAPI (Python)
- **Language:** Python 3.12+
- **ORM:** SQLAlchemy
- **Database:** PostgreSQL (via Supabase)
- **Cache:** Redis
- **Background Jobs:** Celery
- **Authentication:** JWT (Supabase Auth)
- **API Docs:** OpenAPI/Swagger

### Infrastructure
- **Database:** Supabase (managed PostgreSQL)
- **File Storage:** Supabase Storage (S3-compatible)
- **CDN:** Vercel Edge Network
- **Monitoring:** Sentry (error tracking)
- **Analytics:** PostHog (product analytics), Vercel Analytics (web vitals)
- **CI/CD:** GitHub Actions

### Integrations
- **Payment:** Stripe (subscriptions, webhooks)
- **Automation:** Zapier (workflow automation)
- **Developer Tools:** GitHub (future), Vercel (deployment tracking)
- **E-commerce:** Shopify (future)
- **Ads:** TikTok Ads API, Meta Ads API (future)

---

## What's Technically Hard Here

### 1. Pattern Discovery Algorithm
**Challenge:** Identifying meaningful patterns from noisy file/tool usage data  
**Solution:** 
- Machine learning models (likely in `/backend/ml/`)
- Temporal analysis (time-based pattern detection)
- Relationship graph analysis (file/tool connections)

**Evidence:** `/floyo/suggester.py` - Integration suggestion engine

---

### 2. Privacy-First Tracking
**Challenge:** Track usage patterns without exposing sensitive content  
**Solution:**
- Metadata-only tracking (file paths, not content)
- Granular privacy controls (`privacy_prefs` table)
- User-controlled data retention
- Self-hosted option (for enterprise)

**Evidence:** `privacy_prefs`, `telemetry_events`, `transparency_log` tables

---

### 3. Cross-Tool Pattern Analysis
**Challenge:** Understanding workflows across multiple tools/platforms  
**Solution:**
- Unified event model (tracks files, scripts, APIs, external services)
- Integration abstraction layer
- Cross-tool relationship mapping

**Evidence:** `events` table with flexible `metadata` JSONB field

---

### 4. Real-Time Suggestions
**Challenge:** Generating integration suggestions in real-time as patterns emerge  
**Solution:**
- Background job processing (Celery)
- Cached pattern analysis
- Incremental updates

**Evidence:** `/backend/jobs/` - Background job processing

---

## What's Likely to Break at Scale

### 1. Database Performance
**Risk:** `events` table will grow very large (millions of rows)  
**Mitigation:**
- ✅ Indexes on `user_id`, `timestamp` (already exists)
- ✅ Data retention policies (`retention_policies` table)
- ⚠️ **TODO:** Partition `events` table by date
- ⚠️ **TODO:** Archive old events to cold storage

**Files to Update:**
- `/supabase/migrations/YYYYMMDD_partition_events.sql`

---

### 2. Pattern Analysis Latency
**Risk:** Pattern analysis becomes slow as data grows  
**Mitigation:**
- ✅ Background jobs (Celery) - already implemented
- ✅ Redis caching - already implemented
- ⚠️ **TODO:** Optimize pattern analysis queries
- ⚠️ **TODO:** Consider materialized views for common patterns

**Files to Update:**
- `/backend/services/pattern_analysis.py` - Optimize queries

---

### 3. Integration Rate Limits
**Risk:** External APIs (Zapier, GitHub, etc.) have rate limits  
**Mitigation:**
- ✅ Error tracking (Sentry) - already implemented
- ⚠️ **TODO:** Implement rate limit handling
- ⚠️ **TODO:** Queue integration calls
- ⚠️ **TODO:** Retry logic with exponential backoff

**Files to Update:**
- `/backend/integrations/` - Add rate limit handling

---

### 4. Frontend Performance
**Risk:** Dashboard becomes slow with large datasets  
**Mitigation:**
- ✅ React Query caching - already implemented
- ✅ Pagination (likely implemented)
- ⚠️ **TODO:** Virtualize long lists
- ⚠️ **TODO:** Optimize bundle size

**Files to Update:**
- `/frontend/components/` - Add virtualization

---

## Where the Technical Edge/Moat Might Be

### 1. Pattern Data (Proprietary Data)
**Edge:** Floyo collects unique pattern data across tools  
**Moat Strength:** Strong  
**Why:** More users = more patterns = better suggestions = more users (network effect)

**Evidence:** `patterns`, `relationships` tables store unique workflow data

---

### 2. Integration Intelligence (Algorithmic Advantage)
**Edge:** AI/ML models that understand workflow patterns  
**Moat Strength:** Emerging  
**Why:** Better pattern analysis = better suggestions = competitive advantage

**Evidence:** `/floyo/suggester.py`, `/backend/ml/` (if exists)

---

### 3. Privacy-First Positioning (UX/Trust Advantage)
**Edge:** Privacy-first design builds trust  
**Moat Strength:** Strong  
**Why:** Developers trust Floyo with sensitive workflows because it doesn't track content

**Evidence:** Privacy controls, GDPR compliance, self-hosted option

---

### 4. Cross-Tool Visibility (Workflow Advantage)
**Edge:** See patterns across ALL tools, not just one  
**Moat Strength:** Strong  
**Why:** Competitors focus on single tools; Floyo sees the full workflow

**Evidence:** Cross-tool tracking in `events` table

---

### 5. Developer-Focused UX (Product Advantage)
**Edge:** Built by developers, for developers  
**Moat Strength:** Medium  
**Why:** Better understanding of developer workflows = better product

**Evidence:** CLI tool, developer-focused features

---

## Technical Risks

### 1. Scalability
**Risk:** Database and pattern analysis may not scale to 100K+ users  
**Mitigation:** 
- Partition `events` table
- Optimize queries
- Consider read replicas
- Archive old data

**Timeline:** Address before 10K users

---

### 2. Integration Reliability
**Risk:** External APIs (Zapier, GitHub) may be unreliable  
**Mitigation:**
- Retry logic
- Fallback mechanisms
- Health checks
- User notifications

**Timeline:** Address before launch

---

### 3. Privacy Compliance
**Risk:** GDPR/HIPAA compliance requirements  
**Mitigation:**
- ✅ Privacy controls already implemented
- ✅ Data export/deletion features
- ⚠️ **TODO:** Legal review
- ⚠️ **TODO:** Compliance documentation

**Timeline:** Address before enterprise sales

---

### 4. Security
**Risk:** Data breaches, API key leaks  
**Mitigation:**
- ✅ RLS policies (Row Level Security)
- ✅ Environment variable management
- ✅ Audit logging
- ⚠️ **TODO:** Security audit
- ⚠️ **TODO:** Penetration testing

**Timeline:** Address before enterprise sales

---

## TODO: Founders to Complete

> **TODO:** Document ML models:
> - What models are used for pattern analysis?
> - How are they trained?
> - How do they improve over time?

> **TODO:** Document scalability plan:
> - How will you handle 100K+ users?
> - What infrastructure changes are needed?
> - What's the cost at scale?

> **TODO:** Document security practices:
> - How are API keys secured?
> - How is user data encrypted?
> - What's the incident response plan?

---

**Status:** ✅ Draft Complete - Based on repo analysis, needs founder validation

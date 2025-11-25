# Repo Orientation - Floyo

**Generated:** 2025-01-20  
**Purpose:** Quick orientation for YC partners, investors, and technical reviewers

---

## What is Floyo?

**Floyo** is a privacy-first workflow automation tool that watches how developers and teams use files, scripts, and tools, then uses AI to suggest concrete integrations and automations based on actual usage patterns.

**One-sentence pitch:** "Floyo automatically discovers your workflow patterns and suggests integrations you didn't know you needed."

---

## Core Problem Being Solved

Developers and small business operators juggle 10-20+ tools daily. They:
- Don't know which tools they actually use vs. just subscribe to
- Waste hours manually syncing data between tools
- Miss integration opportunities because they don't know what's possible
- Can't optimize their tool stack because they lack visibility

**Floyo solves this by:**
1. **Automatically tracking** file/tool usage patterns (no manual logging)
2. **Analyzing patterns** to identify workflow relationships
3. **Suggesting integrations** (Zapier, APIs, automations) based on actual usage
4. **Providing visibility** into tool utilization and optimization opportunities

---

## Target Users

### Primary: Solo E-commerce Operators
- Running Shopify + TikTok Ads + Meta Ads + Zapier + Google Sheets
- Spending 2-3 hours/day manually syncing data
- Paying $300-500/month for overlapping tools
- **Pain:** Tool sprawl, manual work, broken automations

### Secondary: Solo Full-Stack Developers
- Working across multiple projects simultaneously
- Using React/Next.js, TypeScript, PostgreSQL, Vercel
- **Pain:** Context loss, tool discovery, workflow visibility

### Tertiary: Small Agencies (5-10 people)
- Managing 10-30 client accounts
- Spending $2,000+/month on tools
- **Pain:** Tool chaos, cost visibility, workflow standardization

---

## Architecture Overview

### Tech Stack
- **Frontend:** Next.js 14+ (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Python FastAPI, SQLAlchemy
- **Database:** PostgreSQL via Supabase
- **Authentication:** Supabase Auth (JWT)
- **Deployment:** 
  - Frontend: Vercel (automated via GitHub Actions)
  - Database: Supabase (managed PostgreSQL)
  - Backend: (appears to be FastAPI, deployment target unclear from repo)

### Key Components

1. **`/floyo/`** - Core Python CLI library
   - `tracker.py` - Usage pattern tracking
   - `suggester.py` - Integration suggestions
   - `watcher.py` - File system monitoring
   - `cli.py` - Command-line interface

2. **`/frontend/`** - Next.js web application
   - Dashboard for viewing patterns and suggestions
   - Integration marketplace
   - Analytics and insights

3. **`/backend/`** - FastAPI REST API
   - Event ingestion
   - Pattern analysis
   - Integration management
   - User authentication

4. **`/supabase/`** - Database schema and migrations
   - User management
   - Event tracking
   - Pattern storage
   - Subscription/billing (Stripe)
   - Analytics tables (cohorts, UTM tracking, NPS)

### Data Flow

```
User's Machine (CLI) → File Events → Backend API → Supabase DB
                                              ↓
                                    Pattern Analysis Engine
                                              ↓
                                    Integration Suggestions
                                              ↓
                                    Frontend Dashboard
```

---

## Revenue Model

**Subscription tiers:**
- **Free:** Basic tracking, 2 integrations, 7-day retention
- **Pro:** $29/month - Unlimited tracking, all integrations, 90-day retention
- **Enterprise:** Custom pricing - SSO, unlimited retention, on-premise option

**Payment:** Stripe integration (configured in schema, webhook handlers present)

---

## Current State Assessment

### What's Built
✅ Core file tracking system  
✅ Pattern detection and analysis  
✅ Integration suggestion engine  
✅ Web dashboard (Next.js)  
✅ User authentication (Supabase Auth)  
✅ Subscription/billing infrastructure (Stripe schema)  
✅ Analytics infrastructure (cohorts, UTM, NPS)  
✅ Privacy controls (GDPR-compliant data controls)  
✅ CI/CD pipeline (GitHub Actions → Vercel)  

### What's Missing (from YC perspective)
❓ **Metrics:** Usage metrics (DAU/WAU/MAU) - infrastructure exists, but unclear if instrumented  
❓ **Traction data:** No visible user counts, growth rates, or revenue numbers  
❓ **Distribution:** No clear acquisition channels or growth experiments  
❓ **Team info:** No founder/team information visible in repo  
❓ **Market validation:** No evidence of user interviews, beta tests, or early adopters  

---

## Main YC-Relevant Product

**Floyo** is the main product. This is a single-product repository (not a multi-product suite).

The repo contains some auxiliary tooling (MASTER OMEGA PRIME orchestrator, Aurora Prime health checks) but these appear to be internal DevOps/automation tools, not customer-facing products.

---

## Key Files for YC Review

1. **`/README.md`** - Product overview and setup
2. **`/docs/ICP_AND_JTBD.md`** - User segments and jobs-to-be-done
3. **`/docs/GTM_MATERIALS.md`** - Go-to-market strategy
4. **`/prisma/schema.prisma`** - Database schema (shows feature set)
5. **`/supabase/migrations/`** - Database migrations (shows evolution)
6. **`/floyo/`** - Core product logic
7. **`/frontend/`** - User-facing application
8. **`/backend/`** - API and business logic

---

## Assumptions Made

1. **Backend deployment:** Assumed to be deployable (FastAPI), but deployment target not explicitly documented
2. **Current users:** No user data visible - product may be pre-launch or early stage
3. **Team size:** Unknown - likely 1-3 founders based on repo structure
4. **Stage:** Appears to be pre-product-market-fit or very early traction

---

## Next Steps for YC Readiness

1. **Phase 1:** Create YC narrative documents (product overview, problem/users, market vision, team notes)
2. **Phase 2:** Document metrics infrastructure and create metrics checklist
3. **Phase 3:** Define distribution strategy and growth experiments
4. **Phase 4:** Document tech architecture and defensibility
5. **Phase 5:** Gap analysis vs. YC expectations
6. **Phase 6:** Improve repo structure and developer experience
7. **Phase 7:** Create YC interview cheat sheet
8. **Phase 8:** Set up continuous improvement process

---

**Status:** ✅ Phase 0 Complete - Repository orientation documented

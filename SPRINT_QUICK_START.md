# 30-Day Sprint Quick Start Guide

## Sprint Goal
**Complete Core Product Loop:** Users can sign up, complete onboarding, track file usage, see insights, and take action—all within 5 minutes.

**Success Metrics:**
- Activation rate: 40%+
- Time to first insight: <5 minutes
- Dashboard load time: <2 seconds

---

## Week 1 Checklist (Foundations)

### Backend
- [ ] Event ingestion API (`/api/telemetry/ingest`)
- [ ] Pattern detection background job
- [ ] Database indexes added
- [ ] Sample data generator script

### Frontend
- [ ] 3-step onboarding wizard complete
- [ ] Dashboard skeleton (layout, placeholders)
- [ ] Analytics tracking set up

### Infrastructure
- [ ] Health check endpoints
- [ ] Basic error logging

**Week 1 Demo:** Sign up → Generate sample data → View dashboard with patterns/insights

---

## Week 2 Checklist (Core Functionality)

### Backend
- [ ] Insights generation service
- [ ] Dashboard API endpoints (`/api/insights`, `/api/patterns`, `/api/stats`)
- [ ] Real-time updates (WebSocket or polling)

### Frontend
- [ ] File tracking client MVP (browser extension or desktop app)
- [ ] Dashboard with real data
- [ ] Recommendation cards with actions

**Week 2 Demo:** Install tracking client → Use files → See real patterns/insights on dashboard

---

## Week 3 Checklist (Hardening)

### Backend
- [ ] Database query optimization
- [ ] Caching layer (Redis or in-memory)
- [ ] Privacy controls API (pause/resume, export)
- [ ] Sentry error tracking

### Frontend
- [ ] Empty states and error handling
- [ ] Privacy controls UI
- [ ] Performance optimization

### Validation
- [ ] 5-10 beta users complete full loop
- [ ] User interviews (3-5 interviews)
- [ ] Activation funnel tracking

**Week 3 Demo:** Show edge cases handled, privacy controls, performance improvements

---

## Week 4 Checklist (Polish & Rollout)

### Backend
- [ ] Load testing (100+ concurrent users)
- [ ] API documentation (OpenAPI/Swagger)

### Frontend
- [ ] UI polish (animations, responsive design)
- [ ] Analytics dashboard (activation, retention)

### Infrastructure
- [ ] CI/CD for automated testing
- [ ] Runbook for common operations

### Documentation
- [ ] Recorded demo video
- [ ] Sprint learnings document

**Week 4 Demo:** Polished UI, analytics dashboard, load test results, demo video

---

## First 72 Hours Action Plan

### Day 1 Morning
1. Review sprint plan with team
2. Set up GitHub project board
3. Create Week 1 issues
4. Start onboarding wizard (F1-1)

### Day 1 Afternoon
5. Start event ingestion API (B1-1)
6. Set up analytics (F1-3)
7. **PR #1:** Onboarding + Event Ingestion API

### Day 2 Morning
8. Complete onboarding wizard
9. Complete event ingestion API
10. Start pattern detection job (B1-2)

### Day 2 Afternoon
11. Build dashboard skeleton (F1-2)
12. Create sample data generator (B1-4)
13. Decide file tracking client approach

### Day 3 Morning
14. Complete pattern detection
15. Connect dashboard to API
16. Create insights generation service (B2-1)

### Day 3 Afternoon
17. Complete vertical slice (end-to-end flow)
18. Create demo script
19. Week 1 checkpoint review

---

## Key Files to Know

### Backend
- `backend/api_v1.py` - Main API routes (or split into modules)
- `backend/ml/pattern_detector.py` - Pattern detection
- `backend/ml/recommendation_engine.py` - Insights generation
- `backend/database.py` - Database connection
- `backend/sample_data.py` - Sample data generator

### Frontend
- `frontend/components/OnboardingWizard.tsx` - Onboarding flow
- `frontend/app/dashboard/page.tsx` - Dashboard page
- `frontend/components/InsightsPanel.tsx` - Insights display
- `frontend/components/PatternsList.tsx` - Patterns display
- `frontend/lib/analytics.ts` - Analytics tracking

### Database
- `prisma/schema.prisma` - Database schema
- `supabase/migrations/` - Database migrations

---

## Daily Standup Template

**Yesterday:**
- What did I complete?
- What blockers did I encounter?

**Today:**
- What will I work on?
- What do I need help with?

**Blockers:**
- List any blockers or dependencies

---

## Weekly Checkpoint Questions

1. **Progress:** Are we on track for this week's goals?
2. **Blockers:** What's blocking us?
3. **Learnings:** What did we learn this week?
4. **Next Week:** What do we need to prepare for next week?

---

## Success Criteria Checklist

### Week 1 End
- [ ] User can sign up and complete onboarding
- [ ] Events can be ingested via API
- [ ] Sample data generator works
- [ ] Dashboard loads (even if empty)

### Week 2 End
- [ ] File tracking client sends events
- [ ] Patterns detected from real events
- [ ] Insights generated and displayed
- [ ] Dashboard shows real user data

### Week 3 End
- [ ] System handles edge cases gracefully
- [ ] Dashboard loads in <2 seconds
- [ ] Privacy controls work
- [ ] 5+ external users complete full loop

### Week 4 End
- [ ] Dashboard polished and responsive
- [ ] System handles 100+ concurrent users
- [ ] API documentation complete
- [ ] 10+ users complete full loop successfully

---

## Quick Commands

```bash
# Generate sample data
npm run generate-sample-data -- --userId <user-id> --events 100

# Run pattern detection job
python backend/ml/pattern_detector.py

# Start development servers
cd frontend && npm run dev
cd backend && python -m uvicorn main:app --reload

# Run tests
npm run test
npm run test:e2e

# Check health
curl http://localhost:8000/api/health
```

---

**Start with Day 1 tasks and work through the checklist!**

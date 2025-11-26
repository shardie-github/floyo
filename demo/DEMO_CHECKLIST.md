# Demo Checklist - Floyo

**Purpose:** Pre-demo checklist and quick recovery tips

**Last Updated:** 2025-01-20

---

## Pre-Demo Checklist

### Environment Setup

- [ ] Local dev server running (`cd frontend && npm run dev`)
- [ ] Frontend accessible at http://localhost:3000
- [ ] Database connected (Supabase)
- [ ] Environment variables set (`.env.local`)

### Database

- [ ] Migrations applied (`supabase db push` or via dashboard)
- [ ] Test user account created (or signup flow works)
- [ ] Sample data seeded (if needed for demo)

### Demo Data

- [ ] Sample file patterns available (or simulate usage)
- [ ] Integration suggestions ready to show
- [ ] Sample integrations set up (if showing live integration)

### Accounts & Credentials

- [ ] Test user account ready (email/password)
- [ ] Supabase credentials configured
- [ ] Third-party API keys (if showing integrations): Zapier, etc.

---

## Quick Recovery Tips

### Issue: Dev Server Not Starting

**Check:**
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process if needed
kill -9 [PID]

# Or use different port
PORT=3001 npm run dev
```

**Recovery:** Use different port or kill blocking process

---

### Issue: Database Connection Fails

**Check:**
- `.env.local` has correct Supabase credentials
- Supabase Dashboard → Database → Status (is database running?)
- Network/firewall settings

**Recovery:** Verify credentials, check Supabase dashboard

---

### Issue: No Patterns Discovered Yet

**Recovery:**
- Use sample data (if available)
- Show what patterns look like (screenshots)
- Explain: "In production, Floyo discovers patterns after [X] days"

---

### Issue: Integration Setup Fails

**Recovery:**
- Show suggested code (code examples)
- Explain: "Users can copy this code and set it up manually"
- Use screenshots/video instead of live setup

---

### Issue: Demo Environment Not Ready

**Recovery:**
- Use screenshots/video instead
- "Let me walk you through what users see"
- Show static examples instead of live demo

---

## Common Demo Failures

### Failure: Signup Flow Broken

**Recovery:**
- Use existing test account
- Skip signup, show dashboard directly
- Explain: "Users sign up in 30 seconds"

---

### Failure: Dashboard Not Loading

**Recovery:**
- Use screenshots of dashboard
- Explain features verbally
- Show video demo instead

---

### Failure: Integration Suggestions Not Showing

**Recovery:**
- Show sample suggestions (screenshots)
- Explain: "Floyo suggests integrations based on patterns"
- Show code examples directly

---

## Backup Plans

### Plan A: Live Demo
- Use local dev server
- Show real patterns and suggestions
- Set up integration live

### Plan B: Screenshots
- Use screenshots of key features
- Walk through user journey
- Show code examples

### Plan C: Video Demo
- Record demo video beforehand
- Play video during presentation
- Answer questions after

---

## Post-Demo Checklist

- [ ] Note any issues encountered
- [ ] Update demo script if needed
- [ ] Fix any bugs discovered
- [ ] Update demo data if needed

---

## Demo Environment Setup Commands

```bash
# Start dev server
cd frontend && npm run dev

# Check database connection
# Go to Supabase Dashboard → SQL Editor → Run test query

# Seed demo data (if script exists)
npm run seed:demo

# Reset demo environment (if script exists)
npm run reset:demo
```

---

## Key Files for Demo

- **Demo Path:** `/demo/DEMO_PATH.md`
- **Demo Script:** `/demo/DEMO_SCRIPT.md`
- **Product Overview:** `/yc/YC_PRODUCT_OVERVIEW.md`
- **Setup Guide:** `/docs/SETUP_LOCAL.md`

---

**Status:** ✅ Checklist ready - Review before each demo

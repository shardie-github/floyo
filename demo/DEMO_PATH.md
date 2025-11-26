# Demo Path - Floyo

**Purpose:** Exact steps to run a "happy path" demo from fresh user to "aha" moment

**Last Updated:** 2025-01-20

---

## Pre-Demo Setup

### Required Environment

- ✅ Local dev server running (`cd frontend && npm run dev`)
- ✅ Database connected (Supabase)
- ✅ Test user account created (or use signup flow)
- ✅ Sample data seeded (if needed)

### Pre-Demo Checklist

- [ ] Frontend running at http://localhost:3000
- [ ] Database migrations applied
- [ ] Test user account ready (or signup flow works)
- [ ] Sample file patterns available (or simulate usage)
- [ ] Integration suggestions ready to show

---

## Demo Flow: Fresh User → Aha Moment

### Step 1: Landing Page (30 seconds)

**What to show:**
- Landing page with value proposition
- "Get Started" button

**What to say:**
- "Floyo helps you discover integration opportunities you didn't know existed"

**Action:**
- Click "Get Started" or "Sign Up"

---

### Step 2: Sign Up (1 minute)

**What to show:**
- Sign up form (email/password)
- Or "Sign in with GitHub" (if available)

**What to say:**
- "Sign up takes 30 seconds - we'll track your file usage patterns automatically"

**Action:**
- Complete signup
- Verify email (if required)

---

### Step 3: Onboarding (2 minutes)

**What to show:**
- Onboarding flow (if exists)
- Or dashboard introduction

**What to say:**
- "Floyo runs in the background, tracking which files you open and which tools you use"
- "We only track metadata - never file content - privacy-first"

**Action:**
- Complete onboarding steps
- Grant file system permissions (if CLI tool)

---

### Step 4: First Pattern Discovery (2 minutes)

**What to show:**
- Dashboard showing "Patterns Discovered"
- Or simulate pattern discovery

**What to say:**
- "Floyo has been watching your usage for [X] days"
- "Here's a pattern it discovered: You always run `process_orders.py` and then manually upload to Dropbox"

**Action:**
- Show pattern in dashboard
- Explain how pattern was discovered

---

### Step 5: Integration Suggestion (2 minutes)

**What to show:**
- Integration suggestion card
- "You manually upload processed orders to Dropbox every day. Here's a Zapier workflow that does this automatically."

**What to say:**
- "Floyo suggests concrete integrations based on your actual usage"
- "Not generic advice - actual code you can use"

**Action:**
- Click on integration suggestion
- Show suggestion details (Zapier workflow JSON, Python script modifications)

---

### Step 6: Set Up Integration (3 minutes)

**What to show:**
- Integration setup flow
- Or guide through manual setup

**What to say:**
- "Setting up this integration takes 10 minutes"
- "Floyo provides the code and instructions"

**Action:**
- Show setup steps
- Complete integration (or show completed state)

---

### Step 7: Aha Moment (1 minute)

**What to show:**
- Integration working (or simulated)
- Time saved: "You saved 30 minutes/day"
- More suggestions available

**What to say:**
- "This integration saves you 30 minutes every day"
- "Floyo found 3 more integration opportunities"
- "This is the value - discovering automations you didn't know were possible"

**Action:**
- Show additional suggestions
- Show analytics (time saved, patterns discovered)

---

## Total Demo Time: ~12 minutes

**Key Moments:**
1. **Signup** (30 seconds) - Easy onboarding
2. **Pattern Discovery** (2 minutes) - Automatic discovery
3. **Integration Suggestion** (2 minutes) - Concrete suggestions
4. **Setup** (3 minutes) - Easy implementation
5. **Aha Moment** (1 minute) - Value realized

---

## Alternative Demo Paths

### Path A: Developer Focus

1. Show CLI tool installation
2. Show file usage tracking
3. Show pattern discovery (code-focused)
4. Show integration suggestions (API connections, scripts)
5. Show time saved (developer productivity)

### Path B: E-commerce Focus

1. Show Shopify integration tracking
2. Show pattern: "Orders → Process → Upload to Dropbox"
3. Show Zapier workflow suggestion
4. Show setup and automation
5. Show ROI: "Saves 2 hours/day = $2,000/month value"

---

## Demo Tips

### Do's

- ✅ Start with the problem (manual work waste)
- ✅ Show concrete examples (real patterns, real integrations)
- ✅ Emphasize privacy-first (metadata only)
- ✅ Show time saved (quantify value)
- ✅ End with "aha moment" (value realized)

### Don'ts

- ❌ Don't get too technical (unless audience is technical)
- ❌ Don't show too many features (focus on core value)
- ❌ Don't skip the "aha moment" (this is the key)

---

## Common Demo Issues & Recovery

### Issue: No Patterns Discovered Yet

**Recovery:**
- "Let me show you what patterns look like" (use sample data)
- "In production, Floyo discovers patterns after [X] days of usage"

### Issue: Integration Setup Fails

**Recovery:**
- "Let me show you the suggested code" (show code example)
- "Users can copy this code and set it up manually"

### Issue: Demo Environment Not Ready

**Recovery:**
- Use screenshots/video instead
- "Let me walk you through what users see"

---

## Demo Script

See: `/demo/DEMO_SCRIPT.md` for exact phrases to say during demo.

---

## Demo Checklist

See: `/demo/DEMO_CHECKLIST.md` for pre-demo checklist.

---

**Status:** ✅ Demo path defined - Ready for practice

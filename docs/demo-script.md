# Demo Script

**Last Updated:** 2025-01-XX  
**Purpose:** Demo-ready guide for showcasing Floyo

---

## Executive Summary

**Demo Environment:** Production (or Preview)  
**Demo Duration:** 5-10 minutes  
**Target Audience:** Potential users, investors, stakeholders

**Key Demo Points:**
1. Sign up and onboarding (2 minutes)
2. File tracking and pattern detection (3 minutes)
3. Integration suggestions (2 minutes)
4. Dashboard insights (2 minutes)

---

## 1. Pre-Demo Setup

### Environment Selection

**Production:**
- **URL:** `https://[your-project].vercel.app`
- **Use Case:** Live demo, investor pitch, public demo

**Preview:**
- **URL:** Preview URL from PR (e.g., `https://[project]-[hash].vercel.app`)
- **Use Case:** Internal demo, testing, feature preview

### Prerequisites

- ✅ Demo account created (or use signup flow)
- ✅ Sample data seeded (if needed)
- ✅ All integrations configured (if demoing integrations)
- ✅ Browser ready (Chrome/Firefox recommended)
- ✅ Network connection stable

### Demo Data

**If seed data is needed:**
```bash
# Generate sample data (if script exists)
npm run generate-sample-data -- --userId [demo-user-id] --events 100
```

**Or manually:**
- Create test user via signup
- Simulate file usage patterns
- Generate sample insights

---

## 2. Demo Flow

### Step 1: Sign Up & Onboarding (2 minutes)

**Narrative:**
> "Floyo helps you discover hidden connections in your workflow. Let's start by signing up."

**Actions:**
1. Navigate to signup page
2. Fill in email and password
3. Complete email verification (if required)
4. Go through onboarding wizard:
   - Welcome screen
   - Privacy preferences
   - Initial setup

**Key Points to Highlight:**
- ✅ Privacy-first approach (user controls data)
- ✅ Simple onboarding (3 steps)
- ✅ Clear value proposition

**Demo URL:** `https://[project].vercel.app/signup`

---

### Step 2: Dashboard Overview (1 minute)

**Narrative:**
> "Once you're in, you'll see your dashboard. This is where Floyo shows you patterns and insights."

**Actions:**
1. Navigate to dashboard
2. Show empty state (if no data yet)
3. Explain what will appear:
   - File usage patterns
   - Integration suggestions
   - Usage statistics

**Key Points to Highlight:**
- ✅ Clean, intuitive interface
- ✅ Real-time updates
- ✅ Privacy controls visible

**Demo URL:** `https://[project].vercel.app/dashboard`

---

### Step 3: File Tracking & Pattern Detection (3 minutes)

**Narrative:**
> "Floyo tracks how you work—the files you open, scripts you run, tools you use. Let me show you how it detects patterns."

**Actions:**
1. Show file tracking in action (if demo client available)
2. Or show pre-populated patterns:
   - File extensions used
   - Tools used together
   - Time-based patterns
3. Explain pattern detection:
   - "Floyo noticed you always..."
   - "This pattern suggests..."

**Key Points to Highlight:**
- ✅ Automatic pattern detection
- ✅ Privacy-respecting (local-first)
- ✅ Actionable insights

**Demo URL:** `https://[project].vercel.app/patterns`

---

### Step 4: Integration Suggestions (2 minutes)

**Narrative:**
> "Based on your patterns, Floyo suggests concrete integrations you can use. Let's see what it recommends."

**Actions:**
1. Navigate to suggestions page
2. Show integration suggestions:
   - "You always run this Python script and upload to Dropbox"
   - "Suggested integration: Automate upload step"
3. Show integration code/example
4. Explain how to implement

**Key Points to Highlight:**
- ✅ Personalized suggestions
- ✅ Real code examples
- ✅ Easy to implement

**Demo URL:** `https://[project].vercel.app/suggestions`

---

### Step 5: Dashboard Insights (2 minutes)

**Narrative:**
> "Finally, let's look at your usage insights. Floyo helps you understand your work patterns."

**Actions:**
1. Navigate to insights/analytics page
2. Show:
   - Usage statistics
   - Time-based patterns
   - Tool usage breakdown
3. Highlight key insights:
   - "You use Python 40% of the time"
   - "Your peak productivity is 10am-12pm"

**Key Points to Highlight:**
- ✅ Data-driven insights
- ✅ Visualizations
- ✅ Actionable recommendations

**Demo URL:** `https://[project].vercel.app/insights`

---

## 3. Demo Scenarios

### Scenario A: Data Analyst

**Use Case:** CSV processing → Email automation

**Demo Flow:**
1. Show CSV file usage pattern
2. Show email sending pattern
3. Show integration suggestion: "Automate email after CSV processing"
4. Show code example for automation

**Key Message:** "Save 30 minutes per day with automated workflows"

---

### Scenario B: Developer

**Use Case:** TypeScript editing → Test running → Deployment

**Demo Flow:**
1. Show TypeScript file usage pattern
2. Show test running pattern
3. Show deployment pattern
4. Show integration suggestion: "Connect test → deployment"
5. Show workflow automation example

**Key Message:** "Catch deployment issues faster, reduce context switching"

---

### Scenario C: Content Creator

**Use Case:** Markdown editing → PDF conversion → Cloud upload

**Demo Flow:**
1. Show markdown file usage pattern
2. Show PDF conversion pattern
3. Show cloud upload pattern
4. Show integration suggestion: "One-click publish workflow"
5. Show automation example

**Key Message:** "Publish content 3x faster with zero manual steps"

---

## 4. Demo Checklist

### Pre-Demo

- [ ] Demo environment is accessible (Production or Preview)
- [ ] Demo account created and verified
- [ ] Sample data seeded (if needed)
- [ ] Browser ready (Chrome/Firefox)
- [ ] Network connection stable
- [ ] All integrations configured (if demoing)
- [ ] Demo script reviewed

### During Demo

- [ ] Sign up flow works smoothly
- [ ] Onboarding completes without errors
- [ ] Dashboard loads quickly (<2 seconds)
- [ ] Patterns are visible and understandable
- [ ] Integration suggestions are relevant
- [ ] Insights are clear and actionable

### Post-Demo

- [ ] Answer questions about:
  - Privacy and data handling
  - Integration capabilities
  - Pricing (if applicable)
  - Roadmap and features
- [ ] Collect feedback
- [ ] Follow up with interested parties

---

## 5. Troubleshooting

### Issue: Demo environment not accessible

**Solution:**
- Check Vercel deployment status
- Verify URL is correct
- Check network connection
- Try preview URL if production is down

### Issue: Demo account not working

**Solution:**
- Verify email verification completed
- Check Supabase Dashboard → Authentication → Users
- Try creating new account
- Check error logs in browser console

### Issue: No data showing

**Solution:**
- Verify sample data was seeded
- Check database connection
- Review API endpoints in Network tab
- Check Supabase Dashboard → Database → Tables

### Issue: Slow loading

**Solution:**
- Check network connection
- Verify Vercel deployment is healthy
- Check browser console for errors
- Try refreshing page

---

## 6. Demo Metrics

### Success Metrics

**During Demo:**
- ✅ Signup completion rate: 100%
- ✅ Onboarding completion: 100%
- ✅ Dashboard load time: <2 seconds
- ✅ Zero errors or crashes

**Post-Demo:**
- ✅ Questions answered satisfactorily
- ✅ Interest expressed (signups, follow-ups)
- ✅ Feedback collected

---

## 7. Demo Variations

### Quick Demo (5 minutes)

**Focus:** Core value proposition
1. Sign up (1 min)
2. Dashboard overview (1 min)
3. Pattern detection (2 min)
4. Integration suggestion (1 min)

### Full Demo (10 minutes)

**Focus:** Complete feature set
1. Sign up & onboarding (2 min)
2. Dashboard overview (1 min)
3. File tracking (2 min)
4. Pattern detection (2 min)
5. Integration suggestions (2 min)
6. Insights & analytics (1 min)

### Technical Demo (15 minutes)

**Focus:** Technical capabilities
1. Architecture overview (2 min)
2. Sign up & onboarding (2 min)
3. API endpoints (3 min)
4. Integration examples (5 min)
5. Privacy & security (3 min)

---

## 8. Demo Resources

### Slides (If Needed)

- **Problem Statement:** Why Floyo exists
- **Solution:** How Floyo solves the problem
- **Features:** Key features overview
- **Demo:** Live demo
- **Next Steps:** How to get started

### Demo Video (Optional)

**Record demo for:**
- Asynchronous sharing
- Documentation
- Marketing materials

**Tools:**
- Loom
- OBS Studio
- Screen recording software

---

## 9. Post-Demo Follow-Up

### Immediate Actions

1. **Collect Contact Information:**
   - Email addresses
   - Company names
   - Roles/titles

2. **Answer Questions:**
   - Privacy and security
   - Integration capabilities
   - Pricing and plans
   - Roadmap

3. **Schedule Follow-Up:**
   - Technical deep dive (if needed)
   - Trial access (if applicable)
   - Next steps

### Follow-Up Email Template

```
Subject: Thank you for the Floyo demo!

Hi [Name],

Thank you for taking the time to see Floyo in action!

As discussed, here are the key points:
- [Key point 1]
- [Key point 2]
- [Key point 3]

Next steps:
- [Action item 1]
- [Action item 2]

Questions? Reply to this email or schedule a call: [link]

Best,
[Your name]
```

---

## 10. Demo Success Criteria

### Must-Have

- ✅ Demo environment accessible
- ✅ Sign up flow works
- ✅ Dashboard loads
- ✅ Patterns visible
- ✅ Integration suggestions shown

### Nice-to-Have

- ✅ Sample data pre-populated
- ✅ Integrations configured
- ✅ Analytics visible
- ✅ Privacy controls demonstrated

---

**Last Updated:** 2025-01-XX  
**Status:** ✅ Demo Script Complete

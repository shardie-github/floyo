# Jobs-to-Be-Done - Current Flows

**Last Updated:** 2025-01-20  
**Status:** Template - Founders to map actual user flows and identify friction points

---

## Overview

This document maps the current user flows in Floyo for each primary Job-to-Be-Done. For each job, we document: step-by-step flow, friction points, completion rates, and improvement opportunities.

---

## Primary Jobs-to-Be-Done

### Job 1: "Discover Integration Opportunities"

**Job Statement:** "When I'm manually syncing data between tools, I want Floyo to discover integration opportunities, so I can automate repetitive work."

#### Current Flow

**Step 1: Sign Up**
- User visits landing page
- Clicks "Sign Up" or "Get Started"
- Fills out signup form (email, password)
- Verifies email
- **Completion Rate:** [TODO: Track signup completion rate]
- **Friction Points:**
  - [TODO: Email verification friction?]
  - [TODO: Password requirements too strict?]
  - [TODO: Form too long?]

**Step 2: Install CLI Tool**
- User downloads Floyo CLI
- Installs CLI tool (npm install -g floyo or pip install floyo)
- Runs `floyo init` command
- Grants file system permissions
- **Completion Rate:** [TODO: Track CLI installation rate]
- **Friction Points:**
  - [TODO: Installation complexity?]
  - [TODO: Permission requests confusing?]
  - [TODO: Platform-specific issues?]

**Step 3: Start Tracking**
- User runs `floyo start` command
- Floyo begins tracking file usage patterns
- User continues normal work
- **Completion Rate:** [TODO: Track tracking start rate]
- **Friction Points:**
  - [TODO: User forgets to start tracking?]
  - [TODO: Privacy concerns?]
  - [TODO: Performance impact concerns?]

**Step 4: Pattern Discovery (Automatic)**
- Floyo tracks file usage for 1-7 days
- Pattern discovery algorithm identifies relationships
- Patterns stored in database
- **Completion Rate:** [TODO: Track pattern discovery rate]
- **Friction Points:**
  - [TODO: Takes too long to discover patterns?]
  - [TODO: Patterns not accurate?]
  - [TODO: User doesn't understand what's happening?]

**Step 5: View Integration Suggestions**
- User logs into Floyo dashboard
- Sees integration suggestions based on patterns
- Clicks on suggestion to view details
- **Completion Rate:** [TODO: Track suggestion view rate]
- **Friction Points:**
  - [TODO: Suggestions not relevant?]
  - [TODO: Dashboard confusing?]
  - [TODO: User doesn't know suggestions exist?]

**Step 6: Review Suggestion Details**
- User views suggestion details (what it does, how to set up)
- Reviews code examples or Zapier workflow
- Decides whether to implement
- **Completion Rate:** [TODO: Track detail view rate]
- **Friction Points:**
  - [TODO: Details unclear?]
  - [TODO: Setup too complex?]
  - [TODO: User doesn't understand value?]

**Step 7: Implement Integration**
- User clicks "Set up integration" or "Implement"
- Follows setup instructions
- Integration is configured
- **Completion Rate:** [TODO: Track implementation rate]
- **Friction Points:**
  - [TODO: Setup too complex?]
  - [TODO: Missing instructions?]
  - [TODO: Integration doesn't work?]

**Step 8: Verify Integration Works**
- User tests integration
- Verifies it works as expected
- Marks integration as complete
- **Completion Rate:** [TODO: Track verification rate]
- **Friction Points:**
  - [TODO: Integration doesn't work?]
  - [TODO: User doesn't know how to verify?]
  - [TODO: No feedback mechanism?]

#### Flow Metrics

**Overall Completion Rate:** [TODO: Calculate end-to-end completion rate]

**Funnel Analysis:**
- Sign Up → Install CLI: [TODO]% drop-off
- Install CLI → Start Tracking: [TODO]% drop-off
- Start Tracking → Pattern Discovery: [TODO]% drop-off
- Pattern Discovery → View Suggestions: [TODO]% drop-off
- View Suggestions → Review Details: [TODO]% drop-off
- Review Details → Implement: [TODO]% drop-off
- Implement → Verify: [TODO]% drop-off

**Time to Complete Job:**
- Average: [TODO] days
- Median: [TODO] days
- Target: 7 days

#### Friction Points Summary

**High Friction (Causing >20% drop-off):**
1. [TODO: Friction point 1]
2. [TODO: Friction point 2]
3. [TODO: Friction point 3]

**Medium Friction (Causing 10-20% drop-off):**
1. [TODO: Friction point 1]
2. [TODO: Friction point 2]

**Low Friction (Causing <10% drop-off):**
1. [TODO: Friction point 1]

#### Improvement Opportunities

**Quick Wins (Low effort, high impact):**
1. [TODO: Improvement 1]
2. [TODO: Improvement 2]
3. [TODO: Improvement 3]

**Medium-Term Improvements:**
1. [TODO: Improvement 1]
2. [TODO: Improvement 2]

**Long-Term Improvements:**
1. [TODO: Improvement 1]
2. [TODO: Improvement 2]

---

### Job 2: "Optimize Tool Stack"

**Job Statement:** "When I'm paying for tools I don't use, I want Floyo to show me which tools I actually use, so I can cancel unused subscriptions and save money."

#### Current Flow

**Step 1: Sign Up** (Same as Job 1)

**Step 2: Install CLI Tool** (Same as Job 1)

**Step 3: Start Tracking** (Same as Job 1)

**Step 4: Tool Usage Analysis (Automatic)**
- Floyo tracks tool usage over 30 days
- Identifies which tools are used vs. subscribed to
- Generates usage report
- **Completion Rate:** [TODO: Track analysis completion rate]
- **Friction Points:**
  - [TODO: Takes too long (30 days)?]
  - [TODO: Analysis not accurate?]
  - [TODO: User doesn't know report exists?]

**Step 5: View Tool Usage Report**
- User logs into dashboard
- Navigates to "Tool Usage" section
- Views list of tools with usage stats
- **Completion Rate:** [TODO: Track report view rate]
- **Friction Points:**
  - [TODO: Report hard to find?]
  - [TODO: Report confusing?]
  - [TODO: User doesn't understand metrics?]

**Step 6: Identify Unused Tools**
- User reviews tool list
- Identifies tools with low/no usage
- Reviews cost per tool
- **Completion Rate:** [TODO: Track identification rate]
- **Friction Points:**
  - [TODO: Hard to identify unused tools?]
  - [TODO: Cost not visible?]
  - [TODO: User unsure if tool is unused?]

**Step 7: Cancel Unused Subscriptions**
- User decides to cancel unused tools
- Cancels subscriptions manually
- Updates Floyo (optional)
- **Completion Rate:** [TODO: Track cancellation rate]
- **Friction Points:**
  - [TODO: Cancellation process complex?]
  - [TODO: User forgets to cancel?]
  - [TODO: No reminder system?]

**Step 8: Verify Savings**
- User reviews monthly savings
- Tracks money saved over time
- **Completion Rate:** [TODO: Track verification rate]
- **Friction Points:**
  - [TODO: Savings not tracked?]
  - [TODO: User doesn't see value?]

#### Flow Metrics

**Overall Completion Rate:** [TODO: Calculate end-to-end completion rate]

**Funnel Analysis:**
- Sign Up → Tool Analysis: [TODO]% drop-off
- Tool Analysis → View Report: [TODO]% drop-off
- View Report → Identify Unused: [TODO]% drop-off
- Identify Unused → Cancel: [TODO]% drop-off
- Cancel → Verify Savings: [TODO]% drop-off

**Time to Complete Job:**
- Average: [TODO] days
- Median: [TODO] days
- Target: 30 days

#### Friction Points Summary

**High Friction:**
1. [TODO: Friction point 1]
2. [TODO: Friction point 2]

**Medium Friction:**
1. [TODO: Friction point 1]

**Low Friction:**
1. [TODO: Friction point 1]

#### Improvement Opportunities

**Quick Wins:**
1. [TODO: Improvement 1]
2. [TODO: Improvement 2]

**Medium-Term:**
1. [TODO: Improvement 1]

**Long-Term:**
1. [TODO: Improvement 1]

---

### Job 3: "Monitor Integration Health"

**Job Statement:** "When my automations break, I want Floyo to alert me immediately, so I don't lose sales from failed workflows."

#### Current Flow

**Step 1: Set Up Integration** (From Job 1)

**Step 2: Integration Monitoring (Automatic)**
- Floyo monitors integration health
- Tracks workflow executions
- Detects failures
- **Completion Rate:** [TODO: Track monitoring setup rate]
- **Friction Points:**
  - [TODO: Monitoring not automatic?]
  - [TODO: User doesn't know monitoring exists?]
  - [TODO: False positives?]

**Step 3: Receive Alert**
- Integration fails
- Floyo sends alert (email, in-app notification)
- User receives alert
- **Completion Rate:** [TODO: Track alert delivery rate]
- **Friction Points:**
  - [TODO: Alert not timely?]
  - [TODO: Alert goes to spam?]
  - [TODO: User doesn't see alert?]

**Step 4: View Failure Details**
- User clicks alert or logs into dashboard
- Views failure details (what failed, when, why)
- Reviews error logs
- **Completion Rate:** [TODO: Track detail view rate]
- **Friction Points:**
  - [TODO: Details unclear?]
  - [TODO: Error logs confusing?]
  - [TODO: User doesn't understand issue?]

**Step 5: Fix Integration**
- User identifies root cause
- Fixes integration (updates config, fixes code)
- Tests fix
- **Completion Rate:** [TODO: Track fix rate]
- **Friction Points:**
  - [TODO: Fix too complex?]
  - [TODO: No guidance on how to fix?]
  - [TODO: User doesn't know how to fix?]

**Step 6: Verify Fix Works**
- User verifies integration works
- Monitors for 24-48 hours
- Marks as resolved
- **Completion Rate:** [TODO: Track verification rate]
- **Friction Points:**
  - [TODO: Verification unclear?]
  - [TODO: User doesn't know if fixed?]

#### Flow Metrics

**Overall Completion Rate:** [TODO: Calculate end-to-end completion rate]

**Funnel Analysis:**
- Set Up Integration → Monitoring: [TODO]% drop-off
- Monitoring → Receive Alert: [TODO]% drop-off
- Receive Alert → View Details: [TODO]% drop-off
- View Details → Fix: [TODO]% drop-off
- Fix → Verify: [TODO]% drop-off

**Time to Complete Job:**
- Average: [TODO] hours
- Median: [TODO] hours
- Target: <2 hours

#### Friction Points Summary

**High Friction:**
1. [TODO: Friction point 1]
2. [TODO: Friction point 2]

**Medium Friction:**
1. [TODO: Friction point 1]

**Low Friction:**
1. [TODO: Friction point 1]

#### Improvement Opportunities

**Quick Wins:**
1. [TODO: Improvement 1]
2. [TODO: Improvement 2]

**Medium-Term:**
1. [TODO: Improvement 1]

**Long-Term:**
1. [TODO: Improvement 1]

---

## Cross-Job Patterns

### Common Friction Points Across All Jobs
1. **Onboarding Complexity:** [TODO: How complex is onboarding?]
2. **Dashboard Discoverability:** [TODO: Can users find features?]
3. **Value Communication:** [TODO: Do users understand value?]
4. **Setup Complexity:** [TODO: Is setup too complex?]

### Common Drop-Off Points
1. **Sign Up → Install CLI:** [TODO]% drop-off
2. **Install CLI → Start Tracking:** [TODO]% drop-off
3. **Pattern Discovery → View Suggestions:** [TODO]% drop-off

### Improvement Priorities
1. **Reduce Onboarding Friction:** [TODO: Specific improvements]
2. **Improve Dashboard UX:** [TODO: Specific improvements]
3. **Simplify Setup:** [TODO: Specific improvements]
4. **Better Value Communication:** [TODO: Specific improvements]

---

## TODO: Founders to Complete

> **TODO:** Map actual user flows with real data
> **TODO:** Track completion rates at each step
> **TODO:** Identify friction points causing drop-offs
> **TODO:** Prioritize improvements based on impact
> **TODO:** Test improvements with users
> **TODO:** Update flows as product evolves

---

**Status:** ✅ Template Complete - Ready for founder flow mapping and optimization

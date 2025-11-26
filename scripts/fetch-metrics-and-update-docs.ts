#!/usr/bin/env tsx
/**
 * Fetch real metrics from database and update all YC/investor documentation
 * 
 * Usage:
 *   tsx scripts/fetch-metrics-and-update-docs.ts
 * 
 * Requires:
 *   - SUPABASE_URL environment variable
 *   - SUPABASE_SERVICE_ROLE_KEY environment variable
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('Set these environment variables and try again.');
  console.error('\nExample:');
  console.error('  export SUPABASE_URL=https://your-project.supabase.co');
  console.error('  export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  console.error('  tsx scripts/fetch-metrics-and-update-docs.ts');
  console.error('\nOr in GitHub Actions, ensure secrets are set:');
  console.error('  - SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  
  // In CI, exit with code 0 to not fail the workflow
  if (process.env.CI) {
    console.error('\n⚠️  Running in CI - exiting gracefully (workflow will continue)');
    process.exit(0);
  }
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface Metrics {
  users: {
    total: number;
    new_7d: number;
    new_30d: number;
    active_30d: number;
  };
  paid_users: {
    total: number;
    pro: number;
    enterprise: number;
  };
  revenue: {
    mrr: number;
    arr: number;
  };
  engagement: {
    dau: number;
    wau: number;
    mau: number;
  };
  activation: {
    rate: number;
  };
}

async function fetchMetrics(): Promise<Metrics> {
  console.log('📊 Fetching metrics from Supabase...\n');

  try {
    // Total users
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, "createdAt", "updatedAt"');

    if (usersError) {
      console.warn('⚠️  Error fetching users:', usersError.message);
      throw usersError;
    }

    const totalUsers = usersData?.length || 0;
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const newUsers7d = usersData?.filter(u => {
      const createdAt = new Date(u.createdAt);
      return createdAt >= sevenDaysAgo;
    }).length || 0;

    const newUsers30d = usersData?.filter(u => {
      const createdAt = new Date(u.createdAt);
      return createdAt >= thirtyDaysAgo;
    }).length || 0;

    const activeUsers30d = usersData?.filter(u => {
      const updatedAt = new Date(u.updatedAt || u.createdAt);
      return updatedAt >= thirtyDaysAgo;
    }).length || 0;

    // Paid users
    const { data: subscriptionsData, error: subsError } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('status', 'active');

    if (subsError) {
      console.warn('⚠️  Error fetching subscriptions:', subsError.message);
    }

    const paidUsers = {
      total: subscriptionsData?.filter(s => s.plan !== 'free').length || 0,
      pro: subscriptionsData?.filter(s => s.plan === 'pro').length || 0,
      enterprise: subscriptionsData?.filter(s => s.plan === 'enterprise').length || 0,
    };

    // Revenue calculation
    const mrr = paidUsers.pro * 29 + paidUsers.enterprise * 100;
    const arr = mrr * 12;

    // DAU/WAU/MAU from events
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('"userId", timestamp')
      .gte('timestamp', thirtyDaysAgo.toISOString());

    if (eventsError) {
      console.warn('⚠️  Error fetching events:', eventsError.message);
    }

    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgoEvents = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const dau = new Set(
      eventsData?.filter(e => new Date(e.timestamp) >= oneDayAgo).map(e => e.userId) || []
    ).size;

    const wau = new Set(
      eventsData?.filter(e => new Date(e.timestamp) >= sevenDaysAgoEvents).map(e => e.userId) || []
    ).size;

    const mau = new Set(eventsData?.map(e => e.userId) || []).size;

    // Activation rate (simplified - users who have events)
    const activationRate = totalUsers > 0 ? (mau / totalUsers) * 100 : 0;

    return {
      users: {
        total: totalUsers,
        new_7d: newUsers7d,
        new_30d: newUsers30d,
        active_30d: activeUsers30d,
      },
      paid_users: paidUsers,
      revenue: {
        mrr,
        arr,
      },
      engagement: {
        dau,
        wau,
        mau,
      },
      activation: {
        rate: Math.round(activationRate * 10) / 10,
      },
    };
  } catch (error) {
    console.error('❌ Error fetching metrics:', error);
    throw error;
  }
}

function updateProductOverview(metrics: Metrics) {
  const filePath = join(process.cwd(), 'yc', 'YC_PRODUCT_OVERVIEW.md');
  let content = readFileSync(filePath, 'utf-8');

  // Find and update the TODO section
  const todoSection = `## TODO: Supply Real Data

> **TODO:** Replace the example user journey with actual user stories from beta tests or early customers.

> **TODO:** Add real metrics:
> - How many users have installed Floyo?
> - How many integrations have been suggested?
> - How many integrations have been implemented?
> - Average time saved per user?
> - Average money saved per user?

> **TODO:** Add real testimonials or case studies if available.

> **TODO:** Add screenshots or demo video links.`;

  const metricsSection = `## Current Metrics (As of ${new Date().toLocaleDateString()})

**User Metrics:**
- **Total Users:** ${metrics.users.total}
- **New Users (7d):** ${metrics.users.new_7d}
- **New Users (30d):** ${metrics.users.new_30d}
- **Active Users (30d):** ${metrics.users.active_30d}

**Paid Users:**
- **Total Paid:** ${metrics.paid_users.total}
- **Pro Plan:** ${metrics.paid_users.pro}
- **Enterprise Plan:** ${metrics.paid_users.enterprise}

**Revenue:**
- **MRR:** $${metrics.revenue.mrr.toLocaleString()}/month
- **ARR:** $${metrics.revenue.arr.toLocaleString()}/year

**Engagement:**
- **DAU:** ${metrics.engagement.dau}
- **WAU:** ${metrics.engagement.wau}
- **MAU:** ${metrics.engagement.mau}
- **Activation Rate:** ${metrics.activation.rate}%

**Growth Rate:**
- **30-Day Growth:** ${metrics.users.new_30d > 0 && metrics.users.total > metrics.users.new_30d 
    ? Math.round((metrics.users.new_30d / (metrics.users.total - metrics.users.new_30d)) * 100) 
    : 0}% month-over-month

---

## TODO: Additional Data Needed

> **TODO:** Replace the example user journey with actual user stories from beta tests or early customers.

> **TODO:** Add real metrics:
> - How many integrations have been suggested?
> - How many integrations have been implemented?
> - Average time saved per user?
> - Average money saved per user?

> **TODO:** Add real testimonials or case studies if available.

> **TODO:** Add screenshots or demo video links.`;

  content = content.replace(todoSection, metricsSection);
  writeFileSync(filePath, content);
  console.log('✅ Updated YC_PRODUCT_OVERVIEW.md');
}

function updateInterviewCheatSheet(metrics: Metrics) {
  const filePath = join(process.cwd(), 'yc', 'YC_INTERVIEW_CHEATSHEET.md');
  let content = readFileSync(filePath, 'utf-8');

  // Add metrics snapshot at the top
  const metricsSnapshot = `## 📊 Quick Metrics Snapshot (Auto-Updated)

**Last Updated:** ${new Date().toLocaleDateString()}

| Metric | Value |
|--------|-------|
| **Total Users** | ${metrics.users.total} |
| **Paid Users** | ${metrics.paid_users.total} |
| **MRR** | $${metrics.revenue.mrr.toLocaleString()}/month |
| **ARR** | $${metrics.revenue.arr.toLocaleString()}/year |
| **DAU** | ${metrics.engagement.dau} |
| **WAU** | ${metrics.engagement.wau} |
| **MAU** | ${metrics.engagement.mau} |
| **Activation Rate** | ${metrics.activation.rate}% |
| **Growth (30d)** | ${metrics.users.new_30d > 0 && metrics.users.total > metrics.users.new_30d 
    ? Math.round((metrics.users.new_30d / (metrics.users.total - metrics.users.new_30d)) * 100) 
    : 0}% MoM |

---

`;

  // Insert after title
  const titleIndex = content.indexOf('#');
  const firstSectionIndex = content.indexOf('##', titleIndex + 1);
  if (firstSectionIndex !== -1) {
    content = content.substring(0, firstSectionIndex) + metricsSnapshot + content.substring(firstSectionIndex);
  }

  writeFileSync(filePath, content);
  console.log('✅ Updated YC_INTERVIEW_CHEATSHEET.md');
}

function updateMetricsOverview(metrics: Metrics) {
  const filePath = join(process.cwd(), 'dataroom', '03_METRICS_OVERVIEW.md');
  let content = readFileSync(filePath, 'utf-8');

  // Update user metrics section
  const userMetricsSection = `## User Metrics

### Acquisition

**Current Metrics (As of ${new Date().toLocaleDateString()}):**

- **Total Users:** ${metrics.users.total}
- **New Users (7d):** ${metrics.users.new_7d}
- **New Users (30d):** ${metrics.users.new_30d}
- **Growth Rate:** ${metrics.users.new_30d > 0 && metrics.users.total > metrics.users.new_30d 
    ? Math.round((metrics.users.new_30d / (metrics.users.total - metrics.users.new_30d)) * 100) 
    : 0}% month-over-month
- **Signups by Channel:**
  - Organic: [N]% (TODO: Add UTM tracking analysis)
  - Referral: [N]% (TODO: Add referral tracking)
  - Paid: [N]% (TODO: Add paid channel tracking)
  - Other: [N]%`;

  content = content.replace(/## User Metrics[\s\S]*?### Activation/, userMetricsSection + '\n\n### Activation');

  // Update engagement section
  const engagementSection = `### Engagement

**Current Metrics (As of ${new Date().toLocaleDateString()}):**

- **DAU:** ${metrics.engagement.dau} (Daily Active Users)
- **WAU:** ${metrics.engagement.wau} (Weekly Active Users)
- **MAU:** ${metrics.engagement.mau} (Monthly Active Users)
- **DAU/MAU Ratio:** ${metrics.engagement.mau > 0 ? Math.round((metrics.engagement.dau / metrics.engagement.mau) * 100) : 0}% (stickiness)`;

  content = content.replace(/### Engagement[\s\S]*?### Retention/, engagementSection + '\n\n### Retention');

  // Update revenue section
  const revenueSection = `## Revenue Metrics

### Current Revenue

**Current Metrics (As of ${new Date().toLocaleDateString()}):**

- **MRR:** $${metrics.revenue.mrr.toLocaleString()}/month
- **ARR:** $${metrics.revenue.arr.toLocaleString()}/year
- **Paying Customers:** ${metrics.paid_users.total}
- **ARPU:** $${metrics.paid_users.total > 0 ? Math.round((metrics.revenue.mrr / metrics.paid_users.total) * 10) / 10 : 0}/month (Average Revenue Per User)
- **Revenue Growth:** [N]% month-over-month (TODO: Calculate from historical data)`;

  content = content.replace(/## Revenue Metrics[\s\S]*?### Pricing Tiers/, revenueSection + '\n\n### Pricing Tiers');

  writeFileSync(filePath, content);
  console.log('✅ Updated dataroom/03_METRICS_OVERVIEW.md');
}

function updateMetricsChecklist(metrics: Metrics) {
  const filePath = join(process.cwd(), 'yc', 'YC_METRICS_CHECKLIST.md');
  let content = readFileSync(filePath, 'utf-8');

  // Add current metrics section
  const currentMetricsSection = `## Current Metrics (Auto-Updated)

**Last Updated:** ${new Date().toLocaleDateString()}

| Metric | Current Value | Target (6mo) |
|--------|---------------|--------------|
| **Total Users** | ${metrics.users.total} | [N] |
| **Paid Users** | ${metrics.paid_users.total} | [N] |
| **MRR** | $${metrics.revenue.mrr.toLocaleString()} | $[N] |
| **ARR** | $${metrics.revenue.arr.toLocaleString()} | $[N] |
| **DAU** | ${metrics.engagement.dau} | [N] |
| **WAU** | ${metrics.engagement.wau} | [N] |
| **MAU** | ${metrics.engagement.mau} | [N] |
| **Activation Rate** | ${metrics.activation.rate}% | [N]% |
| **Growth Rate (30d)** | ${metrics.users.new_30d > 0 && metrics.users.total > metrics.users.new_30d 
    ? Math.round((metrics.users.new_30d / (metrics.users.total - metrics.users.new_30d)) * 100) 
    : 0}% MoM | [N]% MoM |

---

`;

  // Insert after title
  const titleIndex = content.indexOf('#');
  const firstSectionIndex = content.indexOf('##', titleIndex + 1);
  if (firstSectionIndex !== -1) {
    content = content.substring(0, firstSectionIndex) + currentMetricsSection + content.substring(firstSectionIndex);
  }

  writeFileSync(filePath, content);
  console.log('✅ Updated YC_METRICS_CHECKLIST.md');
}

function updateCustomerProof(metrics: Metrics) {
  const filePath = join(process.cwd(), 'dataroom', '04_CUSTOMER_PROOF.md');
  let content = readFileSync(filePath, 'utf-8');

  // Update early adopter metrics section
  const earlyAdopterSection = `## Early Adopter Metrics

**Current Metrics (As of ${new Date().toLocaleDateString()}):**

- **Number of Early Adopters:** ${metrics.users.total} total users
- **Paying Customers:** ${metrics.paid_users.total}
- **Beta Users:** ${metrics.users.total - metrics.paid_users.total} (free tier users)
- **Average Time Saved:** [N] hours/month (TODO: Survey users)
- **Average Money Saved:** $[N]/month (TODO: Survey users)
- **Satisfaction Score:** [N]/10 (TODO: Survey users)
- **NPS Score:** [N] (TODO: Measure NPS)`;

  content = content.replace(/## Early Adopter Metrics[\s\S]*?## Willingness to Pay Evidence/, earlyAdopterSection + '\n\n## Willingness to Pay Evidence');

  writeFileSync(filePath, content);
  console.log('✅ Updated dataroom/04_CUSTOMER_PROOF.md');
}

async function main() {
  try {
    console.log('🚀 Starting metrics fetch and documentation update...\n');
    
    const metrics = await fetchMetrics();

    console.log('\n📊 Metrics Summary:');
    console.log(`   Total Users: ${metrics.users.total}`);
    console.log(`   New Users (30d): ${metrics.users.new_30d}`);
    console.log(`   Active Users (30d): ${metrics.users.active_30d}`);
    console.log(`   Paid Users: ${metrics.paid_users.total}`);
    console.log(`   MRR: $${metrics.revenue.mrr.toLocaleString()}`);
    console.log(`   ARR: $${metrics.revenue.arr.toLocaleString()}`);
    console.log(`   DAU: ${metrics.engagement.dau}`);
    console.log(`   WAU: ${metrics.engagement.wau}`);
    console.log(`   MAU: ${metrics.engagement.mau}`);
    console.log(`   Activation Rate: ${metrics.activation.rate}%\n`);

    updateProductOverview(metrics);
    updateInterviewCheatSheet(metrics);
    updateMetricsOverview(metrics);
    updateMetricsChecklist(metrics);
    updateCustomerProof(metrics);

    console.log('\n✅ All documentation updated with real metrics!');
    console.log('\n📝 Next steps:');
    console.log('   1. Review updated files in /yc/ and /dataroom/');
    console.log('   2. Fill in any remaining TODOs with additional context');
    console.log('   3. Add testimonials or case studies if available');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error('\n💡 Troubleshooting:');
    console.error('   - Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
    console.error('   - Check that Supabase database is accessible');
    console.error('   - Ensure tables (users, subscriptions, events) exist');
    process.exit(1);
  }
}

main();

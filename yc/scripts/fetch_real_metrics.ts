#!/usr/bin/env tsx
/**
 * Automated script to fetch real metrics from database and update YC docs
 * 
 * Usage:
 *   tsx yc/scripts/fetch_real_metrics.ts
 * 
 * Requires:
 *   - DATABASE_URL environment variable
 *   - Supabase connection configured
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('Set these environment variables and try again.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface Metrics {
  users: {
    total: number;
    new_7d: number;
    new_30d: number;
    new_90d: number;
  };
  paid_users: {
    total: number;
    pro: number;
    enterprise: number;
    active: number;
  };
  dau_wau_mau: {
    dau: number;
    wau: number;
    mau: number;
  };
  activation: {
    total_signups: number;
    activated_users: number;
    activation_rate: number;
  };
  retention: {
    retention_7d: number;
    retention_30d: number;
  };
  revenue: {
    mrr: number;
    arr: number;
    arpu: number;
  };
  engagement: {
    events_per_user: number;
    integrations_per_user: number;
  };
}

async function fetchMetrics(): Promise<Metrics> {
  console.log('📊 Fetching metrics from database...\n');

  // Total users
  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('id, created_at')
    .order('created_at', { ascending: false });

  if (usersError) {
    console.warn('⚠️  Error fetching users:', usersError.message);
  }

  const totalUsers = usersData?.length || 0;
  const now = new Date();
  const newUsers7d = usersData?.filter(u => {
    const createdAt = new Date(u.created_at);
    return (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24) <= 7;
  }).length || 0;
  const newUsers30d = usersData?.filter(u => {
    const createdAt = new Date(u.created_at);
    return (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24) <= 30;
  }).length || 0;
  const newUsers90d = usersData?.filter(u => {
    const createdAt = new Date(u.created_at);
    return (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24) <= 90;
  }).length || 0;

  // Paid users
  const { data: subscriptionsData } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('status', 'active');

  const paidUsers = {
    total: subscriptionsData?.filter(s => s.plan !== 'free').length || 0,
    pro: subscriptionsData?.filter(s => s.plan === 'pro').length || 0,
    enterprise: subscriptionsData?.filter(s => s.plan === 'enterprise').length || 0,
    active: subscriptionsData?.filter(s => s.plan !== 'free' && s.status === 'active').length || 0,
  };

  // DAU/WAU/MAU
  const { data: eventsData } = await supabase
    .from('events')
    .select('user_id, timestamp')
    .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const uniqueUsers24h = new Set(
    eventsData?.filter(e => {
      const eventTime = new Date(e.timestamp);
      return (now.getTime() - eventTime.getTime()) / (1000 * 60 * 60) <= 24;
    }).map(e => e.user_id) || []
  );

  const uniqueUsers7d = new Set(
    eventsData?.filter(e => {
      const eventTime = new Date(e.timestamp);
      return (now.getTime() - eventTime.getTime()) / (1000 * 60 * 60 * 24) <= 7;
    }).map(e => e.user_id) || []
  );

  const uniqueUsers30d = new Set(
    eventsData?.map(e => e.user_id) || []
  );

  // Activation (simplified - check audit_logs for activation events)
  const { data: activationData } = await supabase
    .from('audit_logs')
    .select('user_id, action')
    .like('action', '%activation%')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const activatedUsers = new Set(activationData?.map(a => a.user_id) || []).size;
  const activationRate = totalUsers > 0 ? (activatedUsers / totalUsers) * 100 : 0;

  // Revenue (simplified calculation)
  const mrr = paidUsers.pro * 29 + paidUsers.enterprise * 100;
  const arr = mrr * 12;
  const arpu = paidUsers.total > 0 ? mrr / paidUsers.total : 0;

  // Engagement (simplified)
  const totalEvents = eventsData?.length || 0;
  const eventsPerUser = uniqueUsers30d.size > 0 ? totalEvents / uniqueUsers30d.size : 0;

  const { data: integrationsData } = await supabase
    .from('user_integrations')
    .select('user_id')
    .eq('is_active', true);

  const integrationsPerUser = uniqueUsers30d.size > 0 
    ? (integrationsData?.length || 0) / uniqueUsers30d.size 
    : 0;

  return {
    users: {
      total: totalUsers,
      new_7d: newUsers7d,
      new_30d: newUsers30d,
      new_90d: newUsers90d,
    },
    paid_users: paidUsers,
    dau_wau_mau: {
      dau: uniqueUsers24h.size,
      wau: uniqueUsers7d.size,
      mau: uniqueUsers30d.size,
    },
    activation: {
      total_signups: totalUsers,
      activated_users: activatedUsers,
      activation_rate: Math.round(activationRate * 100) / 100,
    },
    retention: {
      retention_7d: 0, // Would need cohort analysis
      retention_30d: 0, // Would need cohort analysis
    },
    revenue: {
      mrr: mrr,
      arr: arr,
      arpu: Math.round(arpu * 100) / 100,
    },
    engagement: {
      events_per_user: Math.round(eventsPerUser * 100) / 100,
      integrations_per_user: Math.round(integrationsPerUser * 100) / 100,
    },
  };
}

function updateYCInterviewCheatSheet(metrics: Metrics) {
  const filePath = join(process.cwd(), 'yc', 'YC_INTERVIEW_CHEATSHEET.md');
  let content = readFileSync(filePath, 'utf-8');

  // Replace placeholders with real metrics
  content = content.replace(/\[X\]/g, (match, offset) => {
    // Context-aware replacement based on surrounding text
    const before = content.substring(Math.max(0, offset - 50), offset);
    const after = content.substring(offset, Math.min(content.length, offset + 50));
    const context = before + after;

    if (context.includes('Total Users') || context.includes('Users:')) {
      return metrics.users.total.toString();
    }
    if (context.includes('Paid Users') || context.includes('paid')) {
      return metrics.paid_users.total.toString();
    }
    if (context.includes('MRR') || context.includes('mrr')) {
      return `$${metrics.revenue.mrr.toLocaleString()}`;
    }
    if (context.includes('ARR') || context.includes('arr')) {
      return `$${metrics.revenue.arr.toLocaleString()}`;
    }
    if (context.includes('DAU')) {
      return metrics.dau_wau_mau.dau.toString();
    }
    if (context.includes('WAU')) {
      return metrics.dau_wau_mau.wau.toString();
    }
    if (context.includes('MAU')) {
      return metrics.dau_wau_mau.mau.toString();
    }
    if (context.includes('Activation') || context.includes('activation')) {
      return `${metrics.activation.activation_rate}%`;
    }
    return match;
  });

  // Add metrics snapshot section
  const metricsSnapshot = `
## Quick Reference: Key Numbers (Auto-Generated)

\`\`\`
Users:           ${metrics.users.total}
Paid Users:      ${metrics.paid_users.total}
MRR:             $${metrics.revenue.mrr.toLocaleString()}
ARR:             $${metrics.revenue.arr.toLocaleString()}
Growth Rate:     ${metrics.users.new_30d > 0 ? Math.round((metrics.users.new_30d / (metrics.users.total - metrics.users.new_30d)) * 100) : 0}% MoM
Activation:      ${metrics.activation.activation_rate}%
Retention (7d):  ${metrics.retention.retention_7d}%
CAC:             $0 (needs marketing spend data)
LTV:             $${(metrics.revenue.arpu * 12).toLocaleString()}
LTV:CAC:         0:1 (needs CAC)
Runway:          [X] months (founders to fill in)
\`\`\`

*Last updated: ${new Date().toISOString()}*
`;

  // Insert metrics snapshot after "Quick Reference: Key Numbers" section
  const quickRefIndex = content.indexOf('## Quick Reference: Key Numbers');
  if (quickRefIndex !== -1) {
    const nextSectionIndex = content.indexOf('##', quickRefIndex + 1);
    if (nextSectionIndex !== -1) {
      content = content.substring(0, nextSectionIndex) + metricsSnapshot + '\n\n' + content.substring(nextSectionIndex);
    }
  }

  writeFileSync(filePath, content);
  console.log('✅ Updated YC_INTERVIEW_CHEATSHEET.md with real metrics');
}

function generateMetricsReport(metrics: Metrics) {
  const report = `
# Floyo Metrics Report
Generated: ${new Date().toISOString()}

## User Metrics
- Total Users: ${metrics.users.total}
- New Users (7d): ${metrics.users.new_7d}
- New Users (30d): ${metrics.users.new_30d}
- New Users (90d): ${metrics.users.new_90d}

## Paid Users
- Total Paid: ${metrics.paid_users.total}
- Pro: ${metrics.paid_users.pro}
- Enterprise: ${metrics.paid_users.enterprise}
- Active: ${metrics.paid_users.active}

## Usage Metrics
- DAU: ${metrics.dau_wau_mau.dau}
- WAU: ${metrics.dau_wau_mau.wau}
- MAU: ${metrics.dau_wau_mau.mau}

## Activation
- Total Signups: ${metrics.activation.total_signups}
- Activated Users: ${metrics.activation.activated_users}
- Activation Rate: ${metrics.activation.activation_rate}%

## Revenue
- MRR: $${metrics.revenue.mrr.toLocaleString()}
- ARR: $${metrics.revenue.arr.toLocaleString()}
- ARPU: $${metrics.revenue.arpu.toFixed(2)}

## Engagement
- Events per User: ${metrics.engagement.events_per_user}
- Integrations per User: ${metrics.engagement.integrations_per_user}
`;

  const reportPath = join(process.cwd(), 'yc', 'METRICS_REPORT.md');
  writeFileSync(reportPath, report);
  console.log('✅ Generated METRICS_REPORT.md');
}

async function main() {
  try {
    const metrics = await fetchMetrics();

    console.log('\n📊 Metrics Summary:');
    console.log(`   Total Users: ${metrics.users.total}`);
    console.log(`   Paid Users: ${metrics.paid_users.total}`);
    console.log(`   MRR: $${metrics.revenue.mrr.toLocaleString()}`);
    console.log(`   ARR: $${metrics.revenue.arr.toLocaleString()}`);
    console.log(`   DAU: ${metrics.dau_wau_mau.dau}`);
    console.log(`   WAU: ${metrics.dau_wau_mau.wau}`);
    console.log(`   MAU: ${metrics.dau_wau_mau.mau}`);
    console.log(`   Activation Rate: ${metrics.activation.activation_rate}%\n`);

    updateYCInterviewCheatSheet(metrics);
    generateMetricsReport(metrics);

    console.log('\n✅ All metrics fetched and docs updated!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();

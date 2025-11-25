#!/usr/bin/env tsx
/**
 * Generate weekly metrics report for YC prep
 * 
 * Usage:
 *   tsx yc/scripts/generate_weekly_report.ts
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function generateWeeklyReport() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Fetch metrics
  const { data: users } = await supabase
    .from('users')
    .select('id, created_at')
    .gte('created_at', weekAgo.toISOString());
  
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('status', 'active');
  
  const { data: events } = await supabase
    .from('events')
    .select('user_id, timestamp')
    .gte('timestamp', weekAgo.toISOString());
  
  const newUsers = users?.length || 0;
  const paidUsers = subscriptions?.filter(s => s.plan !== 'free').length || 0;
  const mrr = (subscriptions?.filter(s => s.plan === 'pro').length || 0) * 29 +
              (subscriptions?.filter(s => s.plan === 'enterprise').length || 0) * 100;
  const activeUsers = new Set(events?.map(e => e.user_id) || []).size;
  
  const report = `
# Weekly Metrics Report
Week of: ${weekAgo.toISOString().split('T')[0]} to ${now.toISOString().split('T')[0]}

## Key Metrics
- New Users: ${newUsers}
- Paid Users: ${paidUsers}
- MRR: $${mrr.toLocaleString()}
- Active Users (7d): ${activeUsers}

## Growth
- Week-over-week growth: [Calculate from previous week]
- Conversion rate: ${newUsers > 0 ? ((paidUsers / newUsers) * 100).toFixed(1) : 0}%

## Notes
- [Add any notable events, changes, or observations]
`;

  const reportPath = join(process.cwd(), 'yc', 'WEEKLY_REPORT.md');
  writeFileSync(reportPath, report);
  console.log('✅ Generated weekly report: yc/WEEKLY_REPORT.md');
}

generateWeeklyReport().catch(console.error);

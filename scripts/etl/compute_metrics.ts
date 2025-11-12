#!/usr/bin/env tsx
/**
 * ETL Script: Compute Daily Metrics
 * Description: Aggregates raw data into daily metrics for finance and growth analysis
 * Usage: tsx scripts/etl/compute_metrics.ts [--dry-run] [--date YYYY-MM-DD] [--cron]
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  TZ: z.string().default('America/Toronto'),
});

const argsSchema = z.object({
  dryRun: z.boolean().default(false),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  cron: z.boolean().default(false),
});

interface DailyMetrics {
  day: string;
  sessions: number;
  add_to_carts: number;
  orders: number;
  revenue_cents: number;
  refunds_cents: number;
  aov_cents: number;
  cac_cents: number;
  conversion_rate: number;
  gross_margin_cents: number;
  traffic: number;
}

// COGS percentage assumption (from finance model)
const COGS_PERCENTAGE = 0.35;

// Aggregate experiment metrics for the day
async function aggregateExperimentMetrics(
  supabase: ReturnType<typeof createClient>,
  date: string
): Promise<Record<string, unknown> | null> {
  try {
    const { data: experiments } = await supabase
      .from('experiments')
      .select('id, key, name, status')
      .eq('status', 'active')
      .lte('start_at', `${date}T23:59:59Z`)
      .or(`end_at.is.null,end_at.gte.${date}T00:00:00Z`);
    
    if (!experiments || experiments.length === 0) {
      return null;
    }
    
    const metrics: Record<string, unknown> = {};
    
    for (const exp of experiments) {
      // Get experiment arms
      const { data: arms } = await supabase
        .from('experiment_arms')
        .select('arm_key, weight')
        .eq('experiment_id', exp.id);
      
      // Get events for this experiment on this date
      const { data: events } = await supabase
        .from('events')
        .select('event_name, props')
        .eq('event_name', `experiment_${exp.key}`)
        .gte('occurred_at', `${date}T00:00:00Z`)
        .lte('occurred_at', `${date}T23:59:59Z`);
      
      if (events && events.length > 0) {
        const armCounts: Record<string, number> = {};
        events.forEach((e: any) => {
          const arm = e.props?.arm || 'control';
          armCounts[arm] = (armCounts[arm] || 0) + 1;
        });
        
        metrics[exp.key] = {
          total_events: events.length,
          arm_counts: armCounts,
          arms: arms?.map(a => ({ key: a.arm_key, weight: a.weight })),
        };
      }
    }
    
    return Object.keys(metrics).length > 0 ? metrics : null;
  } catch (error) {
    console.warn('[Compute Metrics] Error aggregating experiment metrics:', error);
    return null;
  }
}

// Operating expense assumptions (from finance model - simplified)
// In production, these would come from a separate expenses table
function estimateOperatingExpenses(revenue: number): {
  sales_marketing: number;
  product_dev: number;
  general_admin: number;
} {
  // Simplified: scale with revenue growth
  // Base: $20K sales/marketing, $12K product dev, $8K admin at $50K revenue
  const baseRevenue = 50000;
  const scaleFactor = Math.max(0.5, Math.min(2.0, revenue / baseRevenue));
  
  return {
    sales_marketing: 20000 * scaleFactor,
    product_dev: 12000 * scaleFactor,
    general_admin: 8000 * scaleFactor,
  };
}

async function computeDailyMetrics(
  supabase: ReturnType<typeof createClient>,
  date: string
): Promise<DailyMetrics> {
  const dateStart = `${date}T00:00:00Z`;
  const dateEnd = `${date}T23:59:59Z`;
  
  // Fetch orders for the date
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .gte('placed_at', dateStart)
    .lte('placed_at', dateEnd);
  
  if (ordersError) throw new Error(`Failed to fetch orders: ${ordersError.message}`);
  
  // Calculate revenue metrics (handle both old and new schema)
  const revenue = (orders || []).reduce((sum, o) => {
    const total = o.total_cents ? o.total_cents / 100 : (o.total_amount ? parseFloat(o.total_amount.toString()) : 0);
    return sum + total;
  }, 0);
  
  const refundAmount = (orders || []).reduce((sum, o) => {
    const refund = o.refund_cents ? o.refund_cents / 100 : (o.refund_amount ? parseFloat(o.refund_amount.toString()) : 0);
    return sum + refund;
  }, 0);
  
  const netRevenue = revenue - refundAmount;
  const refundRate = revenue > 0 ? refundAmount / revenue : 0;
  const orderCount = orders?.length || 0;
  
  // Calculate customer metrics
  const customerIds = new Set((orders || []).map(o => o.user_id || o.customer_id || o.customer_email).filter(Boolean));
  const newCustomers = customerIds.size; // Simplified: in production, track first order date
  const returningCustomers = 0; // Simplified: would require historical lookup
  const averageOrderValue = orderCount > 0 ? revenue / orderCount : 0;
  
  // Fetch spend for the date
  const { data: spend, error: spendError } = await supabase
    .from('spend')
    .select('*')
    .eq('date', date);
  
  if (spendError) throw new Error(`Failed to fetch spend: ${spendError.message}`);
  
  const spendMeta = (spend || [])
    .filter(s => s.platform === 'meta' || s.source === 'meta')
    .reduce((sum, s) => {
      const amount = s.spend_cents ? s.spend_cents / 100 : (s.amount ? parseFloat(s.amount.toString()) : 0);
      return sum + amount;
    }, 0);
  const spendTikTok = (spend || [])
    .filter(s => s.platform === 'tiktok' || s.source === 'tiktok')
    .reduce((sum, s) => {
      const amount = s.spend_cents ? s.spend_cents / 100 : (s.amount ? parseFloat(s.amount.toString()) : 0);
      return sum + amount;
    }, 0);
  const spendOther = (spend || [])
    .filter(s => s.platform && !['meta', 'tiktok'].includes(s.platform) && !['meta', 'tiktok'].includes(s.source || ''))
    .reduce((sum, s) => {
      const amount = s.spend_cents ? s.spend_cents / 100 : (s.amount ? parseFloat(s.amount.toString()) : 0);
      return sum + amount;
    }, 0);
  const spendTotal = spendMeta + spendTikTok + spendOther;
  
  const impressionsTotal = (spend || []).reduce((sum, s) => sum + (s.impressions || 0), 0);
  const clicksTotal = (spend || []).reduce((sum, s) => sum + (s.clicks || 0), 0);
  const conversionsTotal = (spend || []).reduce((sum, s) => sum + (s.conv || s.conversions || 0), 0);
  
  // Calculate CAC
  const cac = newCustomers > 0 ? spendTotal / newCustomers : null;
  const cacMeta = newCustomers > 0 ? spendMeta / newCustomers : null;
  const cacTikTok = newCustomers > 0 ? spendTikTok / newCustomers : null;
  const cacOther = newCustomers > 0 ? spendOther / newCustomers : null;
  
  // Calculate LTV (simplified: would need historical customer data)
  // For now, use assumption: average order value × 6 months (from finance model)
  const ltv = averageOrderValue > 0 ? averageOrderValue * 6 : null;
  const ltvCacRatio = cac && ltv ? ltv / cac : null;
  
  // Calculate COGS and margins
  const cogs = revenue * COGS_PERCENTAGE;
  const cogsPercentage = COGS_PERCENTAGE;
  const grossMargin = netRevenue - cogs;
  const grossMarginPercentage = netRevenue > 0 ? grossMargin / netRevenue : 0;
  
  // Estimate operating expenses
  const opEx = estimateOperatingExpenses(revenue);
  const operatingExpensesTotal = opEx.sales_marketing + opEx.product_dev + opEx.general_admin;
  
  // Calculate EBITDA
  const ebitda = grossMargin - operatingExpensesTotal;
  const ebitdaMargin = netRevenue > 0 ? ebitda / netRevenue : 0;
  
  // Cash metrics (fetch from previous metrics or calculate from burn rate)
  const { data: prevDayMetrics } = await supabase
    .from('metrics_daily')
    .select('cash_balance, operating_expenses_total')
    .order('day', { ascending: false })
    .limit(1)
    .single();
  
  const prevCashBalance = prevDayMetrics?.cash_balance || 50000; // Default starting balance
  const dailyBurn = operatingExpensesTotal / 30; // Approximate daily burn
  const cashBalance = prevCashBalance - dailyBurn;
  const cashRunwayMonths = cashBalance > 0 && dailyBurn > 0 
    ? cashBalance / (dailyBurn * 30) 
    : null;
  
  // Calculate MRR growth rate (compare to previous day)
  // Note: MRR/ARR are calculated from revenue, not stored in metrics_daily schema
  const { data: prevMetrics } = await supabase
    .from('metrics_daily')
    .select('revenue_cents')
    .eq('day', (() => {
      const d = new Date(date);
      d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0];
    })())
    .single();
  
  const prevRevenue = prevMetrics?.revenue_cents ? prevMetrics.revenue_cents / 100 : 0;
  // Growth rate calculated but not stored (can be computed from revenue_cents)
  
  // Map to metrics_daily schema (using cents for monetary values)
  return {
    day: date,
    sessions: 0, // Would come from analytics events
    add_to_carts: 0, // Would come from analytics events
    orders: orderCount,
    revenue_cents: Math.round(revenue * 100),
    refunds_cents: Math.round(refundAmount * 100),
    aov_cents: Math.round(averageOrderValue * 100),
    cac_cents: cac ? Math.round(cac * 100) : 0,
    conversion_rate: orderCount > 0 && impressionsTotal > 0 ? conversionsTotal / impressionsTotal : 0,
    gross_margin_cents: Math.round(grossMargin * 100),
    traffic: impressionsTotal, // Using impressions as traffic proxy
  };
}

async function upsertMetrics(
  supabase: ReturnType<typeof createClient>,
  metrics: DailyMetrics,
  dryRun: boolean
): Promise<void> {
  if (dryRun) {
    console.log('[Compute Metrics] DRY RUN - Would upsert metrics:');
    console.log(JSON.stringify(metrics, null, 2));
    return;
  }
  
  const { error } = await supabase
    .from('metrics_daily')
    .upsert(metrics, {
      onConflict: 'day',
      ignoreDuplicates: false,
    });
  
  if (error) {
    throw new Error(`Failed to upsert metrics: ${error.message}`);
  }
  
  console.log(`[Compute Metrics] Successfully computed metrics for ${metrics.day}`);
}

async function main() {
  const startTime = Date.now();
  console.log('[Compute Metrics] Starting daily metrics computation...');
  console.log(`[Compute Metrics] Timezone: ${process.env.TZ || 'America/Toronto'}`);
  
  try {
    // Parse environment variables
    const env = envSchema.parse({
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      TZ: process.env.TZ || 'America/Toronto',
    });
    
    // Parse command line arguments
    const args = {
      dryRun: process.argv.includes('--dry-run'),
      date: process.argv.includes('--date')
        ? process.argv[process.argv.indexOf('--date') + 1]
        : undefined,
      cron: process.argv.includes('--cron'),
    };
    
    const parsedArgs = argsSchema.parse(args);
    
    // Default to yesterday if cron mode, today otherwise
    const targetDate = parsedArgs.date || (() => {
      const date = new Date();
      if (parsedArgs.cron) {
        date.setDate(date.getDate() - 1); // Yesterday for cron
      }
      return date.toISOString().split('T')[0];
    })();
    
    if (parsedArgs.dryRun) {
      console.log('[Compute Metrics] DRY RUN MODE - No data will be written');
    }
    
    // Initialize Supabase client
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    // Compute metrics
    const metrics = await computeDailyMetrics(supabase, targetDate);
    
    // Upsert to Supabase
    await upsertMetrics(supabase, metrics, parsedArgs.dryRun);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[Compute Metrics] Completed successfully in ${duration}s`);
    
  } catch (error) {
    console.error('[Compute Metrics] Error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { computeDailyMetrics, upsertMetrics };

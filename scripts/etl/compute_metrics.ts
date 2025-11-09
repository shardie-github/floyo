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
  date: string;
  revenue: number;
  net_revenue: number;
  refund_amount: number;
  refund_count: number;
  refund_rate: number;
  order_count: number;
  new_customers: number;
  returning_customers: number;
  average_order_value: number;
  spend_total: number;
  spend_meta: number;
  spend_tiktok: number;
  spend_other: number;
  impressions_total: number;
  clicks_total: number;
  conversions_total: number;
  cac: number | null;
  cac_meta: number | null;
  cac_tiktok: number | null;
  cac_other: number | null;
  ltv: number | null;
  ltv_cac_ratio: number | null;
  cogs: number;
  cogs_percentage: number;
  gross_margin: number;
  gross_margin_percentage: number;
  sales_marketing_expense: number;
  product_dev_expense: number;
  general_admin_expense: number;
  operating_expenses_total: number;
  ebitda: number;
  ebitda_margin: number;
  cash_balance: number | null;
  cash_runway_months: number | null;
  mrr: number;
  arr: number;
  mrr_growth_rate: number;
  experiment_metrics: Record<string, unknown> | null;
}

// COGS percentage assumption (from finance model)
const COGS_PERCENTAGE = 0.35;

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
    .gte('order_date', dateStart)
    .lte('order_date', dateEnd);
  
  if (ordersError) throw new Error(`Failed to fetch orders: ${ordersError.message}`);
  
  // Calculate revenue metrics
  const revenue = (orders || []).reduce((sum, o) => sum + parseFloat(o.total_amount.toString()), 0);
  const refundAmount = (orders || []).reduce((sum, o) => sum + parseFloat((o.refund_amount || 0).toString()), 0);
  const netRevenue = revenue - refundAmount;
  const refundRate = revenue > 0 ? refundAmount / revenue : 0;
  const orderCount = orders?.length || 0;
  
  // Calculate customer metrics
  const customerEmails = new Set((orders || []).map(o => o.customer_email).filter(Boolean));
  const newCustomers = customerEmails.size; // Simplified: in production, track first order date
  const returningCustomers = 0; // Simplified: would require historical lookup
  const averageOrderValue = orderCount > 0 ? revenue / orderCount : 0;
  
  // Fetch spend for the date
  const { data: spend, error: spendError } = await supabase
    .from('spend')
    .select('*')
    .eq('date', date);
  
  if (spendError) throw new Error(`Failed to fetch spend: ${spendError.message}`);
  
  const spendMeta = (spend || [])
    .filter(s => s.source === 'meta')
    .reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0);
  const spendTikTok = (spend || [])
    .filter(s => s.source === 'tiktok')
    .reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0);
  const spendOther = (spend || [])
    .filter(s => !['meta', 'tiktok'].includes(s.source))
    .reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0);
  const spendTotal = spendMeta + spendTikTok + spendOther;
  
  const impressionsTotal = (spend || []).reduce((sum, s) => sum + (s.impressions || 0), 0);
  const clicksTotal = (spend || []).reduce((sum, s) => sum + (s.clicks || 0), 0);
  const conversionsTotal = (spend || []).reduce((sum, s) => sum + (s.conversions || 0), 0);
  
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
  
  // Cash metrics (would need to fetch from cash tracking table)
  const cashBalance = null; // TODO: Implement cash tracking
  const cashRunwayMonths = null; // TODO: Calculate from cash balance and burn rate
  
  // MRR/ARR (simplified: assumes all revenue is MRR)
  const mrr = netRevenue;
  const arr = mrr * 12;
  
  // Calculate MRR growth rate (compare to previous day)
  const { data: prevMetrics } = await supabase
    .from('metrics_daily')
    .select('mrr')
    .eq('date', (() => {
      const d = new Date(date);
      d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0];
    })())
    .single();
  
  const prevMrr = prevMetrics?.mrr || 0;
  const mrrGrowthRate = prevMrr > 0 ? (mrr - prevMrr) / prevMrr : 0;
  
  return {
    date,
    revenue,
    net_revenue: netRevenue,
    refund_amount: refundAmount,
    refund_count: (orders || []).filter(o => (o.refund_amount || 0) > 0).length,
    refund_rate: refundRate,
    order_count: orderCount,
    new_customers: newCustomers,
    returning_customers: returningCustomers,
    average_order_value: averageOrderValue,
    spend_total: spendTotal,
    spend_meta: spendMeta,
    spend_tiktok: spendTikTok,
    spend_other: spendOther,
    impressions_total: impressionsTotal,
    clicks_total: clicksTotal,
    conversions_total: conversionsTotal,
    cac,
    cac_meta: cacMeta,
    cac_tiktok: cacTikTok,
    cac_other: cacOther,
    ltv,
    ltv_cac_ratio: ltvCacRatio,
    cogs,
    cogs_percentage: cogsPercentage,
    gross_margin: grossMargin,
    gross_margin_percentage: grossMarginPercentage,
    sales_marketing_expense: opEx.sales_marketing,
    product_dev_expense: opEx.product_dev,
    general_admin_expense: opEx.general_admin,
    operating_expenses_total: operatingExpensesTotal,
    ebitda,
    ebitda_margin: ebitdaMargin,
    cash_balance: cashBalance,
    cash_runway_months: cashRunwayMonths,
    mrr,
    arr,
    mrr_growth_rate: mrrGrowthRate,
    experiment_metrics: null, // TODO: Aggregate experiment metrics
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
      onConflict: 'date',
      ignoreDuplicates: false,
    });
  
  if (error) {
    throw new Error(`Failed to upsert metrics: ${error.message}`);
  }
  
  console.log(`[Compute Metrics] Successfully computed metrics for ${metrics.date}`);
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

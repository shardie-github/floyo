#!/usr/bin/env tsx
/**
 * ETL Script: Compute Daily Metrics
 * 
 * Aggregates data from orders, spend, and events tables to compute daily metrics
 * for finance and growth reporting.
 * 
 * Usage:
 *   node scripts/etl/compute_metrics.ts [--dry-run] [--date YYYY-MM-DD] [--days N]
 * 
 * Environment Variables:
 *   SUPABASE_URL - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Supabase service role key
 *   INITIAL_CASH_BALANCE - Starting cash balance (default: 500000)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { parseArgs } from 'util';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

interface DailyMetrics {
  date: string;
  revenue: number;
  net_revenue: number;
  refunds: number;
  refund_count: number;
  order_count: number;
  average_order_value: number;
  new_customers: number;
  active_customers: number;
  churned_customers: number;
  total_customers: number;
  spend_total: number;
  spend_meta: number;
  spend_tiktok: number;
  spend_other: number;
  impressions: number;
  clicks: number;
  conversions: number;
  cac: number;
  ltv: number;
  ltv_cac_ratio: number;
  cogs: number;
  cogs_percent: number;
  gross_margin: number;
  gross_margin_percent: number;
  operating_expenses: number;
  sales_marketing: number;
  product_dev: number;
  general_admin: number;
  ebitda: number;
  ebitda_margin: number;
  cash_balance: number | null;
  cash_burn_rate: number;
  runway_months: number | null;
}

async function computeDailyMetrics(
  supabase: ReturnType<typeof createClient>,
  date: string
): Promise<DailyMetrics> {
  const dateStart = `${date}T00:00:00Z`;
  const dateEnd = `${date}T23:59:59Z`;

  // Fetch orders for the day
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .gte('order_date', dateStart)
    .lte('order_date', dateEnd);

  if (ordersError) throw ordersError;

  // Fetch spend for the day
  const { data: spend, error: spendError } = await supabase
    .from('spend')
    .select('*')
    .eq('date', date);

  if (spendError) throw spendError;

  // Fetch events for the day (for customer tracking)
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .gte('timestamp', dateStart)
    .lte('timestamp', dateEnd);

  if (eventsError) throw eventsError;

  // Calculate revenue metrics
  const paidOrders = orders?.filter(o => o.status === 'paid' || o.status === 'fulfilled') || [];
  const revenue = paidOrders.reduce((sum, o) => sum + parseFloat(o.total || '0'), 0);
  const refunds = orders?.reduce((sum, o) => sum + parseFloat(o.refund_amount || '0'), 0) || 0;
  const refundCount = orders?.filter(o => o.status === 'refunded').length || 0;
  const netRevenue = revenue - refunds;
  const orderCount = orders?.length || 0;
  const averageOrderValue = orderCount > 0 ? revenue / orderCount : 0;

  // Calculate customer metrics
  const newCustomers = new Set(
    events?.filter(e => e.event_type === 'signup' || e.event_type === 'purchase')
      .map(e => e.user_id || e.properties?.user_id)
      .filter(Boolean) || []
  ).size;

  // Get previous day's total customers
  const prevDate = new Date(date);
  prevDate.setDate(prevDate.getDate() - 1);
  const prevDateStr = prevDate.toISOString().split('T')[0];

  const { data: prevMetrics } = await supabase
    .from('metrics_daily')
    .select('total_customers')
    .eq('date', prevDateStr)
    .single();

  const prevTotalCustomers = prevMetrics?.total_customers || 0;
  const churnedCustomers = events?.filter(e => e.event_type === 'churn').length || 0;
  const totalCustomers = prevTotalCustomers + newCustomers - churnedCustomers;
  const activeCustomers = events?.filter(e => 
    ['purchase', 'upgrade', 'trial_start'].includes(e.event_type)
  ).length || 0;

  // Calculate spend metrics
  const spendTotal = spend?.reduce((sum, s) => sum + parseFloat(s.amount || '0'), 0) || 0;
  const spendMeta = spend?.filter(s => s.channel === 'meta_ads')
    .reduce((sum, s) => sum + parseFloat(s.amount || '0'), 0) || 0;
  const spendTikTok = spend?.filter(s => s.channel === 'tiktok_ads')
    .reduce((sum, s) => sum + parseFloat(s.amount || '0'), 0) || 0;
  const spendOther = spendTotal - spendMeta - spendTikTok;

  const impressions = spend?.reduce((sum, s) => sum + (s.impressions || 0), 0) || 0;
  const clicks = spend?.reduce((sum, s) => sum + (s.clicks || 0), 0) || 0;
  const conversions = spend?.reduce((sum, s) => sum + (s.conversions || 0), 0) || 0;

  // Calculate CAC
  const cac = newCustomers > 0 ? spendTotal / newCustomers : 0;

  // Calculate LTV (simplified - assumes average order value * 12 months * gross margin)
  // In production, use cohort analysis
  const avgMonthlyRevenuePerCustomer = totalCustomers > 0 ? revenue / totalCustomers : 0;
  const grossMarginPercent = 0.65; // From assumptions, or calculate from COGS
  const ltv = avgMonthlyRevenuePerCustomer * 12 * grossMarginPercent;

  const ltvCacRatio = cac > 0 ? ltv / cac : 0;

  // Calculate COGS (assume 35% of revenue for Base scenario)
  const cogsPercent = 0.35;
  const cogs = revenue * cogsPercent;
  const grossMargin = revenue - cogs;
  const grossMarginPercentCalc = revenue > 0 ? grossMargin / revenue : 0;

  // Operating expenses (from manual entry or allocation)
  // For now, estimate based on spend and fixed costs
  const salesMarketing = spendTotal * 1.5; // Assume spend is part of larger S&M budget
  const productDev = revenue * 0.24; // 24% of revenue
  const generalAdmin = revenue * 0.16; // 16% of revenue
  const operatingExpenses = salesMarketing + productDev + generalAdmin;

  // Calculate EBITDA
  const ebitda = grossMargin - operatingExpenses;
  const ebitdaMargin = revenue > 0 ? ebitda / revenue : 0;

  // Cash flow (simplified - would need historical cash balance)
  const cashBurnRate = operatingExpenses - netRevenue;
  
  // Get previous day's cash balance
  const { data: prevCashMetrics } = await supabase
    .from('metrics_daily')
    .select('cash_balance')
    .eq('date', prevDateStr)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  const initialCashBalance = parseFloat(process.env.INITIAL_CASH_BALANCE || '500000');
  const prevCashBalance = prevCashMetrics?.cash_balance || initialCashBalance;
  const cashBalance = prevCashBalance + netRevenue - operatingExpenses;
  const runwayMonths = cashBurnRate > 0 ? cashBalance / Math.abs(cashBurnRate) : null;

  return {
    date,
    revenue,
    net_revenue: netRevenue,
    refunds,
    refund_count: refundCount,
    order_count: orderCount,
    average_order_value: averageOrderValue,
    new_customers: newCustomers,
    active_customers: activeCustomers,
    churned_customers: churnedCustomers,
    total_customers: totalCustomers,
    spend_total: spendTotal,
    spend_meta: spendMeta,
    spend_tiktok: spendTikTok,
    spend_other: spendOther,
    impressions,
    clicks,
    conversions,
    cac,
    ltv,
    ltv_cac_ratio: ltvCacRatio,
    cogs,
    cogs_percent: cogsPercent,
    gross_margin: grossMargin,
    gross_margin_percent: grossMarginPercentCalc,
    operating_expenses: operatingExpenses,
    sales_marketing: salesMarketing,
    product_dev: productDev,
    general_admin: generalAdmin,
    ebitda,
    ebitda_margin: ebitdaMargin,
    cash_balance: cashBalance,
    cash_burn_rate: cashBurnRate,
    runway_months: runwayMonths,
  };
}

async function loadMetricsToSupabase(
  supabase: ReturnType<typeof createClient>,
  metrics: DailyMetrics,
  dryRun: boolean
): Promise<void> {
  if (dryRun) {
    console.log(`[Compute Metrics] DRY RUN - Would upsert metrics for ${metrics.date}:`);
    console.log(`  Revenue: $${metrics.revenue.toFixed(2)}`);
    console.log(`  Net Revenue: $${metrics.net_revenue.toFixed(2)}`);
    console.log(`  New Customers: ${metrics.new_customers}`);
    console.log(`  CAC: $${metrics.cac.toFixed(2)}`);
    console.log(`  LTV:CAC: ${metrics.ltv_cac_ratio.toFixed(2)}`);
    console.log(`  EBITDA: $${metrics.ebitda.toFixed(2)} (${(metrics.ebitda_margin * 100).toFixed(1)}%)`);
    console.log(`  Cash Balance: $${metrics.cash_balance?.toFixed(2) || 'N/A'}`);
    console.log(`  Runway: ${metrics.runway_months?.toFixed(1) || 'N/A'} months`);
    return;
  }

  const { error } = await supabase
    .from('metrics_daily')
    .upsert({
      date: metrics.date,
      revenue: metrics.revenue,
      net_revenue: metrics.net_revenue,
      refunds: metrics.refunds,
      refund_count: metrics.refund_count,
      order_count: metrics.order_count,
      average_order_value: metrics.average_order_value,
      new_customers: metrics.new_customers,
      active_customers: metrics.active_customers,
      churned_customers: metrics.churned_customers,
      total_customers: metrics.total_customers,
      spend_total: metrics.spend_total,
      spend_meta: metrics.spend_meta,
      spend_tiktok: metrics.spend_tiktok,
      spend_other: metrics.spend_other,
      impressions: metrics.impressions,
      clicks: metrics.clicks,
      conversions: metrics.conversions,
      cac: metrics.cac,
      ltv: metrics.ltv,
      ltv_cac_ratio: metrics.ltv_cac_ratio,
      cogs: metrics.cogs,
      cogs_percent: metrics.cogs_percent,
      gross_margin: metrics.gross_margin,
      gross_margin_percent: metrics.gross_margin_percent,
      operating_expenses: metrics.operating_expenses,
      sales_marketing: metrics.sales_marketing,
      product_dev: metrics.product_dev,
      general_admin: metrics.general_admin,
      ebitda: metrics.ebitda,
      ebitda_margin: metrics.ebitda_margin,
      cash_balance: metrics.cash_balance,
      cash_burn_rate: metrics.cash_burn_rate,
      runway_months: metrics.runway_months,
      computed_at: new Date().toISOString(),
    }, { onConflict: 'date' });

  if (error) {
    console.error('[Compute Metrics] Error upserting metrics:', error);
    throw error;
  }

  console.log(`[Compute Metrics] Successfully computed metrics for ${metrics.date}`);
}

async function main() {
  const startTime = Date.now();
  console.log(`[Compute Metrics] Starting at ${new Date().toISOString()}`);

  const args = parseArgs({
    options: {
      'dry-run': { type: 'boolean', default: false },
      'date': { type: 'string' },
      'days': { type: 'string', default: '1' },
      'cron': { type: 'boolean', default: false },
    },
    strict: false,
  });

  const dryRun = args.values['dry-run'] || false;
  const isCron = args.values['cron'] || false;

  // Determine date range
  const today = new Date();
  const endDate = args.values['date'] 
    ? new Date(args.values['date'])
    : new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1); // Yesterday by default
  
  const days = parseInt(args.values['days'] || '1', 10);

  // Validate environment variables
  const supabaseUrl = process.env.SUPABASE_URL || 'https://YOUR_PROJECT.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

  if (supabaseUrl === 'https://YOUR_PROJECT.supabase.co' || supabaseKey === 'YOUR_SERVICE_ROLE_KEY') {
    console.error('[Compute Metrics] ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Process each day
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(endDate);
      currentDate.setDate(currentDate.getDate() - i);
      const dateStr = currentDate.toISOString().split('T')[0];

      console.log(`[Compute Metrics] Processing ${dateStr}...`);
      const metrics = await computeDailyMetrics(supabase, dateStr);
      await loadMetricsToSupabase(supabase, metrics, dryRun);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[Compute Metrics] Completed successfully in ${duration}s`);
  } catch (error) {
    console.error('[Compute Metrics] ERROR:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

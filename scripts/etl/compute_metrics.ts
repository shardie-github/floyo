/**
 * ETL Script: Compute Daily Metrics
 * Description: Aggregates events, orders, and spend data into daily metrics
 * Schedule: Daily at 01:30 America/Toronto (after data pulls complete)
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

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

async function computeDailyMetrics(pool: pg.Pool, targetDate: string): Promise<DailyMetrics> {
  const client = await pool.connect();
  try {
    // Sessions (unique users with events on this day)
    const sessionsResult = await client.query(
      `SELECT COUNT(DISTINCT user_id) as sessions
       FROM public.events
       WHERE DATE(occurred_at) = $1
       AND event_name IN ('page_view', 'session_start')`,
      [targetDate]
    );
    const sessions = parseInt(sessionsResult.rows[0]?.sessions || '0', 10);

    // Add to carts
    const addToCartsResult = await client.query(
      `SELECT COUNT(*) as count
       FROM public.events
       WHERE DATE(occurred_at) = $1
       AND event_name = 'add_to_cart'`,
      [targetDate]
    );
    const addToCarts = parseInt(addToCartsResult.rows[0]?.count || '0', 10);

    // Orders
    const ordersResult = await client.query(
      `SELECT COUNT(*) as orders, 
              COALESCE(SUM(total_cents), 0) as revenue_cents,
              COALESCE(AVG(total_cents), 0) as aov_cents
       FROM public.orders
       WHERE DATE(placed_at) = $1`,
      [targetDate]
    );
    const orders = parseInt(ordersResult.rows[0]?.orders || '0', 10);
    const revenueCents = parseInt(ordersResult.rows[0]?.revenue_cents || '0', 10);
    const aovCents = orders > 0 ? Math.round(parseFloat(ordersResult.rows[0]?.aov_cents || '0')) : 0;

    // Refunds (assuming refund events or negative orders)
    const refundsResult = await client.query(
      `SELECT COALESCE(ABS(SUM(total_cents)), 0) as refunds_cents
       FROM public.orders
       WHERE DATE(placed_at) = $1
       AND total_cents < 0`,
      [targetDate]
    );
    const refundsCents = parseInt(refundsResult.rows[0]?.refunds_cents || '0', 10);

    // CAC (total ad spend / new customers acquired)
    const spendResult = await client.query(
      `SELECT COALESCE(SUM(spend_cents), 0) as total_spend_cents
       FROM public.spend
       WHERE date = $1`,
      [targetDate]
    );
    const totalSpendCents = parseInt(spendResult.rows[0]?.total_spend_cents || '0', 10);

    // New customers (first order on this day)
    const newCustomersResult = await client.query(
      `SELECT COUNT(DISTINCT user_id) as new_customers
       FROM public.orders o1
       WHERE DATE(placed_at) = $1
       AND NOT EXISTS (
         SELECT 1 FROM public.orders o2
         WHERE o2.user_id = o1.user_id
         AND DATE(o2.placed_at) < $1
       )`,
      [targetDate]
    );
    const newCustomers = parseInt(newCustomersResult.rows[0]?.new_customers || '0', 10);
    const cacCents = newCustomers > 0 ? Math.round(totalSpendCents / newCustomers) : 0;

    // Conversion rate (orders / sessions)
    const conversionRate = sessions > 0 ? orders / sessions : 0;

    // Traffic (total events)
    const trafficResult = await client.query(
      `SELECT COUNT(*) as traffic
       FROM public.events
       WHERE DATE(occurred_at) = $1`,
      [targetDate]
    );
    const traffic = parseInt(trafficResult.rows[0]?.traffic || '0', 10);

    // Gross margin (assume 75% for now, can be calculated from COGS if available)
    const grossMarginCents = Math.round(revenueCents * 0.75);

    return {
      day: targetDate,
      sessions,
      add_to_carts: addToCarts,
      orders,
      revenue_cents: revenueCents,
      refunds_cents: refundsCents,
      aov_cents: aovCents,
      cac_cents: cacCents,
      conversion_rate: conversionRate,
      gross_margin_cents: grossMarginCents,
      traffic,
    };
  } finally {
    client.release();
  }
}

async function upsertMetrics(pool: pg.Pool, metrics: DailyMetrics) {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO public.metrics_daily 
       (day, sessions, add_to_carts, orders, revenue_cents, refunds_cents, aov_cents, 
        cac_cents, conversion_rate, gross_margin_cents, traffic)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (day) 
       DO UPDATE SET sessions = EXCLUDED.sessions, add_to_carts = EXCLUDED.add_to_carts,
                     orders = EXCLUDED.orders, revenue_cents = EXCLUDED.revenue_cents,
                     refunds_cents = EXCLUDED.refunds_cents, aov_cents = EXCLUDED.aov_cents,
                     cac_cents = EXCLUDED.cac_cents, conversion_rate = EXCLUDED.conversion_rate,
                     gross_margin_cents = EXCLUDED.gross_margin_cents, traffic = EXCLUDED.traffic`,
      [
        metrics.day,
        metrics.sessions,
        metrics.add_to_carts,
        metrics.orders,
        metrics.revenue_cents,
        metrics.refunds_cents,
        metrics.aov_cents,
        metrics.cac_cents,
        metrics.conversion_rate,
        metrics.gross_margin_cents,
        metrics.traffic,
      ]
    );
  } finally {
    client.release();
  }
}

async function main() {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('Missing SUPABASE_DB_URL or DATABASE_URL');
  }

  const pool = new pg.Pool({ connectionString: dbUrl });

  try {
    // Compute metrics for yesterday (most recent complete day)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - 1);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    // If --cron flag, compute for yesterday
    // Otherwise, compute for last 7 days (backfill)
    const isCron = process.argv.includes('--cron');
    const daysToCompute = isCron ? 1 : 7;

    for (let i = 0; i < daysToCompute; i++) {
      const computeDate = new Date(targetDate);
      computeDate.setDate(computeDate.getDate() - i);
      const computeDateStr = computeDate.toISOString().split('T')[0];

      console.log(`Computing metrics for ${computeDateStr}...`);

      const metrics = await computeDailyMetrics(pool, computeDateStr);
      await upsertMetrics(pool, metrics);

      console.log(`✅ Metrics computed for ${computeDateStr}:`, {
        sessions: metrics.sessions,
        orders: metrics.orders,
        revenue: `$${(metrics.revenue_cents / 100).toFixed(2)}`,
        cac: `$${(metrics.cac_cents / 100).toFixed(2)}`,
        conversion_rate: `${(metrics.conversion_rate * 100).toFixed(2)}%`,
      });
    }
  } catch (error) {
    console.error('Error computing metrics:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { computeDailyMetrics, upsertMetrics };

#!/usr/bin/env tsx
/**
 * ETL Script: Pull Shopify Orders Data
 * 
 * Fetches order data from Shopify API and loads it into the orders table.
 * 
 * Usage:
 *   node scripts/etl/pull_shopify_orders.ts [--dry-run] [--date YYYY-MM-DD] [--days N]
 * 
 * Environment Variables:
 *   SHOPIFY_API_KEY - Shopify API key
 *   SHOPIFY_PASSWORD - Shopify API password
 *   SHOPIFY_STORE - Shopify store name (e.g., 'mystore' for mystore.myshopify.com)
 *   SUPABASE_URL - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Supabase service role key
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { parseArgs } from 'util';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

interface ShopifyOrder {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  financial_status: string;
  fulfillment_status: string | null;
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  total_shipping_price_set: {
    shop_money: {
      amount: string;
    };
  };
  total_discounts: string;
  refunds: Array<{
    id: number;
    created_at: string;
    note: string;
    refund_line_items: Array<{
      quantity: number;
      line_item: {
        title: string;
        price: string;
      };
    }>;
    transactions: Array<{
      amount: string;
      kind: string;
    }>;
  }>;
  line_items: Array<{
    id: number;
    title: string;
    quantity: number;
    price: string;
    sku: string | null;
  }>;
  customer: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  } | null;
  payment_gateway_names: string[];
}

interface ShopifyAPIResponse {
  orders: ShopifyOrder[];
}

// Exponential backoff helper
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  baseDelay = 1000
): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : baseDelay * Math.pow(2, attempt);
        console.log(`Rate limited. Retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Request failed. Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
  throw new Error('Max retries exceeded');
}

async function fetchShopifyOrders(
  apiKey: string,
  password: string,
  store: string,
  startDate: string,
  endDate: string
): Promise<ShopifyOrder[]> {
  const baseUrl = `https://${apiKey}:${password}@${store}.myshopify.com/admin/api/2024-01`;
  const allOrders: ShopifyOrder[] = [];
  let pageInfo: string | null = null;

  console.log(`[Shopify ETL] Fetching orders from ${startDate} to ${endDate}...`);

  while (true) {
    let url = `${baseUrl}/orders.json?status=any&created_at_min=${startDate}T00:00:00Z&created_at_max=${endDate}T23:59:59Z&limit=250`;
    
    if (pageInfo) {
      url += `&page_info=${pageInfo}`;
    }

    const response = await fetchWithRetry(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data: ShopifyAPIResponse = await response.json();

    if (!data.orders || data.orders.length === 0) {
      break;
    }

    allOrders.push(...data.orders);

    // Check for pagination
    const linkHeader = response.headers.get('Link');
    if (linkHeader && linkHeader.includes('rel="next"')) {
      const nextMatch = linkHeader.match(/page_info=([^>]+)>; rel="next"/);
      pageInfo = nextMatch ? nextMatch[1] : null;
    } else {
      break;
    }

    await sleep(500); // Rate limit protection (Shopify allows 2 requests/second)
  }

  console.log(`[Shopify ETL] Fetched ${allOrders.length} orders`);
  return allOrders;
}

function mapShopifyStatus(shopifyStatus: string, fulfillmentStatus: string | null): string {
  if (shopifyStatus === 'refunded') return 'refunded';
  if (shopifyStatus === 'voided') return 'cancelled';
  if (shopifyStatus === 'paid' && fulfillmentStatus === 'fulfilled') return 'fulfilled';
  if (shopifyStatus === 'paid') return 'paid';
  if (shopifyStatus === 'pending') return 'pending';
  return 'failed';
}

async function loadToSupabase(
  supabase: ReturnType<typeof createClient>,
  orders: ShopifyOrder[],
  dryRun: boolean
): Promise<void> {
  if (dryRun) {
    console.log(`[Shopify ETL] DRY RUN - Would insert ${orders.length} orders:`);
    orders.slice(0, 5).forEach(order => {
      console.log(`  - ${order.name}: ${order.email} - $${order.total_price} (${order.financial_status})`);
    });
    return;
  }

  console.log(`[Shopify ETL] Loading ${orders.length} orders to Supabase...`);

  const records = orders.map(order => {
    const refundAmount = order.refunds.reduce((sum, refund) => {
      return sum + refund.transactions
        .filter(t => t.kind === 'refund')
        .reduce((refundSum, t) => refundSum + parseFloat(t.amount), 0);
    }, 0);

    const latestRefund = order.refunds.length > 0 
      ? order.refunds[order.refunds.length - 1]
      : null;

    return {
      order_id: order.name, // Shopify order name (e.g., "#1001")
      user_id: order.customer?.id ? order.customer.id.toString() : null,
      customer_email: order.email || order.customer?.email || null,
      customer_name: order.customer 
        ? `${order.customer.first_name} ${order.customer.last_name}`.trim()
        : null,
      status: mapShopifyStatus(order.financial_status, order.fulfillment_status),
      currency: 'USD', // Adjust if multi-currency
      subtotal: parseFloat(order.subtotal_price || '0'),
      tax: parseFloat(order.total_tax || '0'),
      shipping: parseFloat(order.total_shipping_price_set?.shop_money?.amount || '0'),
      discount: parseFloat(order.total_discounts || '0'),
      total: parseFloat(order.total_price || '0'),
      refund_amount: refundAmount,
      refund_reason: latestRefund?.note || null,
      refunded_at: latestRefund?.created_at || null,
      payment_method: order.payment_gateway_names?.[0] || null,
      payment_provider: 'shopify',
      source: 'shopify',
      source_data: {
        shopify_order_id: order.id,
        financial_status: order.financial_status,
        fulfillment_status: order.fulfillment_status,
        fetched_at: new Date().toISOString(),
      },
      items: order.line_items.map(item => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        price: parseFloat(item.price),
        sku: item.sku,
      })),
      metadata: {
        refund_count: order.refunds.length,
      },
      order_date: order.created_at,
    };
  });

  // Upsert in batches
  const batchSize = 100;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { error } = await supabase
      .from('orders')
      .upsert(batch, { onConflict: 'order_id' });

    if (error) {
      console.error(`[Shopify ETL] Error loading batch ${i / batchSize + 1}:`, error);
      throw error;
    }
    console.log(`[Shopify ETL] Loaded batch ${i / batchSize + 1}/${Math.ceil(records.length / batchSize)}`);
  }

  console.log(`[Shopify ETL] Successfully loaded ${records.length} orders`);
}

async function main() {
  const startTime = Date.now();
  console.log(`[Shopify ETL] Starting at ${new Date().toISOString()}`);

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

  // Determine date range
  const today = new Date();
  const endDate = args.values['date'] 
    ? new Date(args.values['date'])
    : new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1); // Yesterday by default
  
  const days = parseInt(args.values['days'] || '1', 10);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days + 1);

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  // Validate environment variables
  const apiKey = process.env.SHOPIFY_API_KEY || 'YOUR_SHOPIFY_API_KEY';
  const password = process.env.SHOPIFY_PASSWORD || 'YOUR_SHOPIFY_PASSWORD';
  const store = process.env.SHOPIFY_STORE || 'YOUR_STORE_NAME';
  const supabaseUrl = process.env.SUPABASE_URL || 'https://YOUR_PROJECT.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

  if (apiKey === 'YOUR_SHOPIFY_API_KEY' || password === 'YOUR_SHOPIFY_PASSWORD' || store === 'YOUR_STORE_NAME') {
    console.error('[Shopify ETL] ERROR: SHOPIFY_API_KEY, SHOPIFY_PASSWORD, and SHOPIFY_STORE must be set');
    process.exit(1);
  }

  if (supabaseUrl === 'https://YOUR_PROJECT.supabase.co' || supabaseKey === 'YOUR_SERVICE_ROLE_KEY') {
    console.error('[Shopify ETL] ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    process.exit(1);
  }

  try {
    // Fetch orders from Shopify
    const orders = await fetchShopifyOrders(apiKey, password, store, startDateStr, endDateStr);

    if (orders.length === 0) {
      console.log('[Shopify ETL] No orders to load');
      return;
    }

    // Load to Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);
    await loadToSupabase(supabase, orders, dryRun);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[Shopify ETL] Completed successfully in ${duration}s`);
  } catch (error) {
    console.error('[Shopify ETL] ERROR:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

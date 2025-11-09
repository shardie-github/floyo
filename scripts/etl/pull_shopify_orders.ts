#!/usr/bin/env tsx
/**
 * ETL Script: Pull Shopify Orders
 * Description: Fetches order data from Shopify Admin API
 * Usage: tsx scripts/etl/pull_shopify_orders.ts [--dry-run] [--start-date YYYY-MM-DD] [--end-date YYYY-MM-DD]
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
  SHOPIFY_API_KEY: z.string().min(1),
  SHOPIFY_PASSWORD: z.string().min(1),
  SHOPIFY_STORE: z.string().min(1),
  TZ: z.string().default('America/Toronto'),
});

const argsSchema = z.object({
  dryRun: z.boolean().default(false),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

interface ShopifyOrder {
  id: string;
  name: string;
  email: string;
  created_at: string;
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  total_shipping_price_set: {
    shop_money: {
      amount: string;
    };
  };
  total_discounts: string;
  currency: string;
  financial_status: string;
  fulfillment_status: string | null;
  refunds?: Array<{
    id: string;
    created_at: string;
    amount: string;
  }>;
}

// Exponential backoff helper
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }
  
  throw lastError || new Error('Unknown error');
}

async function pullShopifyOrders(
  apiKey: string,
  password: string,
  store: string,
  startDate: string,
  endDate: string
): Promise<ShopifyOrder[]> {
  const baseUrl = `https://${apiKey}:${password}@${store}.myshopify.com/admin/api/2024-01`;
  const orders: ShopifyOrder[] = [];
  let pageInfo: string | null = null;
  
  console.log(`[Shopify ETL] Fetching orders from ${startDate} to ${endDate}`);
  
  do {
    // TODO: Replace with actual Shopify Admin API implementation
    // This is a placeholder structure
    
    // Example structure:
    // const url = `${baseUrl}/orders.json?` +
    //   `created_at_min=${startDate}T00:00:00-05:00&` +
    //   `created_at_max=${endDate}T23:59:59-05:00&` +
    //   `limit=250` +
    //   (pageInfo ? `&page_info=${pageInfo}` : '');
    // 
    // const response = await fetch(url);
    // const data = await response.json();
    // orders.push(...data.orders);
    // pageInfo = extractPageInfo(response.headers);
    
    // For now, break immediately (dry-run mode will show structure)
    break;
  } while (pageInfo);
  
  return orders;
}

function mapShopifyOrderToOrder(order: ShopifyOrder) {
  const refunds = order.refunds || [];
  const totalRefundAmount = refunds.reduce((sum, refund) => sum + parseFloat(refund.amount), 0);
  const latestRefund = refunds.length > 0 
    ? refunds.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    : null;
  
  // Map Shopify financial_status to our status
  const statusMap: Record<string, string> = {
    'pending': 'pending',
    'authorized': 'pending',
    'partially_paid': 'pending',
    'paid': 'paid',
    'partially_refunded': 'refunded',
    'refunded': 'refunded',
    'voided': 'cancelled',
  };
  
  return {
    external_order_id: order.id.toString(),
    source: 'shopify',
    customer_id: order.email, // Use email as customer_id for now
    customer_email: order.email,
    order_date: new Date(order.created_at).toISOString(),
    total_amount: parseFloat(order.total_price),
    subtotal: parseFloat(order.subtotal_price),
    tax_amount: parseFloat(order.total_tax || '0'),
    shipping_amount: parseFloat(order.total_shipping_price_set?.shop_money?.amount || '0'),
    discount_amount: parseFloat(order.total_discounts || '0'),
    currency: order.currency || 'USD',
    status: statusMap[order.financial_status] || 'pending',
    refund_amount: totalRefundAmount,
    refund_date: latestRefund ? new Date(latestRefund.created_at).toISOString() : null,
    metadata: {
      shopify_order_name: order.name,
      fulfillment_status: order.fulfillment_status,
      refund_count: refunds.length,
    },
  };
}

async function upsertOrders(
  supabase: ReturnType<typeof createClient>,
  orders: ShopifyOrder[],
  dryRun: boolean
): Promise<void> {
  if (orders.length === 0) {
    console.log('[Shopify ETL] No orders to upsert');
    return;
  }
  
  const records = orders.map(mapShopifyOrderToOrder);
  
  if (dryRun) {
    console.log('[Shopify ETL] DRY RUN - Would upsert orders:');
    console.log(JSON.stringify(records.slice(0, 3), null, 2));
    console.log(`[Shopify ETL] Total orders: ${records.length}`);
    return;
  }
  
  const { error } = await supabase
    .from('orders')
    .upsert(records, {
      onConflict: 'external_order_id',
      ignoreDuplicates: false,
    });
  
  if (error) {
    throw new Error(`Failed to upsert orders: ${error.message}`);
  }
  
  console.log(`[Shopify ETL] Successfully upserted ${records.length} orders`);
}

async function main() {
  const startTime = Date.now();
  console.log('[Shopify ETL] Starting Shopify orders pull...');
  console.log(`[Shopify ETL] Timezone: ${process.env.TZ || 'America/Toronto'}`);
  
  try {
    // Parse environment variables
    const env = envSchema.parse({
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY || 'SHOPIFY_API_KEY_PLACEHOLDER',
      SHOPIFY_PASSWORD: process.env.SHOPIFY_PASSWORD || 'SHOPIFY_PASSWORD_PLACEHOLDER',
      SHOPIFY_STORE: process.env.SHOPIFY_STORE || 'SHOPIFY_STORE_PLACEHOLDER',
      TZ: process.env.TZ || 'America/Toronto',
    });
    
    // Parse command line arguments
    const args = {
      dryRun: process.argv.includes('--dry-run'),
      startDate: process.argv.includes('--start-date')
        ? process.argv[process.argv.indexOf('--start-date') + 1]
        : undefined,
      endDate: process.argv.includes('--end-date')
        ? process.argv[process.argv.indexOf('--end-date') + 1]
        : undefined,
    };
    
    const parsedArgs = argsSchema.parse(args);
    
    // Default to last 7 days if not specified
    const endDate = parsedArgs.endDate || new Date().toISOString().split('T')[0];
    const startDate = parsedArgs.startDate || (() => {
      const date = new Date(endDate);
      date.setDate(date.getDate() - 7);
      return date.toISOString().split('T')[0];
    })();
    
    if (parsedArgs.dryRun) {
      console.log('[Shopify ETL] DRY RUN MODE - No data will be written');
    }
    
    // Initialize Supabase client
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    // Fetch orders from Shopify
    const orders = await fetchWithRetry(() =>
      pullShopifyOrders(env.SHOPIFY_API_KEY, env.SHOPIFY_PASSWORD, env.SHOPIFY_STORE, startDate, endDate)
    );
    
    // Upsert to Supabase
    await upsertOrders(supabase, orders, parsedArgs.dryRun);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[Shopify ETL] Completed successfully in ${duration}s`);
    
  } catch (error) {
    console.error('[Shopify ETL] Error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { pullShopifyOrders, upsertOrders };

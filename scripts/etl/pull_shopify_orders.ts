/**
 * ETL Script: Pull Shopify Orders
 * Description: Fetches orders from Shopify API and stores in orders table
 * Schedule: Daily at 01:20 America/Toronto
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

interface ShopifyOrder {
  id: number;
  order_number: number;
  email: string;
  created_at: string;
  financial_status: string;
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
  line_items: Array<{
    id: number;
    title: string;
    quantity: number;
    price: string;
  }>;
  customer?: {
    id: number;
  };
  source_name?: string;
}

async function fetchShopifyOrders(
  shop: string,
  apiKey: string,
  password: string,
  startDate: string,
  endDate: string
): Promise<ShopifyOrder[]> {
  const shopifyUrl = `https://${apiKey}:${password}@${shop}.myshopify.com/admin/api/2024-01/orders.json`;
  const params = new URLSearchParams({
    created_at_min: startDate,
    created_at_max: endDate,
    limit: '250',
    status: 'any',
  });

  const allOrders: ShopifyOrder[] = [];
  let pageInfo: string | null = null;

  do {
    const url = pageInfo
      ? `${shopifyUrl}?${params.toString()}&page_info=${pageInfo}`
      : `${shopifyUrl}?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.statusText}`);
    }

    const data = await response.json();
    allOrders.push(...(data.orders || []));

    // Check for pagination
    const linkHeader = response.headers.get('link');
    if (linkHeader && linkHeader.includes('rel="next"')) {
      const nextMatch = linkHeader.match(/<[^>]+page_info=([^&>]+)/);
      pageInfo = nextMatch ? nextMatch[1] : null;
    } else {
      pageInfo = null;
    }
  } while (pageInfo);

  return allOrders;
}

function parseShopifyOrder(order: ShopifyOrder): {
  order_number: string;
  user_id: string | null;
  placed_at: string;
  items: any[];
  subtotal_cents: number;
  shipping_cents: number;
  tax_cents: number;
  discount_cents: number;
  total_cents: number;
  currency: string;
  source: string | null;
} {
  const subtotalCents = Math.round(parseFloat(order.subtotal_price || '0') * 100);
  const shippingCents = Math.round(
    parseFloat(order.total_shipping_price_set?.shop_money?.amount || '0') * 100
  );
  const taxCents = Math.round(parseFloat(order.total_tax || '0') * 100);
  const discountCents = Math.round(parseFloat(order.total_discounts || '0') * 100);
  const totalCents = Math.round(parseFloat(order.total_price || '0') * 100);

  return {
    order_number: String(order.order_number),
    user_id: order.customer?.id ? String(order.customer.id) : null,
    placed_at: order.created_at,
    items: order.line_items.map((item) => ({
      id: item.id,
      title: item.title,
      quantity: item.quantity,
      price_cents: Math.round(parseFloat(item.price) * 100),
    })),
    subtotal_cents: subtotalCents,
    shipping_cents: shippingCents,
    tax_cents: taxCents,
    discount_cents: discountCents,
    total_cents: totalCents,
    currency: order.currency || 'USD',
    source: order.source_name || null,
  };
}

async function upsertOrders(
  pool: pg.Pool,
  records: Array<{
    order_number: string;
    user_id: string | null;
    placed_at: string;
    items: any[];
    subtotal_cents: number;
    shipping_cents: number;
    tax_cents: number;
    discount_cents: number;
    total_cents: number;
    currency: string;
    source: string | null;
  }>
) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const record of records) {
      await client.query(
        `INSERT INTO public.orders (order_number, user_id, placed_at, items, subtotal_cents, 
         shipping_cents, tax_cents, discount_cents, total_cents, currency, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (order_number) 
         DO UPDATE SET items = EXCLUDED.items, subtotal_cents = EXCLUDED.subtotal_cents,
                       shipping_cents = EXCLUDED.shipping_cents, tax_cents = EXCLUDED.tax_cents,
                       discount_cents = EXCLUDED.discount_cents, total_cents = EXCLUDED.total_cents,
                       source = EXCLUDED.source`,
        [
          record.order_number,
          record.user_id,
          record.placed_at,
          JSON.stringify(record.items),
          record.subtotal_cents,
          record.shipping_cents,
          record.tax_cents,
          record.discount_cents,
          record.total_cents,
          record.currency,
          record.source,
        ]
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('Missing SUPABASE_DB_URL or DATABASE_URL');
  }

  const shopifyStore = process.env.SHOPIFY_STORE;
  const shopifyApiKey = process.env.SHOPIFY_API_KEY;
  const shopifyPassword = process.env.SHOPIFY_PASSWORD;

  if (!shopifyStore || !shopifyApiKey || !shopifyPassword) {
    throw new Error('Missing SHOPIFY_STORE, SHOPIFY_API_KEY, or SHOPIFY_PASSWORD');
  }

  const pool = new pg.Pool({ connectionString: dbUrl });

  try {
    // Fetch last 7 days of orders
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();

    console.log(`Fetching Shopify orders from ${startDateStr} to ${endDateStr}...`);

    const rawOrders = await fetchShopifyOrders(
      shopifyStore,
      shopifyApiKey,
      shopifyPassword,
      startDateStr,
      endDateStr
    );

    const parsedOrders = rawOrders.map(parseShopifyOrder);

    console.log(`Found ${parsedOrders.length} orders`);

    if (parsedOrders.length > 0) {
      await upsertOrders(pool, parsedOrders);
      console.log(`✅ Upserted ${parsedOrders.length} orders to orders table`);
    } else {
      console.log('No new orders to upsert');
    }
  } catch (error) {
    console.error('Error pulling Shopify orders:', error);
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

export { fetchShopifyOrders, parseShopifyOrder, upsertOrders };

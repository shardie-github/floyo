/**
 * Example Tool: Shopify Products
 * Demonstrates code-as-API pattern with reusable TypeScript functions
 */

/**
 * @version 1.0.0
 * @author Agent Engine
 * @description Fetch and filter Shopify products with in-environment processing
 */
export const toolSchema = {
  name: 'shopify_products',
  version: '1.0.0',
  description: 'Fetch Shopify products with filtering and aggregation',
  inputSchema: {
    type: 'object',
    properties: {
      shop: { type: 'string', description: 'Shopify shop domain' },
      accessToken: { type: 'string', description: 'API access token' },
      limit: { type: 'number', description: 'Max products to fetch', default: 50 },
      filter: {
        type: 'object',
        properties: {
          minPrice: { type: 'number' },
          maxPrice: { type: 'number' },
          status: { type: 'string', enum: ['active', 'archived', 'draft'] },
          tags: { type: 'array', items: { type: 'string' } },
        },
      },
      aggregate: {
        type: 'object',
        properties: {
          groupBy: { type: 'string', enum: ['vendor', 'product_type', 'tags'] },
          metrics: {
            type: 'array',
            items: { type: 'string', enum: ['count', 'avg_price', 'total_value'] },
          },
        },
      },
    },
    required: ['shop', 'accessToken'],
  },
  outputSchema: {
    type: 'object',
    properties: {
      products: { type: 'array' },
      summary: { type: 'object' },
      insights: { type: 'array' },
    },
  },
  estimatedTokens: 200,
  latencyMs: 300,
};

interface ShopifyProduct {
  id: string;
  title: string;
  vendor: string;
  product_type: string;
  tags: string[];
  variants: Array<{ price: string }>;
  status: string;
}

/**
 * Fetch products from Shopify API
 */
async function fetchShopifyProducts(
  shop: string,
  accessToken: string,
  limit: number = 50
): Promise<ShopifyProduct[]> {
  const url = `https://${shop}.myshopify.com/admin/api/2024-01/products.json?limit=${limit}`;
  
  const response = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.products || [];
}

/**
 * Filter products in-environment (before model access)
 */
function filterProducts(
  products: ShopifyProduct[],
  filter?: {
    minPrice?: number;
    maxPrice?: number;
    status?: string;
    tags?: string[];
  }
): ShopifyProduct[] {
  if (!filter) return products;

  return products.filter((product) => {
    // Price filter
    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      const price = parseFloat(product.variants[0]?.price || '0');
      if (filter.minPrice !== undefined && price < filter.minPrice) return false;
      if (filter.maxPrice !== undefined && price > filter.maxPrice) return false;
    }

    // Status filter
    if (filter.status && product.status !== filter.status) return false;

    // Tags filter
    if (filter.tags && filter.tags.length > 0) {
      const hasTag = filter.tags.some((tag) => product.tags.includes(tag));
      if (!hasTag) return false;
    }

    return true;
  });
}

/**
 * Aggregate products in-environment
 */
function aggregateProducts(
  products: ShopifyProduct[],
  aggregate?: {
    groupBy?: string;
    metrics?: string[];
  }
): Record<string, any> {
  if (!aggregate) {
    return {
      total: products.length,
      avgPrice: calculateAvgPrice(products),
    };
  }

  const grouped: Record<string, ShopifyProduct[]> = {};

  // Group by specified field
  if (aggregate.groupBy) {
    for (const product of products) {
      const key = (product as any)[aggregate.groupBy] || 'unknown';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(product);
    }
  } else {
    grouped['all'] = products;
  }

  // Calculate metrics
  const summary: Record<string, any> = {};
  for (const [group, groupProducts] of Object.entries(grouped)) {
    summary[group] = {};
    
    if (aggregate.metrics?.includes('count')) {
      summary[group].count = groupProducts.length;
    }
    if (aggregate.metrics?.includes('avg_price')) {
      summary[group].avgPrice = calculateAvgPrice(groupProducts);
    }
    if (aggregate.metrics?.includes('total_value')) {
      summary[group].totalValue = groupProducts.reduce(
        (sum, p) => sum + parseFloat(p.variants[0]?.price || '0'),
        0
      );
    }
  }

  return summary;
}

function calculateAvgPrice(products: ShopifyProduct[]): number {
  if (products.length === 0) return 0;
  const total = products.reduce(
    (sum, p) => sum + parseFloat(p.variants[0]?.price || '0'),
    0
  );
  return total / products.length;
}

/**
 * Generate insights (value-add layer)
 */
function generateInsights(products: ShopifyProduct[]): Array<{
  type: string;
  title: string;
  value: any;
  impact: string;
  actionable: boolean;
}> {
  const insights = [];

  // High-value products insight
  const highValueProducts = products.filter(
    (p) => parseFloat(p.variants[0]?.price || '0') > 100
  );
  if (highValueProducts.length > 0) {
    insights.push({
      type: 'metric',
      title: 'High-Value Products',
      value: `${highValueProducts.length} products > $100`,
      impact: 'high',
      actionable: true,
    });
  }

  // Vendor diversity insight
  const vendors = new Set(products.map((p) => p.vendor));
  if (vendors.size < 3 && products.length > 10) {
    insights.push({
      type: 'anomaly',
      title: 'Low Vendor Diversity',
      value: `Only ${vendors.size} vendors for ${products.length} products`,
      impact: 'medium',
      actionable: true,
    });
  }

  return insights;
}

/**
 * Main execute function (code-as-API)
 */
export async function execute(params: {
  shop: string;
  accessToken: string;
  limit?: number;
  filter?: {
    minPrice?: number;
    maxPrice?: number;
    status?: string;
    tags?: string[];
  };
  aggregate?: {
    groupBy?: string;
    metrics?: string[];
  };
}): Promise<{
  products: ShopifyProduct[];
  summary: Record<string, any>;
  insights: Array<any>;
}> {
  // Step 1: Fetch raw data
  const allProducts = await fetchShopifyProducts(
    params.shop,
    params.accessToken,
    params.limit
  );

  // Step 2: Filter in-environment (reduce before model access)
  const filtered = filterProducts(allProducts, params.filter);

  // Step 3: Aggregate in-environment
  const summary = aggregateProducts(filtered, params.aggregate);

  // Step 4: Generate insights
  const insights = generateInsights(filtered);

  // Return minimal, processed data
  return {
    products: filtered.slice(0, 10), // Only return top 10 to model
    summary,
    insights,
  };
}

export default { execute, toolSchema };

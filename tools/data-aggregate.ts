/**
 * Example Tool: Data Aggregation
 * Demonstrates in-environment processing to reduce token usage
 */

/**
 * @version 1.0.0
 * @description Aggregate and summarize large datasets before model access
 */
export const toolSchema = {
  name: 'data_aggregate',
  version: '1.0.0',
  description: 'Aggregate large datasets with filtering and summarization',
  inputSchema: {
    type: 'object',
    properties: {
      data: { type: 'array', description: 'Array of data objects' },
      groupBy: { type: 'string', description: 'Field to group by' },
      metrics: {
        type: 'array',
        items: { type: 'string' },
        description: 'Metrics to calculate: sum, avg, count, min, max',
      },
      filter: {
        type: 'object',
        description: 'Filter conditions',
      },
      topN: { type: 'number', description: 'Return only top N groups', default: 10 },
    },
    required: ['data'],
  },
  outputSchema: {
    type: 'object',
    properties: {
      aggregated: { type: 'object' },
      summary: { type: 'object' },
      reducedRows: { type: 'number' },
      originalRows: { type: 'number' },
    },
  },
  estimatedTokens: 150,
  latencyMs: 50,
};

export async function execute(params: {
  data: any[];
  groupBy?: string;
  metrics?: string[];
  filter?: Record<string, any>;
  topN?: number;
}): Promise<{
  aggregated: Record<string, any>;
  summary: Record<string, any>;
  reducedRows: number;
  originalRows: number;
}> {
  const originalRows = params.data.length;
  let processed = [...params.data];

  // Step 1: Filter in-environment
  if (params.filter) {
    processed = processed.filter((item) => {
      for (const [key, value] of Object.entries(params.filter!)) {
        if (item[key] !== value) return false;
      }
      return true;
    });
  }

  // Step 2: Aggregate in-environment
  const aggregated: Record<string, any> = {};
  
  if (params.groupBy) {
    const groups: Record<string, any[]> = {};
    for (const item of processed) {
      const key = item[params.groupBy] || 'unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }

    // Calculate metrics per group
    for (const [group, items] of Object.entries(groups)) {
      aggregated[group] = {};
      
      if (params.metrics?.includes('count')) {
        aggregated[group].count = items.length;
      }
      if (params.metrics?.includes('sum')) {
        // Assume numeric field exists
        const sumField = Object.keys(items[0] || {}).find(
          (k) => typeof items[0]?.[k] === 'number'
        );
        if (sumField) {
          aggregated[group].sum = items.reduce(
            (s, item) => s + (item[sumField] || 0),
            0
          );
        }
      }
      if (params.metrics?.includes('avg')) {
        const avgField = Object.keys(items[0] || {}).find(
          (k) => typeof items[0]?.[k] === 'number'
        );
        if (avgField) {
          const sum = items.reduce((s, item) => s + (item[avgField] || 0), 0);
          aggregated[group].avg = sum / items.length;
        }
      }
    }

    // Sort and take top N
    const sorted = Object.entries(aggregated).sort((a, b) => {
      const aVal = a[1].count || 0;
      const bVal = b[1].count || 0;
      return bVal - aVal;
    });

    const topN = params.topN || 10;
    const topGroups: Record<string, any> = {};
    for (const [key, value] of sorted.slice(0, topN)) {
      topGroups[key] = value;
    }
    
    return {
      aggregated: topGroups,
      summary: {
        totalGroups: Object.keys(groups).length,
        topNReturned: Math.min(topN, Object.keys(groups).length),
      },
      reducedRows: topN,
      originalRows,
    };
  }

  // No grouping - just summary
  return {
    aggregated: {},
    summary: {
      total: processed.length,
      filtered: originalRows - processed.length,
    },
    reducedRows: processed.length,
    originalRows,
  };
}

export default { execute, toolSchema };

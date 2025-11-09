/**
 * Metrics aggregation utilities
 * 
 * Shared helpers for calculating averages, sums, and aggregations from metrics data.
 */

export interface MetricData {
  [key: string]: unknown;
}

/**
 * Calculate average of a numeric field across metrics
 */
export function average(metrics: MetricData[], key: string): number | undefined {
  const values = metrics
    .map((m) => {
      const value = m[key] ?? m[key.toLowerCase()];
      return typeof value === 'number' && !isNaN(value) ? value : null;
    })
    .filter((v): v is number => v !== null);
  
  if (values.length === 0) return undefined;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Calculate sum of a numeric field across metrics
 */
export function sum(metrics: MetricData[], key: string): number {
  return metrics
    .map((m) => {
      const value = m[key] ?? m[key.toLowerCase()] ?? 0;
      return typeof value === 'number' && !isNaN(value) ? value : 0;
    })
    .reduce((a, b) => a + b, 0);
}

/**
 * Group metrics by a field value
 */
export function groupBy<T extends MetricData>(metrics: T[], key: string): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};
  for (const metric of metrics) {
    const groupKey = String(metric[key] ?? 'unknown');
    if (!grouped[groupKey]) {
      grouped[groupKey] = [];
    }
    grouped[groupKey].push(metric);
  }
  return grouped;
}

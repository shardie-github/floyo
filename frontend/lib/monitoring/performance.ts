/**
 * Frontend Performance Monitoring
 * 
 * Tracks frontend performance metrics: page load time, API latency, etc.
 */

import { logger } from '../logger';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000;

  /**
   * Record a performance metric
   */
  record(name: string, value: number, metadata?: Record<string, unknown>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: new Date(),
      metadata,
    };

    this.metrics.push(metric);

    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow operations
    if (value > 1000) {
      logger.warn(`Slow operation: ${name} took ${value}ms`, metadata);
    } else {
      logger.debug(`Performance: ${name} took ${value}ms`, metadata);
    }
  }

  /**
   * Measure async operation
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.record(name, duration, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.record(name, duration, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Measure sync operation
   */
  measureSync<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, unknown>
  ): T {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      this.record(name, duration, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.record(name, duration, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Get performance statistics
   */
  getStats(name: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const relevantMetrics = this.metrics.filter((m) => m.name === name);
    if (relevantMetrics.length === 0) {
      return null;
    }

    const values = relevantMetrics.map((m) => m.value).sort((a, b) => a - b);
    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / count;
    const min = values[0];
    const max = values[count - 1];
    const p50 = values[Math.floor(count * 0.5)];
    const p95 = values[Math.floor(count * 0.95)];
    const p99 = values[Math.floor(count * 0.99)];

    return {
      count,
      avg: Math.round(avg * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      p50: Math.round(p50 * 100) / 100,
      p95: Math.round(p95 * 100) / 100,
      p99: Math.round(p99 * 100) / 100,
    };
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear metrics
   */
  clear(): void {
    this.metrics = [];
  }
}

// Global instance
export const performanceMonitor = new PerformanceMonitor();

// Web Vitals integration
if (typeof window !== 'undefined') {
  import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB, onINP }) => {
    onCLS((metric) => {
      performanceMonitor.record('web-vitals-cls', metric.value, {
        rating: metric.rating,
      });
    });

    onFID((metric) => {
      performanceMonitor.record('web-vitals-fid', metric.value, {
        rating: metric.rating,
      });
    });

    onFCP((metric) => {
      performanceMonitor.record('web-vitals-fcp', metric.value, {
        rating: metric.rating,
      });
    });

    onLCP((metric) => {
      performanceMonitor.record('web-vitals-lcp', metric.value, {
        rating: metric.rating,
      });
    });

    onTTFB((metric) => {
      performanceMonitor.record('web-vitals-ttfb', metric.value, {
        rating: metric.rating,
      });
    });

    onINP((metric) => {
      performanceMonitor.record('web-vitals-inp', metric.value, {
        rating: metric.rating,
      });
    });
  });
}

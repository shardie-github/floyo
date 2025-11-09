/**
 * Real-time Monitoring Service
 * 
 * Tracks system health, performance, and errors in real-time.
 * Taps into: "I want to know if something breaks"
 */

export interface SystemMetrics {
  timestamp: string;
  cpu?: number;
  memory?: number;
  requests?: {
    total: number;
    errors: number;
    avgLatency: number;
  };
  errors?: Array<{
    type: string;
    message: string;
    count: number;
  }>;
}

class RealtimeMonitor {
  private metrics: SystemMetrics[] = [];
  private maxMetrics = 100;

  /**
   * Record metric
   */
  record(metric: Partial<SystemMetrics>): void {
    this.metrics.push({
      timestamp: new Date().toISOString(),
      ...metric,
    });

    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * Get recent metrics
   */
  getRecent(minutes: number = 5): SystemMetrics[] {
    const cutoff = Date.now() - minutes * 60 * 1000;
    return this.metrics.filter(m => new Date(m.timestamp).getTime() > cutoff);
  }

  /**
   * Get error rate
   */
  getErrorRate(minutes: number = 5): number {
    const recent = this.getRecent(minutes);
    if (recent.length === 0) return 0;

    const totalRequests = recent.reduce((sum, m) => sum + (m.requests?.total || 0), 0);
    const totalErrors = recent.reduce((sum, m) => sum + (m.requests?.errors || 0), 0);

    return totalRequests > 0 ? totalErrors / totalRequests : 0;
  }

  /**
   * Get average latency
   */
  getAvgLatency(minutes: number = 5): number {
    const recent = this.getRecent(minutes);
    if (recent.length === 0) return 0;

    const latencies = recent
      .map(m => m.requests?.avgLatency || 0)
      .filter(l => l > 0);

    if (latencies.length === 0) return 0;

    return latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
  }

  /**
   * Check if system is healthy
   */
  isHealthy(): boolean {
    const errorRate = this.getErrorRate(5);
    const avgLatency = this.getAvgLatency(5);

    return errorRate < 0.05 && avgLatency < 500; // 5% error rate, 500ms latency
  }
}

export const realtimeMonitor = new RealtimeMonitor();

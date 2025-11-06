/**
 * Observability Layer - Token & Latency Tracking
 * Minimal logging, sanitized telemetry to Supabase
 */

import type { TelemetryRecord } from './types.js';
import { PrivacyLayer } from '../core/privacy.js';

export class Observability {
  private records: TelemetryRecord[] = [];
  private privacy: PrivacyLayer;
  private supabaseClient: any = null; // Will be injected if available

  constructor(privacy: PrivacyLayer) {
    this.privacy = privacy;
  }

  /**
   * Set Supabase client for telemetry storage
   */
  setSupabaseClient(client: any): void {
    this.supabaseClient = client;
  }

  /**
   * Record tool execution telemetry
   */
  async record(
    toolName: string,
    tokensUsed: number,
    latencyMs: number,
    success: boolean,
    contextId?: string
  ): Promise<void> {
    const record: TelemetryRecord = {
      toolName,
      tokensUsed,
      latencyMs,
      success,
      timestamp: new Date().toISOString(),
      contextId,
      sanitized: true, // Always sanitized
    };

    this.records.push(record);

    // Flush to Supabase if available (async, non-blocking)
    if (this.supabaseClient) {
      this.flushToSupabase(record).catch((err) => {
        console.warn(`Failed to flush telemetry: ${err.message}`);
      });
    }
  }

  /**
   * Flush sanitized record to Supabase
   */
  private async flushToSupabase(record: TelemetryRecord): Promise<void> {
    if (!this.supabaseClient) return;

    const sanitized = this.privacy.getSanitizedTelemetry({
      toolName: record.toolName,
      tokensUsed: record.tokensUsed,
      latencyMs: record.latencyMs,
      success: record.success,
    });

    try {
      await this.supabaseClient.from('agent_telemetry').insert(sanitized);
    } catch (error: any) {
      // Fail silently - telemetry is non-critical
      console.warn(`Telemetry insert failed: ${error.message}`);
    }
  }

  /**
   * Get token savings report
   */
  getTokenSavingsReport(): {
    totalTokens: number;
    avgTokensPerCall: number;
    estimatedSavings: number; // vs naive approach
    topConsumers: Array<{ tool: string; tokens: number }>;
  } {
    const totalTokens = this.records.reduce((sum, r) => sum + r.tokensUsed, 0);
    const avgTokensPerCall = totalTokens / Math.max(1, this.records.length);

    // Estimate savings vs loading all tools upfront
    const naiveEstimate = this.records.length * 500; // Assume 500 tokens per tool if all loaded
    const estimatedSavings = naiveEstimate - totalTokens;

    // Top token consumers
    const toolTokens = new Map<string, number>();
    for (const record of this.records) {
      toolTokens.set(
        record.toolName,
        (toolTokens.get(record.toolName) || 0) + record.tokensUsed
      );
    }

    const topConsumers = Array.from(toolTokens.entries())
      .map(([tool, tokens]) => ({ tool, tokens }))
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, 10);

    return {
      totalTokens,
      avgTokensPerCall,
      estimatedSavings: Math.max(0, estimatedSavings),
      topConsumers,
    };
  }

  /**
   * Get latency report
   */
  getLatencyReport(): {
    avgLatency: number;
    p95Latency: number;
    p99Latency: number;
    slowestTools: Array<{ tool: string; latency: number }>;
  } {
    const latencies = this.records.map((r) => r.latencyMs).sort((a, b) => a - b);
    const avgLatency = latencies.reduce((sum, l) => sum + l, 0) / Math.max(1, latencies.length);
    const p95Index = Math.floor(latencies.length * 0.95);
    const p99Index = Math.floor(latencies.length * 0.99);

    // Tool latency aggregation
    const toolLatencies = new Map<string, number[]>();
    for (const record of this.records) {
      if (!toolLatencies.has(record.toolName)) {
        toolLatencies.set(record.toolName, []);
      }
      toolLatencies.get(record.toolName)!.push(record.latencyMs);
    }

    const slowestTools = Array.from(toolLatencies.entries())
      .map(([tool, latencies]) => ({
        tool,
        latency: latencies.reduce((sum, l) => sum + l, 0) / latencies.length,
      }))
      .sort((a, b) => b.latency - a.latency)
      .slice(0, 10);

    return {
      avgLatency,
      p95Latency: latencies[p95Index] || 0,
      p99Latency: latencies[p99Index] || 0,
      slowestTools,
    };
  }

  /**
   * Generate optimization report
   */
  generateOptimizationReport(): string {
    const tokenReport = this.getTokenSavingsReport();
    const latencyReport = this.getLatencyReport();

    return `
Token Efficiency Report:
- Total tokens used: ${tokenReport.totalTokens}
- Average per call: ${tokenReport.avgTokensPerCall.toFixed(0)}
- Estimated savings vs naive: ${tokenReport.estimatedSavings} tokens
- Top consumers: ${tokenReport.topConsumers.map((t) => `${t.tool} (${t.tokens})`).join(', ')}

Latency Report:
- Average: ${latencyReport.avgLatency.toFixed(0)}ms
- P95: ${latencyReport.p95Latency.toFixed(0)}ms
- P99: ${latencyReport.p99Latency.toFixed(0)}ms
- Slowest tools: ${latencyReport.slowestTools.map((t) => `${t.tool} (${t.latency.toFixed(0)}ms)`).join(', ')}
`.trim();
  }

  /**
   * Clear records (for memory management)
   */
  clear(): void {
    this.records = [];
  }
}

/**
 * Uptime Monitor & Health Check Probe
 * Monitors service health and records metrics
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface UptimeReport {
  totalChecks: number;
  checksPassed: number;
  checksFailed: number;
  avgLatency: number;
  endpoints: Array<{
    url: string;
    status: 'ok' | 'fail';
    latency: number;
    error?: string;
  }>;
  downtime: number; // minutes
  alerts: string[];
}

export async function monitorUptime(
  supabase: SupabaseClient,
  config: { reliabilityWebhook?: string }
): Promise<UptimeReport> {
  const endpoints = [
    { url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/health', name: 'API' },
    { url: process.env.SUPABASE_URL || '', name: 'Supabase' },
  ].filter(e => e.url);

  const results: UptimeReport['endpoints'] = [];
  let totalLatency = 0;
  let passedChecks = 0;
  const alerts: string[] = [];

  for (const endpoint of endpoints) {
    try {
      const start = Date.now();
      const result = await checkHealth(endpoint.url);
      const latency = Date.now() - start;

      totalLatency += latency;
      if (result.ok) {
        passedChecks++;
        results.push({
          url: endpoint.url,
          status: 'ok',
          latency,
        });

        // Record metric in Supabase
        await supabase.from('metrics_log').insert({
          source: 'telemetry',
          metric: {
            type: 'health',
            endpoint: endpoint.name,
            status: 'ok',
            latency,
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        results.push({
          url: endpoint.url,
          status: 'fail',
          latency,
          error: result.error,
        });

        alerts.push(`Health check failed for ${endpoint.name}: ${result.error}`);
      }
    } catch (error: any) {
      results.push({
        url: endpoint.url,
        status: 'fail',
        latency: 0,
        error: error.message,
      });

      alerts.push(`Health check error for ${endpoint.name}: ${error.message}`);
    }
  }

  const avgLatency = results.length > 0 ? totalLatency / results.length : 0;
  const failedChecks = results.filter(r => r.status === 'fail').length;
  const downtime = failedChecks > 0 ? (failedChecks / results.length) * 2 : 0; // Estimate 2 min per failure

  // Alert if downtime > 2 minutes
  if (downtime > 2 && config.reliabilityWebhook) {
    await sendAlert(config.reliabilityWebhook, {
      message: `🚨 Service downtime detected: ${downtime.toFixed(2)} minutes`,
      endpoints: results.filter(r => r.status === 'fail'),
    });
  }

  return {
    totalChecks: results.length,
    checksPassed: passedChecks,
    checksFailed: failedChecks,
    avgLatency,
    endpoints: results,
    downtime,
    alerts,
  };
}

function checkHealth(url: string): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const timeout = 5000; // 5 second timeout

    const req = client.get(url, { timeout }, (res) => {
      if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
        resolve({ ok: true });
      } else {
        resolve({ ok: false, error: `HTTP ${res.statusCode}` });
      }
    });

    req.on('error', (error) => {
      resolve({ ok: false, error: error.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: 'Timeout' });
    });
  });
}

async function sendAlert(webhook: string, data: any): Promise<void> {
  try {
    const urlModule = await import('url');
    const httpsModule = await import('https');
    const httpModule = await import('http');
    const url = new urlModule.URL(webhook);
    const client = url.protocol === 'https:' ? httpsModule : httpModule;

    const postData = JSON.stringify(data);

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    return new Promise((resolve, reject) => {
      const req = client.request(options, () => {
        resolve();
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  } catch (error) {
    console.warn('Failed to send alert:', (error as Error).message);
  }
}

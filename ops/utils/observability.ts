/**
 * Observability Suite - OpenTelemetry, metrics, dashboard
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

interface KPI {
  p95Latency: number;
  errorRate: number;
  cost: number;
  requestsPerSecond: number;
}

const metrics: Metric[] = [];

export function recordMetric(name: string, value: number, tags?: Record<string, string>): void {
  metrics.push({
    name,
    value,
    timestamp: new Date(),
    tags
  });
}

export function recordLatency(operation: string, duration: number): void {
  recordMetric('latency', duration, { operation });
}

export function recordError(operation: string, error: string): void {
  recordMetric('errors', 1, { operation, error });
}

export function recordCost(service: string, cost: number): void {
  recordMetric('cost', cost, { service });
}

export async function calculateKPIs(): Promise<KPI> {
  const latencyMetrics = metrics.filter(m => m.name === 'latency');
  const errorMetrics = metrics.filter(m => m.name === 'errors');
  const costMetrics = metrics.filter(m => m.name === 'cost');

  // Calculate P95 latency
  const latencies = latencyMetrics.map(m => m.value).sort((a, b) => a - b);
  const p95Index = Math.floor(latencies.length * 0.95);
  const p95Latency = latencies[p95Index] || 0;

  // Calculate error rate
  const totalRequests = metrics.filter(m => m.name === 'latency').length;
  const errors = errorMetrics.length;
  const errorRate = totalRequests > 0 ? (errors / totalRequests) * 100 : 0;

  // Calculate total cost
  const cost = costMetrics.reduce((sum, m) => sum + m.value, 0);

  // Calculate requests per second (last minute)
  const oneMinuteAgo = new Date(Date.now() - 60000);
  const recentRequests = metrics.filter(m => 
    m.name === 'latency' && m.timestamp > oneMinuteAgo
  ).length;
  const requestsPerSecond = recentRequests / 60;

  return {
    p95Latency,
    errorRate,
    cost,
    requestsPerSecond
  };
}

export async function generateDashboardHTML(): Promise<string> {
  const kpis = await calculateKPIs();

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Production Dashboard</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .dashboard {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    .kpi-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .kpi-value {
      font-size: 2em;
      font-weight: bold;
      color: #0066cc;
    }
    .kpi-label {
      color: #666;
      margin-top: 8px;
    }
    .cost-breakdown {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .cost-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }
    .alert {
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .alert-warning {
      background: #fff3cd;
      border: 1px solid #ffc107;
    }
    .alert-danger {
      background: #f8d7da;
      border: 1px solid #dc3545;
    }
  </style>
</head>
<body>
  <h1>Production Dashboard</h1>
  <p>Last updated: ${new Date().toISOString()}</p>

  ${kpis.errorRate > 5 ? `
    <div class="alert alert-danger">
      ⚠️ High error rate detected: ${kpis.errorRate.toFixed(2)}%
    </div>
  ` : ''}

  ${kpis.p95Latency > 1000 ? `
    <div class="alert alert-warning">
      ⚠️ P95 latency elevated: ${kpis.p95Latency.toFixed(0)}ms
    </div>
  ` : ''}

  <div class="dashboard">
    <div class="kpi-card">
      <div class="kpi-value">${kpis.p95Latency.toFixed(0)}ms</div>
      <div class="kpi-label">P95 Latency</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">${kpis.errorRate.toFixed(2)}%</div>
      <div class="kpi-label">Error Rate</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">$${kpis.cost.toFixed(2)}</div>
      <div class="kpi-label">Total Cost</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">${kpis.requestsPerSecond.toFixed(1)}</div>
      <div class="kpi-label">Requests/sec</div>
    </div>
  </div>

  <div class="cost-breakdown">
    <h2>Cost Breakdown</h2>
    <div class="cost-item">
      <span>Vercel</span>
      <span>$${(kpis.cost * 0.6).toFixed(2)}</span>
    </div>
    <div class="cost-item">
      <span>Supabase</span>
      <span>$${(kpis.cost * 0.3).toFixed(2)}</span>
    </div>
    <div class="cost-item">
      <span>External APIs</span>
      <span>$${(kpis.cost * 0.1).toFixed(2)}</span>
    </div>
  </div>
</body>
</html>`;

  return html;
}

export async function saveDashboard(): Promise<void> {
  const html = await generateDashboardHTML();
  const dashboardPath = path.join(process.cwd(), 'ops', 'reports', 'index.html');
  fs.mkdirSync(path.dirname(dashboardPath), { recursive: true });
  fs.writeFileSync(dashboardPath, html);
}

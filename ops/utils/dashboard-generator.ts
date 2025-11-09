/**
 * Dashboard Generator
 * Creates reliability and compliance dashboards
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

export async function generateDashboards(
  results: any,
  supabase: SupabaseClient
): Promise<void> {
  // Generate reliability dashboard
  await generateReliabilityDashboard(results, supabase);

  // Generate compliance dashboard
  await generateComplianceDashboard(results);

  // Generate security compliance report
  await generateSecurityReport(results);
}

async function generateReliabilityDashboard(
  results: any,
  supabase: SupabaseClient
): Promise<void> {
  const dashboard = {
    timestamp: new Date().toISOString(),
    uptime: results.reliabilityTrends?.uptime || 99.9,
    latency: results.reliabilityTrends?.avgLatency || 0,
    errorRate: results.reliabilityTrends?.errorRate || 0,
    buildTime: results.reliabilityTrends?.buildTime || 0,
    trends: results.reliabilityTrends?.trends || {},
    cost: results.costForecast || {},
    dependencies: {
      outdated: results.dependencies?.outdated?.length || 0,
      vulnerabilities: results.dependencies?.vulnerabilities?.length || 0,
    },
    alerts: results.uptime?.alerts || [],
  };

  // Save JSON dashboard
  const jsonPath = path.join(process.cwd(), 'admin', 'reliability.json');
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(dashboard, null, 2));

  // Generate Markdown dashboard
  const mdPath = path.join(process.cwd(), 'admin', 'reliability.md');
  const md = generateReliabilityMarkdown(dashboard);
  fs.writeFileSync(mdPath, md);
}

async function generateComplianceDashboard(results: any): Promise<void> {
  const dashboard = {
    timestamp: new Date().toISOString(),
    secrets: results.security?.secrets?.status || 'unknown',
    licenses: results.security?.licenses || { gpl: 0, restricted: 0 },
    tls: results.security?.tls?.status || 'unknown',
    rls: results.security?.rls?.status || 'unknown',
    gdpr: results.security?.gdpr?.status || 'unknown',
    issues: results.security?.issues || [],
    trends: {
      vulnerabilities: results.security?.sbom?.vulnerabilities || 0,
    },
  };

  const jsonPath = path.join(process.cwd(), 'admin', 'compliance.json');
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(dashboard, null, 2));
}

async function generateSecurityReport(results: any): Promise<void> {
  const report = `# Security & Compliance Report

Generated: ${new Date().toISOString()}

## Executive Summary

- **Secrets Status**: ${results.security?.secrets?.status || 'unknown'}
- **TLS**: ${results.security?.tls?.status || 'unknown'}
- **RLS**: ${results.security?.rls?.status || 'unknown'}
- **GDPR**: ${results.security?.gdpr?.status || 'unknown'}

## Detailed Findings

### Secrets Audit
- **Exposed Secrets**: ${results.security?.secrets?.exposed || 0}
${results.security?.secrets?.findings?.length > 0 ? `
**Findings:**
${results.security.secrets.findings.slice(0, 10).map((f: any) => `- ${f.file}:${f.line} - ${f.pattern}`).join('\n')}
` : ''}

### License Compliance
- **GPL Licenses**: ${results.security?.licenses?.gpl || 0}
- **Restricted Licenses**: ${results.security?.licenses?.restricted || 0}
${results.security?.licenses?.issues?.length > 0 ? `
**Issues:**
${results.security.licenses.issues.map((i: any) => `- ${i.name}: ${i.license} - ${i.risk}`).join('\n')}
` : ''}

### TLS & CORS
- **Status**: ${results.security?.tls?.status || 'unknown'}
${results.security?.tls?.endpoints?.length > 0 ? `
**Endpoints:**
${results.security.tls.endpoints.map((e: any) => `- ${e.url}: ${e.https ? '✅ HTTPS' : '❌ HTTP'}`).join('\n')}
` : ''}

### Row Level Security (RLS)
- **Status**: ${results.security?.rls?.status || 'unknown'}
${results.security?.rls?.tables?.length > 0 ? `
**Tables:**
${results.security.rls.tables.map((t: any) => `- ${t.name}: ${t.enabled ? '✅ Enabled' : '❌ Disabled'}`).join('\n')}
` : ''}

### GDPR Compliance
- **Status**: ${results.security?.gdpr?.status || 'unknown'}
${results.security?.gdpr?.checks ? `
**Checks:**
- Data Anonymization: ${results.security.gdpr.checks.dataAnonymization ? '✅' : '❌'}
- Consent Management: ${results.security.gdpr.checks.consentManagement ? '✅' : '❌'}
- Data Export: ${results.security.gdpr.checks.dataExport ? '✅' : '❌'}
- Data Deletion: ${results.security.gdpr.checks.dataDeletion ? '✅' : '❌'}
- Retention Policies: ${results.security.gdpr.checks.retentionPolicies ? '✅' : '❌'}
` : ''}

### SBOM
- **Generated**: ${results.security?.sbom?.generated ? '✅' : '❌'}
${results.security?.sbom?.path ? `- **Path**: ${results.security.sbom.path}` : ''}
- **Vulnerabilities**: ${results.security?.sbom?.vulnerabilities || 0}

## Issues

${results.security?.issues?.length > 0 ? results.security.issues.map((i: string) => `- ${i}`).join('\n') : 'No issues detected'}

## Recommendations

${generateRecommendations(results.security)}

---

*Report generated by Hardonia Reliability, Financial & Security Orchestrator*
`;

  const reportPath = path.join(process.cwd(), 'SECURITY_COMPLIANCE_REPORT.md');
  fs.writeFileSync(reportPath, report);
}

function generateReliabilityMarkdown(dashboard: any): string {
  return `# Reliability Dashboard

Last Updated: ${dashboard.timestamp}

## Key Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Uptime | ${dashboard.uptime.toFixed(2)}% | ${dashboard.uptime >= 99.9 ? '✅' : '⚠️'} |
| Avg Latency | ${dashboard.latency.toFixed(0)}ms | ${dashboard.latency < 200 ? '✅' : '⚠️'} |
| Error Rate | ${dashboard.errorRate.toFixed(2)}% | ${dashboard.errorRate < 1 ? '✅' : '⚠️'} |
| Build Time | ${dashboard.buildTime.toFixed(0)}s | ${dashboard.buildTime < 300 ? '✅' : '⚠️'} |

## Cost Forecast

- **Current**: $${dashboard.cost?.current?.toFixed(2) || '0.00'}
- **Forecasted**: $${dashboard.cost?.forecasted?.toFixed(2) || '0.00'}
- **Budget**: $${dashboard.cost?.budget || 75}
- **Status**: ${dashboard.cost?.overrunRisk ? '⚠️ Overrun Risk' : '✅ Within Budget'}

## Dependencies

- **Outdated**: ${dashboard.dependencies.outdated}
- **Vulnerabilities**: ${dashboard.dependencies.vulnerabilities}

## Alerts

${dashboard.alerts.length > 0 ? dashboard.alerts.map((a: string) => `- ⚠️ ${a}`).join('\n') : 'No alerts'}

## Trends

### Uptime Trend (30 days)
${dashboard.trends.uptime ? `Average: ${(dashboard.trends.uptime.reduce((a: number, b: number) => a + b, 0) / dashboard.trends.uptime.length).toFixed(2)}%` : 'No data'}

### Latency Trend (30 days)
${dashboard.trends.latency ? `Average: ${(dashboard.trends.latency.reduce((a: number, b: number) => a + b, 0) / dashboard.trends.latency.length).toFixed(0)}ms` : 'No data'}

---

*Dashboard auto-refreshes post-deploy*
`;
}

function generateRecommendations(security: any): string {
  const recommendations: string[] = [];

  if (security?.secrets?.exposed > 0) {
    recommendations.push('1. Review and remove exposed secrets from codebase');
    recommendations.push('2. Rotate any exposed credentials');
    recommendations.push('3. Use environment variables or secrets management service');
  }

  if (security?.licenses?.gpl > 0) {
    recommendations.push('4. Review GPL-licensed packages for compliance requirements');
  }

  if (security?.tls?.status !== 'enforced') {
    recommendations.push('5. Enforce HTTPS for all endpoints');
  }

  if (security?.rls?.status !== 'enabled') {
    recommendations.push('6. Enable RLS on all Supabase tables');
  }

  if (security?.gdpr?.status === 'fail') {
    recommendations.push('7. Implement missing GDPR compliance features');
  }

  return recommendations.length > 0 ? recommendations.join('\n') : 'All checks passed ✅';
}

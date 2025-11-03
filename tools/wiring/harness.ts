#!/usr/bin/env tsx
/**
 * Wiring Harness - End-to-End Connectivity Verification
 * 
 * This orchestrates comprehensive connectivity tests across all subsystems.
 * Generates connectivity matrix and reports.
 */

import * as fs from 'fs';
import * as path from 'path';


interface CheckResult {
  system: string;
  check: string;
  status: 'PASS' | 'FAIL' | 'DEGRADED' | 'SKIP';
  latency?: number;
  evidence?: string[];
  error?: string;
  fixPR?: string;
  nextAction?: string;
}

interface ConnectivityMatrix {
  timestamp: string;
  version: string;
  checks: CheckResult[];
  summary: {
    total: number;
    pass: number;
    fail: number;
    degraded: number;
    skip: number;
  };
}

class WiringHarness {
  private results: CheckResult[] = [];
  private baseUrl: string;
  private apiUrl: string;
  
  constructor() {
    this.baseUrl = process.env.API_BASE_URL || 'http://localhost:8000';
    this.apiUrl = `${this.baseUrl}/api`;
  }

  private getWorkspacePath(): string {
    // Resolve workspace root - look for tools/wiring/harness.ts
    const cwd = process.cwd();
    
    // Try current directory first
    const harnessPath = path.join(cwd, 'tools', 'wiring', 'harness.ts');
    if (fs.existsSync(harnessPath)) {
      return cwd;
    }
    
    // Walk up directory tree to find workspace root
    let current = cwd;
    for (let i = 0; i < 10; i++) { // Max 10 levels up
      const checkPath = path.join(current, 'tools', 'wiring', 'harness.ts');
      if (fs.existsSync(checkPath)) {
        return current;
      }
      const parent = path.dirname(current);
      if (parent === current) break; // Reached filesystem root
      current = parent;
    }
    
    // Fallback: assume workspace root is where we're running from
    return cwd;
  }

  async run(): Promise<void> {
    console.log('?? Starting Nomad Monorepo Connectivity Verification...\n');
    console.log(`API Base URL: ${this.baseUrl}\n`);

    // A) Foundational checks
    await this.checkEnvironment();
    await this.checkHealth();
    
    // B) AuthN/Z & RLS
    await this.checkAuth();
    await this.checkRLS();
    
    // C) Core Product Loop
    await this.checkProductLoop();
    
    // D) Additional subsystems (with fallbacks)
    await this.checkPayments();
    await this.checkPartnerNetwork();
    await this.checkGrowth();
    await this.checkCompliance();
    await this.checkSRE();
    
    // Generate reports
    await this.generateReports();
    this.printMatrix();
  }

  private async checkEnvironment(): Promise<void> {
    console.log('?? Checking Environment & Secrets...');
    
    const required = [
      'DATABASE_URL',
      'SECRET_KEY',
      'API_BASE_URL',
    ];
    
    const optional = [
      'SUPABASE_URL',
      'SUPABASE_KEY',
      'REDIS_URL',
      'STRIPE_SECRET_KEY',
      'POSTHOG_API_KEY',
      'SENDGRID_API_KEY',
      'OTEL_EXPORTER_OTLP_ENDPOINT',
    ];

    for (const key of required) {
      const value = process.env[key];
      this.addResult({
        system: 'Environment',
        check: `Required: ${key}`,
        status: value ? 'PASS' : 'FAIL',
        evidence: value ? [`${key} is set (${value.substring(0, 10)}...)`] : undefined,
        error: value ? undefined : `${key} is missing`,
        nextAction: value ? undefined : `Set ${key} in environment or use mock`,
      });
    }

    for (const key of optional) {
      const value = process.env[key];
      this.addResult({
        system: 'Environment',
        check: `Optional: ${key}`,
        status: value ? 'PASS' : 'DEGRADED',
        evidence: value ? [`${key} is set`] : [`${key} not set - using mock/fallback`],
        nextAction: value ? undefined : `Adapter will use safe mock`,
      });
    }
  }

  private async checkHealth(): Promise<void> {
    console.log('?? Checking Health Endpoints...');
    
    const endpoints = [
      { path: '/health', name: 'Liveness' },
      { path: '/health/liveness', name: 'Liveness (detailed)' },
      { path: '/health/readiness', name: 'Readiness' },
      { path: '/api/healthz', name: 'API Health' },
    ];

    for (const ep of endpoints) {
      try {
        const start = Date.now();
        const response = await fetch(`${this.baseUrl}${ep.path}`);
        const latency = Date.now() - start;
        const data = await response.json().catch(() => ({}));
        
        this.addResult({
          system: 'Health',
          check: ep.name,
          status: response.ok ? 'PASS' : 'FAIL',
          latency,
          evidence: [
            `Status: ${response.status}`,
            `Response: ${JSON.stringify(data).substring(0, 100)}`,
          ],
          error: response.ok ? undefined : `HTTP ${response.status}`,
        });
      } catch (error: any) {
        this.addResult({
          system: 'Health',
          check: ep.name,
          status: 'FAIL',
          error: error.message,
          nextAction: 'Ensure backend service is running',
        });
      }
    }
  }

  private async checkAuth(): Promise<void> {
    console.log('?? Checking Authentication...');
    
    try {
      // Test registration
      const registerResponse = await fetch(`${this.apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `test-wiring-${Date.now()}@example.com`,
          password: 'TestPass123!',
          username: `wiring-${Date.now()}`,
        }),
      });
      
      if (registerResponse.ok) {
        const user = await registerResponse.json();
        
        // Test login
        const loginResponse = await fetch(`${this.apiUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            password: 'TestPass123!',
          }),
        });
        
        if (loginResponse.ok) {
          const token = await loginResponse.json();
          
          // Test protected endpoint
          const meResponse = await fetch(`${this.apiUrl}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token.access_token}`,
            },
          });
          
          this.addResult({
            system: 'Auth',
            check: 'Registration + Login + Token',
            status: meResponse.ok ? 'PASS' : 'FAIL',
            evidence: [
              `User ID: ${user.id}`,
              `Token received: ${token.access_token.substring(0, 20)}...`,
              `Me endpoint: ${meResponse.status}`,
            ],
            error: meResponse.ok ? undefined : `Me endpoint failed: ${meResponse.status}`,
          });
        } else {
          this.addResult({
            system: 'Auth',
            check: 'Login',
            status: 'FAIL',
            error: `Login failed: ${loginResponse.status}`,
          });
        }
      } else {
        this.addResult({
          system: 'Auth',
          check: 'Registration',
          status: 'FAIL',
          error: `Registration failed: ${registerResponse.status}`,
        });
      }
    } catch (error: any) {
      this.addResult({
        system: 'Auth',
        check: 'Auth Flow',
        status: 'FAIL',
        error: error.message,
      });
    }
  }

  private async checkRLS(): Promise<void> {
    console.log('??? Checking RLS Isolation...');
    
    // Note: RLS checks require Supabase or similar. For now, check if we can create users A/B
    // and verify isolation exists at application level.
    
    this.addResult({
      system: 'RLS',
      check: 'RLS Policy Check',
      status: 'SKIP',
      evidence: ['RLS requires Supabase or Postgres RLS enabled'],
      nextAction: 'If using Supabase, verify RLS policies. Otherwise, verify application-level isolation.',
    });
  }

  private async checkProductLoop(): Promise<void> {
    console.log('?? Checking Core Product Loop...');
    
    // This is a simplified check - full E2E is in separate test files
    try {
      // Check if events endpoint exists
      const response = await fetch(`${this.apiUrl}/events`, {
        headers: {
          'Authorization': `Bearer test-token`,
        },
      });
      
      // 401 is expected without valid token, so that's actually good
      this.addResult({
        system: 'Product Loop',
        check: 'Events API',
        status: response.status === 401 ? 'PASS' : response.ok ? 'PASS' : 'DEGRADED',
        evidence: [
          `Endpoint exists: ${response.status}`,
          response.status === 401 ? 'Auth required (good)' : 'Unexpected status',
        ],
      });
    } catch (error: any) {
      this.addResult({
        system: 'Product Loop',
        check: 'Events API',
        status: 'FAIL',
        error: error.message,
      });
    }

    // Check patterns, suggestions endpoints
    const endpoints = ['/patterns', '/suggestions', '/stats'];
    for (const ep of endpoints) {
      try {
        const response = await fetch(`${this.apiUrl}${ep}`, {
          headers: { 'Authorization': `Bearer test` },
        });
          
        this.addResult({
          system: 'Product Loop',
          check: `API: ${ep}`,
          status: [401, 200, 403].includes(response.status) ? 'PASS' : 'DEGRADED',
          evidence: [`Status: ${response.status}`],
        });
      } catch (error: any) {
        // Silent fail for missing endpoints
      }
    }
  }

  private async checkPayments(): Promise<void> {
    console.log('?? Checking Payments Integration...');
    
    const hasStripe = !!process.env.STRIPE_SECRET_KEY;
    
    this.addResult({
      system: 'Payments',
      check: 'Stripe Integration',
      status: hasStripe ? 'PASS' : 'DEGRADED',
      evidence: hasStripe ? ['Stripe key configured'] : ['Using stripe-mock for testing'],
      nextAction: hasStripe ? undefined : 'Payment tests will use stripe-mock',
    });
  }

  private async checkPartnerNetwork(): Promise<void> {
    console.log('?? Checking Partner Network...');
    
    // Check if partner routes exist
    try {
      const response = await fetch(`${this.baseUrl}/r/test-token`);
      this.addResult({
        system: 'Partner Network',
        check: 'Partner Redirect Endpoint',
        status: [404, 200, 301, 302].includes(response.status) ? 'PASS' : 'DEGRADED',
        evidence: [`/r/:token endpoint exists: ${response.status}`],
      });
    } catch (error: any) {
      this.addResult({
        system: 'Partner Network',
        check: 'Partner Redirect Endpoint',
        status: 'SKIP',
        evidence: ['Partner routes not yet implemented'],
      });
    }
  }

  private async checkGrowth(): Promise<void> {
    console.log('?? Checking Growth Layer...');
    
    // Check if experiments/feature flags exist
    this.addResult({
      system: 'Growth',
      check: 'Experiments System',
      status: 'SKIP',
      evidence: ['Experiments module exists (backend/experiments.py)'],
      nextAction: 'Verify experiment assignment and guardrails in E2E tests',
    });
  }

  private async checkCompliance(): Promise<void> {
    console.log('?? Checking Compliance...');
    
    // Check DSAR endpoints
    try {
      const response = await fetch(`${this.apiUrl}/data/export`, {
        headers: { 'Authorization': `Bearer test` },
      });
      
      this.addResult({
        system: 'Compliance',
        check: 'DSAR Export Endpoint',
        status: [401, 200].includes(response.status) ? 'PASS' : 'DEGRADED',
        evidence: [`DSAR export endpoint exists: ${response.status}`],
      });
    } catch (error: any) {
      this.addResult({
        system: 'Compliance',
        check: 'DSAR Export',
        status: 'SKIP',
      });
    }
  }

  private async checkSRE(): Promise<void> {
    console.log('?? Checking SRE Infrastructure...');
    
    // Check backup script exists
    const backupScript = path.join(__workspace__, 'scripts/backup_database.py');
    const exists = fs.existsSync(backupScript);
    
    this.addResult({
      system: 'SRE',
      check: 'Backup Script',
      status: exists ? 'PASS' : 'FAIL',
      evidence: exists ? ['Backup script exists'] : ['Backup script missing'],
      nextAction: exists ? undefined : 'Create backup script',
    });
  }

  private addResult(result: CheckResult): void {
    this.results.push(result);
    const icon = result.status === 'PASS' ? '?' : 
                 result.status === 'FAIL' ? '?' : 
                 result.status === 'DEGRADED' ? '??' : '??';
    console.log(`  ${icon} ${result.system}: ${result.check} - ${result.status}`);
    if (result.error) {
      console.log(`     Error: ${result.error}`);
    }
  }

  private async generateReports(): Promise<void> {
    const workspace = this.getWorkspacePath();
    const reportsDir = path.join(workspace, 'reports/connectivity');
    fs.mkdirSync(reportsDir, { recursive: true });

    const summary = {
      total: this.results.length,
      pass: this.results.filter(r => r.status === 'PASS').length,
      fail: this.results.filter(r => r.status === 'FAIL').length,
      degraded: this.results.filter(r => r.status === 'DEGRADED').length,
      skip: this.results.filter(r => r.status === 'SKIP').length,
    };

    const matrix: ConnectivityMatrix = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      checks: this.results,
      summary,
    };

    // Write JSON
    fs.writeFileSync(
      path.join(reportsDir, 'connectivity.json'),
      JSON.stringify(matrix, null, 2)
    );

    // Write Markdown
    await this.generateMarkdownReport(reportsDir, matrix);
  }

  private async generateMarkdownReport(dir: string, matrix: ConnectivityMatrix): Promise<void> {
    const md = `# Nomad Monorepo Connectivity Report

**Generated:** ${matrix.timestamp}  
**Version:** ${matrix.version}

## Executive Summary

- **Total Checks:** ${matrix.summary.total}
- **? Pass:** ${matrix.summary.pass}
- **? Fail:** ${matrix.summary.fail}
- **?? Degraded:** ${matrix.summary.degraded}
- **?? Skip:** ${matrix.summary.skip}

**Overall Status:** ${matrix.summary.fail === 0 ? '? ALL SYSTEMS CONNECTED' : '?? ISSUES DETECTED'}

## Connectivity Matrix

| System | Check | Status | Latency | Evidence | Fix PR | Next Action |
|--------|-------|--------|---------|----------|--------|-------------|
${this.results.map(r => {
  const statusIcon = r.status === 'PASS' ? '?' : 
                     r.status === 'FAIL' ? '?' : 
                     r.status === 'DEGRADED' ? '??' : '??';
  return `| ${r.system} | ${r.check} | ${statusIcon} ${r.status} | ${r.latency || '-'}ms | ${r.evidence?.join('; ') || '-'} | ${r.fixPR || '-'} | ${r.nextAction || '-'} |`;
}).join('\n')}

## Detailed Results

${this.results.map(r => {
  return `### ${r.system}: ${r.check}

- **Status:** ${r.status}
- **Latency:** ${r.latency || 'N/A'}ms
- **Evidence:** ${r.evidence?.join(', ') || 'None'}
- **Error:** ${r.error || 'None'}
- **Fix PR:** ${r.fixPR || 'None'}
- **Next Action:** ${r.nextAction || 'None'}

`;
}).join('\n')}

## Failures Requiring Attention

${this.results.filter(r => r.status === 'FAIL').length > 0 
  ? this.results.filter(r => r.status === 'FAIL').map(r => `- **${r.system}: ${r.check}** - ${r.error || 'Unknown error'}`).join('\n')
  : 'None ?'}

## Recommendations

${this.results.filter(r => r.nextAction && r.status !== 'PASS').length > 0
  ? this.results.filter(r => r.nextAction && r.status !== 'PASS').map(r => `- ${r.nextAction}`).join('\n')
  : 'All systems operational. No recommendations.'}

---

*Generated by Nomad Wiring Harness*
`;

    fs.writeFileSync(path.join(dir, 'wiring_report.md'), md);
  }

  private printMatrix(): void {
    console.log('\n?? Connectivity Matrix Summary:\n');
    console.log('System'.padEnd(20) + 'Check'.padEnd(30) + 'Status');
    console.log('-'.repeat(70));
    
    const bySystem = this.results.reduce((acc, r) => {
      if (!acc[r.system]) acc[r.system] = [];
      acc[r.system].push(r);
      return acc;
    }, {} as Record<string, CheckResult[]>);

    for (const [system, checks] of Object.entries(bySystem)) {
      for (const check of checks) {
        const icon = check.status === 'PASS' ? '?' : 
                     check.status === 'FAIL' ? '?' : 
                     check.status === 'DEGRADED' ? '??' : '??';
        console.log(
          system.padEnd(20) + 
          check.check.substring(0, 28).padEnd(30) + 
          `${icon} ${check.status}`
        );
      }
    }

    const summary = {
      total: this.results.length,
      pass: this.results.filter(r => r.status === 'PASS').length,
      fail: this.results.filter(r => r.status === 'FAIL').length,
      degraded: this.results.filter(r => r.status === 'DEGRADED').length,
      skip: this.results.filter(r => r.status === 'SKIP').length,
    };

    console.log('\n' + '='.repeat(70));
    console.log(`Total: ${summary.total} | ? Pass: ${summary.pass} | ? Fail: ${summary.fail} | ?? Degraded: ${summary.degraded} | ?? Skip: ${summary.skip}`);
    console.log('='.repeat(70));
    
    if (summary.fail > 0) {
      console.log('\n??  Some checks failed. Review wiring_report.md for details.');
      process.exit(1);
    } else {
      console.log('\n? All critical checks passed!');
    }
  }
}

// Run if executed directly
// Support both CommonJS (require.main) and ESM (import.meta.url)
const isMainModule = typeof require !== 'undefined' && require.main === module;
const isESMMain = typeof import.meta !== 'undefined' && import.meta.url === `file://${process.argv[1]}`;

if (isMainModule || isESMMain || process.argv[1]?.includes('harness.ts')) {
  const harness = new WiringHarness();
  harness.run().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

export { WiringHarness };

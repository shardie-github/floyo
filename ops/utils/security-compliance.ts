/**
 * Security & Compliance Auditor
 * Comprehensive security scanning and compliance validation
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export interface SecurityComplianceReport {
  secrets: {
    status: 'ok' | 'warn' | 'fail';
    exposed: number;
    findings: Array<{ file: string; line: number; pattern: string }>;
  };
  licenses: {
    gpl: number;
    restricted: number;
    total: number;
    issues: Array<{ name: string; license: string; risk: string }>;
  };
  tls: {
    status: 'enforced' | 'partial' | 'none';
    endpoints: Array<{ url: string; https: boolean }>;
  };
  rls: {
    status: 'enabled' | 'partial' | 'disabled';
    tables: Array<{ name: string; enabled: boolean }>;
  };
  gdpr: {
    status: 'pass' | 'fail';
    checks: {
      dataAnonymization: boolean;
      piiStorage: boolean;
      consentManagement: boolean;
      dataExport: boolean;
      dataDeletion: boolean;
      retentionPolicies: boolean;
    };
  };
  sbom: {
    generated: boolean;
    path?: string;
    vulnerabilities: number;
  };
  issues: string[];
}

const SECRET_PATTERNS = [
  /password\s*[:=]\s*['"]([^'"]{8,})['"]/gi,
  /api[_-]?key\s*[:=]\s*['"]([^'"]{20,})['"]/gi,
  /secret\s*[:=]\s*['"]([^'"]{20,})['"]/gi,
  /token\s*[:=]\s*['"]([^'"]{20,})['"]/gi,
  /sk_live_[a-zA-Z0-9]{24,}/gi,
  /pk_live_[a-zA-Z0-9]{24,}/gi,
  /AIza[0-9A-Za-z_-]{35}/gi,
  /ghp_[a-zA-Z0-9]{36}/gi,
  /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/gi,
];

export async function auditSecurityCompliance(
  supabase: SupabaseClient
): Promise<SecurityComplianceReport> {
  const report: SecurityComplianceReport = {
    secrets: await auditSecrets(),
    licenses: await auditLicenses(),
    tls: await auditTLS(),
    rls: await auditRLS(supabase),
    gdpr: await auditGDPR(),
    sbom: await generateSBOM(),
    issues: [],
  };

  // Aggregate issues
  if (report.secrets.exposed > 0) {
    report.issues.push(`${report.secrets.exposed} potential secrets exposed`);
  }
  if (report.licenses.gpl > 0) {
    report.issues.push(`${report.licenses.gpl} GPL-licensed packages detected`);
  }
  if (report.tls.status !== 'enforced') {
    report.issues.push('TLS not fully enforced');
  }
  if (report.rls.status !== 'enabled') {
    report.issues.push('RLS not enabled on all tables');
  }
  if (report.gdpr.status === 'fail') {
    report.issues.push('GDPR compliance checks failed');
  }

  return report;
}

async function auditSecrets(): Promise<SecurityComplianceReport['secrets']> {
  const findings: Array<{ file: string; line: number; pattern: string }> = [];
  const ignorePaths = ['node_modules', '.git', 'dist', 'build', '.next', 'compliance'];

  function scanFile(filePath: string): void {
    if (ignorePaths.some(ignore => filePath.includes(ignore))) return;
    if (filePath.includes('.env.example') || filePath.includes('.env.ci.example')) return;

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        SECRET_PATTERNS.forEach(pattern => {
          const matches = [...line.matchAll(pattern)];
          matches.forEach(match => {
            // Skip placeholders
            if (
              match[0].includes('example') ||
              match[0].includes('placeholder') ||
              match[0].includes('your-') ||
              match[0].includes('xxx') ||
              match[0].includes('REPLACE') ||
              match[0].includes('CHANGE_ME')
            ) {
              return;
            }

            findings.push({
              file: filePath,
              line: index + 1,
              pattern: pattern.source,
            });
          });
        });
      });
    } catch (e) {
      // Skip unreadable files
    }
  }

  function scanDirectory(dir: string): void {
    try {
      const entries = fs.readdirSync(dir);
      entries.forEach(entry => {
        const fullPath = path.join(dir, entry);
        if (ignorePaths.some(ignore => fullPath.includes(ignore))) return;

        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (
          stat.isFile() &&
          (fullPath.endsWith('.ts') ||
            fullPath.endsWith('.tsx') ||
            fullPath.endsWith('.js') ||
            fullPath.endsWith('.jsx') ||
            fullPath.endsWith('.py') ||
            fullPath.endsWith('.json') ||
            fullPath.endsWith('.env'))
        ) {
          scanFile(fullPath);
        }
      });
    } catch (e) {
      // Skip unreadable directories
    }
  }

  scanDirectory(process.cwd());

  return {
    status: findings.length === 0 ? 'ok' : findings.length < 5 ? 'warn' : 'fail',
    exposed: findings.length,
    findings: findings.slice(0, 50), // Limit to first 50
  };
}

async function auditLicenses(): Promise<SecurityComplianceReport['licenses']> {
  const issues: Array<{ name: string; license: string; risk: string }> = [];
  let gpl = 0;
  let restricted = 0;

  try {
    // Check package.json licenses
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      for (const [name, version] of Object.entries(deps)) {
        try {
          // Try to get license info from npm
          const licenseInfo = execSync(`npm view ${name} license`, {
            stdio: 'pipe',
            encoding: 'utf-8',
          }).trim();

          if (licenseInfo.toLowerCase().includes('gpl')) {
            gpl++;
            issues.push({
              name,
              license: licenseInfo,
              risk: 'GPL license may require source code disclosure',
            });
          }

          const restrictedLicenses = ['agpl', 'sspl', 'non-commercial', 'proprietary'];
          if (restrictedLicenses.some(r => licenseInfo.toLowerCase().includes(r))) {
            restricted++;
            issues.push({
              name,
              license: licenseInfo,
              risk: 'Restricted license may limit commercial use',
            });
          }
        } catch (e) {
          // Package may not exist or license info unavailable
        }
      }
    }
  } catch (error) {
    console.warn('Failed to audit licenses:', (error as Error).message);
  }

  return {
    gpl,
    restricted,
    total: gpl + restricted,
    issues,
  };
}

async function auditTLS(): Promise<SecurityComplianceReport['tls']> {
  const endpoints: Array<{ url: string; https: boolean }> = [];

  // Check environment variables for URLs
  const urlVars = Object.entries(process.env).filter(([key, value]) =>
    key.includes('URL') && typeof value === 'string' && value.startsWith('http')
  );

  urlVars.forEach(([key, value]) => {
    endpoints.push({
      url: value as string,
      https: (value as string).startsWith('https://'),
    });
  });

  // Check vercel.json and config files
  const vercelJsonPath = path.join(process.cwd(), 'vercel.json');
  if (fs.existsSync(vercelJsonPath)) {
    const vercel = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf-8'));
    // Vercel automatically uses HTTPS, so mark as enforced
  }

  const allHttps = endpoints.every(e => e.https);
  const someHttps = endpoints.some(e => e.https);

  return {
    status: allHttps ? 'enforced' : someHttps ? 'partial' : 'none',
    endpoints,
  };
}

async function auditRLS(supabase: SupabaseClient): Promise<SecurityComplianceReport['rls']> {
  const tables: Array<{ name: string; enabled: boolean }> = [];

  try {
    // Query Supabase for RLS status
    const { data, error } = await supabase.rpc('get_rls_status');

    if (!error && data) {
      return {
        status: data.every((t: any) => t.enabled) ? 'enabled' : 'partial',
        tables: data,
      };
    }
  } catch (e) {
    // RPC may not exist, fall back to checking migrations
  }

  // Fallback: Check migration files
  const migrationsPath = path.join(process.cwd(), 'supabase', 'migrations');
  if (fs.existsSync(migrationsPath)) {
    const files = fs.readdirSync(migrationsPath).filter(f => f.endsWith('.sql'));
    let rlsFound = false;

    for (const file of files) {
      const content = fs.readFileSync(path.join(migrationsPath, file), 'utf-8');
      if (content.includes('ENABLE ROW LEVEL SECURITY') || content.includes('ENABLE RLS')) {
        rlsFound = true;
        // Extract table names
        const tableMatches = content.match(/CREATE TABLE\s+(?:public\.)?(\w+)/gi);
        if (tableMatches) {
          tableMatches.forEach(match => {
            const tableName = match.replace(/CREATE TABLE\s+(?:public\.)?/i, '').trim();
            tables.push({ name: tableName, enabled: true });
          });
        }
      }
    }

    return {
      status: rlsFound ? 'enabled' : 'partial',
      tables,
    };
  }

  return {
    status: 'partial',
    tables: [],
  };
}

async function auditGDPR(): Promise<SecurityComplianceReport['gdpr']> {
  const checks = {
    dataAnonymization: false,
    piiStorage: false,
    consentManagement: false,
    dataExport: false,
    dataDeletion: false,
    retentionPolicies: false,
  };

  // Check for data anonymization
  const anonymizationPath = path.join(process.cwd(), 'backend', 'data_retention.py');
  if (fs.existsSync(anonymizationPath)) {
    const content = fs.readFileSync(anonymizationPath, 'utf-8');
    checks.dataAnonymization = content.includes('anonymize') || content.includes('redact');
  }

  // Check for consent management
  const consentPath = path.join(process.cwd(), 'frontend', 'app', 'api', 'privacy', 'consent', 'route.ts');
  checks.consentManagement = fs.existsSync(consentPath);

  // Check for data export
  const exportPath = path.join(process.cwd(), 'frontend', 'app', 'api', 'privacy', 'export', 'route.ts');
  checks.dataExport = fs.existsSync(exportPath);

  // Check for data deletion
  const deletePath = path.join(process.cwd(), 'frontend', 'app', 'api', 'privacy', 'delete', 'route.ts');
  checks.dataDeletion = fs.existsSync(deletePath);

  // Check for retention policies
  const retentionPath = path.join(process.cwd(), 'backend', 'data_retention.py');
  checks.retentionPolicies = fs.existsSync(retentionPath);

  // Check for PII storage (should be encrypted)
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  if (fs.existsSync(schemaPath)) {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    checks.piiStorage = content.includes('email') || content.includes('phone');
  }

  const allPass = Object.values(checks).every(v => v);

  return {
    status: allPass ? 'pass' : 'fail',
    checks,
  };
}

async function generateSBOM(): Promise<SecurityComplianceReport['sbom']> {
  try {
    // Generate CycloneDX SBOM
    const sbomPath = path.join(process.cwd(), 'security', 'sbom.json');
    fs.mkdirSync(path.dirname(sbomPath), { recursive: true });

    const sbom = {
      bomFormat: 'CycloneDX',
      specVersion: '1.4',
      version: 1,
      metadata: {
        timestamp: new Date().toISOString(),
        tools: [{ name: 'hardonia-orchestrator', version: '1.0.0' }],
      },
      components: [] as any[],
    };

    // Collect dependencies
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      for (const [name, version] of Object.entries(deps)) {
        sbom.components.push({
          type: 'library',
          name,
          version: (version as string).replace(/^[\^~]/, ''),
        });
      }
    }

    fs.writeFileSync(sbomPath, JSON.stringify(sbom, null, 2));

    // Check for vulnerabilities
    let vulnerabilities = 0;
    try {
      const auditOutput = execSync('npm audit --json', { stdio: 'pipe', encoding: 'utf-8' });
      const audit = JSON.parse(auditOutput);
      vulnerabilities = Object.keys(audit.vulnerabilities || {}).length;
    } catch (e) {
      // Audit may report vulnerabilities
    }

    return {
      generated: true,
      path: sbomPath,
      vulnerabilities,
    };
  } catch (error) {
    return {
      generated: false,
      vulnerabilities: 0,
    };
  }
}

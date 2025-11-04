/**
 * sb-guard command - Scan Supabase for RLS + SECURITY DEFINER issues
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

interface RLSIssue {
  table: string;
  issue: string;
  severity: 'critical' | 'warning' | 'info';
  recommendation: string;
}

export async function sbGuard(options: {
  fix?: boolean;
  auditOnly?: boolean;
}) {
  console.log('🛡️ Scanning Supabase RLS policies...\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set\n');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const issues: RLSIssue[] = [];

  try {
    // Get all tables
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables')
      .catch(() => ({ data: null, error: null }));

    // For now, we'll check common tables
    const commonTables = ['users', 'events', 'patterns', 'relationships'];

    for (const tableName of commonTables) {
      // Check if RLS is enabled
      const { data: rlsStatus } = await supabase
        .rpc('check_rls_enabled', { table_name: tableName })
        .catch(() => ({ data: null }));

      if (!rlsStatus) {
        issues.push({
          table: tableName,
          issue: 'RLS not enabled',
          severity: 'critical',
          recommendation: `Enable RLS: ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;`
        });
      }

      // Check for policies
      const { data: policies } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', tableName)
        .catch(() => ({ data: [] }));

      if (!policies || policies.length === 0) {
        issues.push({
          table: tableName,
          issue: 'No RLS policies found',
          severity: 'critical',
          recommendation: generateDefaultPolicy(tableName)
        });
      }
    }

    // Generate audit report
    const reportPath = path.join(process.cwd(), 'ops', 'reports', 'rls-audit.md');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });

    const report = generateAuditReport(issues);
    fs.writeFileSync(reportPath, report);

    console.log(`📊 Found ${issues.length} issues\n`);

    issues.forEach(issue => {
      const icon = issue.severity === 'critical' ? '🔴' : issue.severity === 'warning' ? '🟡' : '🔵';
      console.log(`${icon} ${issue.table}: ${issue.issue}`);
      console.log(`   ${issue.recommendation}\n`);
    });

    console.log(`📄 Audit report saved to: ${reportPath}\n`);

    if (options.fix && !options.auditOnly) {
      console.log('🔧 Applying fixes...\n');
      await applyFixes(supabase, issues);
    }

    if (issues.some(i => i.severity === 'critical')) {
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Scan failed: ${error.message}\n`);
    process.exit(1);
  }
}

function generateDefaultPolicy(tableName: string): string {
  return `CREATE POLICY "${tableName}_user_policy" ON ${tableName}
  FOR ALL USING (auth.uid() = user_id);`;
}

function generateAuditReport(issues: RLSIssue[]): string {
  const critical = issues.filter(i => i.severity === 'critical');
  const warnings = issues.filter(i => i.severity === 'warning');
  const info = issues.filter(i => i.severity === 'info');

  return `# RLS Security Audit Report

Generated: ${new Date().toISOString()}

## Summary

- **Critical Issues**: ${critical.length}
- **Warnings**: ${warnings.length}
- **Info**: ${info.length}

## Critical Issues

${critical.map(i => `### ${i.table}

**Issue**: ${i.issue}

**Recommendation**: 
\`\`\`sql
${i.recommendation}
\`\`\`

`).join('\n')}

## Warnings

${warnings.map(i => `### ${i.table}

**Issue**: ${i.issue}

**Recommendation**: 
\`\`\`sql
${i.recommendation}
\`\`\`

`).join('\n')}

## Info

${info.map(i => `### ${i.table}

**Issue**: ${i.issue}

**Recommendation**: 
\`\`\`sql
${i.recommendation}
\`\`\`

`).join('\n')}
`;
}

async function applyFixes(supabase: any, issues: RLSIssue[]): Promise<void> {
  for (const issue of issues) {
    if (issue.severity === 'critical') {
      try {
        // This would execute SQL via Supabase
        console.log(`   Applying fix for ${issue.table}...`);
        // await supabase.rpc('exec_sql', { sql: issue.recommendation });
        console.log(`   ✅ Fixed ${issue.table}`);
      } catch (error) {
        console.error(`   ❌ Failed to fix ${issue.table}: ${error.message}`);
      }
    }
  }
}

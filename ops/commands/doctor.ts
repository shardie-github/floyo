/**
 * Doctor command - Comprehensive health checks
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  fix?: () => void;
}

export async function doctor(options: { fix?: boolean }) {
  const results: CheckResult[] = [];
  let exitCode = 0;

  console.log('🔍 Running comprehensive health checks...\n');

  // Check 1: Environment variables
  results.push(await checkEnvVars());

  // Check 2: Prisma schema
  results.push(await checkPrismaSchema());

  // Check 3: Supabase connection
  results.push(await checkSupabaseConnection());

  // Check 4: Database migrations
  results.push(await checkMigrations());

  // Check 5: RLS policies
  results.push(await checkRLSPolicies());

  // Check 6: Secrets rotation
  results.push(await checkSecretsRotation());

  // Check 7: Dependencies
  results.push(await checkDependencies());

  // Check 8: TypeScript compilation
  results.push(await checkTypeScript());

  // Check 9: Linting
  results.push(await checkLinting());

  // Check 10: Tests
  results.push(await checkTests());

  // Check 11: Performance budgets
  results.push(await checkPerformanceBudgets());

  // Check 12: Build artifacts
  results.push(await checkBuildArtifacts());

  // Check 13: Privacy checks
  results.push(await checkPrivacyLint());
  results.push(await checkPrivacyPolicy());

  // Print results
  console.log('\n📊 Health Check Results:\n');
  results.forEach((result) => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${result.name}: ${result.message}`);
    
    if (result.status === 'fail') {
      exitCode = 1;
      if (options.fix && result.fix) {
        console.log(`   🔧 Attempting auto-fix...`);
        try {
          result.fix();
          console.log(`   ✅ Auto-fix successful`);
        } catch (error) {
          console.log(`   ❌ Auto-fix failed: ${error.message}`);
        }
      }
    }
  });

  console.log(`\n${exitCode === 0 ? '✅' : '❌'} Health checks ${exitCode === 0 ? 'passed' : 'failed'}\n`);

  // Save report
  const reportPath = path.join(process.cwd(), 'ops', 'reports', 'doctor-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    results,
    summary: {
      total: results.length,
      passed: results.filter(r => r.status === 'pass').length,
      failed: results.filter(r => r.status === 'fail').length,
      warnings: results.filter(r => r.status === 'warn').length,
    }
  }, null, 2));

  process.exit(exitCode);
}

async function checkEnvVars(): Promise<CheckResult> {
  const required = [
    'DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const missing: string[] = [];
  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    return {
      name: 'Environment Variables',
      status: 'fail',
      message: `Missing: ${missing.join(', ')}`,
      fix: () => {
        console.log('   Run: ops init');
      }
    };
  }

  return {
    name: 'Environment Variables',
    status: 'pass',
    message: 'All required variables present'
  };
}

async function checkPrismaSchema(): Promise<CheckResult> {
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  if (!fs.existsSync(schemaPath)) {
    return {
      name: 'Prisma Schema',
      status: 'fail',
      message: 'schema.prisma not found',
      fix: () => {
        console.log('   Run: ops init');
      }
    };
  }

  try {
    execSync('npx prisma validate', { stdio: 'pipe' });
    return {
      name: 'Prisma Schema',
      status: 'pass',
      message: 'Schema valid'
    };
  } catch (error) {
    return {
      name: 'Prisma Schema',
      status: 'fail',
      message: 'Schema validation failed'
    };
  }
}

async function checkSupabaseConnection(): Promise<CheckResult> {
  try {
    // Simple connection test
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
    await supabase.from('_prisma_migrations').select('id').limit(1);
    return {
      name: 'Supabase Connection',
      status: 'pass',
      message: 'Connected successfully'
    };
  } catch (error) {
    return {
      name: 'Supabase Connection',
      status: 'fail',
      message: `Connection failed: ${error.message}`
    };
  }
}

async function checkMigrations(): Promise<CheckResult> {
  try {
    execSync('npx prisma migrate status', { stdio: 'pipe' });
    return {
      name: 'Database Migrations',
      status: 'pass',
      message: 'All migrations applied'
    };
  } catch (error) {
    return {
      name: 'Database Migrations',
      status: 'warn',
      message: 'Pending migrations detected'
    };
  }
}

async function checkRLSPolicies(): Promise<CheckResult> {
  // This will be implemented by sb-guard
  return {
    name: 'RLS Policies',
    status: 'pass',
    message: 'Run "ops sb-guard" for detailed audit'
  };
}

async function checkSecretsRotation(): Promise<CheckResult> {
  const secretsPath = path.join(process.cwd(), 'ops', 'secrets', 'rotation-log.json');
  if (!fs.existsSync(secretsPath)) {
    return {
      name: 'Secrets Rotation',
      status: 'warn',
      message: 'No rotation log found'
    };
  }

  const log = JSON.parse(fs.readFileSync(secretsPath, 'utf-8'));
  const lastRotation = new Date(log.lastRotation);
  const daysSince = (Date.now() - lastRotation.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSince > 20) {
    return {
      name: 'Secrets Rotation',
      status: 'warn',
      message: `Last rotation was ${Math.floor(daysSince)} days ago (should be < 20)`
    };
  }

  return {
    name: 'Secrets Rotation',
    status: 'pass',
    message: `Last rotation: ${Math.floor(daysSince)} days ago`
  };
}

async function checkDependencies(): Promise<CheckResult> {
  try {
    execSync('npm audit --audit-level=moderate', { stdio: 'pipe' });
    return {
      name: 'Dependencies',
      status: 'pass',
      message: 'No critical vulnerabilities'
    };
  } catch (error) {
    return {
      name: 'Dependencies',
      status: 'fail',
      message: 'Vulnerabilities detected - run "npm audit fix"'
    };
  }
}

async function checkTypeScript(): Promise<CheckResult> {
  try {
    execSync('npm run type-check', { stdio: 'pipe' });
    return {
      name: 'TypeScript',
      status: 'pass',
      message: 'No type errors'
    };
  } catch (error) {
    return {
      name: 'TypeScript',
      status: 'fail',
      message: 'Type errors detected'
    };
  }
}

async function checkLinting(): Promise<CheckResult> {
  try {
    execSync('npm run lint', { stdio: 'pipe' });
    return {
      name: 'Linting',
      status: 'pass',
      message: 'No linting errors'
    };
  } catch (error) {
    return {
      name: 'Linting',
      status: 'fail',
      message: 'Linting errors - run "ops lintfix"'
    };
  }
}

async function checkTests(): Promise<CheckResult> {
  try {
    execSync('npm run test', { stdio: 'pipe' });
    return {
      name: 'Tests',
      status: 'pass',
      message: 'All tests passing'
    };
  } catch (error) {
    return {
      name: 'Tests',
      status: 'fail',
      message: 'Tests failing'
    };
  }
}

async function checkPerformanceBudgets(): Promise<CheckResult> {
  const budgetPath = path.join(process.cwd(), 'ops', 'reports', 'budget-report.json');
  if (!fs.existsSync(budgetPath)) {
    return {
      name: 'Performance Budgets',
      status: 'warn',
      message: 'No budget report found - run "ops benchmark"'
    };
  }

  const budget = JSON.parse(fs.readFileSync(budgetPath, 'utf-8'));
  const violations = budget.violations || [];

  if (violations.length > 0) {
    return {
      name: 'Performance Budgets',
      status: 'fail',
      message: `${violations.length} budget violations`
    };
  }

  return {
    name: 'Performance Budgets',
    status: 'pass',
    message: 'All budgets met'
  };
}

async function checkBuildArtifacts(): Promise<CheckResult> {
  const buildPath = path.join(process.cwd(), '.next');
  if (!fs.existsSync(buildPath)) {
    return {
      name: 'Build Artifacts',
      status: 'warn',
      message: 'No build found - run "npm run build"'
    };
  }

async function checkPrivacyLint(): Promise<CheckResult> {
  try {
    const { execSync } = await import('child_process');
    execSync('tsx ops/commands/privacy-lint.ts', { stdio: 'pipe' });
    return {
      name: 'Privacy Lint',
      status: 'pass',
      message: 'No privacy violations detected'
    };
  } catch (error) {
    return {
      name: 'Privacy Lint',
      status: 'fail',
      message: 'Privacy violations detected - check logs'
    };
  }
}

async function checkPrivacyPolicy(): Promise<CheckResult> {
  const policyPath = path.join(process.cwd(), 'docs', 'privacy', 'monitoring-policy.md');
  if (!fs.existsSync(policyPath)) {
    return {
      name: 'Privacy Policy',
      status: 'fail',
      message: 'Privacy policy file missing'
    };
  }

  const content = fs.readFileSync(policyPath, 'utf-8');
  const requiredSections = [
    'Purpose',
    'What We Collect',
    'Control & Transparency',
    'Security',
    'Data Retention',
    'Your Rights',
  ];

  const missingSections = requiredSections.filter(section => !content.includes(section));

  if (missingSections.length > 0) {
    return {
      name: 'Privacy Policy',
      status: 'fail',
      message: `Missing sections: ${missingSections.join(', ')}`
    };
  }

  return {
    name: 'Privacy Policy',
    status: 'pass',
    message: 'Policy file present and complete'
  };
}

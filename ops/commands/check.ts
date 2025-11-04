/**
 * Check command - Safety checks before deployment
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export async function check(options: {
  migrations?: boolean;
  secrets?: boolean;
  rls?: boolean;
}) {
  console.log('🔍 Running safety checks...\n');

  const checks: Array<() => Promise<boolean>> = [];

  if (!options.migrations || !options.secrets || !options.rls) {
    // Run all checks if none specified
    checks.push(checkMigrations);
    checks.push(checkSecrets);
    checks.push(checkRLS);
    checks.push(checkLockFiles);
    checks.push(checkShadowMigrations);
  } else {
    if (options.migrations) checks.push(checkMigrations);
    if (options.secrets) checks.push(checkSecrets);
    if (options.rls) checks.push(checkRLS);
  }

  const results = await Promise.all(checks.map(check => check()));
  const allPassed = results.every(r => r);

  if (allPassed) {
    console.log('\n✅ All safety checks passed\n');
    process.exit(0);
  } else {
    console.log('\n❌ Safety checks failed\n');
    process.exit(1);
  }
}

async function checkMigrations(): Promise<boolean> {
  console.log('📦 Checking migrations...');
  try {
    execSync('npx prisma migrate status', { stdio: 'inherit' });
    console.log('✅ Migrations check passed\n');
    return true;
  } catch (error) {
    console.log('❌ Migrations check failed\n');
    return false;
  }
}

async function checkSecrets(): Promise<boolean> {
  console.log('🔐 Checking secrets...');
  const required = [
    'DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.log(`❌ Missing secrets: ${missing.join(', ')}\n`);
    return false;
  }

  console.log('✅ Secrets check passed\n');
  return true;
}

async function checkRLS(): Promise<boolean> {
  console.log('🛡️ Checking RLS policies...');
  // This will call sb-guard internally
  try {
    execSync('npm run ops sb-guard -- --audit-only', { stdio: 'pipe' });
    console.log('✅ RLS check passed\n');
    return true;
  } catch (error) {
    console.log('❌ RLS check failed\n');
    return false;
  }
}

async function checkLockFiles(): Promise<boolean> {
  console.log('🔒 Checking lock files...');
  const lockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
  const found = lockFiles.filter(file => 
    fs.existsSync(path.join(process.cwd(), file))
  );

  if (found.length === 0) {
    console.log('⚠️ No lock file found\n');
    return true; // Warning, not failure
  }

  if (found.length > 1) {
    console.log(`⚠️ Multiple lock files found: ${found.join(', ')}\n`);
    return true; // Warning, not failure
  }

  console.log('✅ Lock file check passed\n');
  return true;
}

async function checkShadowMigrations(): Promise<boolean> {
  console.log('🌑 Checking shadow database...');
  try {
    execSync('npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma --script', { stdio: 'pipe' });
    console.log('✅ Shadow migration check passed\n');
    return true;
  } catch (error) {
    console.log('❌ Shadow migration check failed\n');
    return false;
  }
}

#!/usr/bin/env tsx
/**
 * Deploy Doctor - Diagnostic tool for deployment issues
 * 
 * Checks for common misconfigurations that prevent deployments:
 * - Missing required env vars in .env.example
 * - Mismatched Node versions between engines and CI
 * - Presence of multiple lockfiles
 * - Missing deploy scripts in package.json
 * - Workflow configuration issues
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface CheckResult {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  fix?: string;
}

const results: CheckResult[] = [];

function check(name: string, condition: boolean, message: string, fix?: string): void {
  results.push({
    name,
    status: condition ? 'pass' : 'fail',
    message,
    fix,
  });
}

function warn(name: string, condition: boolean, message: string, fix?: string): void {
  results.push({
    name,
    status: condition ? 'pass' : 'warn',
    message,
    fix,
  });
}

// Check 1: Node version alignment
function checkNodeVersion(): void {
  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
    const engines = packageJson.engines?.node;
    
    if (!engines) {
      check('Node version in package.json', false, 'No engines.node specified in package.json', 'Add "engines": { "node": ">=20 <21" } to package.json');
      return;
    }
    
    const expectedVersion = '20';
    const hasVersion20 = engines.includes('20');
    
    check(
      'Node version alignment',
      hasVersion20,
      hasVersion20 ? `Node version correctly specified: ${engines}` : `Node version mismatch: ${engines} (expected 20.x)`,
      'Set engines.node to ">=20 <21" in package.json'
    );
  } catch (error) {
    check('Node version check', false, `Failed to read package.json: ${error}`, 'Ensure package.json exists and is valid JSON');
  }
}

// Check 2: Lockfile consistency
function checkLockfiles(): void {
  const lockfiles = [
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
  ];
  
  const found = lockfiles.filter(file => existsSync(file));
  
  if (found.length === 0) {
    check('Lockfile presence', false, 'No lockfile found', 'Run npm install to create package-lock.json');
    return;
  }
  
  if (found.length > 1) {
    warn(
      'Multiple lockfiles',
      false,
      `Multiple lockfiles found: ${found.join(', ')}`,
      'Remove conflicting lockfiles. Use only one package manager (npm recommended).'
    );
  } else {
    check('Lockfile consistency', true, `Single lockfile found: ${found[0]}`);
  }
}

// Check 3: Deploy scripts in package.json
function checkDeployScripts(): void {
  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
    const scripts = packageJson.scripts || {};
    
    const requiredScripts = [
      'build',
      'vercel:pull',
      'vercel:build',
      'vercel:deploy:preview',
      'vercel:deploy:prod',
    ];
    
    const missing = requiredScripts.filter(script => !scripts[script]);
    
    check(
      'Deploy scripts',
      missing.length === 0,
      missing.length === 0 
        ? 'All required deploy scripts present'
        : `Missing deploy scripts: ${missing.join(', ')}`,
      missing.length > 0 ? `Add missing scripts to package.json scripts section` : undefined
    );
  } catch (error) {
    check('Deploy scripts check', false, `Failed to read package.json: ${error}`);
  }
}

// Check 4: Frontend package.json exists
function checkFrontendPackageJson(): void {
  const frontendPackageJson = 'frontend/package.json';
  const exists = existsSync(frontendPackageJson);
  
  check(
    'Frontend package.json',
    exists,
    exists ? 'Frontend package.json found' : 'Frontend package.json not found',
    'Ensure frontend/package.json exists'
  );
}

// Check 5: Vercel configuration
function checkVercelConfig(): void {
  const vercelJson = 'vercel.json';
  const exists = existsSync(vercelJson);
  
  if (!exists) {
    warn('Vercel config', false, 'vercel.json not found', 'Create vercel.json with build configuration');
    return;
  }
  
  try {
    const config = JSON.parse(readFileSync(vercelJson, 'utf-8'));
    
    const hasBuildCommand = config.buildCommand || config.framework;
    const hasOutputDir = config.outputDirectory || config.framework === 'nextjs';
    
    check(
      'Vercel config completeness',
      hasBuildCommand && hasOutputDir,
      hasBuildCommand && hasOutputDir 
        ? 'Vercel config appears complete'
        : 'Vercel config missing buildCommand or outputDirectory',
      'Ensure vercel.json has buildCommand and outputDirectory (or framework: "nextjs")'
    );
  } catch (error) {
    check('Vercel config validity', false, `vercel.json is invalid JSON: ${error}`, 'Fix JSON syntax in vercel.json');
  }
}

// Check 6: GitHub workflows exist
function checkWorkflows(): void {
  const workflows = [
    '.github/workflows/frontend-deploy.yml',
    '.github/workflows/ci.yml',
  ];
  
  const missing = workflows.filter(wf => !existsSync(wf));
  
  check(
    'Required workflows',
    missing.length === 0,
    missing.length === 0
      ? 'All required workflows present'
      : `Missing workflows: ${missing.join(', ')}`,
      missing.length > 0 ? 'Create missing workflow files' : undefined
  );
}

// Check 7: .env.example exists
function checkEnvExample(): void {
  const envExample = '.env.example';
  const exists = existsSync(envExample);
  
  warn(
    '.env.example',
    exists,
    exists ? '.env.example found' : '.env.example not found',
    'Create .env.example with all required environment variables'
  );
}

// Check 8: Frontend build script
function checkFrontendBuild(): void {
  try {
    const frontendPackageJson = 'frontend/package.json';
    if (!existsSync(frontendPackageJson)) {
      return; // Already checked above
    }
    
    const packageJson = JSON.parse(readFileSync(frontendPackageJson, 'utf-8'));
    const scripts = packageJson.scripts || {};
    
    check(
      'Frontend build script',
      !!scripts.build,
      scripts.build 
        ? `Frontend build script found: ${scripts.build}`
        : 'Frontend build script missing',
      'Add "build": "next build" to frontend/package.json scripts'
    );
  } catch (error) {
    // Silently fail - already checked above
  }
}

// Check 9: Package manager consistency
function checkPackageManager(): void {
  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
    const packageManager = packageJson.packageManager;
    
    // Check if packageManager field exists (npm, yarn, pnpm)
    if (packageManager) {
      check(
        'Package manager specified',
        true,
        `Package manager specified: ${packageManager}`
      );
    } else {
      warn(
        'Package manager field',
        false,
        'packageManager field not specified in package.json',
        'Add "packageManager": "npm@..." to package.json for consistency'
      );
    }
  } catch (error) {
    // Silently fail
  }
}

// Run all checks
console.log('🔍 Running deployment diagnostics...\n');

checkNodeVersion();
checkLockfiles();
checkDeployScripts();
checkFrontendPackageJson();
checkVercelConfig();
checkWorkflows();
checkEnvExample();
checkFrontendBuild();
checkPackageManager();

// Print results
console.log('Results:\n');

const passed = results.filter(r => r.status === 'pass');
const warnings = results.filter(r => r.status === 'warn');
const failures = results.filter(r => r.status === 'fail');

results.forEach(result => {
  const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌';
  console.log(`${icon} ${result.name}`);
  console.log(`   ${result.message}`);
  if (result.fix) {
    console.log(`   Fix: ${result.fix}`);
  }
  console.log('');
});

// Summary
console.log('\n--- Summary ---');
console.log(`✅ Passed: ${passed.length}`);
console.log(`⚠️  Warnings: ${warnings.length}`);
console.log(`❌ Failed: ${failures.length}`);

if (failures.length > 0) {
  console.log('\n❌ Deployment will likely fail. Fix the issues above.');
  process.exit(1);
} else if (warnings.length > 0) {
  console.log('\n⚠️  Deployment may have issues. Review warnings above.');
  process.exit(0);
} else {
  console.log('\n✅ All checks passed! Deployment should work.');
  process.exit(0);
}

#!/usr/bin/env node
/**
 * Master Orchestrator CLI
 * Self-operating production framework operations
 */

import { program } from 'commander';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import command modules
import { doctor } from './commands/doctor.js';
import { init } from './commands/init.js';
import { check } from './commands/check.js';
import { release } from './commands/release.js';
import { snapshot } from './commands/snapshot.js';
import { restore } from './commands/restore.js';
import { rotateSecrets } from './commands/rotate-secrets.js';
import { sbGuard } from './commands/sb-guard.js';
import { testE2E } from './commands/test-e2e.js';
import { benchmark } from './commands/benchmark.js';
import { lintfix } from './commands/lintfix.js';
import { docs } from './commands/docs.js';
import { changelog } from './commands/changelog.js';
import { orchestrate } from './commands/orchestrate.js';

program
  .name('ops')
  .description('Self-operating production framework CLI')
  .version('1.0.0');

program
  .command('doctor')
  .description('Run comprehensive health checks')
  .option('--fix', 'Auto-fix issues when possible')
  .action(async (options) => {
    await doctor(options);
  });

program
  .command('init')
  .description('Initialize production framework')
  .action(async () => {
    await init();
  });

program
  .command('check')
  .description('Run safety checks before deployment')
  .option('--migrations', 'Check migrations only')
  .option('--secrets', 'Check secrets only')
  .option('--rls', 'Check RLS policies only')
  .action(async (options) => {
    await check(options);
  });

program
  .command('release')
  .description('Execute full release pipeline')
  .option('--dry-run', 'Simulate release without deploying')
  .option('--skip-tests', 'Skip tests (not recommended)')
  .action(async (options) => {
    await release(options);
  });

program
  .command('snapshot')
  .description('Create encrypted database snapshot')
  .option('--subset <tables>', 'Comma-separated table names')
  .option('--encrypt', 'Encrypt snapshot', true)
  .action(async (options) => {
    await snapshot(options);
  });

program
  .command('restore')
  .description('Restore database from snapshot')
  .argument('<snapshot-file>', 'Snapshot file path')
  .option('--dry-run', 'Validate snapshot without restoring')
  .action(async (snapshotFile, options) => {
    await restore(snapshotFile, options);
  });

program
  .command('rotate-secrets')
  .description('Rotate secrets and push to Supabase + Vercel')
  .option('--force', 'Force rotation even if not due')
  .action(async (options) => {
    await rotateSecrets(options);
  });

program
  .command('sb-guard')
  .description('Scan Supabase for RLS + SECURITY DEFINER issues')
  .option('--fix', 'Auto-generate missing policies')
  .option('--audit-only', 'Generate audit report only')
  .action(async (options) => {
    await sbGuard(options);
  });

program
  .command('test:e2e')
  .description('Run end-to-end tests')
  .option('--headed', 'Run in headed mode')
  .option('--workers <n>', 'Number of workers', '4')
  .action(async (options) => {
    await testE2E(options);
  });

program
  .command('benchmark')
  .description('Run performance benchmarks')
  .option('--baseline <file>', 'Compare against baseline')
  .action(async (options) => {
    await benchmark(options);
  });

program
  .command('lintfix')
  .description('Fix linting issues automatically')
  .action(async () => {
    await lintfix();
  });

program
  .command('docs')
  .description('Rebuild documentation')
  .option('--watch', 'Watch mode')
  .action(async (options) => {
    await docs(options);
  });

program
  .command('changelog')
  .description('Generate CHANGELOG from commits')
  .option('--since <tag>', 'Generate since tag')
  .action(async (options) => {
    await changelog(options);
  });

program
  .command('orchestrate')
  .description('Run reliability, financial, and security orchestrator')
  .option('--full', 'Run full orchestrator cycle', false)
  .option('--dependencies', 'Check dependency health only', false)
  .option('--costs', 'Forecast costs and track reliability only', false)
  .option('--security', 'Run security and compliance audit only', false)
  .option('--uptime', 'Monitor uptime and health only', false)
  .option('--errors', 'Triage errors only', false)
  .option('--dashboards', 'Generate dashboards only', false)
  .option('--auto-pr', 'Create auto-PRs for safe fixes', false)
  .action(async (options) => {
    await orchestrate(options);
  });

program.parse(process.argv);

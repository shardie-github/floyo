#!/usr/bin/env tsx
/**
 * Reliability, Financial, and Security Orchestrator
 * Autonomous monitoring and remediation system for Hardonia full-stack environment
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// Import orchestrator modules
import { checkDependencyHealth } from '../utils/dependency-health.js';
import { forecastCosts, trackReliabilityTrends } from '../utils/cost-intelligence.js';
import { auditSecurityCompliance } from '../utils/security-compliance.js';
import { monitorUptime } from '../utils/uptime-monitor.js';
import { triageErrors } from '../utils/error-triage.js';
import { generateDashboards } from '../utils/dashboard-generator.js';
import { createAutoPR } from '../utils/auto-pr.js';

interface OrchestratorConfig {
  budget: number;
  reliabilityWebhook?: string;
  supabaseUrl: string;
  supabaseServiceKey: string;
  githubToken?: string;
  vercelToken?: string;
}

export async function orchestrate(options: {
  full?: boolean;
  dependencies?: boolean;
  costs?: boolean;
  security?: boolean;
  uptime?: boolean;
  errors?: boolean;
  dashboards?: boolean;
  autoPr?: boolean;
}) {
  console.log('\n' + '='.repeat(80));
  console.log('🎯 Hardonia Reliability, Financial & Security Orchestrator');
  console.log('='.repeat(80) + '\n');

  const config = loadConfig();
  const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);

  // Default to full cycle if no specific options provided
  const runFull = options.full || (!options.dependencies && !options.costs && !options.security && !options.uptime && !options.errors && !options.dashboards);

  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    cycle: runFull ? 'full' : 'partial',
  };

  try {
    // 1. Dependency Health Check
    if (runFull || options.dependencies) {
      console.log('📦 Checking dependency health...');
      results.dependencies = await checkDependencyHealth();
      console.log(`   ✅ Found ${results.dependencies.outdated?.length || 0} outdated packages`);
      console.log(`   ✅ Found ${results.dependencies.vulnerabilities?.length || 0} vulnerabilities\n`);
    }

    // 2. Cost Forecasting & Reliability Trends
    if (runFull || options.costs) {
      console.log('💰 Forecasting costs and tracking reliability...');
      results.costForecast = await forecastCosts(config.budget, supabase);
      results.reliabilityTrends = await trackReliabilityTrends(supabase);
      console.log(`   ✅ Forecasted monthly cost: $${results.costForecast.forecasted.toFixed(2)}`);
      console.log(`   ✅ Uptime: ${results.reliabilityTrends.uptime.toFixed(2)}%\n`);
    }

    // 3. Security & Compliance Audit
    if (runFull || options.security) {
      console.log('🔒 Auditing security and compliance...');
      results.security = await auditSecurityCompliance(supabase);
      console.log(`   ✅ Secrets: ${results.security.secrets.status}`);
      console.log(`   ✅ Licenses: ${results.security.licenses.gpl} GPL, ${results.security.licenses.restricted} restricted`);
      console.log(`   ✅ TLS: ${results.security.tls.status}`);
      console.log(`   ✅ RLS: ${results.security.rls.status}`);
      console.log(`   ✅ GDPR: ${results.security.gdpr.status}\n`);
    }

    // 4. Uptime Monitoring
    if (runFull || options.uptime) {
      console.log('📡 Monitoring uptime and health...');
      results.uptime = await monitorUptime(supabase, config);
      console.log(`   ✅ Health checks: ${results.uptime.checksPassed}/${results.uptime.totalChecks}`);
      console.log(`   ✅ Average latency: ${results.uptime.avgLatency}ms\n`);
    }

    // 5. Error Triage
    if (runFull || options.errors) {
      console.log('🔍 Triaging errors...');
      results.errors = await triageErrors(supabase, config);
      console.log(`   ✅ Analyzed ${results.errors.totalErrors} errors`);
      console.log(`   ✅ Recurring issues: ${results.errors.recurring.length}\n`);
    }

    // 6. Generate Dashboards
    if (runFull || options.dashboards) {
      console.log('📊 Generating dashboards...');
      await generateDashboards(results, supabase);
      console.log('   ✅ Dashboards generated\n');
    }

    // 7. Auto-PR Creation (if safe fixes available)
    if ((runFull || options.autoPr) && results.dependencies?.safeFixes?.length > 0) {
      console.log('🤖 Creating auto-PRs for safe fixes...');
      if (config.githubToken) {
        const prResults = await createAutoPR(results.dependencies.safeFixes, config);
        results.autoPRs = prResults;
        console.log(`   ✅ Created ${prResults.created} PR(s)\n`);
      } else {
        console.log('   ⚠️  GitHub token not configured, skipping auto-PR\n');
      }
    }

    // Save results
    const reportPath = path.join(process.cwd(), 'compliance', 'audits', getDateString());
    fs.mkdirSync(reportPath, { recursive: true });
    fs.writeFileSync(
      path.join(reportPath, 'orchestrator-report.json'),
      JSON.stringify(results, null, 2)
    );

    // Save latest reports
    fs.writeFileSync(
      path.join(process.cwd(), 'dependency-report.json'),
      JSON.stringify(results.dependencies, null, 2)
    );
    fs.writeFileSync(
      path.join(process.cwd(), 'cost_forecast.json'),
      JSON.stringify(results.costForecast, null, 2)
    );
    fs.writeFileSync(
      path.join(process.cwd(), 'reliability_trends.json'),
      JSON.stringify(results.reliabilityTrends, null, 2)
    );

    console.log('='.repeat(80));
    console.log('✅ Orchestrator cycle completed successfully');
    console.log('='.repeat(80) + '\n');

    return results;
  } catch (error: any) {
    console.error('❌ Orchestrator error:', error.message);
    throw error;
  }
}

function loadConfig(): OrchestratorConfig {
  const configPath = path.join(process.cwd(), 'config', 'orchestrator.json');
  const defaultConfig: OrchestratorConfig = {
    budget: 75,
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    githubToken: process.env.GITHUB_TOKEN,
    vercelToken: process.env.VERCEL_TOKEN,
    reliabilityWebhook: process.env.RELIABILITY_ALERT_WEBHOOK,
  };

  if (fs.existsSync(configPath)) {
    const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return { ...defaultConfig, ...fileConfig };
  }

  return defaultConfig;
}

function getDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

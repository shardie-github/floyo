#!/usr/bin/env node
/**
 * Unified Agent CLI
 * Entry point for the Hardonia Unified Agent System
 */

import { program } from 'commander';
import { UnifiedAgentOrchestrator } from './orchestrator.js';

program
  .name('unified-agent')
  .description('Hardonia Unified Background + Composer Agent System')
  .version('1.0.0');

program
  .command('run')
  .description('Run all agents')
  .option('--reliability', 'Run reliability agent only', false)
  .option('--cost', 'Run cost agent only', false)
  .option('--security', 'Run security agent only', false)
  .option('--docs', 'Run documentation agent only', false)
  .option('--planning', 'Run planning agent only', false)
  .option('--observability', 'Run observability agent only', false)
  .option('--reflection', 'Run reflection agent only', false)
  .option('--skip-reliability', 'Skip reliability agent', false)
  .option('--skip-cost', 'Skip cost agent', false)
  .option('--skip-security', 'Skip security agent', false)
  .option('--skip-docs', 'Skip documentation agent', false)
  .option('--skip-planning', 'Skip planning agent', false)
  .option('--skip-observability', 'Skip observability agent', false)
  .option('--skip-reflection', 'Skip reflection agent', false)
  .action(async (options) => {
    const orchestrator = new UnifiedAgentOrchestrator();

    const runOptions: any = {};
    
    // Handle single agent runs
    if (options.reliability) {
      runOptions.reliability = true;
      runOptions.cost = false;
      runOptions.security = false;
      runOptions.documentation = false;
      runOptions.planning = false;
      runOptions.observability = false;
      runOptions.reflection = false;
    } else if (options.cost) {
      runOptions.reliability = false;
      runOptions.cost = true;
      runOptions.security = false;
      runOptions.documentation = false;
      runOptions.planning = false;
      runOptions.observability = false;
      runOptions.reflection = false;
    } else if (options.security) {
      runOptions.reliability = false;
      runOptions.cost = false;
      runOptions.security = true;
      runOptions.documentation = false;
      runOptions.planning = false;
      runOptions.observability = false;
      runOptions.reflection = false;
    } else if (options.docs) {
      runOptions.reliability = false;
      runOptions.cost = false;
      runOptions.security = false;
      runOptions.documentation = true;
      runOptions.planning = false;
      runOptions.observability = false;
      runOptions.reflection = false;
    } else if (options.planning) {
      runOptions.reliability = false;
      runOptions.cost = false;
      runOptions.security = false;
      runOptions.documentation = false;
      runOptions.planning = true;
      runOptions.observability = false;
      runOptions.reflection = false;
    } else if (options.observability) {
      runOptions.reliability = false;
      runOptions.cost = false;
      runOptions.security = false;
      runOptions.documentation = false;
      runOptions.planning = false;
      runOptions.observability = true;
      runOptions.reflection = false;
    } else if (options.reflection) {
      runOptions.reliability = false;
      runOptions.cost = false;
      runOptions.security = false;
      runOptions.documentation = false;
      runOptions.planning = false;
      runOptions.observability = false;
      runOptions.reflection = true;
    } else {
      // Handle skip options
      runOptions.reliability = !options.skipReliability;
      runOptions.cost = !options.skipCost;
      runOptions.security = !options.skipSecurity;
      runOptions.documentation = !options.skipDocs;
      runOptions.planning = !options.skipPlanning;
      runOptions.observability = !options.skipObservability;
      runOptions.reflection = !options.skipReflection;
    }

    console.log('🚀 Starting Unified Agent System...\n');
    
    const result = await orchestrator.runAll(runOptions);

    console.log('\n📊 Summary:');
    console.log(`   Success: ${result.success ? '✅' : '❌'}`);
    console.log(`   Context: ${result.context.type}`);
    
    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      for (const error of result.errors) {
        console.log(`   - ${error}`);
      }
    }

    process.exit(result.success ? 0 : 1);
  });

program
  .command('status')
  .description('Show agent status and last run info')
  .action(async () => {
    console.log('📊 Unified Agent Status\n');
    
    // Check for artifact files
    const { existsSync } = await import('fs');
    const { join } = await import('path');
    
    const artifacts = [
      { name: 'Reliability', path: 'admin/reliability.json' },
      { name: 'Cost', path: 'admin/cost.json' },
      { name: 'Compliance', path: 'admin/compliance.json' },
      { name: 'SBOM', path: 'security/sbom.json' },
      { name: 'Sprint Plan', path: 'roadmap/current-sprint.json' },
      { name: 'Reflection', path: 'auto/reflection.json' },
    ];

    for (const artifact of artifacts) {
      const exists = existsSync(join(process.cwd(), artifact.path));
      console.log(`   ${exists ? '✅' : '❌'} ${artifact.name}`);
    }
  });

program.parse(process.argv);

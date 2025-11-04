/**
 * Benchmark command - Run performance benchmarks
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export async function benchmark(options: { baseline?: string }) {
  console.log('📊 Running performance benchmarks...\n');

  const budgets = {
    lcp: 2500, // ms
    cls: 0.1,
    tbt: 300, // ms
    js: 170 * 1024, // bytes
  };

  try {
    // Run Lighthouse CI
    console.log('🔍 Running Lighthouse CI...');
    execSync('npm run lighthouse', { stdio: 'inherit' });

    // Parse results
    const resultsPath = path.join(process.cwd(), '.lighthouseci', 'results.json');
    if (!fs.existsSync(resultsPath)) {
      throw new Error('Lighthouse results not found');
    }

    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
    const violations: string[] = [];

    // Check budgets
    for (const [metric, budget] of Object.entries(budgets)) {
      const value = results[metric];
      if (value > budget) {
        violations.push(`${metric}: ${value} > ${budget}`);
      }
    }

    // Generate report
    const reportPath = path.join(process.cwd(), 'ops', 'reports', 'budget-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      budgets,
      results,
      violations,
      passed: violations.length === 0
    }, null, 2));

    if (violations.length > 0) {
      console.log('\n❌ Budget violations detected:\n');
      violations.forEach(v => console.log(`   - ${v}\n`));
      process.exit(1);
    }

    console.log('\n✅ All performance budgets met\n');
  } catch (error) {
    console.error(`❌ Benchmark failed: ${error.message}\n`);
    process.exit(1);
  }
}

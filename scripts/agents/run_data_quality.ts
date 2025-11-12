#!/usr/bin/env tsx
/**
 * Data Quality Runner
 * Executes data quality SQL checks and reports failures
 */

import fs from 'fs';
import path from 'path';
import { query } from '../lib/db.js';
import { logger } from '../lib/logger.js';

interface DQCheck {
    check_name: string;
    status: 'PASS' | 'FAIL';
    [key: string]: any;
}

async function runDataQualityChecks(): Promise<DQCheck[]> {
    const sqlFile = path.join(process.cwd(), 'tests', 'data_quality.sql');
    
    if (!fs.existsSync(sqlFile)) {
        throw new Error(`Data quality SQL file not found: ${sqlFile}`);
    }

    const sql = fs.readFileSync(sqlFile, 'utf-8');
    
    // Split SQL into individual queries (semicolon-separated)
    const queries = sql
        .split(';')
        .map(q => q.trim())
        .filter(q => q.length > 0 && !q.startsWith('--'));

    const results: DQCheck[] = [];

    for (const querySql of queries) {
        try {
            // Skip comments and empty lines
            if (querySql.startsWith('--') || querySql.length === 0) {
                continue;
            }

            const result = await query(querySql);
            
            if (result.rows && result.rows.length > 0) {
                for (const row of result.rows) {
                    results.push(row as DQCheck);
                }
            }
        } catch (error) {
            logger.error(`Error executing DQ check:`, error);
            results.push({
                check_name: 'query_execution_error',
                status: 'FAIL',
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    return results;
}

async function generateReport(results: DQCheck[]): Promise<void> {
    const reportsDir = path.join(process.cwd(), 'reports', 'exec');
    fs.mkdirSync(reportsDir, { recursive: true });

    const reportPath = path.join(reportsDir, 'data_quality_report.md');
    const timestamp = new Date().toISOString();
    
    const passed = results.filter(r => r.status === 'PASS');
    const failed = results.filter(r => r.status === 'FAIL');
    const overallStatus = failed.length === 0 ? 'PASS' : 'FAIL';

    const markdown = `# Data Quality Report

**Generated:** ${timestamp}  
**Status:** ${overallStatus === 'PASS' ? '✅ PASS' : '❌ FAIL'}

## Summary

- **Total Checks:** ${results.length}
- **Passed:** ${passed.length}
- **Failed:** ${failed.length}

## Results

${results.map(r => {
    const statusIcon = r.status === 'PASS' ? '✅' : '❌';
    const details = Object.entries(r)
        .filter(([k]) => k !== 'check_name' && k !== 'status')
        .map(([k, v]) => `  - **${k}:** ${v}`)
        .join('\n');
    return `### ${statusIcon} ${r.check_name}\n\n**Status:** ${r.status}\n${details ? `\n${details}\n` : ''}`;
}).join('\n\n')}

## Failed Checks

${failed.length > 0
        ? failed.map(r => `- ❌ **${r.check_name}**`).join('\n')
        : '- None'}

## Next Steps

${overallStatus === 'PASS'
        ? '✅ All data quality checks passed.'
        : '❌ Fix failed checks before proceeding.'}
`;

    fs.writeFileSync(reportPath, markdown);
    logger.info(`Data quality report written to ${reportPath}`);
}

async function main() {
    const startTime = Date.now();
    logger.info('Running data quality checks...');

    try {
        const results = await runDataQualityChecks();
        await generateReport(results);

        const failed = results.filter(r => r.status === 'FAIL');
        if (failed.length > 0) {
            logger.error(`${failed.length} data quality checks failed`);
            process.exit(1);
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        logger.info(`Data quality checks completed in ${duration}s - All checks passed`);

    } catch (error) {
        logger.error('Data quality checks failed:', error);
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { runDataQualityChecks, generateReport };

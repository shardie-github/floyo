#!/usr/bin/env tsx
/**
 * Preflight Agent
 * Checks environment variables and database connectivity before operations
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../lib/logger.js';
import { testConnection } from '../lib/db.js';

interface PreflightReport {
    timestamp: string;
    environment: {
        node_version: string;
        timezone: string;
        env_vars_present: string[];
        env_vars_missing: string[];
    };
    database: {
        connected: boolean;
        healthcheck?: any;
    };
    status: 'pass' | 'fail';
    errors: string[];
}

async function checkEnvironment(): Promise<{ present: string[]; missing: string[] }> {
    const required = [
        'SUPABASE_DB_URL',
        'SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
    ];
    const optional = [
        'SUPABASE_ANON_KEY',
        'SLACK_WEBHOOK_URL',
        'GENERIC_SOURCE_A_TOKEN',
        'GENERIC_SOURCE_B_TOKEN',
        'TZ',
    ];

    const present: string[] = [];
    const missing: string[] = [];

    for (const key of required) {
        if (process.env[key]) {
            present.push(key);
        } else {
            missing.push(key);
        }
    }

    for (const key of optional) {
        if (process.env[key]) {
            present.push(key);
        }
    }

    return { present, missing };
}

async function checkDatabase(): Promise<{ connected: boolean; healthcheck?: any }> {
    try {
        const connected = await testConnection();
        if (!connected) {
            return { connected: false };
        }

        // Try to run healthcheck function if available
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && supabaseKey) {
            try {
                const supabase = createClient(supabaseUrl, supabaseKey, {
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false,
                    },
                });
                const { data } = await supabase.rpc('system_healthcheck');
                return { connected: true, healthcheck: data };
            } catch (error) {
                logger.warn('Healthcheck function not available:', error);
                return { connected: true };
            }
        }

        return { connected: true };
    } catch (error) {
        logger.error('Database check failed:', error);
        return { connected: false };
    }
}

async function generateReport(report: PreflightReport): Promise<void> {
    const reportsDir = path.join(process.cwd(), 'reports', 'exec');
    fs.mkdirSync(reportsDir, { recursive: true });

    const reportPath = path.join(reportsDir, 'preflight_report.md');
    const markdown = `# Preflight Report

**Generated:** ${report.timestamp}  
**Status:** ${report.status === 'pass' ? '✅ PASS' : '❌ FAIL'}

## Environment

- **Node Version:** ${report.environment.node_version}
- **Timezone:** ${report.environment.timezone}

### Environment Variables

**Present:**
${report.environment.env_vars_present.map(v => `- ${v}`).join('\n')}

**Missing (Required):**
${report.environment.env_vars_missing.length > 0
        ? report.environment.env_vars_missing.map(v => `- ❌ ${v}`).join('\n')
        : '- None'}

## Database

- **Connected:** ${report.database.connected ? '✅ Yes' : '❌ No'}
${report.database.healthcheck
        ? `\n**Healthcheck:**\n\`\`\`json\n${JSON.stringify(report.database.healthcheck, null, 2)}\n\`\`\``
        : ''}

## Errors

${report.errors.length > 0 ? report.errors.map(e => `- ❌ ${e}`).join('\n') : '- None'}

## Next Steps

${report.status === 'pass'
        ? '✅ Preflight checks passed. Ready to proceed.'
        : '❌ Fix errors above before proceeding.'}
`;

    fs.writeFileSync(reportPath, markdown);
    logger.info(`Preflight report written to ${reportPath}`);
}

async function main() {
    const startTime = Date.now();
    logger.info('Running preflight checks...');

    const report: PreflightReport = {
        timestamp: new Date().toISOString(),
        environment: {
            node_version: process.version,
            timezone: process.env.TZ || 'America/Toronto',
            env_vars_present: [],
            env_vars_missing: [],
        },
        database: {
            connected: false,
        },
        status: 'pass',
        errors: [],
    };

    // Check environment
    const envCheck = await checkEnvironment();
    report.environment.env_vars_present = envCheck.present;
    report.environment.env_vars_missing = envCheck.missing;

    if (envCheck.missing.length > 0) {
        report.status = 'fail';
        report.errors.push(`Missing required environment variables: ${envCheck.missing.join(', ')}`);
    }

    // Check database
    const dbCheck = await checkDatabase();
    report.database = dbCheck;

    if (!dbCheck.connected) {
        report.status = 'fail';
        report.errors.push('Database connection failed');
    }

    // Generate report
    await generateReport(report);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info(`Preflight completed in ${duration}s - Status: ${report.status.toUpperCase()}`);

    if (report.status === 'fail') {
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { checkEnvironment, checkDatabase, generateReport };

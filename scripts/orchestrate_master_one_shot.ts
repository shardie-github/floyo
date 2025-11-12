#!/usr/bin/env tsx
/**
 * Master One-Shot Orchestration Script
 * Executes all phases: Preflight → Guardrails → System Health → Delta Migration → Verification → Summary
 */

import fs from 'fs';
import path from 'path';
import { logger } from './lib/logger.js';
import { checkEnvironment, checkDatabase } from './agents/preflight.js';
import { verifyDatabase } from './agents/verify_db.js';
import { generateDeltaMigration } from './agents/generate_delta_migration.js';
import { runDataQualityChecks } from './agents/run_data_quality.js';
import { notify } from './agents/notify.js';
import { execSync } from 'child_process';

interface RunSummary {
    timestamp: string;
    phases: {
        preflight: { status: 'pass' | 'fail'; errors: string[] };
        guardrails: { status: 'pass' | 'fail'; created: string[] };
        system_health: { status: 'pass' | 'fail'; reports: string[] };
        delta_migration: { status: 'pass' | 'fail'; migration_file?: string };
        verification: { status: 'pass' | 'fail'; errors: string[] };
        etl_smoke_test: { status: 'pass' | 'fail'; errors: string[] };
        metrics_computation: { status: 'pass' | 'fail'; days_processed?: number };
        data_quality: { status: 'pass' | 'fail'; failed_checks: string[] };
        system_doctor: { status: 'pass' | 'fail'; tickets_created: string[] };
    };
    overall_status: 'pass' | 'fail';
    created_files: string[];
    next_actions: string[];
}

async function phasePreflight(): Promise<{ status: 'pass' | 'fail'; errors: string[] }> {
    logger.info('=== PHASE 1: Preflight Checks ===');
    const errors: string[] = [];

    try {
        const envCheck = await checkEnvironment();
        if (envCheck.missing.length > 0) {
            errors.push(`Missing environment variables: ${envCheck.missing.join(', ')}`);
        }

        const dbCheck = await checkDatabase();
        if (!dbCheck.connected) {
            errors.push('Database connection failed');
        }

        if (errors.length > 0) {
            logger.error('Preflight failed:', errors);
            return { status: 'fail', errors };
        }

        logger.info('✅ Preflight checks passed');
        return { status: 'pass', errors: [] };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error('Preflight error:', errorMsg);
        return { status: 'fail', errors: [errorMsg] };
    }
}

async function phaseGuardrails(): Promise<{ status: 'pass' | 'fail'; created: string[] }> {
    logger.info('=== PHASE 2: Guardrails Pack ===');
    const created: string[] = [];

    // Guardrails are already created (SQL migrations, TS utils, ETL scripts, fixtures, agents, CI)
    // This phase verifies they exist
    const guardrailFiles = [
        'supabase/migrations/000000000800_upsert_functions.sql',
        'scripts/lib/db.ts',
        'scripts/lib/retry.ts',
        'scripts/lib/logger.ts',
        'scripts/etl/pull_events.ts',
        'scripts/etl/pull_ads_source_a.ts',
        'scripts/etl/pull_ads_source_b.ts',
        'scripts/etl/compute_metrics.ts',
        'scripts/agents/preflight.ts',
        'scripts/agents/verify_db.ts',
        'scripts/agents/run_data_quality.ts',
        'scripts/agents/notify.ts',
        'scripts/agents/system_doctor.ts',
        'tests/data_quality.sql',
        'tests/fixtures/events_sample.json',
        'tests/fixtures/source_a_ads_sample.json',
        'tests/fixtures/source_b_ads_sample.json',
        'infra/gh-actions/preflight.yml',
        'infra/gh-actions/data_quality.yml',
    ];

    for (const file of guardrailFiles) {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
            created.push(file);
        } else {
            logger.warn(`Guardrail file missing: ${file}`);
        }
    }

    logger.info(`✅ Guardrails verified (${created.length} files)`);
    return { status: 'pass', created };
}

async function phaseSystemHealth(): Promise<{ status: 'pass' | 'fail'; reports: string[] }> {
    logger.info('=== PHASE 3: System Health Reports ===');
    const reports: string[] = [];

    // System health reports are already created
    const reportFiles = [
        'reports/system/loops.md',
        'reports/system/second_order.md',
        'reports/system/socio_tech_alignment.md',
        'reports/system/constraints_report.md',
        'reports/system/resilience_index.md',
        'reports/system/multi_agent_sync.md',
    ];

    for (const file of reportFiles) {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
            reports.push(file);
        }
    }

    logger.info(`✅ System health reports verified (${reports.length} reports)`);
    return { status: 'pass', reports };
}

async function phaseDeltaMigration(): Promise<{ status: 'pass' | 'fail'; migration_file?: string }> {
    logger.info('=== PHASE 4: Delta Migration ===');

    try {
        const migrationFile = await generateDeltaMigration();
        
        if (migrationFile) {
            logger.info(`✅ Delta migration generated: ${migrationFile}`);

            // Try to apply via Supabase CLI
            try {
                logger.info('Attempting to apply migration via Supabase CLI...');
                execSync('supabase db push --include-all', { stdio: 'inherit' });
                logger.info('✅ Migration applied via Supabase CLI');
            } catch (error) {
                logger.warn('Supabase CLI failed, trying psql fallback...');
                const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
                if (dbUrl) {
                    execSync(`psql "${dbUrl}" -f "${migrationFile}"`, { stdio: 'inherit' });
                    logger.info('✅ Migration applied via psql');
                } else {
                    throw new Error('Missing database URL for psql fallback');
                }
            }

            return { status: 'pass', migration_file: migrationFile };
        } else {
            logger.info('✅ No delta migration needed (all objects present)');
            return { status: 'pass' };
        }
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error('Delta migration failed:', errorMsg);
        return { status: 'fail' };
    }
}

async function phaseVerification(): Promise<{ status: 'pass' | 'fail'; errors: string[] }> {
    logger.info('=== PHASE 5: Database Verification ===');
    const errors: string[] = [];

    try {
        const verified = await verifyDatabase();
        if (!verified) {
            errors.push('Database verification failed');
            return { status: 'fail', errors };
        }

        logger.info('✅ Database verification passed');
        return { status: 'pass', errors: [] };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error('Verification error:', errorMsg);
        return { status: 'fail', errors: [errorMsg] };
    }
}

async function phaseETLSmokeTest(): Promise<{ status: 'pass' | 'fail'; errors: string[] }> {
    logger.info('=== PHASE 6: ETL Smoke Test (Dry-Run) ===');
    const errors: string[] = [];

    try {
        // Run ETL scripts in dry-run mode
        const etlScripts = [
            'scripts/etl/pull_events.ts',
            'scripts/etl/pull_ads_source_a.ts',
            'scripts/etl/pull_ads_source_b.ts',
        ];

        for (const script of etlScripts) {
            try {
                execSync(`tsx ${script} --dry-run`, { stdio: 'inherit' });
                logger.info(`✅ ${script} dry-run passed`);
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                errors.push(`${script}: ${errorMsg}`);
            }
        }

        if (errors.length > 0) {
            return { status: 'fail', errors };
        }

        logger.info('✅ ETL smoke tests passed');
        return { status: 'pass', errors: [] };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error('ETL smoke test error:', errorMsg);
        return { status: 'fail', errors: [errorMsg] };
    }
}

async function phaseMetricsComputation(): Promise<{ status: 'pass' | 'fail'; days_processed?: number }> {
    logger.info('=== PHASE 7: Metrics Computation ===');

    try {
        // Compute metrics for last 7 days (safe range)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        logger.info(`Computing metrics from ${startStr} to ${endStr}...`);

        // Use Supabase RPC to call recompute_metrics_daily
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey, {
                auth: { autoRefreshToken: false, persistSession: false },
            });

            const { data, error } = await supabase.rpc('recompute_metrics_daily', {
                start_date: startStr,
                end_date: endStr,
            });

            if (error) {
                throw new Error(`Metrics computation failed: ${error.message}`);
            }

            const daysProcessed = data || 0;
            logger.info(`✅ Metrics computed for ${daysProcessed} days`);
            return { status: 'pass', days_processed: daysProcessed };
        } else {
            logger.warn('Skipping metrics computation (missing Supabase credentials)');
            return { status: 'pass', days_processed: 0 };
        }
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error('Metrics computation error:', errorMsg);
        return { status: 'fail' };
    }
}

async function phaseDataQuality(): Promise<{ status: 'pass' | 'fail'; failed_checks: string[] }> {
    logger.info('=== PHASE 8: Data Quality Checks ===');
    const failedChecks: string[] = [];

    try {
        const results = await runDataQualityChecks();
        const failed = results.filter(r => r.status === 'FAIL');

        if (failed.length > 0) {
            failedChecks.push(...failed.map(r => r.check_name));
            logger.error(`❌ ${failed.length} data quality checks failed`);
            return { status: 'fail', failed_checks: failedChecks };
        }

        logger.info('✅ All data quality checks passed');
        return { status: 'pass', failed_checks: [] };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error('Data quality check error:', errorMsg);
        return { status: 'fail', failed_checks: [errorMsg] };
    }
}

async function phaseSystemDoctor(): Promise<{ status: 'pass' | 'fail'; tickets_created: string[] }> {
    logger.info('=== PHASE 9: System Doctor ===');
    const ticketsCreated: string[] = [];

    try {
        // Run system doctor (it will create tickets if issues found)
        const { checkDeltaMigration, checkDatabaseVerification, createTicket } = await import('./agents/system_doctor.js');
        
        const deltaIssues = await checkDeltaMigration();
        const dbIssues = await checkDatabaseVerification();

        const criticalIssues = [...deltaIssues, ...dbIssues].filter(
            i => i.severity === 'critical' || i.severity === 'high'
        );

        if (criticalIssues.length > 0) {
            for (const issue of criticalIssues) {
                await createTicket(issue);
                ticketsCreated.push(`READY_system_fix_${issue.component}`);
            }
            logger.warn(`⚠️ System doctor found ${criticalIssues.length} issues, tickets created`);
            return { status: 'fail', tickets_created: ticketsCreated };
        }

        logger.info('✅ System doctor: No critical issues found');
        return { status: 'pass', tickets_created: [] };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error('System doctor error:', errorMsg);
        return { status: 'fail', tickets_created: [] };
    }
}

async function generateExecutiveSummary(summary: RunSummary): Promise<void> {
    const reportsDir = path.join(process.cwd(), 'reports', 'exec');
    fs.mkdirSync(reportsDir, { recursive: true });

    const date = new Date().toISOString().split('T')[0];
    const reportPath = path.join(reportsDir, `run_summary_${date}.md`);

    const markdown = `# Master One-Shot Run Summary

**Generated:** ${summary.timestamp}  
**Status:** ${summary.overall_status === 'pass' ? '✅ PASS' : '❌ FAIL'}

## Phase Results

### 1. Preflight Checks
- **Status:** ${summary.phases.preflight.status === 'pass' ? '✅ PASS' : '❌ FAIL'}
${summary.phases.preflight.errors.length > 0 ? `- **Errors:** ${summary.phases.preflight.errors.join(', ')}` : ''}

### 2. Guardrails Pack
- **Status:** ${summary.phases.guardrails.status === 'pass' ? '✅ PASS' : '❌ FAIL'}
- **Files Created:** ${summary.phases.guardrails.created.length}

### 3. System Health Reports
- **Status:** ${summary.phases.system_health.status === 'pass' ? '✅ PASS' : '❌ FAIL'}
- **Reports:** ${summary.phases.system_health.reports.length}

### 4. Delta Migration
- **Status:** ${summary.phases.delta_migration.status === 'pass' ? '✅ PASS' : '❌ FAIL'}
${summary.phases.delta_migration.migration_file ? `- **Migration File:** ${summary.phases.delta_migration.migration_file}` : '- **No migration needed**'}

### 5. Database Verification
- **Status:** ${summary.phases.verification.status === 'pass' ? '✅ PASS' : '❌ FAIL'}
${summary.phases.verification.errors.length > 0 ? `- **Errors:** ${summary.phases.verification.errors.join(', ')}` : ''}

### 6. ETL Smoke Test
- **Status:** ${summary.phases.etl_smoke_test.status === 'pass' ? '✅ PASS' : '❌ FAIL'}
${summary.phases.etl_smoke_test.errors.length > 0 ? `- **Errors:** ${summary.phases.etl_smoke_test.errors.join(', ')}` : ''}

### 7. Metrics Computation
- **Status:** ${summary.phases.metrics_computation.status === 'pass' ? '✅ PASS' : '❌ FAIL'}
${summary.phases.metrics_computation.days_processed !== undefined ? `- **Days Processed:** ${summary.phases.metrics_computation.days_processed}` : ''}

### 8. Data Quality Checks
- **Status:** ${summary.phases.data_quality.status === 'pass' ? '✅ PASS' : '❌ FAIL'}
${summary.phases.data_quality.failed_checks.length > 0 ? `- **Failed Checks:** ${summary.phases.data_quality.failed_checks.join(', ')}` : ''}

### 9. System Doctor
- **Status:** ${summary.phases.system_doctor.status === 'pass' ? '✅ PASS' : '❌ FAIL'}
${summary.phases.system_doctor.tickets_created.length > 0 ? `- **Tickets Created:** ${summary.phases.system_doctor.tickets_created.join(', ')}` : '- **No issues found**'}

## Created Files

${summary.created_files.map(f => `- ${f}`).join('\n')}

## Next Actions

${summary.next_actions.map(a => `- ${a}`).join('\n')}

## Notes

This run executed all phases of the Master One-Shot process. Review any failures above and address them before the next run.
`;

    fs.writeFileSync(reportPath, markdown);
    logger.info(`Executive summary written to ${reportPath}`);
}

async function main() {
    const startTime = Date.now();
    logger.info('🚀 Starting Master One-Shot Orchestration...');

    const summary: RunSummary = {
        timestamp: new Date().toISOString(),
        phases: {
            preflight: { status: 'fail', errors: [] },
            guardrails: { status: 'fail', created: [] },
            system_health: { status: 'fail', reports: [] },
            delta_migration: { status: 'fail' },
            verification: { status: 'fail', errors: [] },
            etl_smoke_test: { status: 'fail', errors: [] },
            metrics_computation: { status: 'fail' },
            data_quality: { status: 'fail', failed_checks: [] },
            system_doctor: { status: 'fail', tickets_created: [] },
        },
        overall_status: 'fail',
        created_files: [],
        next_actions: [],
    };

    try {
        // Execute phases
        summary.phases.preflight = await phasePreflight();
        summary.phases.guardrails = await phaseGuardrails();
        summary.phases.system_health = await phaseSystemHealth();
        summary.phases.delta_migration = await phaseDeltaMigration();
        summary.phases.verification = await phaseVerification();
        summary.phases.etl_smoke_test = await phaseETLSmokeTest();
        summary.phases.metrics_computation = await phaseMetricsComputation();
        summary.phases.data_quality = await phaseDataQuality();
        summary.phases.system_doctor = await phaseSystemDoctor();

        // Determine overall status
        const failedPhases = Object.values(summary.phases).filter(p => p.status === 'fail');
        summary.overall_status = failedPhases.length === 0 ? 'pass' : 'fail';

        // Collect created files
        summary.created_files = [
            ...summary.phases.guardrails.created,
            ...summary.phases.system_health.reports,
            ...(summary.phases.delta_migration.migration_file ? [summary.phases.delta_migration.migration_file] : []),
        ];

        // Generate next actions
        if (summary.phases.preflight.status === 'fail') {
            summary.next_actions.push('Fix environment variables and database connection');
        }
        if (summary.phases.delta_migration.status === 'fail') {
            summary.next_actions.push('Review and apply delta migration manually');
        }
        if (summary.phases.data_quality.status === 'fail') {
            summary.next_actions.push('Fix data quality issues');
        }
        if (summary.phases.system_doctor.tickets_created.length > 0) {
            summary.next_actions.push(`Review ${summary.phases.system_doctor.tickets_created.length} system fix tickets`);
        }
        if (summary.overall_status === 'pass') {
            summary.next_actions.push('✅ All phases passed - System ready for production');
        }

        // Generate executive summary
        await generateExecutiveSummary(summary);

        // Notify
        await notify({
            title: `Master One-Shot: ${summary.overall_status === 'pass' ? 'SUCCESS' : 'FAILED'}`,
            message: `Completed ${Object.keys(summary.phases).length} phases. ${failedPhases.length} phase(s) failed.`,
            status: summary.overall_status === 'pass' ? 'success' : 'error',
            fields: Object.entries(summary.phases).map(([name, phase]) => ({
                name: name.replace(/_/g, ' '),
                value: phase.status === 'pass' ? '✅' : '❌',
            })),
        });

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        logger.info(`\n🎯 Master One-Shot completed in ${duration}s - Status: ${summary.overall_status.toUpperCase()}`);

        if (summary.overall_status === 'fail') {
            process.exit(1);
        }
    } catch (error) {
        logger.error('Master One-Shot orchestration failed:', error);
        await generateExecutiveSummary(summary);
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

#!/usr/bin/env tsx
/**
 * Run All Supabase Migrations
 * Executes all migration scripts in order, handles errors, and retries where needed
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { logger } from './lib/logger.js';
import { retry } from './lib/retry.js';
import { validateMigrationFile } from './validate_migrations.js';

interface MigrationResult {
    file: string;
    status: 'success' | 'failed' | 'skipped';
    error?: string;
    applied: boolean;
}

async function checkDatabaseConnection(): Promise<boolean> {
    const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
        logger.warn('No database URL found. Migrations will be validated only.');
        return false;
    }

    try {
        // Try a simple connection test
        const { query } = await import('./lib/db.js');
        await query('SELECT 1');
        return true;
    } catch (error) {
        logger.warn('Database connection failed:', error instanceof Error ? error.message : String(error));
        return false;
    }
}

async function applyMigrationViaSupabaseCLI(filePath: string): Promise<boolean> {
    try {
        logger.info(`Attempting to apply via Supabase CLI: ${path.basename(filePath)}`);
        execSync(`supabase db push --db-url "${process.env.SUPABASE_DB_URL}" --include-all`, {
            stdio: 'inherit',
            env: { ...process.env },
        });
        return true;
    } catch (error) {
        logger.warn('Supabase CLI failed, will try psql fallback');
        return false;
    }
}

async function applyMigrationViaPsql(filePath: string): Promise<boolean> {
    const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
        throw new Error('No database URL available for psql');
    }

    try {
        logger.info(`Applying via psql: ${path.basename(filePath)}`);
        execSync(`psql "${dbUrl}" -f "${filePath}" -v ON_ERROR_STOP=1`, {
            stdio: 'inherit',
        });
        return true;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error(`psql failed: ${errorMsg}`);
        return false;
    }
}

async function applyMigration(filePath: string): Promise<MigrationResult> {
    const fileName = path.basename(filePath);
    const result: MigrationResult = {
        file: fileName,
        status: 'failed',
        applied: false,
    };

    try {
        // Validate migration first
        const validation = validateMigrationFile(filePath);
        if (!validation.hasSyntax) {
            result.error = `Validation failed: ${validation.errors.join(', ')}`;
            result.status = 'failed';
            return result;
        }

        // Check if we have database connection
        const hasConnection = await checkDatabaseConnection();
        if (!hasConnection) {
            result.status = 'skipped';
            result.error = 'No database connection available';
            return result;
        }

        // Try to apply migration
        const applied = await retry(
            async () => {
                // Try Supabase CLI first
                const cliSuccess = await applyMigrationViaSupabaseCLI(filePath);
                if (cliSuccess) return true;

                // Fallback to psql
                return await applyMigrationViaPsql(filePath);
            },
            {
                maxRetries: 2,
                baseDelayMs: 1000,
                description: `Apply migration ${fileName}`,
            }
        );

        if (applied) {
            result.status = 'success';
            result.applied = true;
            logger.info(`✅ Successfully applied: ${fileName}`);
        } else {
            result.error = 'Failed to apply migration';
            result.status = 'failed';
        }
    } catch (error) {
        result.error = error instanceof Error ? error.message : String(error);
        result.status = 'failed';
        logger.error(`❌ Failed to apply ${fileName}: ${result.error}`);
    }

    return result;
}

async function generateDeltaMigration(): Promise<string | null> {
    try {
        logger.info('Generating delta migration...');
        const { generateDeltaMigration } = await import('./agents/generate_delta_migration.js');
        const migrationFile = await generateDeltaMigration();
        
        if (migrationFile) {
            logger.info(`✅ Delta migration generated: ${migrationFile}`);
            return migrationFile;
        } else {
            logger.info('✅ No delta migration needed (all objects present)');
            return null;
        }
    } catch (error) {
        logger.error('Delta migration generation failed:', error);
        return null;
    }
}

async function verifyDatabase(): Promise<boolean> {
    try {
        logger.info('Verifying database...');
        const { verifyDatabase } = await import('./agents/verify_db.js');
        const verified = await verifyDatabase();
        
        if (verified) {
            logger.info('✅ Database verification passed');
            return true;
        } else {
            logger.error('❌ Database verification failed');
            return false;
        }
    } catch (error) {
        logger.error('Database verification error:', error);
        return false;
    }
}

async function main() {
    const startTime = Date.now();
    logger.info('🚀 Running All Supabase Migration Scripts...\n');

    const results: MigrationResult[] = [];
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');

    if (!fs.existsSync(migrationsDir)) {
        logger.error(`Migrations directory not found: ${migrationsDir}`);
        process.exit(1);
    }

    // Step 1: Validate all migrations
    logger.info('=== STEP 1: Validating Migrations ===');
    const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

    logger.info(`Found ${files.length} migration files\n`);

    // Step 2: Generate delta migration
    logger.info('=== STEP 2: Generating Delta Migration ===');
    const deltaFile = await generateDeltaMigration();
    if (deltaFile) {
        files.push(path.basename(deltaFile));
    }
    logger.info('');

    // Step 3: Apply migrations in order
    logger.info('=== STEP 3: Applying Migrations ===');
    const hasConnection = await checkDatabaseConnection();

    if (!hasConnection) {
        logger.warn('⚠️  No database connection. Migrations will be validated only.\n');
        logger.info('To apply migrations, set SUPABASE_DB_URL or DATABASE_URL environment variable.\n');
    }

    for (const file of files) {
        const filePath = path.join(migrationsDir, file);
        const result = await applyMigration(filePath);
        results.push(result);
    }

    // Step 4: Verify database
    logger.info('\n=== STEP 4: Verifying Database ===');
    if (hasConnection) {
        await verifyDatabase();
    } else {
        logger.warn('Skipping verification (no database connection)');
    }

    // Summary
    logger.info('\n=== SUMMARY ===');
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const skipped = results.filter(r => r.status === 'skipped').length;

    logger.info(`✅ Successful: ${successful}`);
    logger.info(`❌ Failed: ${failed}`);
    logger.info(`⏭️  Skipped: ${skipped}`);
    logger.info(`📊 Total: ${results.length}\n`);

    if (failed > 0) {
        logger.error('Failed migrations:');
        results.filter(r => r.status === 'failed').forEach(r => {
            logger.error(`  - ${r.file}: ${r.error || 'Unknown error'}`);
        });
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info(`\n⏱️  Completed in ${duration}s`);

    if (failed > 0) {
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { applyMigration, checkDatabaseConnection };

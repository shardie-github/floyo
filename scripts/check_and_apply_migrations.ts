#!/usr/bin/env tsx
/**
 * Check and Apply Migrations
 * Attempts to connect to database using available credentials and apply migrations
 */

import fs from 'fs';
import path from 'path';
import { logger } from './lib/logger.js';
import { query, testConnection } from './lib/db.js';

async function checkAvailableCredentials(): Promise<{
    hasDbUrl: boolean;
    hasSupabaseUrl: boolean;
    hasServiceKey: boolean;
}> {
    const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

    return {
        hasDbUrl: !!dbUrl,
        hasSupabaseUrl: !!supabaseUrl,
        hasServiceKey: !!serviceKey,
    };
}

async function tryConnectDatabase(): Promise<boolean> {
    try {
        logger.info('Attempting to connect to database...');
        const connected = await testConnection();
        if (connected) {
            logger.info('✅ Database connection successful!');
            return true;
        }
        return false;
    } catch (error) {
        logger.warn('Database connection failed:', error instanceof Error ? error.message : String(error));
        return false;
    }
}

async function applyMigrationFile(filePath: string): Promise<boolean> {
    try {
        const sql = fs.readFileSync(filePath, 'utf-8');
        logger.info(`Applying migration: ${path.basename(filePath)}`);
        
        // Split by semicolons and execute each statement
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
            if (statement.length > 0) {
                try {
                    await query(statement);
                } catch (error: any) {
                    // Ignore "already exists" errors (idempotent)
                    if (error?.message?.includes('already exists') || 
                        error?.message?.includes('duplicate') ||
                        error?.code === '42P07' || // duplicate_table
                        error?.code === '42710') { // duplicate_object
                        logger.debug(`Skipping (already exists): ${statement.substring(0, 50)}...`);
                        continue;
                    }
                    throw error;
                }
            }
        }

        logger.info(`✅ Successfully applied: ${path.basename(filePath)}`);
        return true;
    } catch (error) {
        logger.error(`❌ Failed to apply ${path.basename(filePath)}:`, error);
        return false;
    }
}

async function main() {
    logger.info('🔍 Checking for database credentials...\n');

    const creds = await checkAvailableCredentials();
    logger.info('Available credentials:');
    logger.info(`  - Database URL: ${creds.hasDbUrl ? '✅' : '❌'}`);
    logger.info(`  - Supabase URL: ${creds.hasSupabaseUrl ? '✅' : '❌'}`);
    logger.info(`  - Service Key: ${creds.hasServiceKey ? '✅' : '❌'}\n`);

    if (!creds.hasDbUrl && !creds.hasSupabaseUrl) {
        logger.warn('⚠️  No database credentials found.');
        logger.info('\nTo apply migrations, set one of:');
        logger.info('  - SUPABASE_DB_URL or DATABASE_URL');
        logger.info('  - SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY');
        logger.info('\nOr run migrations via GitHub Actions workflow.');
        process.exit(0);
    }

    // Try to connect
    const connected = await tryConnectDatabase();
    if (!connected) {
        logger.error('❌ Could not connect to database. Please check credentials.');
        process.exit(1);
    }

    // Apply migrations
    logger.info('\n📦 Applying migrations...\n');
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
        const filePath = path.join(migrationsDir, file);
        const success = await applyMigrationFile(filePath);
        if (success) {
            successCount++;
        } else {
            failCount++;
        }
    }

    logger.info(`\n📊 Summary:`);
    logger.info(`  ✅ Successful: ${successCount}`);
    logger.info(`  ❌ Failed: ${failCount}`);
    logger.info(`  📦 Total: ${files.length}`);

    if (failCount > 0) {
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

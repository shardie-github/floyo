#!/usr/bin/env tsx
/**
 * Apply Migrations via Supabase CLI
 * Uses Supabase CLI to apply migrations if project is linked or credentials are available
 */

import { execSync } from 'child_process';
import { logger } from './lib/logger.js';
import fs from 'fs';
import path from 'path';

async function checkSupabaseLink(): Promise<boolean> {
    try {
        const configPath = path.join(process.cwd(), 'supabase', 'config.toml');
        if (!fs.existsSync(configPath)) {
            return false;
        }

        const config = fs.readFileSync(configPath, 'utf-8');
        // Check if project_id is set (not just a template)
        return !config.includes('${SUPABASE_PROJECT_REF:-}') || 
               !!process.env.SUPABASE_PROJECT_REF;
    } catch {
        return false;
    }
}

async function trySupabaseCLI(): Promise<boolean> {
    try {
        logger.info('Attempting to apply migrations via Supabase CLI...');
        
        // Check if we have access token
        const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
        const projectRef = process.env.SUPABASE_PROJECT_REF;

        if (accessToken && projectRef) {
            logger.info('Found Supabase credentials, attempting to login and link...');
            
            // Login
            try {
                execSync(`npx supabase login --token "${accessToken}"`, {
                    stdio: 'inherit',
                });
                logger.info('✅ Supabase login successful');
            } catch (error) {
                logger.warn('Supabase login failed, trying without token...');
            }

            // Link project
            try {
                execSync(`npx supabase link --project-ref "${projectRef}"`, {
                    stdio: 'inherit',
                });
                logger.info('✅ Project linked successfully');
            } catch (error) {
                logger.warn('Project linking failed, trying db push with URL...');
            }
        }

        // Try db push
        const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
        if (dbUrl) {
            logger.info('Applying migrations via db push...');
            execSync(`npx supabase db push --db-url "${dbUrl}" --include-all`, {
                stdio: 'inherit',
            });
            logger.info('✅ Migrations applied successfully via Supabase CLI');
            return true;
        } else {
            // Try without URL (uses linked project)
            logger.info('Applying migrations to linked project...');
            execSync('npx supabase db push --include-all', {
                stdio: 'inherit',
            });
            logger.info('✅ Migrations applied successfully via Supabase CLI');
            return true;
        }
    } catch (error: any) {
        logger.warn('Supabase CLI failed:', error.message);
        return false;
    }
}

async function main() {
    logger.info('🚀 Attempting to apply migrations via Supabase CLI...\n');

    const hasLink = await checkSupabaseLink();
    logger.info(`Project linked: ${hasLink ? '✅' : '❌'}`);
    logger.info(`SUPABASE_ACCESS_TOKEN: ${process.env.SUPABASE_ACCESS_TOKEN ? '✅' : '❌'}`);
    logger.info(`SUPABASE_PROJECT_REF: ${process.env.SUPABASE_PROJECT_REF ? '✅' : '❌'}`);
    logger.info(`SUPABASE_DB_URL: ${process.env.SUPABASE_DB_URL ? '✅' : '❌'}`);
    logger.info(`DATABASE_URL: ${process.env.DATABASE_URL ? '✅' : '❌'}\n`);

    const success = await trySupabaseCLI();
    
    if (!success) {
        logger.warn('\n⚠️  Could not apply migrations via Supabase CLI.');
        logger.info('\nTo apply migrations, you need:');
        logger.info('  1. SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF (for linking)');
        logger.info('  2. OR SUPABASE_DB_URL or DATABASE_URL (for direct connection)');
        logger.info('\nOr run via GitHub Actions workflow which has access to secrets.');
        process.exit(0);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

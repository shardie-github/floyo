#!/usr/bin/env tsx
/**
 * Apply NPS Migration
 * 
 * Applies the NPS submissions table migration to Supabase.
 * This can be run independently or the migration will be applied via CI/CD.
 * 
 * Usage: tsx scripts/apply-nps-migration.ts
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

async function applyMigration() {
  console.log('🔄 Applying NPS migration...\n');

  try {
    // Check if Supabase is linked
    try {
      execSync('npx supabase projects list', { stdio: 'pipe' });
    } catch (error) {
      console.log('⚠️  Supabase not linked. Migration will be applied via CI/CD.');
      console.log('   To apply manually:');
      console.log('   1. npx supabase link --project-ref <your-ref>');
      console.log('   2. npx supabase migration up');
      return;
    }

    // Check if migration file exists
    const migrationFile = join(process.cwd(), 'supabase/migrations/20250120000000_nps_submissions.sql');
    const migrationExists = require('fs').existsSync(migrationFile);

    if (!migrationExists) {
      console.log('⚠️  NPS migration file not found.');
      console.log('   The NPS table is included in the master consolidated schema.');
      console.log('   Run: npx supabase migration up');
      return;
    }

    // Apply migration
    console.log('📝 Applying migration...');
    execSync('npx supabase migration up', { stdio: 'inherit' });

    console.log('\n✅ NPS migration applied successfully!');
    console.log('\nNext steps:');
    console.log('  1. Verify table exists: Check Supabase Dashboard');
    console.log('  2. Generate Prisma client: npm run prisma:generate');
    console.log('  3. Test NPS survey: Visit app and trigger survey');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.log('\nTroubleshooting:');
    console.log('  1. Ensure Supabase is linked: npx supabase link');
    console.log('  2. Check migration file exists');
    console.log('  3. Verify database connection');
    process.exit(1);
  }
}

applyMigration();

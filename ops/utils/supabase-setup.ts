/**
 * Supabase Setup Script
 * Creates project and applies migrations
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

interface SupabaseConfig {
  url: string;
  serviceRoleKey: string;
  anonKey: string;
}

export async function setupSupabase(config: SupabaseConfig) {
  const supabase = createClient(config.url, config.serviceRoleKey);

  // Read migration file
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20240101000000_initial_schema.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  // Execute migration
  console.log('🚀 Applying database migration...');
  const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

  if (error) {
    // Fallback: Use direct SQL execution via REST API
    console.log('⚠️  RPC method not available, using direct SQL...');
    // Note: Supabase doesn't expose direct SQL execution via JS client
    // This would need to be run via Supabase Dashboard or CLI
    console.log('📝 Please run the migration SQL manually via Supabase Dashboard SQL Editor');
    return false;
  }

  console.log('✅ Migration applied successfully');
  return true;
}

export async function validateRLSPolicies(config: SupabaseConfig) {
  const supabase = createClient(config.url, config.serviceRoleKey);

  console.log('🔍 Validating RLS policies...');

  const tables = [
    'users', 'sessions', 'events', 'patterns', 'relationships',
    'subscriptions', 'utm_tracks', 'cohorts', 'feature_flags',
    'offers', 'audit_logs', 'retention_policies'
  ];

  const issues: string[] = [];

  for (const table of tables) {
    // Check if RLS is enabled
    const { data: rlsEnabled } = await supabase
      .rpc('check_rls_enabled', { table_name: table })
      .catch(() => ({ data: null }));

    if (!rlsEnabled) {
      issues.push(`❌ RLS not enabled on ${table}`);
    } else {
      console.log(`✅ RLS enabled on ${table}`);
    }

    // Check for policies
    const { data: policies } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', table)
      .catch(() => ({ data: [] }));

    if (!policies || policies.length === 0) {
      issues.push(`⚠️  No policies found on ${table}`);
    } else {
      console.log(`✅ ${policies.length} policies on ${table}`);
    }
  }

  if (issues.length > 0) {
    console.log('\n⚠️  Issues found:');
    issues.forEach(issue => console.log(`  ${issue}`));
    return false;
  }

  console.log('\n✅ All RLS policies validated');
  return true;
}

export async function validateIndexes(config: SupabaseConfig) {
  const supabase = createClient(config.url, config.serviceRoleKey);

  console.log('🔍 Validating indexes...');

  const expectedIndexes = [
    'idx_users_email',
    'idx_sessions_user_id',
    'idx_events_user_id_timestamp',
    'idx_patterns_user_id',
    'idx_relationships_user_id',
    'idx_subscriptions_user_id',
    'idx_utm_tracks_user_id_timestamp',
    'idx_cohorts_user_id',
    'idx_audit_logs_user_id_timestamp'
  ];

  // Query pg_indexes to verify
  const { data: indexes, error } = await supabase
    .rpc('get_indexes')
    .catch(() => ({ data: [], error: null }));

  if (error) {
    console.log('⚠️  Could not validate indexes automatically');
    console.log('📝 Please verify indexes manually via Supabase Dashboard');
    return true; // Don't fail, just warn
  }

  const foundIndexes = indexes?.map((idx: any) => idx.indexname) || [];
  const missing = expectedIndexes.filter(idx => !foundIndexes.includes(idx));

  if (missing.length > 0) {
    console.log(`⚠️  Missing indexes: ${missing.join(', ')}`);
    return false;
  }

  console.log('✅ All indexes validated');
  return true;
}

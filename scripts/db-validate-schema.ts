#!/usr/bin/env tsx
/**
 * Database Schema Validation Script
 * 
 * Validates that core database tables and columns exist.
 * Used in CI after migrations to ensure schema is correct.
 * 
 * Usage:
 *   tsx scripts/db-validate-schema.ts
 * 
 * Environment Variables Required:
 *   - DATABASE_URL (PostgreSQL connection string)
 *   - Or SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import * as pg from 'pg';

interface ValidationResult {
  table: string;
  exists: boolean;
  columns?: string[];
  missingColumns?: string[];
  error?: string;
}

// Core tables that must exist
const REQUIRED_TABLES = [
  'users',
  'sessions',
  'events',
  'patterns',
  'relationships',
  'subscriptions',
  'privacy_prefs',
  'organizations',
  'workflows',
] as const;

// Required columns per table
const REQUIRED_COLUMNS: Record<string, string[]> = {
  users: ['id', 'email', 'createdAt', 'updatedAt'],
  sessions: ['id', 'userId', 'token', 'expiresAt'],
  events: ['id', 'userId', 'filePath', 'eventType', 'timestamp'],
  patterns: ['id', 'userId', 'fileExtension', 'count', 'lastUsed'],
  relationships: ['id', 'userId', 'sourceFile', 'targetFile', 'relationType'],
  subscriptions: ['id', 'userId', 'plan', 'status'],
  privacy_prefs: ['id', 'userId', 'consentGiven', 'monitoringEnabled'],
  organizations: ['id', 'name', 'slug', 'plan'],
  workflows: ['id', 'name', 'definition', 'isActive'],
};

async function validateSchema(): Promise<boolean> {
  const results: ValidationResult[] = [];
  let client: pg.Client | null = null;
  let supabase: ReturnType<typeof createClient> | null = null;

  try {
    // Try Supabase first (if SUPABASE_URL is set)
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('🔍 Using Supabase client for validation...');
      supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
    }

    // Try direct PostgreSQL connection (if DATABASE_URL is set)
    if (process.env.DATABASE_URL && !supabase) {
      console.log('🔍 Using direct PostgreSQL connection for validation...');
      client = new pg.Client({
        connectionString: process.env.DATABASE_URL,
      });
      await client.connect();
    }

    if (!supabase && !client) {
      throw new Error(
        'Missing database connection. Set either:\n' +
        '  - SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY, or\n' +
        '  - DATABASE_URL'
      );
    }

    // Validate each required table
    for (const table of REQUIRED_TABLES) {
      const result: ValidationResult = { table, exists: false };

      try {
        if (supabase) {
          // Use Supabase client
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);

          if (error) {
            // Check if error is "relation does not exist"
            if (error.message.includes('does not exist') || error.code === '42P01') {
              result.exists = false;
              result.error = `Table ${table} does not exist`;
            } else {
              // Table exists but query failed (permissions, etc.)
              result.exists = true;
              result.error = error.message;
            }
          } else {
            result.exists = true;
          }
        } else if (client) {
          // Use direct PostgreSQL connection
          const query = `
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = $1
            ORDER BY ordinal_position
          `;
          const res = await client.query(query, [table]);

          if (res.rows.length === 0) {
            result.exists = false;
            result.error = `Table ${table} does not exist`;
          } else {
            result.exists = true;
            result.columns = res.rows.map((row) => row.column_name);
          }
        }

        // Validate required columns if table exists
        if (result.exists && client && REQUIRED_COLUMNS[table]) {
          const requiredCols = REQUIRED_COLUMNS[table];
          const existingCols = result.columns || [];
          const missingCols = requiredCols.filter(
            (col) => !existingCols.includes(col)
          );

          if (missingCols.length > 0) {
            result.missingColumns = missingCols;
          }
        }

        results.push(result);
      } catch (err) {
        result.error = err instanceof Error ? err.message : String(err);
        results.push(result);
      }
    }

    // Print results
    console.log('\n📊 Schema Validation Results:\n');
    let allValid = true;

    for (const result of results) {
      if (result.exists && !result.missingColumns?.length) {
        console.log(`✅ ${result.table}`);
        if (result.columns) {
          console.log(`   Columns: ${result.columns.length} found`);
        }
      } else {
        allValid = false;
        console.log(`❌ ${result.table}`);
        if (!result.exists) {
          console.log(`   Error: ${result.error || 'Table does not exist'}`);
        }
        if (result.missingColumns && result.missingColumns.length > 0) {
          console.log(`   Missing columns: ${result.missingColumns.join(', ')}`);
        }
      }
    }

    console.log('\n');

    if (allValid) {
      console.log('✅ Schema validation passed!');
      return true;
    } else {
      console.log('❌ Schema validation failed!');
      console.log('\nMissing tables or columns detected.');
      console.log('Please run migrations: npm run prisma:deploy or supabase migration up');
      return false;
    }
  } catch (error) {
    console.error('❌ Schema validation error:', error);
    return false;
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// Run validation
validateSchema()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

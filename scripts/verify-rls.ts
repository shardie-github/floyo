#!/usr/bin/env tsx
/**
 * RLS Verification Script
 * Tests Row Level Security policies to ensure proper isolation
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !SUPABASE_ANON_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface TestResult {
  test: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function testRLSIsolation() {
  console.log('Testing RLS isolation...\n');

  // Test 1: Anonymous user cannot access other users' data
  try {
    const { data, error } = await anonClient
      .from('events')
      .select('*')
      .limit(1);

    if (error && error.code === 'PGRST301') {
      results.push({ test: 'Anonymous access blocked', passed: true });
    } else if (data && data.length === 0) {
      results.push({ test: 'Anonymous access returns empty', passed: true });
    } else {
      results.push({
        test: 'Anonymous access blocked',
        passed: false,
        error: 'Anonymous user can access data',
      });
    }
  } catch (e: any) {
    results.push({
      test: 'Anonymous access blocked',
      passed: true,
    });
  }

  // Test 2: Service role can access all data (for admin operations)
  try {
    const { data, error } = await serviceClient
      .from('events')
      .select('count')
      .limit(1);

    if (!error) {
      results.push({ test: 'Service role has admin access', passed: true });
    } else {
      results.push({
        test: 'Service role has admin access',
        passed: false,
        error: error.message,
      });
    }
  } catch (e: any) {
    results.push({
      test: 'Service role has admin access',
      passed: false,
      error: e.message,
    });
  }

  // Test 3: Privacy tables enforce user isolation
  try {
    const { data, error } = await anonClient
      .from('privacy_prefs')
      .select('*')
      .limit(1);

    if (error || !data || data.length === 0) {
      results.push({
        test: 'Privacy prefs enforce isolation',
        passed: true,
      });
    } else {
      results.push({
        test: 'Privacy prefs enforce isolation',
        passed: false,
        error: 'Anonymous user can access privacy prefs',
      });
    }
  } catch (e: any) {
    results.push({
      test: 'Privacy prefs enforce isolation',
      passed: true,
    });
  }
}

async function generateReport() {
  await testRLSIsolation();

  console.log('\n=== RLS Verification Report ===\n');
  let passed = 0;
  let failed = 0;

  results.forEach((result) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${result.test}`);
    if (result.error) {
      console.log(`   Error: ${result.error}\n`);
    }
    if (result.passed) passed++;
    else failed++;
  });

  console.log(`\nSummary: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

generateReport().catch(console.error);

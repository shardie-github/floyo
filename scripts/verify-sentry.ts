#!/usr/bin/env tsx
/**
 * Verify Sentry Integration
 * 
 * Tests that Sentry is properly configured and can capture errors.
 */

import * as Sentry from '@sentry/nextjs';

async function verifySentry() {
  console.log('🔍 Verifying Sentry integration...\n');
  
  // Check DSN
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    console.log('❌ NEXT_PUBLIC_SENTRY_DSN not set');
    console.log('   Set NEXT_PUBLIC_SENTRY_DSN in .env.local');
    return false;
  }
  
  console.log('✅ NEXT_PUBLIC_SENTRY_DSN is set');
  
  // Check Sentry initialization
  if (!Sentry.getCurrentHub().getClient()) {
    console.log('⚠️  Sentry client not initialized');
    console.log('   Sentry may initialize at runtime');
  } else {
    console.log('✅ Sentry client initialized');
  }
  
  // Test error capture (in development, this won't send to Sentry)
  try {
    Sentry.captureException(new Error('Sentry verification test'));
    console.log('✅ Error capture test completed');
  } catch (error) {
    console.log('❌ Error capture test failed:', error);
    return false;
  }
  
  console.log('\n✅ Sentry verification complete!');
  console.log('   Check Sentry Dashboard for test error');
  
  return true;
}

verifySentry()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

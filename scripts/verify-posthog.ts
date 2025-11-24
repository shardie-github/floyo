#!/usr/bin/env tsx
/**
 * Verify PostHog Integration
 */

async function verifyPostHog() {
  console.log('🔍 Verifying PostHog integration...\n');
  
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) {
    console.log('⚠️  NEXT_PUBLIC_POSTHOG_KEY not set');
    console.log('   PostHog is optional - skipping verification');
    return true;
  }
  
  console.log('✅ NEXT_PUBLIC_POSTHOG_KEY is set');
  console.log('   Verify PostHog in browser console:');
  console.log('   window.posthog?.capture("test_event")');
  
  return true;
}

verifyPostHog()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

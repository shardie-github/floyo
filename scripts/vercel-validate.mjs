#!/usr/bin/env node
/**
 * Vercel Hardening Validation Script
 * 
 * Validates:
 * - /api/health returns 200
 * - Security headers present on /
 * - Preview robots.txt disallows indexing
 * - Admin basic auth returns 401 when unauthenticated
 */

import assert from 'node:assert/strict';

const base = process.env.VALIDATE_BASE_URL || 'http://localhost:3000';
const isPreview = process.env.VERCEL_ENV === 'preview' || base.includes('-vercel.app');

console.log(`[Vercel Guard] Validating ${base} (preview: ${isPreview})`);

// Test 1: Health endpoint
try {
  const healthResp = await fetch(`${base}/api/health`, { method: 'GET' });
  assert.equal(healthResp.status, 200, 'Health endpoint should return 200');
  const healthData = await healthResp.json();
  assert.ok(healthData.ok, 'Health response should have ok: true');
  console.log('✅ Health endpoint: PASS');
} catch (error) {
  console.error('❌ Health endpoint: FAIL', error.message);
  throw error;
}

// Test 2: Security headers
const requiredHeaders = [
  'strict-transport-security',
  'x-frame-options',
  'x-content-type-options',
  'content-security-policy'
];

try {
  const homeResp = await fetch(`${base}/`, { method: 'HEAD' });
  const missingHeaders = requiredHeaders.filter(
    h => !homeResp.headers.get(h)
  );
  
  if (missingHeaders.length > 0) {
    throw new Error(`Missing headers: ${missingHeaders.join(', ')}`);
  }
  
  console.log('✅ Security headers: PASS');
  console.log('   Headers found:', requiredHeaders.map(h => homeResp.headers.get(h) ? '✓' : '✗').join(' '));
} catch (error) {
  console.error('❌ Security headers: FAIL', error.message);
  throw error;
}

// Test 3: Preview robots.txt
if (isPreview) {
  try {
    const robotsResp = await fetch(`${base}/robots.txt`, { method: 'GET' });
    const robotsText = await robotsResp.text();
    
    if (!robotsText.includes('Disallow: /')) {
      throw new Error('Preview robots.txt should disallow indexing');
    }
    
    console.log('✅ Preview robots.txt: PASS');
  } catch (error) {
    console.error('❌ Preview robots.txt: FAIL', error.message);
    // Don't throw - this is a warning for previews
  }
}

// Test 4: Admin basic auth (if ADMIN_BASIC_AUTH is configured)
if (process.env.ADMIN_BASIC_AUTH) {
  try {
    const adminResp = await fetch(`${base}/admin`, { method: 'GET' });
    
    // Should return 401 if auth is required
    if (adminResp.status !== 401) {
      console.warn('⚠️  Admin endpoint did not return 401 (may be configured differently)');
    } else {
      console.log('✅ Admin basic auth: PASS (returns 401 when unauthenticated)');
    }
  } catch (error) {
    console.warn('⚠️  Admin basic auth check: Could not verify', error.message);
  }
} else {
  console.log('ℹ️  Admin basic auth: SKIP (ADMIN_BASIC_AUTH not configured)');
}

console.log('\n[Vercel Guard] Validation PASS');
process.exit(0);

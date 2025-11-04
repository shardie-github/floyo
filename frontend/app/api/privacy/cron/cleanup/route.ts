/**
 * Privacy Background Jobs API Route
 * Handles scheduled cleanup tasks
 */

import { NextRequest, NextResponse } from 'next/server';
import { runPrivacyBackgroundJobs } from '@/lib/background-jobs';

// Secret token to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET;

// POST /api/privacy/cron/cleanup
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret (for Vercel Cron or similar)
    const authHeader = request.headers.get('authorization');
    const secret = authHeader?.replace('Bearer ', '') || request.headers.get('x-cron-secret');

    if (CRON_SECRET && secret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await runPrivacyBackgroundJobs();

    return NextResponse.json({ success: true, message: 'Background jobs completed' });
  } catch (error: any) {
    console.error('Background job error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/privacy/cron/cleanup (for manual triggering)
export async function GET(request: NextRequest) {
  try {
    // In production, require authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await runPrivacyBackgroundJobs();

    return NextResponse.json({ success: true, message: 'Background jobs completed' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

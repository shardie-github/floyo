/**
 * Feature Flags API Route
 * 
 * Returns current feature flags configuration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFeatureFlags } from '@/lib/flags';
import { withErrorHandler } from '@/lib/api/error-handler';

export const GET = withErrorHandler(async (_req: NextRequest) => {
  const flags = await getFeatureFlags();
  return NextResponse.json(flags, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
});

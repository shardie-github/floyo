/**
 * Comparison Data API Route
 * Social proof and comparison data
 */

import { NextRequest, NextResponse } from 'next/server';
import { InsightsService } from '@/lib/services/insights-service';
import { getUserId } from '@/lib/auth-utils';
import { withErrorHandler } from '@/lib/api/error-handler';
import { AuthorizationError } from '@/src/lib/errors';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const userId = await getUserId(request);
  if (!userId) {
    throw new AuthorizationError('Authentication required');
  }

  const insightsService = new InsightsService();
  const comparison = await insightsService.getComparisonData(userId);

  return NextResponse.json(comparison, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
});

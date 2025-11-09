/**
 * Insights API Route
 * Generates personalized insights that drive engagement
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
  const insights = await insightsService.generateInsights(userId);

  return NextResponse.json(insights, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
});

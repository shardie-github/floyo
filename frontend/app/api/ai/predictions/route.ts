/**
 * Predictive Analytics API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { PredictiveAnalytics } from '@/lib/ai/predictive-analytics';
import { getUserId } from '@/lib/auth-utils';
import { withErrorHandler } from '@/lib/api/error-handler';
import { AuthorizationError } from '@/src/lib/errors';
import { cache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache/cache';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const userId = await getUserId(request);
  if (!userId) {
    throw new AuthorizationError('Authentication required');
  }

  const analytics = new PredictiveAnalytics();

  // Cache predictions for 15 minutes
  const cacheKey = `predictions:${userId}`;
  const predictions = await cache.getOrSet(
    cacheKey,
    () => analytics.getAllPredictions(userId),
    CACHE_TTL.long
  );

  return NextResponse.json({ predictions });
});

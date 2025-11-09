/**
 * Smart Insights API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { SmartInsightsEngine } from '@/lib/ai/smart-insights';
import { getUserId } from '@/lib/auth-utils';
import { withErrorHandler } from '@/lib/api/error-handler';
import { AuthorizationError } from '@/src/lib/errors';
import { cache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache/cache';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const userId = await getUserId(request);
  if (!userId) {
    throw new AuthorizationError('Authentication required');
  }

  const engine = new SmartInsightsEngine();

  // Cache insights for 10 minutes
  const cacheKey = `smart-insights:${userId}`;
  const insights = await cache.getOrSet(
    cacheKey,
    () => engine.getAllInsights(userId),
    CACHE_TTL.long
  );

  return NextResponse.json({ insights });
});

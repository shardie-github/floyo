/**
 * AI Recommendations API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { RecommendationEngine } from '@/lib/ai/recommendation-engine';
import { getUserId } from '@/lib/auth-utils';
import { withErrorHandler } from '@/lib/api/error-handler';
import { AuthorizationError } from '@/src/lib/errors';
import { cache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache/cache';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const userId = await getUserId(request);
  if (!userId) {
    throw new AuthorizationError('Authentication required');
  }

  const engine = new RecommendationEngine();

  // Cache recommendations for 5 minutes
  const cacheKey = `recommendations:${userId}`;
  const recommendations = await cache.getOrSet(
    cacheKey,
    () => engine.generateRecommendations(userId),
    CACHE_TTL.medium
  );

  return NextResponse.json({ recommendations });
});

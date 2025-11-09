/**
 * Search API Route
 * Full-text search for files, events, and patterns
 */

import { NextRequest, NextResponse } from 'next/server';
import { SearchService } from '@/lib/search/search-service';
import { getUserId } from '@/lib/auth-utils';
import { withErrorHandler } from '@/lib/api/error-handler';
import { AuthorizationError, ValidationError } from '@/src/lib/errors';
import { rateLimit } from '@/lib/middleware/rate-limit';
import { cache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache/cache';

export const GET = withErrorHandler(async (request: NextRequest) => {
  // Rate limiting
  const rateLimitResult = rateLimit(request);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: rateLimitResult.resetAt },
      {
        status: 429,
        headers: Object.fromEntries(rateLimitResult.headers.entries()),
      }
    );
  }

  const userId = await getUserId(request);
  if (!userId) {
    throw new AuthorizationError('Authentication required');
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  if (!query || query.trim().length < 2) {
    throw new ValidationError('Search query must be at least 2 characters', {
      fields: { q: ['Query too short'] },
    });
  }

  if (limit > 100) {
    throw new ValidationError('Limit cannot exceed 100', {
      fields: { limit: ['Limit too high'] },
    });
  }

  const searchService = new SearchService();

  // Cache search results
  const cacheKey = `${CACHE_KEYS.insights(userId)}:search:${query}:${limit}`;
  const results = await cache.getOrSet(
    cacheKey,
    () => searchService.search(userId, query, limit),
    CACHE_TTL.short
  );

  return NextResponse.json(
    { results, query, count: results.length },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        ...Object.fromEntries(rateLimitResult.headers.entries()),
      },
    }
  );
});

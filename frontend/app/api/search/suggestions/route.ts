/**
 * Search Suggestions API Route
 * Autocomplete suggestions for search
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
      { error: 'Rate limit exceeded' },
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

  if (!query || query.trim().length < 1) {
    return NextResponse.json({ suggestions: [] });
  }

  const searchService = new SearchService();

  // Cache suggestions
  const cacheKey = `${CACHE_KEYS.insights(userId)}:suggestions:${query}`;
  const suggestions = await cache.getOrSet(
    cacheKey,
    () => searchService.getSuggestions(userId, query),
    CACHE_TTL.short
  );

  return NextResponse.json(
    { suggestions },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        ...Object.fromEntries(rateLimitResult.headers.entries()),
      },
    }
  );
});

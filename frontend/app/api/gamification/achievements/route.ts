/**
 * Achievements API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { GamificationService } from '@/lib/services/gamification-service';
import { getUserId } from '@/lib/auth-utils';
import { withErrorHandler } from '@/lib/api/error-handler';
import { AuthorizationError } from '@/src/lib/errors';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const userId = await getUserId(request);
  if (!userId) {
    throw new AuthorizationError('Authentication required');
  }

  const gamificationService = new GamificationService();
  const achievements = await gamificationService.getAchievements(userId);

  return NextResponse.json(achievements, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
});

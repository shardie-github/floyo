/**
 * Time Metrics API Route
 * Addresses time anxiety and efficiency concerns
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getUserId } from '@/lib/auth-utils';
import { withErrorHandler } from '@/lib/api/error-handler';
import { AuthorizationError } from '@/src/lib/errors';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const userId = await getUserId(request);
  if (!userId) {
    throw new AuthorizationError('Authentication required');
  }

  const events = await prisma.event.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    take: 1000,
  });

  // Calculate total hours (estimate: 1 event = 5 minutes average)
  const totalHoursTracked = (events.length * 5) / 60;

  // Find duplicate file accesses (potential time waste)
  const fileAccessCounts = new Map<string, number>();
  events.forEach(e => {
    fileAccessCounts.set(e.filePath, (fileAccessCounts.get(e.filePath) || 0) + 1);
  });

  const duplicateFiles = Array.from(fileAccessCounts.entries())
    .filter(([_, count]) => count > 3)
    .map(([file, count]) => ({ file, count }));

  // Estimate wasted time: each duplicate access after 3rd = 2 minutes wasted
  const wastedTime = duplicateFiles.reduce((sum, { count }) => {
    return sum + Math.max(0, (count - 3) * 2 / 60);
  }, 0);

  // Potential hours saved by optimizing
  const potentialHoursSaved = wastedTime * 5; // Assume 5x multiplier for optimization

  // Calculate efficiency (unique files / total events)
  const uniqueFiles = new Set(events.map(e => e.filePath)).size;
  const efficiency = events.length > 0 ? uniqueFiles / events.length : 0;

  // Generate recommendations
  const recommendations: string[] = [];
  if (efficiency < 0.5) {
    recommendations.push('You\'re accessing the same files repeatedly. Consider organizing your workflow.');
  }
  if (duplicateFiles.length > 5) {
    recommendations.push(`Consolidate ${duplicateFiles.length} frequently accessed files to save time.`);
  }
  if (wastedTime > 2) {
    recommendations.push('Enable file shortcuts or bookmarks to reduce navigation time.');
  }
  if (recommendations.length === 0) {
    recommendations.push('You\'re using your files efficiently! Keep up the good work.');
  }

  return NextResponse.json({
    totalHoursTracked: totalHoursTracked,
    potentialHoursSaved: potentialHoursSaved,
    efficiency: efficiency,
    wastedTime: wastedTime,
    recommendations,
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
});

/**
 * Privacy Score API Route
 * Reduces user anxiety by showing security status
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

  const prefs = await prisma.privacyPrefs.findUnique({
    where: { userId },
  });

  let score = 100;
  const factors: Array<{
    name: string;
    status: 'good' | 'warning' | 'critical';
    message: string;
  }> = [];

  // Consent given
  if (prefs?.consentGiven) {
    factors.push({
      name: 'Consent Given',
      status: 'good',
      message: 'You have given explicit consent for data tracking',
    });
  } else {
    score -= 30;
    factors.push({
      name: 'Consent Given',
      status: 'critical',
      message: 'Enable consent to improve your privacy score',
    });
  }

  // MFA enabled
  if (prefs?.mfaRequired) {
    factors.push({
      name: 'Multi-Factor Authentication',
      status: 'good',
      message: 'MFA is enabled for your account',
    });
  } else {
    score -= 20;
    factors.push({
      name: 'Multi-Factor Authentication',
      status: 'warning',
      message: 'Enable MFA to secure your account',
    });
  }

  // Data retention
  if (prefs?.dataRetentionDays && prefs.dataRetentionDays <= 90) {
    factors.push({
      name: 'Data Retention',
      status: 'good',
      message: `Data retained for ${prefs.dataRetentionDays} days`,
    });
  } else {
    score -= 10;
    factors.push({
      name: 'Data Retention',
      status: 'warning',
      message: 'Consider reducing data retention period',
    });
  }

  // Monitoring enabled (optional, doesn't affect score)
  if (prefs?.monitoringEnabled) {
    factors.push({
      name: 'Monitoring Active',
      status: 'good',
      message: 'Privacy monitoring is active',
    });
  }

  return NextResponse.json({
    score: Math.max(0, Math.min(100, score)),
    factors,
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
});

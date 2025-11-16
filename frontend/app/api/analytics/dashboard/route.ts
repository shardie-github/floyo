/**
 * Analytics Dashboard API Route
 * Provides comprehensive analytics data for business metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth-utils';
import { AuthorizationError } from '@/src/lib/errors';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      throw new AuthorizationError('Authentication required', 'analytics-dashboard');
    }

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30', 10);

    // Call backend analytics dashboard
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(
      `${backendUrl}/api/v1/analytics/dashboard?days=${days}`,
      {
        headers: {
          'Authorization': request.headers.get('authorization') || '',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics dashboard' },
      { status: error instanceof AuthorizationError ? 401 : 500 }
    );
  }
}

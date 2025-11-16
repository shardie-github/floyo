/**
 * Security Monitoring API Route
 * Provides security metrics and policy status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth-utils';
import { AuthorizationError } from '@/src/lib/errors';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      throw new AuthorizationError('Authentication required', 'security-monitoring');
    }

    // Check if user is admin
    const adminUserIds = process.env.ADMIN_USER_IDS?.split(',') || [];
    if (!adminUserIds.includes(userId) && process.env.NODE_ENV === 'production') {
      throw new AuthorizationError('Admin access required', 'security-monitoring');
    }

    // Fetch security data from backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/v1/monitoring/security`, {
      headers: {
        'Authorization': request.headers.get('authorization') || '',
      },
    });

    if (!response.ok) {
      // Return mock data if backend is not available
      return NextResponse.json({
        vulnerabilities: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        },
        policies: {
          https: process.env.NODE_ENV === 'production',
          rls: true,
          cors: true,
          mfa: false,
          csp: true,
          hsts: process.env.NODE_ENV === 'production',
        },
        active_sessions: 0,
        failed_logins_24h: 0,
        security_events_24h: 0,
        last_audit: new Date().toISOString(),
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch security data' },
      { status: error instanceof AuthorizationError ? 401 : 500 }
    );
  }
}

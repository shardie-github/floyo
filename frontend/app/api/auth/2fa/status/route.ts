/**
 * 2FA Status API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth-utils';
import { AuthorizationError } from '@/src/lib/errors';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      throw new AuthorizationError('Authentication required', '2fa-status');
    }

    // Check 2FA status from backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/v1/auth/2fa/status`, {
      headers: {
        'Authorization': request.headers.get('authorization') || '',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ enabled: false });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to check 2FA status' },
      { status: error instanceof AuthorizationError ? 401 : 500 }
    );
  }
}

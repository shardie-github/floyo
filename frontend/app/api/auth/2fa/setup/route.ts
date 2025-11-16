/**
 * 2FA Setup API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth-utils';
import { AuthorizationError } from '@/src/lib/errors';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      throw new AuthorizationError('Authentication required', '2fa-setup');
    }

    // Generate 2FA setup from backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/v1/auth/2fa/setup`, {
      method: 'POST',
      headers: {
        'Authorization': request.headers.get('authorization') || '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to setup 2FA');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to setup 2FA' },
      { status: error instanceof AuthorizationError ? 401 : 500 }
    );
  }
}

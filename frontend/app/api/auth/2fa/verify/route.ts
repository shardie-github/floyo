/**
 * 2FA Verify API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth-utils';
import { AuthorizationError } from '@/src/lib/errors';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      throw new AuthorizationError('Authentication required', '2fa-verify');
    }

    const body = await request.json();
    const { code, secret } = body;

    if (!code || !secret) {
      return NextResponse.json(
        { error: 'Code and secret are required' },
        { status: 400 }
      );
    }

    // Verify 2FA code with backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/v1/auth/2fa/verify`, {
      method: 'POST',
      headers: {
        'Authorization': request.headers.get('authorization') || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, secret }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || 'Invalid verification code' },
        { status: 400 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to verify 2FA code' },
      { status: error instanceof AuthorizationError ? 401 : 500 }
    );
  }
}

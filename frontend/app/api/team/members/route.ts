/**
 * Team Members API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth-utils';
import { AuthorizationError } from '@/src/lib/errors';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      throw new AuthorizationError('Authentication required', 'team-members');
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/v1/team/members`, {
      headers: {
        'Authorization': request.headers.get('authorization') || '',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ members: [] });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch team members' },
      { status: error instanceof AuthorizationError ? 401 : 500 }
    );
  }
}

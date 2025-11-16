/**
 * MindStudio Sync API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth-utils';
import { AuthorizationError } from '@/src/lib/errors';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      throw new AuthorizationError('Authentication required', 'mindstudio-sync');
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/v1/integrations/mindstudio/sync`, {
      method: 'POST',
      headers: {
        'Authorization': request.headers.get('authorization') || '',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to sync MindStudio agents');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to sync MindStudio agents' },
      { status: error instanceof AuthorizationError ? 401 : 500 }
    );
  }
}

/**
 * Privacy MFA Check Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserId, checkMfaElevation } from '@/lib/auth-utils';

const prisma = new PrismaClient();

// GET /api/privacy/mfa/check
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionToken = request.headers.get('x-mfa-session-token');
    const elevated = await checkMfaElevation(userId, sessionToken);

    if (!elevated) {
      return NextResponse.json({ elevated: false });
    }

    // Get session details
    const session = await prisma.mfaEnforcedSession.findUnique({
      where: { sessionToken: sessionToken! },
    });

    return NextResponse.json({
      elevated: true,
      expiresAt: session?.expiresAt.toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Privacy MFA Check Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  // TODO: Verify JWT token
  return null;
}

// GET /api/privacy/mfa/check
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionToken = request.headers.get('x-mfa-session-token');
    if (!sessionToken) {
      return NextResponse.json({ elevated: false });
    }

    const session = await prisma.mfaEnforcedSession.findUnique({
      where: { sessionToken },
    });

    if (!session || session.userId !== userId || session.expiresAt < new Date()) {
      return NextResponse.json({ elevated: false });
    }

    return NextResponse.json({
      elevated: true,
      expiresAt: session.expiresAt.toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

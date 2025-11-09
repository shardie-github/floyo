/**
 * Privacy MFA API Route
 * Handle MFA verification and session elevation
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserId, createMfaSession } from '@/lib/auth-utils';
import { verifyTotp } from '@/lib/totp-utils';

// POST /api/privacy/mfa/verify
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { totpCode, secret } = body;

    if (!totpCode) {
      return NextResponse.json({ error: 'TOTP code required' }, { status: 400 });
    }

    if (!secret) {
      return NextResponse.json({ error: 'TOTP secret required' }, { status: 400 });
    }

    // Verify TOTP
    const isValid = verifyTotp(secret, totpCode);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid TOTP code' }, { status: 403 });
    }

    // Create elevated session (expires in 1 hour)
    const { sessionToken, expiresAt } = await createMfaSession(userId, 1);

    return NextResponse.json({
      sessionToken,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

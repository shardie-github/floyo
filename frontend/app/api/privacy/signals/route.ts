/**
 * Privacy Signals API Route
 * Manage signal toggles and sampling rates
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

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

async function checkMfaElevation(request: NextRequest): Promise<boolean> {
  const userId = await getUserId(request);
  if (!userId) return false;
  const sessionToken = request.headers.get('x-mfa-session-token');
  if (!sessionToken) return false;
  const session = await prisma.mfaEnforcedSession.findUnique({
    where: { sessionToken },
  });
  if (!session || session.userId !== userId || session.expiresAt < new Date()) {
    return false;
  }
  return true;
}

function hashValue(value: any): string {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

async function logTransparencyAction(
  userId: string,
  action: string,
  resource?: string,
  resourceId?: string,
  oldValue?: any,
  newValue?: any
) {
  await prisma.privacyTransparencyLog.create({
    data: {
      userId,
      action,
      resource,
      resourceId,
      oldValueHash: oldValue ? hashValue(oldValue) : null,
      newValueHash: newValue ? hashValue(newValue) : null,
    },
  });
}

const SignalToggleSchema = z.object({
  signalKey: z.string(),
  enabled: z.boolean(),
  samplingRate: z.number().min(0).max(1),
});

// GET /api/privacy/signals
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const signals = await prisma.signalToggle.findMany({
      where: { userId },
      orderBy: { signalKey: 'asc' },
    });

    return NextResponse.json(signals);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/privacy/signals
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await checkMfaElevation(request))) {
      return NextResponse.json(
        { error: 'MFA required to modify signal toggles' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = SignalToggleSchema.parse(body);

    const existing = await prisma.signalToggle.findUnique({
      where: {
        userId_signalKey: {
          userId,
          signalKey: data.signalKey,
        },
      },
    });

    const signal = await prisma.signalToggle.upsert({
      where: {
        userId_signalKey: {
          userId,
          signalKey: data.signalKey,
        },
      },
      create: {
        userId,
        ...data,
      },
      update: data,
    });

    await logTransparencyAction(
      userId,
      'signal_toggled',
      'signal_toggle',
      signal.id,
      existing,
      signal
    );

    return NextResponse.json(signal);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

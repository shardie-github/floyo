/**
 * Privacy Apps API Route
 * Manage app allowlist and scopes
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

const AppAllowlistSchema = z.object({
  appId: z.string(),
  appName: z.string(),
  enabled: z.boolean(),
  scope: z.enum(['metadata_only', 'metadata_plus_usage', 'none']),
});

// GET /api/privacy/apps
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apps = await prisma.appAllowlist.findMany({
      where: { userId },
      orderBy: { appName: 'asc' },
    });

    return NextResponse.json(apps);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/privacy/apps
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await checkMfaElevation(request))) {
      return NextResponse.json(
        { error: 'MFA required to modify app allowlist' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = AppAllowlistSchema.parse(body);

    // Get existing for transparency log
    const existing = await prisma.appAllowlist.findUnique({
      where: {
        userId_appId: {
          userId,
          appId: data.appId,
        },
      },
    });

    const app = await prisma.appAllowlist.upsert({
      where: {
        userId_appId: {
          userId,
          appId: data.appId,
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
      data.enabled ? 'app_enabled' : 'app_disabled',
      'app_allowlist',
      app.id,
      existing,
      app
    );

    return NextResponse.json(app);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

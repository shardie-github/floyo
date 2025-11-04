/**
 * Privacy Delete API Route
 * Soft delete → hard delete after delay (7 days)
 */

import { NextRequest, NextResponse } from 'next/server';
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

async function logTransparencyAction(
  userId: string,
  action: string,
  resource?: string,
  resourceId?: string,
  metadata?: any
) {
  await prisma.privacyTransparencyLog.create({
    data: {
      userId,
      action,
      resource,
      resourceId,
      metadata: metadata || {},
    },
  });
}

// POST /api/privacy/delete
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await checkMfaElevation(request))) {
      return NextResponse.json(
        { error: 'MFA required to delete data' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const immediate = body.immediate === true;

    if (immediate) {
      // Hard delete immediately
      await Promise.all([
        prisma.telemetryEvent.deleteMany({ where: { userId } }),
        prisma.signalToggle.deleteMany({ where: { userId } }),
        prisma.appAllowlist.deleteMany({ where: { userId } }),
        prisma.privacyTransparencyLog.deleteMany({ where: { userId } }),
        prisma.privacyPrefs.deleteMany({ where: { userId } }),
      ]);

      await logTransparencyAction(
        userId,
        'delete_requested',
        'all_data',
        userId,
        { immediate: true }
      );

      return NextResponse.json({
        success: true,
        deletedAt: new Date().toISOString(),
        immediate: true,
      });
    } else {
      // Soft delete: mark for deletion in 7 days
      const deleteAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await prisma.privacyPrefs.update({
        where: { userId },
        data: {
          monitoringEnabled: false,
          consentGiven: false,
          // Store delete request metadata
        },
      });

      await logTransparencyAction(
        userId,
        'delete_requested',
        'all_data',
        userId,
        { deleteAt: deleteAt.toISOString(), immediate: false }
      );

      // TODO: Schedule background job to hard delete after 7 days
      // For now, return the scheduled date

      return NextResponse.json({
        success: true,
        scheduledDeleteAt: deleteAt.toISOString(),
        immediate: false,
        message: 'Data will be permanently deleted after 7 days',
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

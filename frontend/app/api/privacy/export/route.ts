/**
 * Privacy Export API Route
 * Export user telemetry data (async job with signed URL)
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

function hashValue(value: any): string {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
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

// POST /api/privacy/export
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await checkMfaElevation(request))) {
      return NextResponse.json(
        { error: 'MFA required to export data' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    // Collect all user data
    const [prefs, apps, signals, events, logs] = await Promise.all([
      prisma.privacyPrefs.findUnique({ where: { userId } }),
      prisma.appAllowlist.findMany({ where: { userId } }),
      prisma.signalToggle.findMany({ where: { userId } }),
      prisma.telemetryEvent.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
      }),
      prisma.privacyTransparencyLog.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
      }),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      userId,
      preferences: prefs,
      apps,
      signals,
      events,
      transparencyLog: logs,
    };

    // Generate signed URL (expires in 1 hour)
    const exportToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // In production, store export token in database and create signed URL
    // For now, return data directly (in production, use S3/GCS signed URLs)
    const signedUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/privacy/export/${exportToken}?expires=${expiresAt.getTime()}`;

    await logTransparencyAction(
      userId,
      'export_requested',
      'data_export',
      exportToken,
      { format, expiresAt }
    );

    return NextResponse.json({
      exportId: exportToken,
      signedUrl,
      expiresAt: expiresAt.toISOString(),
      format,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/privacy/export/:token (serves the actual export)
export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const expires = parseInt(searchParams.get('expires') || '0');

    if (Date.now() > expires) {
      return NextResponse.json({ error: 'Export link expired' }, { status: 410 });
    }

    // TODO: Verify export token matches userId
    // For now, trust the token

    const [prefs, apps, signals, events, logs] = await Promise.all([
      prisma.privacyPrefs.findUnique({ where: { userId } }),
      prisma.appAllowlist.findMany({ where: { userId } }),
      prisma.signalToggle.findMany({ where: { userId } }),
      prisma.telemetryEvent.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
      }),
      prisma.privacyTransparencyLog.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
      }),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      userId,
      preferences: prefs,
      apps,
      signals,
      events,
      transparencyLog: logs,
    };

    return NextResponse.json(exportData, {
      headers: {
        'Content-Disposition': `attachment; filename="privacy-export-${userId}-${Date.now()}.json"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

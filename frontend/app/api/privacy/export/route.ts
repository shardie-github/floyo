/**
 * Privacy Export API Route
 * Export user telemetry data (async job with signed URL)
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { getUserId, checkMfaElevation } from '@/lib/auth-utils';
import { createS3Export, createLocalExport } from '@/lib/storage-export';
import { createExportToken } from '@/lib/export-tokens';

const prisma = new PrismaClient();

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

    const sessionToken = request.headers.get('x-mfa-session-token');
    if (!userId || !(await checkMfaElevation(userId, sessionToken))) {
      return NextResponse.json(
        { error: 'MFA required to export data' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || 'json') as 'json' | 'csv';

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

    // Create export (S3 if configured, otherwise local)
    const useS3 = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
    
    let exportResult;
    if (useS3) {
      exportResult = await createS3Export({
        userId,
        format,
        data: exportData,
        expiresInHours: 1,
      });
    } else {
      exportResult = createLocalExport({
        userId,
        format,
        data: exportData,
        expiresInHours: 1,
      });
    }

    // Store export token
    await createExportToken(userId, exportResult.exportId, exportResult.expiresAt, format);

    await logTransparencyAction(
      userId,
      'export_requested',
      'data_export',
      exportResult.exportId,
      { format, expiresAt: exportResult.expiresAt.toISOString() }
    );

    return NextResponse.json({
      exportId: exportResult.exportId,
      signedUrl: exportResult.signedUrl,
      expiresAt: exportResult.expiresAt.toISOString(),
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

    // Validate export token
    const { validateExportToken, getExportTokenInfo } = await import('@/lib/export-tokens');
    const isValid = await validateExportToken(params.token, userId);
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid or expired export token' }, { status: 403 });
    }

    const tokenInfo = await getExportTokenInfo(params.token, userId);
    const format = (tokenInfo?.format || 'json') as 'json' | 'csv';

    // Try to get from S3 first, fallback to database
    const useS3 = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
    
    let exportData;
    if (useS3) {
      try {
        const { getExportFromS3 } = await import('@/lib/storage-export');
        exportData = await getExportFromS3(params.token, userId);
      } catch {
        // Fallback to database
        exportData = await getExportDataFromDb(userId);
      }
    } else {
      exportData = await getExportDataFromDb(userId);
    }

    const contentType = format === 'json' ? 'application/json' : 'text/csv';
    const filename = `privacy-export-${userId}-${Date.now()}.${format}`;

    return NextResponse.json(exportData, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function getExportDataFromDb(userId: string) {
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

  return {
    exportedAt: new Date().toISOString(),
    userId,
    preferences: prefs,
    apps,
    signals,
    events,
    transparencyLog: logs,
  };
}

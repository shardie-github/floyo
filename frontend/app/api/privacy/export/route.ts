/**
 * Privacy Export API Route
 * Export user telemetry data (async job with signed URL)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import { getUserId, checkMfaElevation } from '@/lib/auth-utils';
import { createS3Export, createLocalExport } from '@/lib/storage-export';
import { createExportToken } from '@/lib/export-tokens';
import { createErrorResponse, withErrorHandler } from '@/lib/api/error-handler';
import { ValidationError, AuthorizationError } from '@/src/lib/errors';

const ExportFormatSchema = z.enum(['json', 'csv']);

async function logTransparencyAction(
  userId: string,
  action: string,
  resource?: string,
  resourceId?: string,
  metadata?: Record<string, unknown>
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
export const POST = withErrorHandler(async (request: NextRequest) => {
  const userId = await getUserId(request);
  if (!userId) {
    throw new AuthorizationError('Authentication required');
  }

  const sessionToken = request.headers.get('x-mfa-session-token');
  if (!(await checkMfaElevation(userId, sessionToken))) {
    throw new AuthorizationError('MFA required to export data', { resource: 'export' });
  }

  const { searchParams } = new URL(request.url);
  const formatParam = searchParams.get('format') || 'json';
  const formatResult = ExportFormatSchema.safeParse(formatParam);
  if (!formatResult.success) {
    throw new ValidationError('Invalid format parameter', {
      fields: { format: ['Must be "json" or "csv"'] },
    });
  }
  const format = formatResult.data;

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
});

// GET /api/privacy/export/:token (serves the actual export)
export const GET = withErrorHandler(async (request: NextRequest, { params }: { params: { token: string } }) => {
  const userId = await getUserId(request);
  if (!userId) {
    throw new AuthorizationError('Authentication required');
  }

  const { searchParams } = new URL(request.url);
  const expires = parseInt(searchParams.get('expires') || '0');

  if (Date.now() > expires) {
    throw new ValidationError('Export link expired', {}, { resource: 'export', resourceId: params.token });
  }

  // Validate export token
  const { validateExportToken, getExportTokenInfo } = await import('@/lib/export-tokens');
  const isValid = await validateExportToken(params.token, userId);
  
  if (!isValid) {
    throw new AuthorizationError('Invalid or expired export token', { resource: 'export', resourceId: params.token });
  }

  const tokenInfo = await getExportTokenInfo(params.token, userId);
  const formatResult = ExportFormatSchema.safeParse(tokenInfo?.format || 'json');
  const format = formatResult.success ? formatResult.data : 'json';

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
});

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

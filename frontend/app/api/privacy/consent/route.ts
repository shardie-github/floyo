/**
 * Privacy API Route Handlers
 * Next.js API routes for privacy-first monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Auth helper (replace with your actual auth implementation)
async function getUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  // TODO: Verify JWT token and extract user ID
  // For now, return null if not authenticated
  // In production, use proper JWT verification
  return null;
}

// MFA check helper
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

// Hash helper for transparency log
function hashValue(value: any): string {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

// Write to transparency log
async function logTransparencyAction(
  userId: string,
  action: string,
  resource?: string,
  resourceId?: string,
  oldValue?: any,
  newValue?: any,
  metadata?: any
) {
  await prisma.privacyTransparencyLog.create({
    data: {
      userId,
      action,
      resource,
      resourceId,
      oldValueHash: oldValue ? hashValue(oldValue) : null,
      newValueHash: newValue ? hashValue(newValue) : null,
      metadata: metadata || {},
    },
  });
}

// POST /api/privacy/consent
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check MFA elevation
    if (!(await checkMfaElevation(request))) {
      return NextResponse.json(
        { error: 'MFA required to update consent' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const ConsentSchema = z.object({
      consentGiven: z.boolean(),
      dataRetentionDays: z.number().int().min(1).max(365),
      mfaRequired: z.boolean(),
      monitoringEnabled: z.boolean().optional(),
    });

    const data = ConsentSchema.parse(body);

    // Get existing prefs for transparency log
    const existing = await prisma.privacyPrefs.findUnique({
      where: { userId },
    });

    const prefs = await prisma.privacyPrefs.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
        monitoringEnabled: data.monitoringEnabled ?? data.consentGiven,
        lastReviewedAt: new Date(),
      },
      update: {
        ...data,
        monitoringEnabled: data.monitoringEnabled ?? data.consentGiven,
        lastReviewedAt: new Date(),
      },
    });

    // Log to transparency log
    await logTransparencyAction(
      userId,
      data.consentGiven ? 'consent_given' : 'consent_revoked',
      'privacy_prefs',
      prefs.id,
      existing,
      prefs
    );

    return NextResponse.json(prefs);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/privacy/consent
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prefs = await prisma.privacyPrefs.findUnique({
      where: { userId },
    });

    if (!prefs) {
      return NextResponse.json({
        consentGiven: false,
        dataRetentionDays: 14,
        mfaRequired: true,
        monitoringEnabled: false,
      });
    }

    return NextResponse.json(prefs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

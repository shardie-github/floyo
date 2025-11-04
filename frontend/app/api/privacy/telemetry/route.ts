/**
 * Privacy Telemetry API Route
 * Submit telemetry events (client-side, with redaction)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { getUserId } from '@/lib/auth-utils';

const prisma = new PrismaClient();

// Check kill-switch
const PRIVACY_KILL_SWITCH = process.env.PRIVACY_KILL_SWITCH === 'true';

// Redact sensitive fields
function redactMetadata(metadata: any): any {
  if (!metadata || typeof metadata !== 'object') {
    return metadata;
  }

  const sensitiveKeys = ['password', 'token', 'secret', 'api_key', 'credit_card', 'ssn', 'key'];
  const redacted = { ...metadata };

  for (const key of sensitiveKeys) {
    if (key in redacted) {
      delete redacted[key];
    }
  }

  // Hash window titles if they contain sensitive patterns
  if (redacted.window_title && typeof redacted.window_title === 'string') {
    const sensitivePatterns = /password|secret|token|key|credit|ssn/i;
    if (sensitivePatterns.test(redacted.window_title)) {
      redacted.window_title = '[REDACTED]';
    }
  }

  return redacted;
}

const TelemetryEventSchema = z.object({
  appId: z.string(),
  eventType: z.string(),
  durationMs: z.number().int().optional(),
  metadata: z.record(z.any()).optional(),
});

// POST /api/privacy/telemetry
export async function POST(request: NextRequest) {
  try {
    // Check kill-switch
    if (PRIVACY_KILL_SWITCH) {
      return NextResponse.json(
        { success: false, reason: 'kill_switch_active' },
        { status: 503 }
      );
    }

    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has monitoring enabled
    const prefs = await prisma.privacyPrefs.findUnique({
      where: { userId },
    });

    if (!prefs || !prefs.monitoringEnabled || !prefs.consentGiven) {
      return NextResponse.json(
        { success: false, reason: 'monitoring_disabled' },
        { status: 403 }
      );
    }

    // Check if app is allowed
    const app = await prisma.appAllowlist.findUnique({
      where: {
        userId_appId: {
          userId,
          appId: '', // Will be set from body
        },
      },
    });

    const body = await request.json();
    const data = TelemetryEventSchema.parse(body);

    // Re-check app with actual appId
    const allowedApp = await prisma.appAllowlist.findUnique({
      where: {
        userId_appId: {
          userId,
          appId: data.appId,
        },
      },
    });

    if (!allowedApp || !allowedApp.enabled || allowedApp.scope === 'none') {
      return NextResponse.json(
        { success: false, reason: 'app_not_allowed' },
        { status: 403 }
      );
    }

    // Check signal toggle
    const signalToggle = await prisma.signalToggle.findUnique({
      where: {
        userId_signalKey: {
          userId,
          signalKey: data.eventType,
        },
      },
    });

    if (signalToggle && !signalToggle.enabled) {
      return NextResponse.json(
        { success: false, reason: 'signal_disabled' },
        { status: 403 }
      );
    }

    // Apply sampling rate
    const samplingRate = signalToggle?.samplingRate ?? 1.0;
    if (Math.random() > samplingRate) {
      return NextResponse.json({ success: false, reason: 'sampled_out' });
    }

    // Redact metadata
    const redactedMetadata = data.metadata ? redactMetadata(data.metadata) : null;

    // Create event
    const event = await prisma.telemetryEvent.create({
      data: {
        userId,
        appId: data.appId,
        eventType: data.eventType,
        durationMs: data.durationMs,
        metadataRedactedJson: redactedMetadata,
      },
    });

    return NextResponse.json({ success: true, eventId: event.id });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    // Fail silently to avoid disrupting user experience
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

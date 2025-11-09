/**
 * Privacy Telemetry API Route
 * Submit telemetry events (client-side, with redaction)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import { getUserId } from '@/lib/auth-utils';
import { createErrorResponse, withErrorHandler } from '@/lib/api/error-handler';
import { ValidationError } from '@/src/lib/errors';

// Check kill-switch
const PRIVACY_KILL_SWITCH = process.env.PRIVACY_KILL_SWITCH === 'true';

// Redact sensitive fields
function redactMetadata(metadata: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
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
  appId: z.string().min(1),
  eventType: z.string().min(1),
  durationMs: z.number().int().positive().optional(),
  metadata: z.record(z.unknown()).optional(),
});

type TelemetryEventInput = z.infer<typeof TelemetryEventSchema>;

// POST /api/privacy/telemetry
export const POST = withErrorHandler(async (request: NextRequest) => {
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
    const _app = await prisma.appAllowlist.findUnique({
      where: {
        userId_appId: {
          userId,
          appId: '', // Will be set from body
        },
      },
    });

    const body = await request.json();
    const parseResult = TelemetryEventSchema.safeParse(body);
    if (!parseResult.success) {
      throw new ValidationError('Invalid telemetry event data', {
        fields: parseResult.error.flatten().fieldErrors,
      });
    }
    const data: TelemetryEventInput = parseResult.data;

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
});

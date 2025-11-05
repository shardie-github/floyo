import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/utils/rate-limit';
import { log } from '@/lib/obs/log';
import { z } from 'zod';

// [CRUX+HARDEN:BEGIN:ingest-guardrails]

const MAX_PAYLOAD_SIZE = 1024 * 1024; // 1MB

const ingestSchema = z.object({
  userId: z.string().uuid().optional(),
  events: z.array(z.object({
    filePath: z.string().max(500),
    eventType: z.enum(['created', 'modified', 'accessed', 'deleted']),
    tool: z.string().optional(),
    timestamp: z.string().datetime().optional(),
    metadata: z.record(z.any()).optional(),
  })).max(1000), // Max 1000 events per batch
});

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown';
    
    if (!rateLimit(`ingest:${ip}`, 100, 20)) {
      log.warn('Rate limit exceeded', { ip });
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // Check payload size
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_PAYLOAD_SIZE) {
      return NextResponse.json(
        { error: 'Payload too large' },
        { status: 413 }
      );
    }

    // Parse and validate body
    const body = await req.json();
    
    // Additional size check after parsing
    const bodySize = JSON.stringify(body).length;
    if (bodySize > MAX_PAYLOAD_SIZE) {
      return NextResponse.json(
        { error: 'Payload too large' },
        { status: 413 }
      );
    }

    // Validate schema
    const validated = ingestSchema.parse(body);

    // Process events (placeholder - replace with actual processing)
    log.info('Events ingested', { 
      count: validated.events.length,
      ip 
    });

    return NextResponse.json({ 
      success: true,
      processed: validated.events.length 
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      log.error('Validation error', { error: error.errors });
      return NextResponse.json(
        { error: 'Invalid payload', details: error.errors },
        { status: 400 }
      );
    }

    log.error('Ingest error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// [CRUX+HARDEN:END:ingest-guardrails]

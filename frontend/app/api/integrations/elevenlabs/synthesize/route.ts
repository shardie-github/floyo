/**
 * ElevenLabs Voice Synthesis API
 * Synthesize voice using ElevenLabs API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

/**
 * POST /api/integrations/elevenlabs/synthesize
 * Synthesize voice from text
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId, text, voiceId, modelId, stability, similarityBoost } = body;

    if (!userId || !text) {
      return NextResponse.json(
        { error: 'userId and text are required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured', code: 'CONFIG_ERROR' },
        { status: 500 }
      );
    }

    // Default voice ID if not provided
    const defaultVoiceId = voiceId || '21m00Tcm4TlvDq8ikWAM'; // Rachel voice

    // Synthesize voice
    const synthesisResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${defaultVoiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: modelId || 'eleven_monolingual_v1',
          voice_settings: {
            stability: stability || 0.5,
            similarity_boost: similarityBoost || 0.5,
          },
        }),
      }
    );

    if (!synthesisResponse.ok) {
      const error = await synthesisResponse.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: 'Failed to synthesize voice',
          details: error,
          code: 'API_ERROR',
        },
        { status: synthesisResponse.status }
      );
    }

    // Get audio data
    const audioBuffer = await synthesisResponse.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    // Log synthesis event
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await supabase.from('audit_logs').insert({
        action: 'elevenlabs_synthesis',
        userId,
        resource: 'elevenlabs',
        metadata: {
          voiceId: defaultVoiceId,
          textLength: text.length,
          modelId: modelId || 'eleven_monolingual_v1',
        },
        timestamp: new Date(),
      });
    }

    return NextResponse.json({
      ok: true,
      audio: audioBase64,
      format: 'mp3',
      voiceId: defaultVoiceId,
    });
  } catch (error: any) {
    console.error('ElevenLabs synthesis error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integrations/elevenlabs/voices
 * List available voices
 */
export async function GET() {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured', code: 'CONFIG_ERROR' },
        { status: 500 }
      );
    }

    const voicesResponse = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (!voicesResponse.ok) {
      const error = await voicesResponse.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: 'Failed to fetch voices',
          details: error,
          code: 'API_ERROR',
        },
        { status: voicesResponse.status }
      );
    }

    const voicesData = await voicesResponse.json();
    const voices = voicesData.voices || [];

    return NextResponse.json({
      ok: true,
      voices: voices.map((voice: any) => ({
        voiceId: voice.voice_id,
        name: voice.name,
        category: voice.category,
        description: voice.description,
      })),
    });
  } catch (error: any) {
    console.error('ElevenLabs voices fetch error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

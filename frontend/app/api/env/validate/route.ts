/**
 * Environment Variable Validation Endpoint
 * 
 * Validates all required environment variables and reports any missing or invalid ones.
 * Useful for health checks and debugging configuration issues.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validatePublicEnv, validateServerEnv } from '@/lib/env';

export const runtime = 'nodejs';

interface ValidationResult {
  ok: boolean;
  timestamp: string;
  public: {
    valid: boolean;
    errors: string[];
    variables: Record<string, string | undefined>;
  };
  server: {
    valid: boolean;
    errors: string[];
    variables: Record<string, string | undefined>;
  };
}

export async function GET(req: NextRequest) {
  const result: ValidationResult = {
    ok: true,
    timestamp: new Date().toISOString(),
    public: {
      valid: false,
      errors: [],
      variables: {},
    },
    server: {
      valid: false,
      errors: [],
      variables: {},
    },
  };

  // Validate public environment variables
  try {
    const publicEnv = validatePublicEnv();
    result.public.valid = true;
    result.public.variables = {
      NEXT_PUBLIC_SUPABASE_URL: publicEnv.NEXT_PUBLIC_SUPABASE_URL ? '***set***' : undefined,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '***set***' : undefined,
      NEXT_PUBLIC_API_URL: publicEnv.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_SITE_URL: publicEnv.NEXT_PUBLIC_SITE_URL,
    };
  } catch (error: any) {
    result.public.valid = false;
    result.public.errors = [error.message || 'Validation failed'];
    result.ok = false;
  }

  // Validate server environment variables
  try {
    const serverEnv = validateServerEnv();
    result.server.valid = true;
    result.server.variables = {
      DATABASE_URL: serverEnv.DATABASE_URL ? '***set***' : undefined,
      SUPABASE_URL: serverEnv.SUPABASE_URL ? '***set***' : undefined,
      SUPABASE_SERVICE_ROLE_KEY: serverEnv.SUPABASE_SERVICE_ROLE_KEY ? '***set***' : undefined,
      SECRET_KEY: serverEnv.SECRET_KEY ? '***set***' : undefined,
    };
  } catch (error: any) {
    result.server.valid = false;
    result.server.errors = [error.message || 'Validation failed'];
    result.ok = false;
  }

  const statusCode = result.ok ? 200 : 503;

  return NextResponse.json(result, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

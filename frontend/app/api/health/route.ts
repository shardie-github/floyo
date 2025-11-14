/**
 * Enhanced Health Check API Route
 * 
 * Provides comprehensive health status including dependencies and environment variable validation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@supabase/supabase-js';
import prisma from '@/lib/db/prisma';

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_JWT_SECRET',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

interface HealthStatus {
  ok: boolean;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  missing: string[];
  checks: {
    database: {
      status: 'healthy' | 'unhealthy';
      latencyMs?: number;
    };
    supabase: {
      status: 'healthy' | 'unhealthy';
      latencyMs?: number;
    };
  };
}

export const GET = withErrorHandler(async (_req: NextRequest) => {
  // Validate required environment variables
  const missing = REQUIRED_ENV_VARS.filter(key => !process.env[key]);

  const checks: HealthStatus['checks'] = {
    database: { status: 'unhealthy' },
    supabase: { status: 'unhealthy' },
  };

  // Check Prisma database
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: 'healthy',
      latencyMs: Date.now() - dbStart,
    };
  } catch (error) {
    checks.database.status = 'unhealthy';
  }

  // Check Supabase
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (supabaseUrl && supabaseServiceKey) {
      const supabaseStart = Date.now();
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await supabase.from('users').select('id').limit(1);
      checks.supabase = {
        status: 'healthy',
        latencyMs: Date.now() - supabaseStart,
      };
    }
  } catch (error) {
    checks.supabase.status = 'unhealthy';
  }

  // Determine overall status
  const allHealthy = Object.values(checks).every(check => check.status === 'healthy') && missing.length === 0;
  const anyUnhealthy = Object.values(checks).some(check => check.status === 'unhealthy') || missing.length > 0;
  
  const status: HealthStatus['status'] = allHealthy 
    ? 'healthy' 
    : anyUnhealthy 
      ? 'unhealthy' 
      : 'degraded';

  const healthStatus: HealthStatus = {
    ok: missing.length === 0 && allHealthy,
    status,
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    missing,
    checks,
  };

  const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;

  return NextResponse.json(healthStatus, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
});

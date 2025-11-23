import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

/**
 * Health check endpoint for monitoring and load balancers.
 * 
 * Performs actual health checks on:
 * - Database connectivity (Supabase)
 * - Service availability
 * 
 * Returns 200 if healthy, 503 if degraded/unhealthy.
 */
export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, { status: 'ok' | 'error' | 'warning'; message?: string; latency?: number }> = {};
  
  try {
    // Check database connectivity via Supabase
    let dbCheckStart = Date.now();
    try {
      const supabase = getSupabaseServer();
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1)
        .single();
      
      const dbLatency = Date.now() - dbCheckStart;
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned, which is OK
        checks.database = {
          status: 'error',
          message: `Database query failed: ${error.message}`,
          latency: dbLatency,
        };
      } else {
        checks.database = {
          status: 'ok',
          message: 'Database connection successful',
          latency: dbLatency,
        };
      }
    } catch (dbError) {
      const dbLatency = Date.now() - dbCheckStart;
      checks.database = {
        status: 'error',
        message: dbError instanceof Error ? dbError.message : 'Database connection failed',
        latency: dbLatency,
      };
    }
    
    // Check environment configuration
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ];
    
    const missingEnv = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );
    
    if (missingEnv.length > 0) {
      checks.environment = {
        status: 'error',
        message: `Missing required environment variables: ${missingEnv.join(', ')}`,
      };
    } else {
      checks.environment = {
        status: 'ok',
        message: 'All required environment variables present',
      };
    }
    
    // Determine overall status
    const hasErrors = Object.values(checks).some((c) => c.status === 'error');
    const hasWarnings = Object.values(checks).some((c) => c.status === 'warning');
    const overallStatus = hasErrors ? 'unhealthy' : hasWarnings ? 'degraded' : 'healthy';
    const httpStatus = hasErrors ? 503 : hasWarnings ? 200 : 200; // Return 200 for degraded, 503 only for errors
    
    const totalLatency = Date.now() - startTime;
    
    return NextResponse.json(
      {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks,
        latency_ms: totalLatency,
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      },
      { 
        status: httpStatus,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Health-Check': 'true',
        },
      }
    );
  } catch (error) {
    const totalLatency = Date.now() - startTime;
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        checks: {
          health_endpoint: {
            status: 'error',
            message: 'Health check endpoint failed',
          },
        },
        latency_ms: totalLatency,
      },
      { 
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Health-Check': 'true',
        },
      }
    );
  }
}

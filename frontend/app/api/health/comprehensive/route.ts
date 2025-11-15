/**
 * Comprehensive Health Check Endpoint
 * 
 * Provides detailed health status for all system components:
 * - Database connectivity
 * - Supabase services
 * - External integrations
 * - Environment configuration
 * - System metrics
 */

import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'
import { validatePublicEnv } from '@/lib/env'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  environment: string
  checks: {
    database: ComponentHealth
    supabase: ComponentHealth
    environment: ComponentHealth
    integrations: Record<string, ComponentHealth>
  }
  metrics?: {
    responseTime: number
    uptime: number
  }
}

interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  message?: string
  latency?: number
  details?: Record<string, unknown>
}

const startTime = Date.now()

export async function GET() {
  const start = Date.now()
  const checks: HealthStatus['checks'] = {
    database: await checkDatabase(),
    supabase: await checkSupabase(),
    environment: checkEnvironment(),
    integrations: await checkIntegrations(),
  }

  // Determine overall status
  const allHealthy = Object.values(checks).every(
    (check) => check.status === 'healthy' || (typeof check === 'object' && Object.values(check).every((c) => c.status === 'healthy'))
  )
  const anyUnhealthy = Object.values(checks).some(
    (check) => check.status === 'unhealthy' || (typeof check === 'object' && Object.values(check).some((c) => c.status === 'unhealthy'))
  )

  const overallStatus: HealthStatus['status'] = allHealthy
    ? 'healthy'
    : anyUnhealthy
    ? 'unhealthy'
    : 'degraded'

  const responseTime = Date.now() - start
  const uptime = Math.floor((Date.now() - startTime) / 1000)

  const health: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks,
    metrics: {
      responseTime,
      uptime,
    },
  }

  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503

  return NextResponse.json(health, { status: statusCode })
}

async function checkDatabase(): Promise<ComponentHealth> {
  const start = Date.now()
  try {
    const supabase = getSupabaseServer()
    const { error } = await supabase.from('users').select('count').limit(1)

    if (error) {
      return {
        status: 'unhealthy',
        message: `Database connection failed: ${error.message}`,
        latency: Date.now() - start,
      }
    }

    return {
      status: 'healthy',
      message: 'Database connection successful',
      latency: Date.now() - start,
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown database error',
      latency: Date.now() - start,
    }
  }
}

async function checkSupabase(): Promise<ComponentHealth> {
  const start = Date.now()
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return {
        status: 'unhealthy',
        message: 'Supabase configuration missing',
      }
    }

    // Test Supabase connection
    const supabase = getSupabaseServer()
    const { error } = await supabase.auth.getUser()

    // Auth check might fail if no user, but connection should work
    const latency = Date.now() - start

    return {
      status: error && error.message.includes('JWT') ? 'degraded' : 'healthy',
      message: error && error.message.includes('JWT') ? 'Supabase connected but auth check failed (expected)' : 'Supabase connection successful',
      latency,
      details: {
        url: supabaseUrl,
        hasServiceKey: !!supabaseKey,
      },
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown Supabase error',
      latency: Date.now() - start,
    }
  }
}

function checkEnvironment(): ComponentHealth {
  try {
    const env = validatePublicEnv()
    return {
      status: 'healthy',
      message: 'Environment variables validated',
      details: {
        hasSupabaseUrl: !!env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        nodeEnv: env.NODE_ENV,
      },
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Environment validation failed',
    }
  }
}

async function checkIntegrations(): Promise<Record<string, ComponentHealth>> {
  const integrations: Record<string, ComponentHealth> = {}

  // Check Stripe
  integrations.stripe = {
    status: process.env.STRIPE_API_KEY ? 'healthy' : 'degraded',
    message: process.env.STRIPE_API_KEY ? 'Stripe configured' : 'Stripe not configured',
  }

  // Check Redis
  integrations.redis = {
    status: process.env.REDIS_URL ? 'healthy' : 'degraded',
    message: process.env.REDIS_URL ? 'Redis configured' : 'Redis not configured',
  }

  // Check Sentry
  integrations.sentry = {
    status: process.env.NEXT_PUBLIC_SENTRY_DSN ? 'healthy' : 'degraded',
    message: process.env.NEXT_PUBLIC_SENTRY_DSN ? 'Sentry configured' : 'Sentry not configured',
  }

  // Check PostHog
  integrations.posthog = {
    status: process.env.NEXT_PUBLIC_POSTHOG_KEY ? 'healthy' : 'degraded',
    message: process.env.NEXT_PUBLIC_POSTHOG_KEY ? 'PostHog configured' : 'PostHog not configured',
  }

  // Check external integrations
  const externalIntegrations = [
    { key: 'zapier', envKey: 'ZAPIER_SECRET' },
    { key: 'tiktok', envKey: 'TIKTOK_ADS_API_KEY' },
    { key: 'meta', envKey: 'META_ADS_ACCESS_TOKEN' },
    { key: 'elevenlabs', envKey: 'ELEVENLABS_API_KEY' },
    { key: 'autods', envKey: 'AUTODS_API_KEY' },
    { key: 'capcut', envKey: 'CAPCUT_API_KEY' },
    { key: 'minstudio', envKey: 'MINSTUDIO_API_KEY' },
  ]

  for (const integration of externalIntegrations) {
    integrations[integration.key] = {
      status: process.env[integration.envKey] ? 'healthy' : 'degraded',
      message: process.env[integration.envKey] ? `${integration.key} configured` : `${integration.key} not configured`,
    }
  }

  return integrations
}

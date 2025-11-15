/**
 * Environment Variable Validation Schema
 * 
 * Validates all environment variables at build time and runtime.
 * Ensures type safety and prevents runtime errors from missing variables.
 */

import { z } from 'zod';

/**
 * Schema for public environment variables (exposed to browser)
 */
const publicEnvSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().min(1),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  
  // API Configuration
  NEXT_PUBLIC_API_URL: z.string().url().optional().default('http://localhost:8000'),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional().default('http://localhost:3000'),
  
  // Monitoring & Observability
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional().default('https://us.i.posthog.com'),
  
  // Feature Flags
  NEXT_PUBLIC_PRIVACY_KILL_SWITCH: z.string().transform((val) => val === 'true').optional().default('false'),
  NEXT_PUBLIC_TRUST_STATUS_PAGE: z.string().transform((val) => val === 'true').optional().default('false'),
  NEXT_PUBLIC_TRUST_HELP_CENTER: z.string().transform((val) => val === 'true').optional().default('false'),
  NEXT_PUBLIC_TRUST_EXPORT: z.string().transform((val) => val === 'true').optional().default('false'),
  NEXT_PUBLIC_CSP_ENABLED: z.string().transform((val) => val === 'true').optional().default('false'),
  NEXT_PUBLIC_CSP_ALLOWLIST: z.string().optional(),
  
  // Integrations
  NEXT_PUBLIC_HCAPTCHA_SITEKEY: z.string().optional(),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().optional(),
  
  // App Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),
  NEXT_PUBLIC_ENV: z.enum(['development', 'production', 'staging']).optional(),
  
  // WebSocket (optional)
  NEXT_PUBLIC_WS_URL: z.string().url().optional(),
  
  // App Version
  NEXT_PUBLIC_APP_VERSION: z.string().optional().default('1.0.0'),
});

/**
 * Schema for server-side environment variables (not exposed to browser)
 */
const serverEnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().min(1),
  
  // Supabase Server-side
  SUPABASE_URL: z.string().url().min(1),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_JWT_SECRET: z.string().optional(),
  
  // Security
  SECRET_KEY: z.string().min(32, 'SECRET_KEY must be at least 32 characters'),
  CRON_SECRET: z.string().optional(),
  VERCEL_CRON_SECRET: z.string().optional(),
  ADMIN_BASIC_AUTH: z.string().optional(),
  SNAPSHOT_ENCRYPTION_KEY: z.string().optional(),
  
  // Payment Processing
  STRIPE_API_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  
  // Redis & Cache
  REDIS_URL: z.string().url().optional(),
  CELERY_BROKER_URL: z.string().url().optional(),
  CELERY_RESULT_BACKEND: z.string().url().optional(),
  
  // AWS (for exports)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  
  // External Integrations
  ZAPIER_SECRET: z.string().optional(),
  TIKTOK_ADS_API_KEY: z.string().optional(),
  TIKTOK_ADS_API_SECRET: z.string().optional(),
  META_ADS_ACCESS_TOKEN: z.string().optional(),
  META_ADS_APP_ID: z.string().optional(),
  META_ADS_APP_SECRET: z.string().optional(),
  ELEVENLABS_API_KEY: z.string().optional(),
  AUTODS_API_KEY: z.string().optional(),
  CAPCUT_API_KEY: z.string().optional(),
  MINSTUDIO_API_KEY: z.string().optional(),
  
  // CI/CD
  SUPABASE_ACCESS_TOKEN: z.string().optional(),
  SUPABASE_PROJECT_REF: z.string().optional(),
  VERCEL_TOKEN: z.string().optional(),
  VERCEL_ORG_ID: z.string().optional(),
  VERCEL_PROJECT_ID: z.string().optional(),
  
  // Application
  ENVIRONMENT: z.enum(['development', 'staging', 'production']).optional().default('development'),
  FRONTEND_URL: z.string().url().optional().default('http://localhost:3000'),
  
  // ISR Configuration
  REVALIDATE_SECONDS: z.string().transform((val) => parseInt(val, 10)).optional().default('60'),
});

/**
 * Type-safe environment variables for client-side usage
 */
export type PublicEnv = z.infer<typeof publicEnvSchema>;

/**
 * Type-safe environment variables for server-side usage
 */
export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Validates public environment variables
 * Call this at the top of your app to ensure all required vars are set
 */
export function validatePublicEnv(): PublicEnv {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_PRIVACY_KILL_SWITCH: process.env.NEXT_PUBLIC_PRIVACY_KILL_SWITCH,
    NEXT_PUBLIC_TRUST_STATUS_PAGE: process.env.NEXT_PUBLIC_TRUST_STATUS_PAGE,
    NEXT_PUBLIC_TRUST_HELP_CENTER: process.env.NEXT_PUBLIC_TRUST_HELP_CENTER,
    NEXT_PUBLIC_TRUST_EXPORT: process.env.NEXT_PUBLIC_TRUST_EXPORT,
    NEXT_PUBLIC_CSP_ENABLED: process.env.NEXT_PUBLIC_CSP_ENABLED,
    NEXT_PUBLIC_CSP_ALLOWLIST: process.env.NEXT_PUBLIC_CSP_ALLOWLIST,
    NEXT_PUBLIC_HCAPTCHA_SITEKEY: process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
  };

  try {
    return publicEnvSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      throw new Error(
        `Environment validation failed:\n${missing.join('\n')}\n\n` +
        `Please check your .env.local file and ensure all required variables are set.`
      );
    }
    throw error;
  }
}

/**
 * Validates server-side environment variables
 * Call this in API routes and server components
 */
export function validateServerEnv(): ServerEnv {
  const env = {
    DATABASE_URL: process.env.DATABASE_URL,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET,
    SECRET_KEY: process.env.SECRET_KEY,
    CRON_SECRET: process.env.CRON_SECRET,
    VERCEL_CRON_SECRET: process.env.VERCEL_CRON_SECRET,
    ADMIN_BASIC_AUTH: process.env.ADMIN_BASIC_AUTH,
    SNAPSHOT_ENCRYPTION_KEY: process.env.SNAPSHOT_ENCRYPTION_KEY,
    STRIPE_API_KEY: process.env.STRIPE_API_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    SENTRY_DSN: process.env.SENTRY_DSN,
    REDIS_URL: process.env.REDIS_URL,
    CELERY_BROKER_URL: process.env.CELERY_BROKER_URL,
    CELERY_RESULT_BACKEND: process.env.CELERY_RESULT_BACKEND,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION,
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
    ZAPIER_SECRET: process.env.ZAPIER_SECRET,
    TIKTOK_ADS_API_KEY: process.env.TIKTOK_ADS_API_KEY,
    TIKTOK_ADS_API_SECRET: process.env.TIKTOK_ADS_API_SECRET,
    META_ADS_ACCESS_TOKEN: process.env.META_ADS_ACCESS_TOKEN,
    META_ADS_APP_ID: process.env.META_ADS_APP_ID,
    META_ADS_APP_SECRET: process.env.META_ADS_APP_SECRET,
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
    AUTODS_API_KEY: process.env.AUTODS_API_KEY,
    CAPCUT_API_KEY: process.env.CAPCUT_API_KEY,
    MINSTUDIO_API_KEY: process.env.MINSTUDIO_API_KEY,
    SUPABASE_ACCESS_TOKEN: process.env.SUPABASE_ACCESS_TOKEN,
    SUPABASE_PROJECT_REF: process.env.SUPABASE_PROJECT_REF,
    VERCEL_TOKEN: process.env.VERCEL_TOKEN,
    VERCEL_ORG_ID: process.env.VERCEL_ORG_ID,
    VERCEL_PROJECT_ID: process.env.VERCEL_PROJECT_ID,
    ENVIRONMENT: process.env.ENVIRONMENT,
    FRONTEND_URL: process.env.FRONTEND_URL,
    REVALIDATE_SECONDS: process.env.REVALIDATE_SECONDS,
  };

  try {
    return serverEnvSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      throw new Error(
        `Server environment validation failed:\n${missing.join('\n')}\n\n` +
        `Please check your environment variables and ensure all required variables are set.`
      );
    }
    throw error;
  }
}

/**
 * Get validated public environment variables
 * Use this instead of process.env for type safety
 */
export const env = (() => {
  try {
    return validatePublicEnv();
  } catch (error) {
    // In development, log warning but don't fail
    if (process.env.NODE_ENV === 'development') {
      console.warn('Environment validation warning:', error);
      // Return defaults for development
      return {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
        NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
        NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        NEXT_PUBLIC_PRIVACY_KILL_SWITCH: process.env.NEXT_PUBLIC_PRIVACY_KILL_SWITCH === 'true',
        NEXT_PUBLIC_TRUST_STATUS_PAGE: process.env.NEXT_PUBLIC_TRUST_STATUS_PAGE === 'true',
        NEXT_PUBLIC_TRUST_HELP_CENTER: process.env.NEXT_PUBLIC_TRUST_HELP_CENTER === 'true',
        NEXT_PUBLIC_TRUST_EXPORT: process.env.NEXT_PUBLIC_TRUST_EXPORT === 'true',
        NEXT_PUBLIC_CSP_ENABLED: process.env.NEXT_PUBLIC_CSP_ENABLED === 'true',
        NEXT_PUBLIC_CSP_ALLOWLIST: process.env.NEXT_PUBLIC_CSP_ALLOWLIST,
        NEXT_PUBLIC_HCAPTCHA_SITEKEY: process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY,
        NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
        NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV as 'development' | 'production' | 'staging' | undefined,
        NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
        NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      } as PublicEnv;
    }
    // In production, fail fast
    throw error;
  }
})();

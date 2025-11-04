/**
 * Environment variable helper with validation
 */

import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  
  // Optional
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ENVIRONMENT: z.enum(['development', 'staging', 'production']).default('development'),
  
  // Secrets
  JWT_SECRET: z.string().optional(),
  ENCRYPTION_KEY: z.string().optional(),
  SNAPSHOT_ENCRYPTION_KEY: z.string().optional(),
  
  // External services
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  RELEASE_WEBHOOK_URL: z.string().url().optional(),
  
  // Feature flags
  QUIET_MODE: z.enum(['true', 'false']).default('false'),
  ENABLE_BILLING: z.enum(['true', 'false']).default('false'),
});

export type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | null = null;

export function requireEnv(): Env {
  if (validatedEnv) {
    return validatedEnv;
  }

  try {
    validatedEnv = envSchema.parse(process.env);
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      throw new Error(`Missing or invalid environment variables:\n${missing.join('\n')}`);
    }
    throw error;
  }
}

export function getEnv(key: keyof Env): string {
  const env = requireEnv();
  const value = env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value as string;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.ENVIRONMENT === 'production';
}

export function isQuietMode(): boolean {
  return process.env.QUIET_MODE === 'true';
}

export function isBillingEnabled(): boolean {
  return process.env.ENABLE_BILLING === 'true';
}

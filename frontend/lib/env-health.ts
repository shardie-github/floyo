/**
 * Environment Health Checker
 * 
 * Provides runtime environment variable validation and health checks.
 * Can be used in middleware, API routes, and server components.
 */

import { validatePublicEnv, validateServerEnv } from './env';

export interface EnvHealthStatus {
  ok: boolean;
  public: {
    valid: boolean;
    missing: string[];
    invalid: string[];
  };
  server: {
    valid: boolean;
    missing: string[];
    invalid: string[];
  };
  timestamp: string;
}

/**
 * Check environment variable health
 */
export function checkEnvHealth(): EnvHealthStatus {
  const status: EnvHealthStatus = {
    ok: true,
    public: {
      valid: false,
      missing: [],
      invalid: [],
    },
    server: {
      valid: false,
      missing: [],
      invalid: [],
    },
    timestamp: new Date().toISOString(),
  };

  // Check public environment variables
  try {
    validatePublicEnv();
    status.public.valid = true;
  } catch (error: any) {
    status.public.valid = false;
    if (error.message) {
      // Extract missing variables from error message
      const missingMatch = error.message.match(/NEXT_PUBLIC_\w+/g);
      if (missingMatch) {
        status.public.missing = [...new Set(missingMatch)];
      }
    }
    status.ok = false;
  }

  // Check server environment variables (only in server context)
  if (typeof window === 'undefined') {
    try {
      validateServerEnv();
      status.server.valid = true;
    } catch (error: any) {
      status.server.valid = false;
      if (error.message) {
        const missingMatch = error.message.match(/(DATABASE_URL|SUPABASE_\w+|SECRET_KEY)/g);
        if (missingMatch) {
          status.server.missing = [...new Set(missingMatch)];
        }
      }
      status.ok = false;
    }
  }

  return status;
}

/**
 * Get critical environment variables status
 */
export function getCriticalEnvStatus(): {
  ok: boolean;
  missing: string[];
} {
  const requiredPublic = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const missing: string[] = [];

  for (const key of requiredPublic) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  return {
    ok: missing.length === 0,
    missing,
  };
}

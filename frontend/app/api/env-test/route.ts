/**
 * Environment Test API Route
 * 
 * Returns non-sensitive environment variable names and status
 * (without exposing actual secret values)
 * 
 * Used for smoke testing deployed Vercel functions
 */

import { NextResponse } from 'next/server';

interface EnvTestResult {
  timestamp: string;
  environment: string;
  variables: {
    name: string;
    present: boolean;
    length?: number; // Length of value (not the value itself)
  }[];
  checks: {
    database: boolean;
    supabase: boolean;
    vercel: boolean;
  };
}

export const GET = async () => {
  const variables = [
    'DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_JWT_SECRET',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_ACCESS_TOKEN',
    'SUPABASE_PROJECT_REF',
    'VERCEL_TOKEN',
    'VERCEL_ORG_ID',
    'VERCEL_PROJECT_ID',
  ];

  const envStatus = variables.map(name => ({
    name,
    present: !!process.env[name],
    length: process.env[name]?.length,
  }));

  const checks = {
    database: !!process.env.DATABASE_URL,
    supabase: !!(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
    vercel: !!process.env.VERCEL,
  };

  const result: EnvTestResult = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    variables: envStatus,
    checks,
  };

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
};

/**
 * API Documentation Route
 * Serves OpenAPI/Swagger documentation
 */

import { NextRequest, NextResponse } from 'next/server';
import { openApiSpec } from '@/lib/api/openapi';

export const GET = (_req: NextRequest) => {
  return NextResponse.json(openApiSpec, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
};

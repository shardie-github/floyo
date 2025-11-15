/**
 * API Route: Wiring Status
 * 
 * Serves the latest connectivity matrix JSON
 */

import { NextResponse } from 'next/server';
import * as fs from 'fs';

export const runtime = 'nodejs'; // Requires Node.js for file system access
import * as path from 'path';

export async function GET() {
  try {
    const statusPath = path.join(process.cwd(), '..', 'reports/connectivity/connectivity.json');
    
    if (fs.existsSync(statusPath)) {
      const data = fs.readFileSync(statusPath, 'utf-8');
      const matrix = JSON.parse(data);
      return NextResponse.json(matrix);
    }
    
    // Return default if report doesn't exist
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      checks: [],
      summary: {
        total: 0,
        pass: 0,
        fail: 0,
        degraded: 0,
        skip: 0,
      },
      message: 'Run "pnpm wiring:run" to generate connectivity report',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

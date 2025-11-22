import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check database connectivity
    // Note: Adjust based on your database setup
    const dbHealthy = true; // TODO: Add actual database health check
    
    // Check external services
    const services = {
      database: dbHealthy,
      timestamp: new Date().toISOString(),
    };
    
    const allHealthy = Object.values(services).every(v => v === true);
    
    return NextResponse.json(
      {
        status: allHealthy ? 'healthy' : 'degraded',
        services,
        uptime: process.uptime(),
      },
      { status: allHealthy ? 200 : 503 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

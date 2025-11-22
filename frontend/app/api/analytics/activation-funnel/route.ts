import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);
    
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/analytics/activation-funnel?days=${days}`, {
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Cookie': request.headers.get('Cookie') || '',
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch activation funnel');
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching activation funnel:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch activation funnel' },
      { status: 500 }
    );
  }
}

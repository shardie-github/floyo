// [STAKE+TRUST:BEGIN:audit_api]
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // TODO: Replace with real auth user id from session
    // For now, this is a placeholder that should be replaced with actual auth
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader) {
      // In real implementation, verify JWT token and extract user ID
      // const token = authHeader.replace('Bearer ', '');
      // const decoded = verifyToken(token);
      // userId = decoded.userId;
    }

    // For now, return empty array if no user ID
    // In production, this should require authentication
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .eq('user_id', userId)
      .order('ts', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Audit log fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch audit log' },
        { status: 500 }
      );
    }

    return NextResponse.json({ rows: data || [] });
  } catch (error: any) {
    console.error('Audit log API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
// [STAKE+TRUST:END:audit_api]

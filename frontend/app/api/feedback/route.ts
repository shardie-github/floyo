// [STAKE+TRUST:BEGIN:feedback_api]
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
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

    const { userId = 'anon', rating, comment } = await req.json();

    // Insert feedback into audit_log table
    // In production, you might want a separate feedback table
    const { error } = await supabase.from('audit_log').insert({
      user_id: userId,
      action: 'feedback',
      meta: {
        rating,
        comment,
        timestamp: new Date().toISOString(),
      },
    });

    if (error) {
      console.error('Feedback submission error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Feedback API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
// [STAKE+TRUST:END:feedback_api]

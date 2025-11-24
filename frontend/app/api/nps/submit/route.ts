import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { score, feedback } = await req.json();

    // Validate score
    if (typeof score !== 'number' || score < 0 || score > 10) {
      return NextResponse.json(
        { error: 'Score must be between 0 and 10' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Determine category
    let category: 'promoter' | 'passive' | 'detractor';
    if (score >= 9) {
      category = 'promoter';
    } else if (score >= 7) {
      category = 'passive';
    } else {
      category = 'detractor';
    }

    // Store NPS submission
    const { error: insertError } = await supabase
      .from('nps_submissions')
      .insert({
        user_id: user.id,
        score,
        feedback: feedback || null,
        category,
        submitted_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Failed to store NPS submission:', insertError);
      return NextResponse.json(
        { error: 'Failed to submit survey' },
        { status: 500 }
      );
    }

    // Trigger follow-up for detractors
    if (category === 'detractor') {
      // Queue follow-up email (implement email service)
      // await sendDetractorFollowUp(user.id, feedback);
    }

    // Trigger thank you for promoters
    if (category === 'promoter') {
      // Queue thank you email
      // await sendPromoterThankYou(user.id);
    }

    return NextResponse.json({ 
      message: 'Thank you for your feedback!',
      category 
    });
  } catch (error) {
    console.error('NPS submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabaseServer();
    
    // Check admin access (implement admin check)
    // const { data: { user } } = await supabase.auth.getUser();
    // if (!user || !isAdmin(user.id)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    // }

    // Get NPS score (last 30 days)
    const { data: npsData, error: npsError } = await supabase
      .rpc('calculate_nps_score', { days_back: 30 });

    if (npsError) {
      console.error('Failed to calculate NPS:', npsError);
      return NextResponse.json(
        { error: 'Failed to calculate NPS' },
        { status: 500 }
      );
    }

    // Get recent feedback
    const { data: recentFeedback, error: feedbackError } = await supabase
      .from('nps_submissions')
      .select('score, feedback, category, submitted_at, user_id')
      .order('submitted_at', { ascending: false })
      .limit(50);

    if (feedbackError) {
      console.error('Failed to fetch feedback:', feedbackError);
    }

    // Get trend data (last 12 months)
    const { data: trendData, error: trendError } = await supabase
      .from('nps_submissions')
      .select('score, submitted_at')
      .gte('submitted_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .order('submitted_at', { ascending: true });

    // Group by month
    const monthlyTrend = trendData?.reduce((acc, item) => {
      const month = new Date(item.submitted_at).toISOString().slice(0, 7);
      if (!acc[month]) {
        acc[month] = { scores: [], count: 0 };
      }
      acc[month].scores.push(item.score);
      acc[month].count++;
      return acc;
    }, {} as Record<string, { scores: number[]; count: number }>);

    // Calculate monthly NPS
    const trend = Object.entries(monthlyTrend || {}).map(([month, data]) => {
      const promoters = data.scores.filter(s => s >= 9).length;
      const detractors = data.scores.filter(s => s <= 6).length;
      const nps = data.count > 0 
        ? ((promoters - detractors) / data.count) * 100 
        : 0;
      
      return {
        month,
        nps: Math.round(nps * 10) / 10,
        count: data.count,
      };
    });

    return NextResponse.json({
      score: npsData?.[0]?.score || null,
      count: npsData?.[0]?.total_responses || 0,
      promoters: npsData?.[0]?.promoters || 0,
      passives: npsData?.[0]?.passives || 0,
      detractors: npsData?.[0]?.detractors || 0,
      recentFeedback: recentFeedback || [],
      trend: trend || [],
    });
  } catch (error) {
    console.error('NPS admin error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

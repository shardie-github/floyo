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

    // Get active subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('status', 'active');

    if (subError) {
      console.error('Failed to fetch subscriptions:', subError);
    }

    // Calculate MRR
    const mrr = subscriptions?.reduce((total, sub) => {
      if (sub.plan === 'pro') return total + 29;
      if (sub.plan === 'enterprise') return total + 99;
      return total;
    }, 0) || 0;

    // Calculate ARR
    const arr = mrr * 12;

    // Get total customers
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id', { count: 'exact' });

    const totalCustomers = users?.length || 0;

    // Calculate churn rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: cancelled, error: cancelledError } = await supabase
      .from('subscriptions')
      .select('id', { count: 'exact' })
      .eq('status', 'canceled')
      .gte('updatedAt', thirtyDaysAgo.toISOString());

    const cancelledCount = cancelled?.length || 0;
    const activeCount = subscriptions?.length || 0;
    const churnRate = activeCount > 0 
      ? Math.round((cancelledCount / activeCount) * 100 * 10) / 10
      : 0;

    // Get plan distribution
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id');

    const { data: allSubs, error: allSubsError } = await supabase
      .from('subscriptions')
      .select('plan, status');

    const freeUsers = (allUsers?.length || 0) - (allSubs?.filter(s => s.status === 'active').length || 0);
    const proUsers = allSubs?.filter(s => s.plan === 'pro' && s.status === 'active').length || 0;
    const enterpriseUsers = allSubs?.filter(s => s.plan === 'enterprise' && s.status === 'active').length || 0;

    return NextResponse.json({
      mrr,
      arr,
      totalCustomers,
      churnRate,
      planDistribution: {
        free: freeUsers,
        pro: proUsers,
        enterprise: enterpriseUsers,
      },
      // TODO: Calculate changes (requires historical data)
      mrrChange: null,
      arrChange: null,
      customerChange: null,
      churnChange: null,
    });
  } catch (error) {
    console.error('Revenue admin error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

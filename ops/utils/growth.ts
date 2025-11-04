/**
 * Growth Engine - UTM tracking and cohort analysis
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface UTMParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export async function trackUTM(userId: string, params: UTMParams): Promise<void> {
  // Check if this is first touch
  const existing = await prisma.uTMTrack.findFirst({
    where: { userId },
    orderBy: { timestamp: 'asc' }
  });

  const isFirstTouch = !existing;

  // Mark previous last touch as false
  await prisma.uTMTrack.updateMany({
    where: {
      userId,
      lastTouch: true
    },
    data: {
      lastTouch: false
    }
  });

  // Create new tracking entry
  await prisma.uTMTrack.create({
    data: {
      userId,
      source: params.source,
      medium: params.medium,
      campaign: params.campaign,
      term: params.term,
      content: params.content,
      firstTouch: isFirstTouch,
      lastTouch: true
    }
  });

  // Update cohort if first touch
  if (isFirstTouch) {
    const cohortMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    await prisma.cohort.upsert({
      where: {
        userId_cohortMonth: {
          userId,
          cohortMonth
        }
      },
      create: {
        userId,
        cohortMonth,
        acquiredAt: new Date()
      },
      update: {}
    });
  }
}

export async function generateCohortReport(): Promise<{
  cohorts: Array<{
    month: string;
    acquired: number;
    retained: number;
    revenue: number;
  }>;
  ltv: number;
}> {
  const cohorts = await prisma.cohort.findMany({
    include: {
      user: {
        include: {
          subscriptions: true
        }
      }
    }
  });

  const cohortData = cohorts.reduce((acc, cohort) => {
    const month = cohort.cohortMonth;
    if (!acc[month]) {
      acc[month] = {
        month,
        acquired: 0,
        retained: 0,
        revenue: 0
      };
    }
    acc[month].acquired++;
    
    // Check if user is still active (has subscription)
    if (cohort.user.subscriptions.some(s => s.status === 'active')) {
      acc[month].retained++;
    }

    // Calculate revenue
    const revenue = cohort.user.subscriptions.reduce((sum, sub) => {
      if (sub.status === 'active') {
        const planRevenue = {
          free: 0,
          pro: 29,
          enterprise: 99
        }[sub.plan] || 0;
        return sum + planRevenue;
      }
      return sum;
    }, 0);
    acc[month].revenue += revenue;

    return acc;
  }, {} as Record<string, any>);

  const ltv = Object.values(cohortData).reduce((sum: number, cohort: any) => {
    return sum + (cohort.revenue / cohort.acquired);
  }, 0) / Object.keys(cohortData).length;

  return {
    cohorts: Object.values(cohortData),
    ltv: ltv || 0
  };
}

export async function generateGrowthReport(): Promise<string> {
  const report = await generateCohortReport();
  
  const csv = [
    'Month,Acquired,Retained,Revenue,Retention Rate',
    ...report.cohorts.map(c => 
      `${c.month},${c.acquired},${c.retained},${c.revenue},${((c.retained / c.acquired) * 100).toFixed(2)}%`
    )
  ].join('\n');

  return csv;
}

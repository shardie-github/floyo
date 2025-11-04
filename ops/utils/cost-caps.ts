/**
 * Cost Caps - Quota and throttling logic
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CostQuota {
  service: string;
  dailyLimit: number;
  monthlyLimit: number;
  currentDaily: number;
  currentMonthly: number;
}

const quotas: Record<string, CostQuota> = {
  vercel: {
    service: 'vercel',
    dailyLimit: 10, // $10/day
    monthlyLimit: 300, // $300/month
    currentDaily: 0,
    currentMonthly: 0
  },
  supabase: {
    service: 'supabase',
    dailyLimit: 5, // $5/day
    monthlyLimit: 150, // $150/month
    currentDaily: 0,
    currentMonthly: 0
  },
  external_apis: {
    service: 'external_apis',
    dailyLimit: 3, // $3/day
    monthlyLimit: 90, // $90/month
    currentDaily: 0,
    currentMonthly: 0
  }
};

export async function checkCostQuota(service: string, cost: number): Promise<{
  allowed: boolean;
  reason?: string;
  recommendation?: string;
}> {
  const quota = quotas[service];
  if (!quota) {
    return { allowed: true };
  }

  const now = new Date();
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Reset daily/monthly if needed (in production, would query database)
  if (quota.currentDaily > 0 && now < startOfDay) {
    quota.currentDaily = 0;
  }
  if (quota.currentMonthly > 0 && now < startOfMonth) {
    quota.currentMonthly = 0;
  }

  // Check limits
  if (quota.currentDaily + cost > quota.dailyLimit) {
    return {
      allowed: false,
      reason: `Daily limit exceeded for ${service}`,
      recommendation: `Current: $${quota.currentDaily.toFixed(2)}, Limit: $${quota.dailyLimit}, Requested: $${cost.toFixed(2)}`
    };
  }

  if (quota.currentMonthly + cost > quota.monthlyLimit) {
    return {
      allowed: false,
      reason: `Monthly limit exceeded for ${service}`,
      recommendation: `Current: $${quota.currentMonthly.toFixed(2)}, Limit: $${quota.monthlyLimit}, Requested: $${cost.toFixed(2)}`
    };
  }

  // Update counters
  quota.currentDaily += cost;
  quota.currentMonthly += cost;

  return { allowed: true };
}

export function throttleRequest(service: string): boolean {
  // Simple throttling logic
  // In production, would use Redis or similar
  return true;
}

export async function simulateCosts(scenario: string): Promise<{
  totalCost: number;
  breakdown: Record<string, number>;
  withinBudget: boolean;
}> {
  const scenarios: Record<string, Record<string, number>> = {
    normal: {
      vercel: 5,
      supabase: 2,
      external_apis: 1
    },
    high_traffic: {
      vercel: 15,
      supabase: 8,
      external_apis: 5
    },
    spike: {
      vercel: 50,
      supabase: 20,
      external_apis: 15
    }
  };

  const costs = scenarios[scenario] || scenarios.normal;
  const totalCost = Object.values(costs).reduce((sum, cost) => sum + cost, 0);

  const withinBudget = Object.entries(costs).every(([service, cost]) => {
    const quota = quotas[service];
    return quota && cost <= quota.monthlyLimit;
  });

  return {
    totalCost,
    breakdown: costs,
    withinBudget
  };
}

export async function sendCostAlert(service: string, cost: number, quota: CostQuota): Promise<void> {
  // Send alert via webhook or email
  const message = `⚠️ Cost alert for ${service}:
    Current: $${cost.toFixed(2)}
    Daily limit: $${quota.dailyLimit}
    Monthly limit: $${quota.monthlyLimit}
    
    Recommendation: ${cost > quota.dailyLimit * 0.8 ? 'Consider throttling' : 'Monitor closely'}
  `;
  
  console.log(message);
  // In production, would send to webhook/email
}

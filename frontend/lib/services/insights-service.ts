/**
 * Insights Service
 * 
 * Taps into user psychology: FOMO, urgency, personalization, anxiety reduction.
 * Creates compelling, personalized insights that drive engagement.
 */

import prisma from '@/lib/db/prisma';

export interface Insight {
  id: string;
  type: 'fomo' | 'achievement' | 'comparison' | 'efficiency' | 'security' | 'opportunity';
  title: string;
  message: string;
  urgency: 'low' | 'medium' | 'high';
  cta?: {
    text: string;
    action: string;
  };
  expiresAt?: string;
  icon: string;
}

export interface ComparisonData {
  yourStats: {
    filesTracked: number;
    efficiency: number;
    productivity: number;
  };
  averageStats: {
    filesTracked: number;
    efficiency: number;
    productivity: number;
  };
  percentile: number;
  message: string;
}

export class InsightsService {
  /**
   * Generate personalized insights for user
   * Taps into: FOMO, comparison, achievement, efficiency anxiety
   */
  async generateInsights(userId: string): Promise<Insight[]> {
    const insights: Insight[] = [];

    // FOMO: "You're missing out on..."
    const fomoInsights = await this.generateFOMOInsights(userId);
    insights.push(...fomoInsights);

    // Comparison: "You're in the top X%"
    const comparisonInsights = await this.generateComparisonInsights(userId);
    insights.push(...comparisonInsights);

    // Efficiency: "You could save X hours"
    const efficiencyInsights = await this.generateEfficiencyInsights(userId);
    insights.push(...efficiencyInsights);

    // Achievement: "You're close to..."
    const achievementInsights = await this.generateAchievementInsights(userId);
    insights.push(...achievementInsights);

    // Security: "Your privacy score is..."
    const securityInsights = await this.generateSecurityInsights(userId);
    insights.push(...securityInsights);

    return insights.sort((a, b) => {
      const urgencyOrder = { high: 3, medium: 2, low: 1 };
      return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
    });
  }

  /**
   * FOMO Insights - "You're missing out"
   */
  private async generateFOMOInsights(userId: string): Promise<Insight[]> {
    const insights: Insight[] = [];
    const events = await prisma.event.count({ where: { userId } });
    const lastEvent = await prisma.event.findFirst({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    });

    if (!lastEvent) {
      insights.push({
        id: 'fomo_no_tracking',
        type: 'fomo',
        title: 'Start Tracking Now',
        message: 'You\'re missing out on insights about your file usage patterns. Start tracking to discover hidden productivity opportunities.',
        urgency: 'high',
        cta: { text: 'Start Tracking', action: '/dashboard' },
        icon: '🚀',
      });
      return insights;
    }

    const daysSinceLastEvent = Math.floor(
      (Date.now() - lastEvent.timestamp.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastEvent > 3) {
      insights.push({
        id: 'fomo_inactive',
        type: 'fomo',
        title: 'You\'ve Been Inactive',
        message: `You haven't tracked any files in ${daysSinceLastEvent} days. You're missing valuable insights about your productivity patterns.`,
        urgency: 'high',
        cta: { text: 'Resume Tracking', action: '/dashboard' },
        icon: '⏰',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    // Limited time insight
    if (events < 50) {
      insights.push({
        id: 'fomo_early_adopter',
        type: 'fomo',
        title: 'Early Adopter Bonus',
        message: 'Track 50 files this week to unlock exclusive early adopter badge and premium features.',
        urgency: 'high',
        cta: { text: 'Track More Files', action: '/dashboard' },
        icon: '⭐',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    return insights;
  }

  /**
   * Comparison Insights - Social proof, status
   */
  private async generateComparisonInsights(userId: string): Promise<Insight[]> {
    const insights: Insight[] = [];
    const events = await prisma.event.count({ where: { userId } });
    
    // Get average across all users
    const allUsers = await prisma.user.findMany({ select: { id: true } });
    let totalEvents = 0;
    for (const user of allUsers) {
      totalEvents += await prisma.event.count({ where: { userId: user.id } });
    }
    const averageEvents = allUsers.length > 0 ? totalEvents / allUsers.length : 0;

    const percentile = events > averageEvents ? 
      Math.min(90 + ((events - averageEvents) / averageEvents) * 10, 99) :
      Math.max(10, (events / averageEvents) * 50);

    if (percentile >= 90) {
      insights.push({
        id: 'comparison_top_performer',
        type: 'comparison',
        title: 'Top Performer 🏆',
        message: `You're in the top ${100 - percentile.toFixed(0)}% of users! You track ${events} files vs average of ${averageEvents.toFixed(0)}.`,
        urgency: 'medium',
        icon: '🏆',
      });
    } else if (percentile >= 75) {
      insights.push({
        id: 'comparison_above_average',
        type: 'comparison',
        title: 'Above Average',
        message: `You're doing better than ${percentile.toFixed(0)}% of users. Keep it up!`,
        urgency: 'low',
        icon: '📈',
      });
    } else if (events < averageEvents * 0.5) {
      insights.push({
        id: 'comparison_below_average',
        type: 'comparison',
        title: 'Room for Growth',
        message: `You track ${events} files, but the average is ${averageEvents.toFixed(0)}. Track more to unlock better insights!`,
        urgency: 'medium',
        cta: { text: 'Track More', action: '/dashboard' },
        icon: '📊',
      });
    }

    return insights;
  }

  /**
   * Efficiency Insights - Time anxiety, productivity
   */
  private async generateEfficiencyInsights(userId: string): Promise<Insight[]> {
    const insights: Insight[] = [];
    const events = await prisma.event.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    if (events.length < 10) return insights;

    // Calculate potential time saved
    const duplicateFiles = new Set<string>();
    events.forEach(e => {
      if (events.filter(ev => ev.filePath === e.filePath).length > 1) {
        duplicateFiles.add(e.filePath);
      }
    });

    const potentialHoursSaved = duplicateFiles.size * 0.5; // Assume 30 min per duplicate

    if (potentialHoursSaved > 2) {
      insights.push({
        id: 'efficiency_time_save',
        type: 'efficiency',
        title: 'Save Time',
        message: `You could save ${potentialHoursSaved.toFixed(1)} hours per week by consolidating ${duplicateFiles.size} duplicate file patterns.`,
        urgency: 'medium',
        cta: { text: 'Optimize Now', action: '/dashboard?tab=patterns' },
        icon: '⏱️',
      });
    }

    // Efficiency score
    const uniqueFiles = new Set(events.map(e => e.filePath)).size;
    const efficiency = uniqueFiles / events.length;

    if (efficiency < 0.5) {
      insights.push({
        id: 'efficiency_low',
        type: 'efficiency',
        title: 'Low Efficiency Detected',
        message: `You're accessing the same ${events.length - uniqueFiles} files repeatedly. Consider organizing your workflow.`,
        urgency: 'medium',
        cta: { text: 'View Patterns', action: '/dashboard?tab=patterns' },
        icon: '⚠️',
      });
    }

    return insights;
  }

  /**
   * Achievement Insights - Progress, milestones
   */
  private async generateAchievementInsights(userId: string): Promise<Insight[]> {
    const insights: Insight[] = [];
    const events = await prisma.event.count({ where: { userId } });
    const patterns = await prisma.pattern.count({ where: { userId } });

    // Milestone tracking
    const milestones = [10, 50, 100, 500, 1000];
    const nextMilestone = milestones.find(m => m > events);

    if (nextMilestone) {
      const progress = (events / nextMilestone) * 100;
      if (progress >= 80) {
        insights.push({
          id: 'achievement_close',
          type: 'achievement',
          title: 'Almost There!',
          message: `You're ${nextMilestone - events} files away from ${nextMilestone} files tracked! Unlock a special badge.`,
          urgency: 'high',
          cta: { text: 'Track More', action: '/dashboard' },
          icon: '🎯',
        });
      }
    }

    // Pattern discovery
    if (patterns === 0 && events >= 5) {
      insights.push({
        id: 'achievement_patterns',
        type: 'achievement',
        title: 'Discover Patterns',
        message: 'You\'ve tracked enough files to discover usage patterns. Unlock insights about your workflow!',
        urgency: 'medium',
        cta: { text: 'View Patterns', action: '/dashboard?tab=patterns' },
        icon: '🔍',
      });
    }

    return insights;
  }

  /**
   * Security Insights - Privacy anxiety reduction
   */
  private async generateSecurityInsights(userId: string): Promise<Insight[]> {
    const insights: Insight[] = [];
    const prefs = await prisma.privacyPrefs.findUnique({
      where: { userId },
    });

    if (!prefs) {
      insights.push({
        id: 'security_setup',
        type: 'security',
        title: 'Secure Your Data',
        message: 'Set up privacy preferences to control what data is tracked. Your privacy matters.',
        urgency: 'high',
        cta: { text: 'Privacy Settings', action: '/settings/privacy' },
        icon: '🔒',
      });
      return insights;
    }

    // Privacy score calculation
    let privacyScore = 100;
    if (!prefs.consentGiven) privacyScore -= 30;
    if (!prefs.mfaRequired) privacyScore -= 20;
    if (prefs.dataRetentionDays > 90) privacyScore -= 10;

    if (privacyScore < 70) {
      insights.push({
        id: 'security_low_score',
        type: 'security',
        title: 'Privacy Score: ' + privacyScore,
        message: `Your privacy score is ${privacyScore}/100. Enable MFA and review your settings to improve it.`,
        urgency: 'medium',
        cta: { text: 'Improve Privacy', action: '/settings/privacy' },
        icon: '🛡️',
      });
    } else {
      insights.push({
        id: 'security_good_score',
        type: 'security',
        title: 'Privacy Score: ' + privacyScore,
        message: `Great! Your privacy score is ${privacyScore}/100. You're taking good care of your data.`,
        urgency: 'low',
        icon: '✅',
      });
    }

    return insights;
  }

  /**
   * Get comparison data for social proof
   */
  async getComparisonData(userId: string): Promise<ComparisonData> {
    const events = await prisma.event.count({ where: { userId } });
    
    // Calculate efficiency
    const userEvents = await prisma.event.findMany({
      where: { userId },
      take: 100,
    });
    const uniqueFiles = new Set(userEvents.map(e => e.filePath)).size;
    const efficiency = userEvents.length > 0 ? uniqueFiles / userEvents.length : 0;

    // Get averages
    const allUsers = await prisma.user.findMany({ select: { id: true } });
    let totalEvents = 0;
    let totalEfficiency = 0;
    for (const user of allUsers) {
      const userEventCount = await prisma.event.count({ where: { userId: user.id } });
      totalEvents += userEventCount;
      if (userEventCount > 0) {
        const userEvs = await prisma.event.findMany({ where: { userId: user.id }, take: 100 });
        const userUnique = new Set(userEvs.map(e => e.filePath)).size;
        totalEfficiency += userEvs.length > 0 ? userUnique / userEvs.length : 0;
      }
    }
    const avgEvents = allUsers.length > 0 ? totalEvents / allUsers.length : 0;
    const avgEfficiency = allUsers.length > 0 ? totalEfficiency / allUsers.length : 0;

    const percentile = events > avgEvents ? 
      Math.min(90 + ((events - avgEvents) / avgEvents) * 10, 99) :
      Math.max(10, (events / avgEvents) * 50);

    const productivity = Math.min((efficiency / avgEfficiency) * 50 + (events / avgEvents) * 50, 100);

    let message = '';
    if (percentile >= 90) {
      message = `You're crushing it! Top ${100 - percentile.toFixed(0)}% of users.`;
    } else if (percentile >= 75) {
      message = `You're above average! Better than ${percentile.toFixed(0)}% of users.`;
    } else {
      message = `You're at ${percentile.toFixed(0)}%. Track more to climb the ranks!`;
    }

    return {
      yourStats: {
        filesTracked: events,
        efficiency,
        productivity,
      },
      averageStats: {
        filesTracked: avgEvents,
        efficiency: avgEfficiency,
        productivity: 50,
      },
      percentile,
      message,
    };
  }
}

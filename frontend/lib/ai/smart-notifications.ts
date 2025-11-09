/**
 * Smart Notification Timing
 * 
 * ML-powered notification scheduling based on user behavior patterns.
 * Taps into: "I want notifications when I'm actually ready to see them"
 */

import prisma from '@/lib/db/prisma';

export interface NotificationSchedule {
  userId: string;
  optimalTimes: number[]; // Hours of day (0-23)
  optimalDays: number[]; // Days of week (0-6)
  quietHours: { start: number; end: number };
  timezone: string;
}

export class SmartNotificationService {
  /**
   * Analyze user activity patterns to determine optimal notification times
   */
  async analyzeUserPatterns(userId: string): Promise<NotificationSchedule> {
    const events = await prisma.event.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 1000,
    });

    // Analyze hour patterns
    const hourCounts = new Map<number, number>();
    const dayCounts = new Map<number, number>();

    events.forEach(event => {
      const date = new Date(event.timestamp);
      const hour = date.getHours();
      const day = date.getDay();

      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
      dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
    });

    // Find optimal hours (top 3 most active)
    const optimalHours = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => hour);

    // Find optimal days (top 2 most active)
    const optimalDays = Array.from(dayCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([day]) => day);

    // Determine quiet hours (least active 6-hour period)
    const sortedHours = Array.from(hourCounts.entries())
      .sort((a, b) => a[1] - b[1]);

    let quietStart = 0;
    let quietEnd = 6;
    let minActivity = Infinity;

    for (let start = 0; start < 24; start++) {
      const end = (start + 6) % 24;
      let activity = 0;

      if (end > start) {
        for (let h = start; h < end; h++) {
          activity += hourCounts.get(h) || 0;
        }
      } else {
        for (let h = start; h < 24; h++) {
          activity += hourCounts.get(h) || 0;
        }
        for (let h = 0; h < end; h++) {
          activity += hourCounts.get(h) || 0;
        }
      }

      if (activity < minActivity) {
        minActivity = activity;
        quietStart = start;
        quietEnd = end;
      }
    }

    return {
      userId,
      optimalTimes: optimalHours,
      optimalDays,
      quietHours: { start: quietStart, end: quietEnd },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  /**
   * Check if now is a good time to send notification
   */
  async shouldSendNow(userId: string): Promise<boolean> {
    const schedule = await this.analyzeUserPatterns(userId);
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    // Check quiet hours
    const { start, end } = schedule.quietHours;
    if (end > start) {
      if (currentHour >= start && currentHour < end) {
        return false;
      }
    } else {
      if (currentHour >= start || currentHour < end) {
        return false;
      }
    }

    // Prefer optimal times
    if (schedule.optimalTimes.includes(currentHour) && schedule.optimalDays.includes(currentDay)) {
      return true;
    }

    // Allow during optimal days
    if (schedule.optimalDays.includes(currentDay)) {
      return true;
    }

    // Default: allow but with lower priority
    return true;
  }

  /**
   * Get next optimal notification time
   */
  async getNextOptimalTime(userId: string): Promise<Date> {
    const schedule = await this.analyzeUserPatterns(userId);
    const now = new Date();
    const currentHour = now.getHours();

    // Find next optimal hour
    const sortedOptimalHours = [...schedule.optimalTimes].sort((a, b) => a - b);
    let nextHour = sortedOptimalHours.find(h => h > currentHour);

    if (!nextHour) {
      // Use first optimal hour tomorrow
      nextHour = sortedOptimalHours[0];
      now.setDate(now.getDate() + 1);
    }

    const nextTime = new Date(now);
    nextTime.setHours(nextHour, 0, 0, 0);

    return nextTime;
  }
}

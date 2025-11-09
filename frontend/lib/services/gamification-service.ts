/**
 * Gamification Service
 * 
 * Taps into user psychology: achievement, status, progress, comparison.
 * Creates emotional engagement through badges, streaks, levels, and social proof.
 */

import prisma from '@/lib/db/prisma';

export interface UserStats {
  level: number;
  xp: number;
  badges: Badge[];
  streak: number;
  rank: number;
  percentile: number;
  efficiency: number;
  productivity: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  progress: number;
  target: number;
  reward: {
    xp: number;
    badge?: string;
  };
}

export class GamificationService {
  /**
   * Calculate user level based on XP
   */
  async calculateLevel(userId: string): Promise<number> {
    const stats = await this.getUserStats(userId);
    // Level = sqrt(XP / 100)
    return Math.floor(Math.sqrt(stats.xp / 100)) + 1;
  }

  /**
   * Get user stats with gamification data
   */
  async getUserStats(userId: string): Promise<UserStats> {
    const [events, patterns, relationships] = await Promise.all([
      prisma.event.count({ where: { userId } }),
      prisma.pattern.count({ where: { userId } }),
      prisma.relationship.count({ where: { userId } }),
    ]);

    // Calculate XP (experience points)
    const xp = events * 1 + patterns * 10 + relationships * 5;
    const level = await this.calculateLevel(userId);

    // Calculate streak (consecutive days with activity)
    const streak = await this.calculateStreak(userId);

    // Get badges
    const badges = await this.getUserBadges(userId);

    // Calculate rank and percentile
    const { rank, percentile } = await this.calculateRank(userId, xp);

    // Calculate efficiency (files per hour)
    const efficiency = await this.calculateEfficiency(userId);
    const productivity = await this.calculateProductivity(userId);

    return {
      level,
      xp,
      badges,
      streak,
      rank,
      percentile,
      efficiency,
      productivity,
    };
  }

  /**
   * Calculate consecutive day streak
   */
  private async calculateStreak(userId: string): Promise<number> {
    const events = await prisma.event.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    if (events.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < events.length; i++) {
      const eventDate = new Date(events[i].timestamp);
      eventDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === i) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Get user badges
   */
  async getUserBadges(userId: string): Promise<Badge[]> {
    const stats = await this.getUserStats(userId);
    const badges: Badge[] = [];

    // First File Badge
    if (stats.xp >= 1) {
      badges.push({
        id: 'first_file',
        name: 'First Steps',
        description: 'Tracked your first file',
        icon: '🎯',
        unlockedAt: new Date().toISOString(),
        rarity: 'common',
      });
    }

    // Power User Badge
    if (stats.level >= 10) {
      badges.push({
        id: 'power_user',
        name: 'Power User',
        description: 'Reached level 10',
        icon: '⚡',
        unlockedAt: new Date().toISOString(),
        rarity: 'rare',
      });
    }

    // Streak Master
    if (stats.streak >= 7) {
      badges.push({
        id: 'streak_master',
        name: 'Streak Master',
        description: '7 day streak',
        icon: '🔥',
        unlockedAt: new Date().toISOString(),
        rarity: 'epic',
      });
    }

    // Top Performer
    if (stats.percentile >= 90) {
      badges.push({
        id: 'top_performer',
        name: 'Top Performer',
        description: 'In top 10% of users',
        icon: '🏆',
        unlockedAt: new Date().toISOString(),
        rarity: 'legendary',
      });
    }

    return badges;
  }

  /**
   * Calculate user rank and percentile
   */
  private async calculateRank(userId: string, userXp: number): Promise<{ rank: number; percentile: number }> {
    // Get all users' XP
    const allUsers = await prisma.user.findMany({
      select: { id: true },
    });

    const userXpScores: number[] = [];
    for (const user of allUsers) {
      const stats = await this.getUserStats(user.id);
      userXpScores.push(stats.xp);
    }

    userXpScores.sort((a, b) => b - a);
    const rank = userXpScores.indexOf(userXp) + 1;
    const percentile = ((allUsers.length - rank) / allUsers.length) * 100;

    return { rank, percentile };
  }

  /**
   * Calculate efficiency (files per hour)
   */
  private async calculateEfficiency(userId: string): Promise<number> {
    const events = await prisma.event.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    if (events.length < 2) return 0;

    const timeSpan = events[0].timestamp.getTime() - events[events.length - 1].timestamp.getTime();
    const hours = timeSpan / (1000 * 60 * 60);
    return hours > 0 ? events.length / hours : 0;
  }

  /**
   * Calculate productivity score (0-100)
   */
  private async calculateProductivity(userId: string): Promise<number> {
    const stats = await this.getUserStats(userId);
    // Base score on level, streak, and efficiency
    const levelScore = Math.min(stats.level * 5, 50);
    const streakScore = Math.min(stats.streak * 2, 30);
    const efficiencyScore = Math.min(stats.efficiency * 10, 20);
    return Math.min(levelScore + streakScore + efficiencyScore, 100);
  }

  /**
   * Get achievements user can unlock
   */
  async getAchievements(userId: string): Promise<Achievement[]> {
    const stats = await this.getUserStats(userId);
    const events = await prisma.event.count({ where: { userId } });
    const patterns = await prisma.pattern.count({ where: { userId } });

    return [
      {
        id: 'track_100_files',
        name: 'Century Club',
        description: 'Track 100 files',
        progress: events,
        target: 100,
        reward: { xp: 100, badge: 'century_club' },
      },
      {
        id: 'discover_10_patterns',
        name: 'Pattern Master',
        description: 'Discover 10 file patterns',
        progress: patterns,
        target: 10,
        reward: { xp: 50, badge: 'pattern_master' },
      },
      {
        id: 'level_5',
        name: 'Rising Star',
        description: 'Reach level 5',
        progress: stats.level,
        target: 5,
        reward: { xp: 200, badge: 'rising_star' },
      },
      {
        id: 'streak_30',
        name: 'Dedication',
        description: '30 day streak',
        progress: stats.streak,
        target: 30,
        reward: { xp: 500, badge: 'dedication' },
      },
    ];
  }
}

/**
 * Smart Insights Engine
 * 
 * ML-powered pattern detection and predictive insights.
 * Taps into: "I want to know what's coming before it happens"
 */

import prisma from '@/lib/db/prisma';

export interface SmartInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'prediction' | 'opportunity';
  title: string;
  message: string;
  confidence: number;
  timeframe: string;
  actionItems?: string[];
  visualization?: {
    type: 'line' | 'bar' | 'pie';
    data: unknown[];
  };
}

export class SmartInsightsEngine {
  /**
   * Detect trends in user behavior
   */
  async detectTrends(userId: string, days: number = 30): Promise<SmartInsight[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const events = await prisma.event.findMany({
      where: {
        userId,
        timestamp: { gte: cutoff },
      },
      orderBy: { timestamp: 'asc' },
    });

    const insights: SmartInsight[] = [];

    // Group by day
    const dailyCounts = new Map<string, number>();
    events.forEach(event => {
      const day = new Date(event.timestamp).toISOString().split('T')[0];
      dailyCounts.set(day, (dailyCounts.get(day) || 0) + 1);
    });

    const counts = Array.from(dailyCounts.values());
    if (counts.length < 7) return insights;

    // Calculate trend (simple linear regression)
    const n = counts.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = counts.reduce((a, b) => a + b, 0);
    const sumXY = counts.reduce((sum, val, idx) => sum + val * idx, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const trend = slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable';

    if (Math.abs(slope) > 0.5) {
      insights.push({
        id: 'trend-activity',
        type: 'trend',
        title: `Activity is ${trend}`,
        message: `Your file activity is ${trend} by ${Math.abs(slope).toFixed(1)} events per day over the last ${days} days.`,
        confidence: 0.8,
        timeframe: `Last ${days} days`,
        visualization: {
          type: 'line',
          data: Array.from(dailyCounts.entries()).map(([date, count]) => ({ date, count })),
        },
      });
    }

    // Detect anomalies
    const avg = sumY / n;
    const variance = counts.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    counts.forEach((count, idx) => {
      if (Math.abs(count - avg) > 2 * stdDev) {
        const date = Array.from(dailyCounts.keys())[idx];
        insights.push({
          id: `anomaly-${date}`,
          type: 'anomaly',
          title: 'Unusual Activity Detected',
          message: `On ${new Date(date).toLocaleDateString()}, you had ${count} file events (${count > avg ? 'above' : 'below'} average of ${avg.toFixed(0)}).`,
          confidence: 0.75,
          timeframe: date,
        });
      }
    });

    return insights;
  }

  /**
   * Predict future patterns
   */
  async predictFuture(userId: string): Promise<SmartInsight[]> {
    const insights: SmartInsight[] = [];

    // Predict peak times
    const events = await prisma.event.findMany({
      where: { userId },
      take: 500,
    });

    const hourCounts = new Map<number, number>();
    events.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    const sortedHours = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    if (sortedHours.length > 0) {
      insights.push({
        id: 'predict-peak-hours',
        type: 'prediction',
        title: 'Predicted Peak Hours',
        message: `Based on your patterns, you're most active at ${sortedHours.map(([h]) => `${h}:00`).join(', ')}. Schedule important work during these times.`,
        confidence: 0.85,
        timeframe: 'Next week',
        actionItems: [
          'Schedule important tasks during peak hours',
          'Set reminders for high-priority work',
        ],
      });
    }

    // Predict tool usage
    const toolCounts = new Map<string, number>();
    events.forEach(event => {
      if (event.tool) {
        toolCounts.set(event.tool, (toolCounts.get(event.tool) || 0) + 1);
      }
    });

    const topTool = Array.from(toolCounts.entries())
      .sort((a, b) => b[1] - a[1])[0];

    if (topTool && topTool[1] > 50) {
      insights.push({
        id: 'predict-tool-usage',
        type: 'prediction',
        title: 'Tool Usage Prediction',
        message: `You'll likely use ${topTool[0]} ${Math.ceil(topTool[1] / events.length * 7)} times this week based on current patterns.`,
        confidence: 0.7,
        timeframe: 'This week',
      });
    }

    return insights;
  }

  /**
   * Identify opportunities
   */
  async identifyOpportunities(userId: string): Promise<SmartInsight[]> {
    const insights: SmartInsight[] = [];

    const patterns = await prisma.pattern.findMany({
      where: { userId },
      orderBy: { count: 'desc' },
      take: 10,
    });

    // Opportunity: High-frequency patterns that could be automated
    patterns.forEach(pattern => {
      if (pattern.count > 100) {
        insights.push({
          id: `opportunity-${pattern.id}`,
          type: 'opportunity',
          title: 'Automation Opportunity',
          message: `You've used .${pattern.fileExtension} files ${pattern.count} times. Consider automating workflows involving these files.`,
          confidence: 0.9,
          timeframe: 'Immediate',
          actionItems: [
            `Create automation for .${pattern.fileExtension} files`,
            'Set up integration with related tools',
          ],
        });
      }
    });

    return insights;
  }

  /**
   * Get all smart insights
   */
  async getAllInsights(userId: string): Promise<SmartInsight[]> {
    const [trends, predictions, opportunities] = await Promise.all([
      this.detectTrends(userId),
      this.predictFuture(userId),
      this.identifyOpportunities(userId),
    ]);

    return [...trends, ...predictions, ...opportunities].sort((a, b) => b.confidence - a.confidence);
  }
}

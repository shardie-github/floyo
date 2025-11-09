/**
 * Predictive Analytics Engine
 * 
 * Forecasts trends, predicts issues, and anticipates needs.
 * Taps into: "I want to know what will happen before it does"
 */

import prisma from '@/lib/db/prisma';

export interface Prediction {
  id: string;
  type: 'usage' | 'performance' | 'trend' | 'anomaly';
  title: string;
  prediction: string;
  confidence: number;
  timeframe: string;
  impact: 'low' | 'medium' | 'high';
  recommendations?: string[];
}

export class PredictiveAnalytics {
  /**
   * Predict future usage patterns
   */
  async predictUsage(userId: string, days: number = 7): Promise<Prediction[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    const events = await prisma.event.findMany({
      where: {
        userId,
        timestamp: { gte: cutoff },
      },
      orderBy: { timestamp: 'asc' },
    });

    const predictions: Prediction[] = [];

    // Simple time series forecasting (moving average)
    const dailyCounts: number[] = [];
    const dateMap = new Map<string, number>();

    events.forEach(event => {
      const date = new Date(event.timestamp).toISOString().split('T')[0];
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });

    const sortedDates = Array.from(dateMap.keys()).sort();
    sortedDates.forEach(date => {
      dailyCounts.push(dateMap.get(date) || 0);
    });

    if (dailyCounts.length < 7) return predictions;

    // Calculate moving average
    const window = 7;
    const recentAvg = dailyCounts.slice(-window).reduce((a, b) => a + b, 0) / window;
    const previousAvg = dailyCounts.slice(-window * 2, -window).reduce((a, b) => a + b, 0) / window;
    const trend = recentAvg - previousAvg;

    // Predict next week
    const predictedDaily = recentAvg + (trend * days);
    const predictedTotal = predictedDaily * days;

    predictions.push({
      id: 'usage-prediction',
      type: 'usage',
      title: 'Predicted File Activity',
      prediction: `You'll likely have ${Math.round(predictedTotal)} file events over the next ${days} days (${Math.round(predictedDaily)} per day)`,
      confidence: 0.75,
      timeframe: `Next ${days} days`,
      impact: 'medium',
      recommendations: [
        trend > 0 ? 'Activity is increasing - prepare for higher workload' : 'Activity is stable - maintain current pace',
      ],
    });

    // Predict peak days
    const dayOfWeekCounts = new Map<number, number>();
    events.forEach(event => {
      const day = new Date(event.timestamp).getDay();
      dayOfWeekCounts.set(day, (dayOfWeekCounts.get(day) || 0) + 1);
    });

    const peakDay = Array.from(dayOfWeekCounts.entries())
      .sort((a, b) => b[1] - a[1])[0];

    if (peakDay) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      predictions.push({
        id: 'peak-day-prediction',
        type: 'trend',
        title: 'Predicted Peak Day',
        prediction: `Next ${dayNames[peakDay[0]]} is likely to be your most active day`,
        confidence: 0.7,
        timeframe: 'Next week',
        impact: 'low',
        recommendations: [
          `Schedule important work for ${dayNames[peakDay[0]]}`,
        ],
      });
    }

    return predictions;
  }

  /**
   * Predict performance issues
   */
  async predictPerformance(userId: string): Promise<Prediction[]> {
    const predictions: Prediction[] = [];

    // Analyze event frequency for potential bottlenecks
    const events = await prisma.event.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    const toolCounts = new Map<string, number>();
    events.forEach(event => {
      if (event.tool) {
        toolCounts.set(event.tool, (toolCounts.get(event.tool) || 0) + 1);
      }
    });

    // If one tool dominates, predict potential bottleneck
    const total = events.length;
    toolCounts.forEach((count, tool) => {
      const percentage = (count / total) * 100;
      if (percentage > 70) {
        predictions.push({
          id: `performance-${tool}`,
          type: 'performance',
          title: 'Potential Bottleneck Detected',
          prediction: `${tool} accounts for ${percentage.toFixed(0)}% of your activity. Consider diversifying tools to avoid dependency.`,
          confidence: 0.8,
          timeframe: 'Ongoing',
          impact: 'high',
          recommendations: [
            'Explore alternative tools',
            'Set up backup workflows',
            'Reduce single-point-of-failure risk',
          ],
        });
      }
    });

    return predictions;
  }

  /**
   * Predict anomalies
   */
  async predictAnomalies(userId: string): Promise<Prediction[]> {
    const predictions: Prediction[] = [];

    const events = await prisma.event.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 1000,
    });

    // Detect unusual inactivity
    const now = Date.now();
    const lastEvent = events[0];
    if (lastEvent) {
      const hoursSinceLastEvent = (now - new Date(lastEvent.timestamp).getTime()) / (1000 * 60 * 60);
      const avgHoursBetweenEvents = this.calculateAvgInterval(events);

      if (hoursSinceLastEvent > avgHoursBetweenEvents * 2) {
        predictions.push({
          id: 'anomaly-inactivity',
          type: 'anomaly',
          title: 'Unusual Inactivity Detected',
          prediction: `You haven't been active for ${Math.round(hoursSinceLastEvent)} hours (average is ${Math.round(avgHoursBetweenEvents)} hours)`,
          confidence: 0.85,
          timeframe: 'Current',
          impact: 'low',
          recommendations: [
            'Check if everything is working correctly',
            'Review recent activity',
          ],
        });
      }
    }

    return predictions;
  }

  /**
   * Calculate average interval between events
   */
  private calculateAvgInterval(events: Array<{ timestamp: Date | string }>): number {
    if (events.length < 2) return 24; // Default 24 hours

    let totalInterval = 0;
    for (let i = 1; i < events.length; i++) {
      const prev = new Date(events[i - 1].timestamp).getTime();
      const curr = new Date(events[i].timestamp).getTime();
      totalInterval += (curr - prev) / (1000 * 60 * 60); // Convert to hours
    }

    return totalInterval / (events.length - 1);
  }

  /**
   * Get all predictions
   */
  async getAllPredictions(userId: string): Promise<Prediction[]> {
    const [usage, performance, anomalies] = await Promise.all([
      this.predictUsage(userId),
      this.predictPerformance(userId),
      this.predictAnomalies(userId),
    ]);

    return [...usage, ...performance, ...anomalies].sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact] || b.confidence - a.confidence;
    });
  }
}

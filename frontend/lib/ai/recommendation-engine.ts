/**
 * AI-Powered Recommendation Engine
 * 
 * Uses ML to predict what integrations, workflows, and actions users need.
 * Taps into: "I want the system to know what I need before I do"
 */

import prisma from '@/lib/db/prisma';

export interface Recommendation {
  id: string;
  type: 'integration' | 'workflow' | 'optimization' | 'insight';
  title: string;
  description: string;
  confidence: number; // 0-1
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  reasoning?: string; // Why this was recommended
}

export interface UserPattern {
  fileTypes: string[];
  tools: string[];
  timePatterns: {
    peakHours: number[];
    peakDays: number[];
  };
  workflows: Array<{
    sequence: string[];
    frequency: number;
  }>;
}

export class RecommendationEngine {
  /**
   * Analyze user patterns using ML-like algorithms
   */
  async analyzeUserPatterns(userId: string): Promise<UserPattern> {
    const events = await prisma.event.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 1000,
    });

    // Extract file types
    const fileTypes = new Map<string, number>();
    const tools = new Map<string, number>();
    const hourCounts = new Map<number, number>();
    const dayCounts = new Map<number, number>();
    const sequences: string[][] = [];

    events.forEach((event, idx) => {
      // File types
      const ext = event.filePath.split('.').pop()?.toLowerCase() || 'unknown';
      fileTypes.set(ext, (fileTypes.get(ext) || 0) + 1);

      // Tools
      if (event.tool) {
        tools.set(event.tool, (tools.get(event.tool) || 0) + 1);
      }

      // Time patterns
      const date = new Date(event.timestamp);
      const hour = date.getHours();
      const day = date.getDay();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
      dayCounts.set(day, (dayCounts.get(day) || 0) + 1);

      // Sequences (consecutive events)
      if (idx > 0 && events[idx - 1].userId === event.userId) {
        const prevTool = events[idx - 1].tool || 'unknown';
        const currTool = event.tool || 'unknown';
        sequences.push([prevTool, currTool]);
      }
    });

    // Find peak hours/days
    const peakHours = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => hour);

    const peakDays = Array.from(dayCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([day]) => day);

    // Find common workflows
    const workflowFreq = new Map<string, number>();
    sequences.forEach(seq => {
      const key = seq.join(' -> ');
      workflowFreq.set(key, (workflowFreq.get(key) || 0) + 1);
    });

    const workflows = Array.from(workflowFreq.entries())
      .map(([sequence, frequency]) => ({
        sequence: sequence.split(' -> '),
        frequency,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    return {
      fileTypes: Array.from(fileTypes.keys()).slice(0, 10),
      tools: Array.from(tools.keys()).slice(0, 10),
      timePatterns: {
        peakHours,
        peakDays,
      },
      workflows,
    };
  }

  /**
   * Generate intelligent recommendations
   */
  async generateRecommendations(userId: string): Promise<Recommendation[]> {
    const patterns = await this.analyzeUserPatterns(userId);
    const recommendations: Recommendation[] = [];

    // Integration recommendations based on file types
    const integrationMap: Record<string, string[]> = {
      'ts': ['TypeScript', 'VSCode', 'ESLint'],
      'tsx': ['React', 'Next.js', 'VSCode'],
      'py': ['Python', 'PyCharm', 'Jupyter'],
      'js': ['JavaScript', 'Node.js', 'VSCode'],
      'md': ['Markdown', 'Obsidian', 'Notion'],
      'json': ['JSON', 'Postman', 'VSCode'],
    };

    patterns.fileTypes.forEach(fileType => {
      const integrations = integrationMap[fileType];
      if (integrations) {
        recommendations.push({
          id: `integration-${fileType}`,
          type: 'integration',
          title: `Integrate with ${integrations[0]}`,
          description: `You frequently use .${fileType} files. Connect with ${integrations.join(', ')} for seamless workflow.`,
          confidence: 0.85,
          priority: 'high',
          actionUrl: `/integrations/${fileType}`,
          reasoning: `High usage of .${fileType} files (${patterns.fileTypes.length} types detected)`,
        });
      }
    });

    // Workflow optimization recommendations
    if (patterns.workflows.length > 0) {
      const topWorkflow = patterns.workflows[0];
      if (topWorkflow.frequency > 5) {
        recommendations.push({
          id: `workflow-${topWorkflow.sequence.join('-')}`,
          type: 'workflow',
          title: `Automate: ${topWorkflow.sequence.join(' → ')}`,
          description: `You perform this sequence ${topWorkflow.frequency} times. Automate it to save time.`,
          confidence: 0.9,
          priority: 'high',
          actionUrl: `/workflows/create?sequence=${topWorkflow.sequence.join(',')}`,
          reasoning: `Repeated ${topWorkflow.frequency} times`,
        });
      }
    }

    // Time-based optimization
    const currentHour = new Date().getHours();
    if (!patterns.timePatterns.peakHours.includes(currentHour)) {
      recommendations.push({
        id: 'time-optimization',
        type: 'optimization',
        title: 'Optimize Your Schedule',
        description: `You're most active during hours ${patterns.timePatterns.peakHours.join(', ')}. Schedule important tasks then.`,
        confidence: 0.7,
        priority: 'medium',
        reasoning: `Peak activity detected at hours ${patterns.timePatterns.peakHours.join(', ')}`,
      });
    }

    // Tool consolidation
    if (patterns.tools.length > 5) {
      recommendations.push({
        id: 'tool-consolidation',
        type: 'optimization',
        title: 'Consolidate Your Tools',
        description: `You use ${patterns.tools.length} different tools. Consider consolidating to reduce context switching.`,
        confidence: 0.65,
        priority: 'medium',
        reasoning: `${patterns.tools.length} unique tools detected`,
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority] || b.confidence - a.confidence;
    });
  }

  /**
   * Predict next action
   */
  async predictNextAction(userId: string): Promise<Recommendation | null> {
    const recommendations = await this.generateRecommendations(userId);
    return recommendations.length > 0 ? recommendations[0] : null;
  }
}

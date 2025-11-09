/**
 * Intelligent Automation Engine
 * 
 * Auto-suggests and creates workflows based on user patterns.
 * Taps into: "I want things to happen automatically"
 */

import prisma from '@/lib/db/prisma';

export interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: 'event' | 'time' | 'condition';
    condition: string;
  };
  actions: Array<{
    type: 'notification' | 'integration' | 'workflow';
    config: Record<string, unknown>;
  }>;
  enabled: boolean;
  frequency: number; // How often this pattern occurs
  confidence: number; // ML confidence score
}

export class AutomationEngine {
  /**
   * Detect automation opportunities
   */
  async detectOpportunities(userId: string): Promise<Automation[]> {
    const events = await prisma.event.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 500,
    });

    const automations: Automation[] = [];

    // Detect repeated sequences
    const sequences = new Map<string, number>();
    for (let i = 0; i < events.length - 1; i++) {
      const seq = `${events[i].tool || 'unknown'} -> ${events[i + 1].tool || 'unknown'}`;
      sequences.set(seq, (sequences.get(seq) || 0) + 1);
    }

    Array.from(sequences.entries()).forEach(([sequence, frequency]) => {
      if (frequency > 10) {
        const [triggerTool, actionTool] = sequence.split(' -> ');
        automations.push({
          id: `auto-${sequence.replace(/\s/g, '-')}`,
          name: `Auto: ${triggerTool} → ${actionTool}`,
          description: `Automatically trigger ${actionTool} when ${triggerTool} is used`,
          trigger: {
            type: 'event',
            condition: `tool == "${triggerTool}"`,
          },
          actions: [
            {
              type: 'workflow',
              config: { tool: actionTool },
            },
          ],
          enabled: false,
          frequency,
          confidence: Math.min(frequency / 50, 1),
        });
      }
    });

    // Detect time-based patterns
    const hourPatterns = new Map<number, string[]>();
    events.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      const tool = event.tool || 'unknown';
      if (!hourPatterns.has(hour)) {
        hourPatterns.set(hour, []);
      }
      hourPatterns.get(hour)!.push(tool);
    });

    hourPatterns.forEach((tools, hour) => {
      const uniqueTools = [...new Set(tools)];
      if (uniqueTools.length === 1 && tools.length > 20) {
        automations.push({
          id: `auto-time-${hour}`,
          name: `Daily ${uniqueTools[0]} at ${hour}:00`,
          description: `Automatically prepare ${uniqueTools[0]} workspace at ${hour}:00 daily`,
          trigger: {
            type: 'time',
            condition: `hour == ${hour}`,
          },
          actions: [
            {
              type: 'workflow',
              config: { tool: uniqueTools[0], action: 'prepare' },
            },
          ],
          enabled: false,
          frequency: tools.length,
          confidence: 0.8,
        });
      }
    });

    return automations.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Create automation
   */
  async createAutomation(userId: string, automation: Automation): Promise<void> {
    // In production, store in database
    // For now, store in localStorage
    const automations = this.getUserAutomations(userId);
    automations.push(automation);
    localStorage.setItem(`automations-${userId}`, JSON.stringify(automations));
  }

  /**
   * Get user automations
   */
  getUserAutomations(userId: string): Automation[] {
    const stored = localStorage.getItem(`automations-${userId}`);
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Enable/disable automation
   */
  async toggleAutomation(userId: string, automationId: string, enabled: boolean): Promise<void> {
    const automations = this.getUserAutomations(userId);
    const automation = automations.find(a => a.id === automationId);
    if (automation) {
      automation.enabled = enabled;
      localStorage.setItem(`automations-${userId}`, JSON.stringify(automations));
    }
  }
}

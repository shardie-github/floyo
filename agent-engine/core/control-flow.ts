/**
 * Control Flow Engine - Deterministic Logic & Fallbacks
 * Native control flow, not LLM-driven chains
 */

import type { WorkflowStep, WorkflowResult, ToolResult } from './types.js';
import { ToolRegistry } from './tool-registry.js';
import { ContextManager } from './context-manager.js';
import { PrivacyLayer } from './privacy.js';

export class ControlFlowEngine {
  constructor(
    private registry: ToolRegistry,
    private contextManager: ContextManager,
    private privacy: PrivacyLayer
  ) {}

  /**
   * Execute workflow with deterministic control flow
   */
  async executeWorkflow(
    contextId: string,
    steps: WorkflowStep[],
    timeout: number = 1500
  ): Promise<WorkflowResult> {
    const startTime = Date.now();
    const results: WorkflowResult['steps'] = [];
    let totalTokens = 0;
    let success = true;

    for (const step of steps) {
      const stepStart = Date.now();
      let attempts = 0;
      let stepResult: ToolResult | null = null;

      // Deterministic retry logic
      const maxAttempts = step.retries || 3;
      const stepTimeout = step.timeout || timeout;

      while (attempts < maxAttempts && !stepResult?.success) {
        attempts++;
        
        try {
          // Check timeout
          if (Date.now() - startTime > stepTimeout) {
            throw new Error(`Workflow timeout after ${stepTimeout}ms`);
          }

          // Try primary tool
          stepResult = await this.executeTool(contextId, step.tool, step.params);

          // If failed and fallback exists, try fallback
          if (!stepResult.success && step.fallback) {
            console.log(`Primary tool failed, trying fallback: ${step.fallback}`);
            stepResult = await this.executeTool(contextId, step.fallback, step.params);
          }

          // If still failed, try cached result (if available)
          if (!stepResult.success) {
            const cached = await this.getCachedResult(step.tool, step.params);
            if (cached) {
              stepResult = {
                ...cached,
                error: 'Using cached result due to tool failure',
              };
            }
          }
        } catch (error: any) {
          stepResult = {
            success: false,
            error: error.message,
            tokensUsed: 0,
            latencyMs: Date.now() - stepStart,
            sanitized: false,
          };
        }
      }

      if (!stepResult.success) {
        success = false;
      }

      results.push({
        step,
        result: stepResult!,
        attempts,
      });

      totalTokens += stepResult!.tokensUsed;
    }

    const totalLatency = Date.now() - startTime;

    // Generate insights
    const insights = this.generateInsights(results, totalTokens, totalLatency);

    // Generate narrative
    const narrative = this.generateNarrative(results, insights);

    return {
      success,
      steps: results,
      totalTokens,
      totalLatency,
      insights,
      narrative,
    };
  }

  /**
   * Execute single tool call
   */
  private async executeTool(
    contextId: string,
    toolName: string,
    params: Record<string, any>
  ): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      // Check token budget
      const budget = this.contextManager.getTokenBudget(contextId);
      const schema = await this.registry.getToolSchema(toolName);
      
      if (schema && schema.estimatedTokens && schema.estimatedTokens > budget) {
        throw new Error(`Insufficient token budget: ${budget} < ${schema.estimatedTokens}`);
      }

      // Load tool module (lazy)
      const toolModule = await this.registry.loadTool(toolName);
      
      // Sanitize params (tokenize PII)
      const sanitizedParams = this.privacy.containsPII(params)
        ? this.privacy.tokenize(params)
        : params;

      // Execute tool
      const executeFn = toolModule.execute || toolModule.default || toolModule[toolName];
      if (typeof executeFn !== 'function') {
        throw new Error(`Tool ${toolName} does not export execute function`);
      }

      const rawResult = await executeFn(sanitizedParams);

      // Estimate tokens used
      const resultStr = JSON.stringify(rawResult);
      const tokensUsed = Math.ceil(resultStr.length / 4);

      // Record in context
      const result: ToolResult = {
        success: true,
        data: rawResult,
        tokensUsed,
        latencyMs: Date.now() - startTime,
        sanitized: this.privacy.containsPII(params),
      };

      // Record in context
      result.tool = toolName;
      this.contextManager.recordToolResult(contextId, result);

      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        tokensUsed: 0,
        latencyMs: Date.now() - startTime,
        sanitized: false,
      };
    }
  }

  /**
   * Get cached result (fallback layer)
   */
  private async getCachedResult(
    _toolName: string,
    _params: Record<string, any>
  ): Promise<ToolResult | null> {
    // In production, this would query a cache (Redis, etc.)
    // For now, return null (no cache)
    return null;
  }

  /**
   * Generate insights from workflow results
   */
  private generateInsights(
    steps: WorkflowResult['steps'],
    totalTokens: number,
    totalLatency: number
  ): Array<{ type: string; title: string; value: any; impact?: string; actionable?: boolean }> {
    const insights = [];

    // Token efficiency insight
    const avgTokensPerStep = totalTokens / steps.length;
    if (avgTokensPerStep > 500) {
      insights.push({
        type: 'metric',
        title: 'High Token Usage',
        value: `${avgTokensPerStep.toFixed(0)} tokens/step`,
        impact: 'high',
        actionable: true,
      });
    }

    // Latency insight
    if (totalLatency > 1500) {
      insights.push({
        type: 'metric',
        title: 'Latency Exceeded Target',
        value: `${totalLatency}ms (target: 1500ms)`,
        impact: 'high',
        actionable: true,
      });
    }

    // Failure rate insight
    const failures = steps.filter((s) => !s.result.success).length;
    if (failures > 0) {
      insights.push({
        type: 'anomaly',
        title: 'Workflow Failures',
        value: `${failures}/${steps.length} steps failed`,
        impact: failures === steps.length ? 'high' : 'medium',
        actionable: true,
      });
    }

    // Cost estimate (if available)
    const estimatedCost = (totalTokens / 1000) * 0.002; // Rough estimate
    insights.push({
      type: 'cost_delta',
      title: 'Estimated Cost',
      value: `$${estimatedCost.toFixed(4)}`,
      impact: 'low',
      actionable: false,
    });

    return insights;
  }

  /**
   * Generate natural language narrative
   */
  private generateNarrative(
    steps: WorkflowResult['steps'],
    insights: Array<any>
  ): string {
    const successCount = steps.filter((s) => s.result.success).length;
    const totalSteps = steps.length;
    const totalLatency = steps.reduce((sum, s) => sum + s.result.latencyMs, 0);
    const totalTokens = steps.reduce((sum, s) => sum + s.result.tokensUsed, 0);

    let narrative = `Workflow executed ${successCount}/${totalSteps} steps successfully. `;
    narrative += `Total latency: ${totalLatency}ms, tokens used: ${totalTokens}. `;

    if (insights.length > 0) {
      const criticalInsights = insights.filter((i) => i.impact === 'high');
      if (criticalInsights.length > 0) {
        narrative += `Key insights: ${criticalInsights.map((i) => i.title).join(', ')}. `;
      }
    }

    // Next best action
    const failures = steps.filter((s) => !s.result.success);
    if (failures.length > 0) {
      narrative += `Recommended action: Review failed steps (${failures.map((f) => f.step.tool).join(', ')}) and verify tool availability.`;
    } else {
      narrative += `All steps completed successfully. No action required.`;
    }

    return narrative;
  }
}

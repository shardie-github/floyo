/**
 * Context Manager - Token-Efficient Rolling Context
 * Maintains < 2000 tokens per active agent
 */

import type { AgentContext, ToolResult } from './types.js';

const DEFAULT_MAX_TOKENS = 2000;
const TOKEN_ESTIMATE_RATIO = 4; // ~4 chars per token

export class ContextManager {
  private contexts: Map<string, AgentContext> = new Map();
  private maxTokens: number;

  constructor(maxTokens: number = DEFAULT_MAX_TOKENS) {
    this.maxTokens = maxTokens;
  }

  createContext(id: string, metadata?: Record<string, any>): AgentContext {
    const context: AgentContext = {
      id,
      tokensUsed: 0,
      maxTokens: this.maxTokens,
      toolsLoaded: new Set(),
      startTime: Date.now(),
      metadata,
    };
    this.contexts.set(id, context);
    return context;
  }

  getContext(id: string): AgentContext | undefined {
    return this.contexts.get(id);
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.length / TOKEN_ESTIMATE_RATIO);
  }

  addTokens(contextId: string, tokens: number): boolean {
    const context = this.contexts.get(contextId);
    if (!context) return false;

    const newTotal = context.tokensUsed + tokens;
    if (newTotal > context.maxTokens) {
      // Roll over: remove oldest tool results to stay under cap
      this.rolloverContext(context);
      return this.addTokens(contextId, tokens);
    }

    context.tokensUsed = newTotal;
    return true;
  }

  private rolloverContext(context: AgentContext): void {
    // Remove oldest loaded tools to free up token budget
    // In practice, this would remove cached tool results
    const oldestTool = Array.from(context.toolsLoaded)[0];
    if (oldestTool) {
      context.toolsLoaded.delete(oldestTool);
      // Estimate freed tokens (simplified)
      context.tokensUsed = Math.max(0, context.tokensUsed - 100);
    }
  }

  recordToolResult(contextId: string, result: ToolResult): void {
    const context = this.contexts.get(contextId);
    if (!context) return;

    this.addTokens(contextId, result.tokensUsed);
    context.toolsLoaded.add(result.tool || 'unknown');
  }

  getTokenBudget(contextId: string): number {
    const context = this.contexts.get(contextId);
    if (!context) return 0;
    return Math.max(0, context.maxTokens - context.tokensUsed);
  }

  clearContext(contextId: string): void {
    this.contexts.delete(contextId);
  }

  // Get summary for telemetry (minimal data)
  getContextSummary(contextId: string): {
    tokensUsed: number;
    toolsLoaded: number;
    durationMs: number;
  } | null {
    const context = this.contexts.get(contextId);
    if (!context) return null;

    return {
      tokensUsed: context.tokensUsed,
      toolsLoaded: context.toolsLoaded.size,
      durationMs: Date.now() - context.startTime,
    };
  }
}

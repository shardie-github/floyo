/**
 * Core Types for MCP-Powered AI Agent Engine
 * Token-efficient, composable, production-ready
 */

export interface ToolSchema {
  name: string;
  version: string;
  author?: string;
  description: string;
  path: string; // Module path for lazy loading
  inputSchema: Record<string, any>; // JSON Schema
  outputSchema?: Record<string, any>;
  estimatedTokens?: number; // For budget planning
  latencyMs?: number; // Historical latency
}

export interface ToolManifest {
  version: string;
  tools: Record<string, ToolSchema>;
  lastUpdated: string;
}

export interface AgentContext {
  id: string;
  tokensUsed: number;
  maxTokens: number; // Rolling cap (default 2000)
  toolsLoaded: Set<string>;
  startTime: number;
  metadata?: Record<string, any>;
}

export interface ToolCall {
  tool: string;
  params: Record<string, any>;
  contextId: string;
  timestamp: number;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  tokensUsed: number;
  latencyMs: number;
  sanitized?: boolean; // Whether PII was tokenized
  tool?: string; // Tool name (for tracking)
}

export interface WorkflowStep {
  id: string;
  tool: string;
  params: Record<string, any>;
  fallback?: string; // Fallback tool if primary fails
  retries?: number;
  timeout?: number;
}

export interface WorkflowResult {
  success: boolean;
  steps: Array<{
    step: WorkflowStep;
    result: ToolResult;
    attempts: number;
  }>;
  totalTokens: number;
  totalLatency: number;
  insights?: Insight[];
  narrative?: string; // Natural language summary
}

export interface Insight {
  type: 'metric' | 'cost_delta' | 'next_action' | 'anomaly';
  title: string;
  value: any;
  impact?: 'high' | 'medium' | 'low';
  actionable?: boolean;
}

export interface TelemetryRecord {
  toolName: string;
  tokensUsed: number;
  latencyMs: number;
  success: boolean;
  timestamp: string;
  contextId?: string;
  sanitized: boolean;
}

export interface MCPConnection {
  server: string;
  transport: 'stdio' | 'http' | 'websocket';
  config?: Record<string, any>;
}

export interface TokenizedData {
  original: string;
  token: string;
  type: 'email' | 'user_id' | 'ip' | 'phone' | 'other';
}

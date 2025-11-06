/**
 * Main Agent Engine - Orchestrator
 * Composes all components into production-ready agent system
 */

import { ContextManager } from './core/context-manager.js';
import { ToolRegistry } from './core/tool-registry.js';
import { PrivacyLayer } from './core/privacy.js';
import { ControlFlowEngine } from './core/control-flow.js';
import { Observability } from './core/observability.js';
import { MCPClient } from '../mcp/client.js';
import type {
  AgentContext,
  WorkflowStep,
  WorkflowResult,
  MCPConnection,
} from './core/types.js';

export interface AgentEngineConfig {
  maxTokens?: number;
  supabaseClient?: any;
  mcpConnections?: MCPConnection[];
}

export class AgentEngine {
  private contextManager: ContextManager;
  private toolRegistry: ToolRegistry;
  private privacy: PrivacyLayer;
  private controlFlow: ControlFlowEngine;
  private observability: Observability;
  private mcpClient: MCPClient;

  constructor(config: AgentEngineConfig = {}) {
    this.contextManager = new ContextManager(config.maxTokens);
    this.toolRegistry = new ToolRegistry();
    this.privacy = new PrivacyLayer();
    this.observability = new Observability(this.privacy);
    this.controlFlow = new ControlFlowEngine(
      this.toolRegistry,
      this.contextManager,
      this.privacy
    );
    this.mcpClient = new MCPClient();

    // Setup Supabase if provided
    if (config.supabaseClient) {
      this.observability.setSupabaseClient(config.supabaseClient);
    }

    // Connect to MCP servers if provided
    if (config.mcpConnections) {
      this.connectMCP(config.mcpConnections).catch((err) => {
        console.warn(`MCP connection failed: ${err.message}`);
      });
    }
  }

  /**
   * Initialize agent engine (load manifest, etc.)
   */
  async initialize(): Promise<void> {
    await this.toolRegistry.loadManifest();
    await this.toolRegistry.saveManifest(); // Save if auto-discovered
  }

  /**
   * Create new agent context
   */
  createContext(id: string, metadata?: Record<string, any>): AgentContext {
    return this.contextManager.createContext(id, metadata);
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(
    contextId: string,
    steps: WorkflowStep[],
    timeout?: number
  ): Promise<WorkflowResult> {
    const startTime = Date.now();

    // Verify context exists
    const context = this.contextManager.getContext(contextId);
    if (!context) {
      throw new Error(`Context not found: ${contextId}`);
    }

    // Execute workflow
    const result = await this.controlFlow.executeWorkflow(
      contextId,
      steps,
      timeout
    );

    // Record telemetry for each step
    for (const stepResult of result.steps) {
      await this.observability.record(
        stepResult.step.tool,
        stepResult.result.tokensUsed,
        stepResult.result.latencyMs,
        stepResult.result.success,
        contextId
      );
    }

    return result;
  }

  /**
   * Search for tools (progressive discovery)
   */
  async searchTools(query: string): Promise<Array<{ name: string; description: string }>> {
    const tools = await this.toolRegistry.searchTools(query);
    return tools.map((t) => ({
      name: t.name,
      description: t.description,
    }));
  }

  /**
   * Get tool summary (token-efficient)
   */
  async getToolSummary(toolName: string) {
    return this.toolRegistry.getToolSummary(toolName);
  }

  /**
   * Connect to MCP servers
   */
  private async connectMCP(connections: MCPConnection[]): Promise<void> {
    for (const connection of connections) {
      try {
        await this.mcpClient.connect(connection);
        
        // Discover tools from MCP server
        const tools = await this.mcpClient.listTools(connection.server);
        
        // Register MCP tools in registry (virtual tools)
        // In production, would integrate with registry
        console.log(`Connected to MCP server: ${connection.server}, found ${tools.length} tools`);
      } catch (error: any) {
        console.warn(`Failed to connect to MCP server ${connection.server}: ${error.message}`);
      }
    }
  }

  /**
   * Get optimization report
   */
  getOptimizationReport(): string {
    return this.observability.generateOptimizationReport();
  }

  /**
   * Get context summary
   */
  getContextSummary(contextId: string) {
    return this.contextManager.getContextSummary(contextId);
  }

  /**
   * Cleanup context
   */
  cleanup(contextId: string): void {
    this.contextManager.clearContext(contextId);
  }
}

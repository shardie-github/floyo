/**
 * Unified Agent Orchestrator
 * Coordinates all sub-agents and generates artifacts
 */

import { RepoContextDetector, type RepoContext } from './core/repo-context.js';
import { ReliabilityAgent } from './core/reliability-agent.js';
import { CostAgent } from './core/cost-agent.js';
import { SecurityAgent } from './core/security-agent.js';
import { DocumentationAgent } from './core/documentation-agent.js';
import { PlanningAgent } from './core/planning-agent.js';
import { ObservabilityAgent } from './core/observability-agent.js';
import { ReflectionAgent } from './core/reflection-agent.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface AgentConfig {
  agentMode: string;
  autoRun: boolean;
  schedule?: Record<string, string>;
  artifacts?: Record<string, string>;
  thresholds?: {
    costOverrunPercent?: number;
    regressionCount?: number;
    duplicationThreshold?: number;
  };
}

export interface AgentRunResult {
  success: boolean;
  context: RepoContext;
  results: {
    reliability?: boolean;
    cost?: boolean;
    security?: boolean;
    documentation?: boolean;
    planning?: boolean;
    observability?: boolean;
    reflection?: boolean;
  };
  errors: string[];
}

export class UnifiedAgentOrchestrator {
  private workspacePath: string;
  private config: AgentConfig;
  private contextDetector: RepoContextDetector;
  private reliabilityAgent: ReliabilityAgent;
  private costAgent: CostAgent;
  private securityAgent: SecurityAgent;
  private documentationAgent: DocumentationAgent;
  private planningAgent: PlanningAgent;
  private observabilityAgent: ObservabilityAgent;
  private reflectionAgent: ReflectionAgent;

  constructor(workspacePath: string = process.cwd()) {
    this.workspacePath = workspacePath;
    this.config = this.loadConfig();
    
    // Initialize agents
    this.contextDetector = new RepoContextDetector(workspacePath);
    this.reliabilityAgent = new ReliabilityAgent(workspacePath);
    this.costAgent = new CostAgent(
      workspacePath,
      this.config.thresholds?.costOverrunPercent || 10
    );
    this.securityAgent = new SecurityAgent(workspacePath);
    this.documentationAgent = new DocumentationAgent(workspacePath);
    this.planningAgent = new PlanningAgent(workspacePath);
    this.observabilityAgent = new ObservabilityAgent(workspacePath);
    this.reflectionAgent = new ReflectionAgent(workspacePath);
  }

  /**
   * Run all agents
   */
  async runAll(options: {
    reliability?: boolean;
    cost?: boolean;
    security?: boolean;
    documentation?: boolean;
    planning?: boolean;
    observability?: boolean;
    reflection?: boolean;
  } = {}): Promise<AgentRunResult> {
    const result: AgentRunResult = {
      success: true,
      context: this.contextDetector.detect(),
      results: {},
      errors: [],
    };

    console.log('🔍 Detecting repository context...');
    console.log(`   Type: ${result.context.type}`);
    console.log(`   Modes: ${result.context.modes.join(', ')}`);
    console.log(`   Frameworks: ${result.context.frameworks.join(', ')}\n`);

    // Run Reliability Agent
    if (options.reliability !== false) {
      try {
        console.log('📊 Running Reliability Agent...');
        const reliabilityMetrics = await this.reliabilityAgent.collectMetrics(result.context);
        this.reliabilityAgent.saveMetrics(reliabilityMetrics);
        this.reliabilityAgent.generateReport(reliabilityMetrics);
        result.results.reliability = true;
        console.log('   ✅ Reliability metrics collected\n');
      } catch (error: any) {
        result.errors.push(`Reliability Agent: ${error.message}`);
        result.results.reliability = false;
        console.log(`   ❌ Error: ${error.message}\n`);
      }
    }

    // Run Cost Agent
    if (options.cost !== false) {
      try {
        console.log('💰 Running Cost Agent...');
        const costMetrics = await this.costAgent.collectMetrics(result.context);
        this.costAgent.saveMetrics(costMetrics);
        this.costAgent.generateReport(costMetrics);
        result.results.cost = true;
        console.log('   ✅ Cost metrics collected\n');
      } catch (error: any) {
        result.errors.push(`Cost Agent: ${error.message}`);
        result.results.cost = false;
        console.log(`   ❌ Error: ${error.message}\n`);
      }
    }

    // Run Security Agent
    if (options.security !== false) {
      try {
        console.log('🔐 Running Security Agent...');
        const securityMetrics = await this.securityAgent.collectMetrics(result.context);
        this.securityAgent.saveSBOM(securityMetrics);
        this.securityAgent.saveCompliance(securityMetrics);
        this.securityAgent.generateReport(securityMetrics);
        result.results.security = true;
        console.log('   ✅ Security audit completed\n');
      } catch (error: any) {
        result.errors.push(`Security Agent: ${error.message}`);
        result.results.security = false;
        console.log(`   ❌ Error: ${error.message}\n`);
      }
    }

    // Run Documentation Agent
    if (options.documentation !== false) {
      try {
        console.log('📚 Running Documentation Agent...');
        const docUpdate = await this.documentationAgent.updateDocumentation(result.context);
        result.results.documentation = true;
        console.log(`   ✅ Updated ${docUpdate.filesUpdated.length} documentation files\n`);
      } catch (error: any) {
        result.errors.push(`Documentation Agent: ${error.message}`);
        result.results.documentation = false;
        console.log(`   ❌ Error: ${error.message}\n`);
      }
    }

    // Run Planning Agent
    if (options.planning !== false) {
      try {
        console.log('📋 Running Planning Agent...');
        const sprintPlan = await this.planningAgent.generateSprintPlan(result.context);
        this.planningAgent.saveSprintPlan(sprintPlan);
        result.results.planning = true;
        console.log(`   ✅ Generated sprint plan with ${sprintPlan.todos.length} TODOs\n`);
      } catch (error: any) {
        result.errors.push(`Planning Agent: ${error.message}`);
        result.results.planning = false;
        console.log(`   ❌ Error: ${error.message}\n`);
      }
    }

    // Run Observability Agent
    if (options.observability !== false) {
      try {
        console.log('📈 Running Observability Agent...');
        const snapshot = this.observabilityAgent.generateSnapshot();
        this.observabilityAgent.saveSnapshot(snapshot);
        result.results.observability = true;
        console.log('   ✅ Metrics snapshot generated\n');
      } catch (error: any) {
        result.errors.push(`Observability Agent: ${error.message}`);
        result.results.observability = false;
        console.log(`   ❌ Error: ${error.message}\n`);
      }
    }

    // Run Reflection Agent
    if (options.reflection !== false) {
      try {
        console.log('🤔 Running Reflection Agent...');
        const reflection = await this.reflectionAgent.reflect(result.context);
        this.reflectionAgent.saveReflection(reflection);
        result.results.reflection = true;
        console.log(`   ✅ Reflection cycle ${reflection.cycle} completed\n`);
      } catch (error: any) {
        result.errors.push(`Reflection Agent: ${error.message}`);
        result.results.reflection = false;
        console.log(`   ❌ Error: ${error.message}\n`);
      }
    }

    result.success = result.errors.length === 0;

    return result;
  }

  /**
   * Load configuration
   */
  private loadConfig(): AgentConfig {
    const configPath = join(this.workspacePath, '.cursor', 'config', 'master-agent.json');
    
    if (existsSync(configPath)) {
      try {
        return JSON.parse(readFileSync(configPath, 'utf-8'));
      } catch (e) {
        console.warn('Failed to load config, using defaults');
      }
    }

    // Default config
    return {
      agentMode: 'hardonia-global',
      autoRun: true,
      thresholds: {
        costOverrunPercent: 10,
        regressionCount: 3,
        duplicationThreshold: 30,
      },
    };
  }
}

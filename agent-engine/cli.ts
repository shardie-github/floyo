/**
 * Agent Engine CLI - Test & Demo
 * Run workflows and see token/latency savings
 */

import { AgentEngine } from './index.js';
import type { WorkflowStep } from './core/types.js';

async function main() {
  console.log('🚀 Initializing Agent Engine...\n');

  const engine = new AgentEngine({
    maxTokens: 2000,
  });

  await engine.initialize();

  // Create context
  const contextId = `test-${Date.now()}`;
  engine.createContext(contextId, { test: true });

  console.log(`✅ Created context: ${contextId}\n`);

  // Example workflow: Fetch and aggregate Shopify products
  const steps: WorkflowStep[] = [
    {
      id: '1',
      tool: 'shopify_products',
      params: {
        shop: 'example-shop',
        accessToken: 'test-token',
        limit: 50,
        filter: {
          minPrice: 10,
          status: 'active',
        },
        aggregate: {
          groupBy: 'vendor',
          metrics: ['count', 'avg_price'],
        },
      },
      retries: 3,
      fallback: 'data_aggregate', // Fallback if Shopify fails
    },
  ];

  console.log('📋 Executing workflow...\n');
  const startTime = Date.now();

  try {
    const result = await engine.executeWorkflow(contextId, steps, 1500);

    const duration = Date.now() - startTime;

    console.log('✅ Workflow completed!\n');
    console.log(`Success: ${result.success}`);
    console.log(`Total tokens: ${result.totalTokens}`);
    console.log(`Total latency: ${result.totalLatency}ms`);
    console.log(`Duration: ${duration}ms\n`);

    if (result.insights && result.insights.length > 0) {
      console.log('💡 Insights:');
      for (const insight of result.insights) {
        console.log(`  - ${insight.title}: ${insight.value} (${insight.impact} impact)`);
      }
      console.log();
    }

    if (result.narrative) {
      console.log('📝 Narrative:');
      console.log(`  ${result.narrative}\n`);
    }

    // Show optimization report
    console.log('📊 Optimization Report:');
    console.log(engine.getOptimizationReport());
    console.log();

    // Context summary
    const summary = engine.getContextSummary(contextId);
    if (summary) {
      console.log('📈 Context Summary:');
      console.log(`  Tokens used: ${summary.tokensUsed}`);
      console.log(`  Tools loaded: ${summary.toolsLoaded}`);
      console.log(`  Duration: ${summary.durationMs}ms\n`);
    }

    // Cleanup
    engine.cleanup(contextId);
    console.log('🧹 Cleaned up context\n');
  } catch (error: any) {
    console.error('❌ Workflow failed:', error.message);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

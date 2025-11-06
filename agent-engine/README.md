/**
 * Agent Engine - README
 * 
 * Autonomous, cost-efficient, low-latency AI agent engine with MCP integration
 */

# Agent Engine Architecture

## Overview

Production-ready AI agent engine that fuses code execution with Model Context Protocol (MCP), designed for token efficiency, composability, and business automation.

## Core Tenets

### 1. Token Efficiency
- Progressive tool discovery (no bulk loading)
- Rolling context cap: < 2,000 tokens per agent
- Cached schemas, minimal JSON resends

### 2. Code-as-API Design
- Every tool is a TypeScript module: `import { getShopifyProducts } from "@/tools/shopify"`
- Native control flow (loops, conditionals, retries)
- Defer computation to runtime, not model prompts

### 3. In-Environment Data Processing
- Filter/aggregate before model access
- Example: 10,000 rows → 10 insights
- Minimal, anonymized summaries only

### 4. Progressive Tool Discovery
- Lazy module loading via registry pattern
- Lightweight manifest (`tools/manifest.json`)
- Load modules only when needed

### 5. Privacy & Observability
- PII tokenization before model exposure
- Sanitized telemetry to Supabase
- On-prem/isolated mode support

### 6. Control Flow & Error Management
- Deterministic logic (not LLM-driven)
- Fallback layers: primary → secondary → cached
- Target latency: < 1.5s per workflow

### 7. Composability & Future Proofing
- Self-describing modules (schema, version, author)
- Auto-generate typed SDKs for MCP endpoints
- Streaming token budgets per sub-agent

### 8. Value-Add Layer
- Smart summaries and insights
- JSON reports + natural language narratives
- Actionable outputs (metrics, cost deltas, next actions)

## Architecture

```
agent-engine/
├── core/
│   ├── types.ts              # Core type definitions
│   ├── context-manager.ts    # Token-efficient context management
│   ├── tool-registry.ts      # Progressive discovery & lazy loading
│   ├── privacy.ts            # PII tokenization
│   ├── control-flow.ts       # Deterministic workflow execution
│   └── observability.ts      # Token/latency tracking
├── mcp/
│   └── client.ts             # MCP client integration
├── index.ts                  # Main AgentEngine orchestrator
└── cli.ts                    # CLI for testing

tools/
├── shopify.ts                # Example: Shopify products tool
├── data-aggregate.ts         # Example: Data aggregation tool
└── manifest.json             # Auto-generated tool manifest
```

## Usage

### Basic Example

```typescript
import { AgentEngine } from './agent-engine/index.js';

const engine = new AgentEngine({
  maxTokens: 2000,
});

await engine.initialize();

const contextId = 'workflow-1';
engine.createContext(contextId);

const steps = [
  {
    id: '1',
    tool: 'shopify_products',
    params: {
      shop: 'example-shop',
      accessToken: 'token',
      limit: 50,
      filter: { minPrice: 10 },
    },
    retries: 3,
    fallback: 'data_aggregate',
  },
];

const result = await engine.executeWorkflow(contextId, steps);

console.log(result.narrative);
console.log(result.insights);
```

### Creating a Tool

```typescript
// tools/my-tool.ts
export const toolSchema = {
  name: 'my_tool',
  version: '1.0.0',
  description: 'My tool description',
  inputSchema: {
    type: 'object',
    properties: {
      param1: { type: 'string' },
    },
  },
  estimatedTokens: 100,
};

export async function execute(params: { param1: string }) {
  // Process in-environment
  const processed = processData(params.param1);
  
  // Return minimal, actionable data
  return {
    result: processed,
    insights: generateInsights(processed),
  };
}

export default { execute, toolSchema };
```

## Running

```bash
# Run agent engine CLI
npm run agent:run

# Or directly
tsx agent-engine/cli.ts
```

## Token Efficiency Metrics

The engine tracks:
- Total tokens used
- Average tokens per call
- Estimated savings vs naive approach
- Top token consumers

## Latency Targets

- Average: < 500ms
- P95: < 1000ms
- P99: < 1500ms
- Workflow timeout: 1500ms

## Privacy

All PII is automatically tokenized before model exposure:
- Emails → `[EMAIL_hash]`
- User IDs → `[USER_ID_hash]`
- IPs → `[IP_hash]`
- Phones → `[PHONE_hash]`

Telemetry records are sanitized (no PII) before storage.

## MCP Integration

Connect to MCP servers:

```typescript
const engine = new AgentEngine({
  mcpConnections: [
    {
      server: 'filesystem',
      transport: 'stdio',
      config: { /* ... */ },
    },
  ],
});
```

## Observability

Get optimization reports:

```typescript
const report = engine.getOptimizationReport();
// Shows token savings, latency metrics, top consumers
```

## Next Steps

1. Add more tool modules (Shopify, Stripe, etc.)
2. Integrate with Supabase for telemetry storage
3. Add MCP server implementations
4. Build typed SDK generator for MCP endpoints
5. Add streaming support for long-running workflows

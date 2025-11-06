# Agent Engine Quick Reference

## Quick Start

```bash
# Run agent engine demo
npm run agent:run
```

## Architecture Overview

```
agent-engine/
├── core/                    # Core engine components
│   ├── types.ts            # TypeScript type definitions
│   ├── context-manager.ts  # Token-efficient context (< 2000 tokens)
│   ├── tool-registry.ts   # Progressive tool discovery
│   ├── privacy.ts         # PII tokenization
│   ├── control-flow.ts    # Deterministic workflow execution
│   └── observability.ts   # Token/latency tracking
├── mcp/                    # MCP integration
│   └── client.ts          # MCP client (JSON-RPC)
├── index.ts               # Main AgentEngine orchestrator
└── cli.ts                 # CLI for testing

tools/                      # Tool modules (code-as-API)
├── shopify.ts            # Example: Shopify products
└── data-aggregate.ts     # Example: Data aggregation
```

## Key Features

### ✅ Token Efficiency
- Progressive tool discovery (no bulk loading)
- Rolling context cap: 2000 tokens
- Schema caching

### ✅ Code-as-API
- TypeScript modules as tools
- Native control flow
- Deterministic execution

### ✅ In-Environment Processing
- Filter/aggregate before model access
- Reduce 10k rows → 10 insights

### ✅ Privacy
- PII tokenization (emails, IPs, user IDs)
- Sanitized telemetry

### ✅ Control Flow
- Deterministic logic
- Fallback layers (primary → secondary → cached)
- Retry with timeout (< 1.5s)

### ✅ Value-Add
- Smart insights
- Natural language narratives
- Actionable outputs

## Creating a Tool

```typescript
// tools/my-tool.ts
export const toolSchema = {
  name: 'my_tool',
  version: '1.0.0',
  description: 'Tool description',
  inputSchema: { /* JSON Schema */ },
  estimatedTokens: 100,
};

export async function execute(params: any) {
  // Process in-environment
  const processed = processData(params);
  
  // Return minimal data
  return {
    result: processed,
    insights: generateInsights(processed),
  };
}

export default { execute, toolSchema };
```

## Usage Example

```typescript
import { AgentEngine } from './agent-engine/index.js';

const engine = new AgentEngine({ maxTokens: 2000 });
await engine.initialize();

const contextId = 'workflow-1';
engine.createContext(contextId);

const result = await engine.executeWorkflow(contextId, [
  {
    id: '1',
    tool: 'shopify_products',
    params: { shop: 'example', accessToken: 'token' },
    retries: 3,
    fallback: 'data_aggregate',
  },
]);

console.log(result.narrative);
console.log(result.insights);
```

## Metrics Tracked

- Token usage & savings
- Latency (avg, P95, P99)
- Top token consumers
- Optimization reports

## Next Steps

1. Add Supabase telemetry table
2. Implement MCP server transports
3. Add Redis caching
4. Create more tool modules
5. Build SDK generator

#!/usr/bin/env tsx
/**
 * Database Query Optimizer
 * 
 * Analyzes and optimizes database queries:
 * - Identifies slow queries
 * - Suggests index additions
 * - Optimizes query patterns
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

interface QueryAnalysis {
  query: string
  executionTime: number
  suggestedIndexes: string[]
  optimizationSuggestions: string[]
}

function analyzeQuery(query: string): QueryAnalysis {
  const analysis: QueryAnalysis = {
    query,
    executionTime: 0,
    suggestedIndexes: [],
    optimizationSuggestions: [],
  }
  
  // Check for missing indexes
  if (query.includes('WHERE') && query.includes('userId')) {
    if (!query.includes('INDEX') && !query.includes('@@index')) {
      analysis.suggestedIndexes.push('CREATE INDEX IF NOT EXISTS idx_user_id ON table_name(userId)')
    }
  }
  
  // Check for N+1 query patterns
  if (query.match(/SELECT.*FROM.*WHERE.*IN\s*\(/)) {
    analysis.optimizationSuggestions.push('Consider using JOIN instead of IN clause for better performance')
  }
  
  // Check for missing LIMIT
  if (query.includes('SELECT') && !query.includes('LIMIT') && !query.includes('FETCH')) {
    analysis.optimizationSuggestions.push('Add LIMIT clause to prevent large result sets')
  }
  
  // Check for SELECT *
  if (query.includes('SELECT *')) {
    analysis.optimizationSuggestions.push('Use specific column names instead of SELECT *')
  }
  
  return analysis
}

function generateOptimizationReport(analyses: QueryAnalysis[]): string {
  const report = `# Database Query Optimization Report

Generated: ${new Date().toISOString()}

## Summary

- Total Queries Analyzed: ${analyses.length}
- Queries Needing Optimization: ${analyses.filter(a => a.optimizationSuggestions.length > 0).length}
- Suggested Indexes: ${analyses.reduce((sum, a) => sum + a.suggestedIndexes.length, 0)}

## Recommended Indexes

${analyses
  .flatMap(a => a.suggestedIndexes)
  .filter((v, i, arr) => arr.indexOf(v) === i)
  .map(idx => `- ${idx}`)
  .join('\n')}

## Optimization Suggestions

${analyses
  .filter(a => a.optimizationSuggestions.length > 0)
  .map(a => `### Query\n\`\`\`sql\n${a.query}\n\`\`\`\n\n**Suggestions:**\n${a.optimizationSuggestions.map(s => `- ${s}`).join('\n')}`)
  .join('\n\n')}

## Next Steps

1. Review suggested indexes
2. Apply optimizations
3. Test query performance
4. Monitor slow query logs
`
  
  return report
}

function main() {
  console.log('🔍 Analyzing database queries...\n')
  
  // This would typically read from slow query logs or analyze Prisma queries
  // For now, generate a template report
  
  const report = generateOptimizationReport([])
  writeFileSync(join(process.cwd(), 'docs/query-optimization-report.md'), report)
  
  console.log('✅ Query optimization report generated')
  console.log('📄 See docs/query-optimization-report.md')
}

if (require.main === module) {
  main()
}

export { analyzeQuery, generateOptimizationReport }

/**
 * Database Migration Alignment Script
 * 
 * Compares Prisma schema with Alembic migrations to ensure consistency.
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

interface Table {
  name: string
  columns: Column[]
  indexes: Index[]
  foreignKeys: ForeignKey[]
}

interface Column {
  name: string
  type: string
  nullable: boolean
  default?: string
  unique?: boolean
}

interface Index {
  name: string
  columns: string[]
  unique?: boolean
}

interface ForeignKey {
  name: string
  columns: string[]
  referencedTable: string
  referencedColumns: string[]
}

/**
 * Parse Prisma schema
 */
function parsePrismaSchema(): Map<string, Table> {
  const schemaPath = join(process.cwd(), 'prisma', 'schema.prisma')
  const content = readFileSync(schemaPath, 'utf-8')
  
  const tables = new Map<string, Table>()
  
  // Match model definitions
  const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/gs
  let match
  
  while ((match = modelRegex.exec(content)) !== null) {
    const modelName = match[1]
    const modelBody = match[2]
    
    // Skip if it's a relation-only model
    if (!modelBody.includes('@id')) continue
    
    const table: Table = {
      name: modelName.toLowerCase(),
      columns: [],
      indexes: [],
      foreignKeys: [],
    }
    
    // Parse columns
    const fieldRegex = /(\w+)\s+(\S+)([^@\n]*)/g
    let fieldMatch
    
    while ((fieldMatch = fieldRegex.exec(modelBody)) !== null) {
      const fieldName = fieldMatch[1]
      const fieldType = fieldMatch[2]
      const fieldAttrs = fieldMatch[3]
      
      const column: Column = {
        name: fieldName,
        type: fieldType,
        nullable: !fieldAttrs.includes('@default') && fieldType.includes('?'),
        unique: fieldAttrs.includes('@unique'),
      }
      
      table.columns.push(column)
    }
    
    // Parse indexes
    const indexRegex = /@@index\(\[([^\]]+)\](?:,\s*name:\s*"([^"]+)")?\)/g
    while ((indexMatch = indexRegex.exec(modelBody)) !== null) {
      const columns = indexMatch[1].split(',').map(c => c.trim().replace(/"/g, ''))
      const indexName = indexMatch[2] || `idx_${table.name}_${columns.join('_')}`
      
      table.indexes.push({
        name: indexName,
        columns,
      })
    }
    
    // Parse foreign keys (relations)
    const relationRegex = /(\w+)\s+(\w+)\s+@relation\(fields:\s*\[(\w+)\],\s*references:\s*\[(\w+)\]\)/g
    while ((relationMatch = relationRegex.exec(modelBody)) !== null) {
      const fkColumn = relationMatch[3]
      const refModel = relationMatch[2]
      const refColumn = relationMatch[4]
      
      table.foreignKeys.push({
        name: `fk_${table.name}_${fkColumn}`,
        columns: [fkColumn],
        referencedTable: refModel.toLowerCase(),
        referencedColumns: [refColumn],
      })
    }
    
    tables.set(table.name, table)
  }
  
  return tables
}

/**
 * Parse Alembic migrations
 */
function parseAlembicMigrations(): Map<string, Table> {
  const migrationsDir = join(process.cwd(), 'migrations')
  const tables = new Map<string, Table>()
  
  // This is a simplified parser - in reality, you'd need to execute migrations
  // and introspect the database, or parse the migration files more carefully
  
  return tables
}

/**
 * Compare schemas
 */
function compareSchemas(prisma: Map<string, Table>, alembic: Map<string, Table>): {
  missing: Table[]
  extra: Table[]
  differences: Array<{ table: string; issue: string }>
} {
  const missing: Table[] = []
  const extra: Table[] = []
  const differences: Array<{ table: string; issue: string }> = []
  
  // Find missing tables
  for (const [name, table] of prisma) {
    if (!alembic.has(name)) {
      missing.push(table)
    }
  }
  
  // Find extra tables
  for (const [name, table] of alembic) {
    if (!prisma.has(name)) {
      extra.push(table)
    }
  }
  
  // Find differences
  for (const [name, prismaTable] of prisma) {
    const alembicTable = alembic.get(name)
    if (!alembicTable) continue
    
    // Compare columns
    const prismaColumns = new Set(prismaTable.columns.map(c => c.name))
    const alembicColumns = new Set(alembicTable.columns.map(c => c.name))
    
    for (const col of prismaTable.columns) {
      if (!alembicColumns.has(col.name)) {
        differences.push({
          table: name,
          issue: `Missing column: ${col.name}`,
        })
      }
    }
    
    for (const col of alembicTable.columns) {
      if (!prismaColumns.has(col.name)) {
        differences.push({
          table: name,
          issue: `Extra column: ${col.name}`,
        })
      }
    }
  }
  
  return { missing, extra, differences }
}

/**
 * Generate alignment report
 */
function generateReport(result: ReturnType<typeof compareSchemas>): string {
  let report = '# Database Migration Alignment Report\n\n'
  report += `Generated: ${new Date().toISOString()}\n\n`
  
  report += `## Summary\n\n`
  report += `- Missing Tables: ${result.missing.length}\n`
  report += `- Extra Tables: ${result.extra.length}\n`
  report += `- Differences: ${result.differences.length}\n\n`
  
  if (result.missing.length > 0) {
    report += `## Missing Tables (Prisma → Alembic)\n\n`
    for (const table of result.missing) {
      report += `### ${table.name}\n`
      report += `- Columns: ${table.columns.length}\n`
      report += `- Indexes: ${table.indexes.length}\n\n`
    }
  }
  
  if (result.differences.length > 0) {
    report += `## Schema Differences\n\n`
    for (const diff of result.differences) {
      report += `- **${diff.table}**: ${diff.issue}\n`
    }
  }
  
  return report
}

// Run alignment
if (require.main === module) {
  try {
    const prisma = parsePrismaSchema()
    const alembic = parseAlembicMigrations()
    const result = compareSchemas(prisma, alembic)
    const report = generateReport(result)
    
    console.log(report)
    
    const reportPath = join(process.cwd(), 'reports', 'migration-alignment.md')
    writeFileSync(reportPath, report)
    console.log(`\n✅ Report written to ${reportPath}`)
    
    if (result.missing.length > 0 || result.differences.length > 0) {
      console.error(`\n⚠️  Found ${result.missing.length} missing tables and ${result.differences.length} differences`)
      process.exit(1)
    }
  } catch (error) {
    console.error('Error during alignment:', error)
    process.exit(1)
  }
}

export { parsePrismaSchema, compareSchemas, generateReport }

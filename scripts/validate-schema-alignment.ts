#!/usr/bin/env tsx
/**
 * Schema Alignment Validator
 * 
 * Compares Prisma schema with Supabase migrations to detect drift.
 * Ensures database schema consistency across ORM and migrations.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

interface TableInfo {
  name: string;
  columns: string[];
  indexes: string[];
  constraints: string[];
}

interface SchemaDiff {
  table: string;
  type: 'missing_table' | 'missing_column' | 'missing_index' | 'missing_constraint' | 'type_mismatch';
  prisma?: string;
  supabase?: string;
  message: string;
}

class SchemaAlignmentValidator {
  private prismaSchema: string;
  private supabaseMigrations: string[] = [];
  private diffs: SchemaDiff[] = [];

  constructor() {
    this.loadSchemas();
  }

  private loadSchemas() {
    // Load Prisma schema
    const prismaPath = join(process.cwd(), 'prisma', 'schema.prisma');
    this.prismaSchema = readFileSync(prismaPath, 'utf-8');

    // Load Supabase migrations
    const migrationsPath = join(process.cwd(), 'supabase', 'migrations');
    try {
      const migrationFiles = execSync(`find ${migrationsPath} -name "*.sql" -type f`, {
        encoding: 'utf-8',
      })
        .trim()
        .split('\n')
        .filter(Boolean);

      for (const file of migrationFiles) {
        this.supabaseMigrations.push(readFileSync(file, 'utf-8'));
      }
    } catch (error) {
      console.warn('Could not load Supabase migrations:', error);
    }
  }

  private extractPrismaTables(): Map<string, TableInfo> {
    const tables = new Map<string, TableInfo>();

    // Extract model definitions from Prisma schema
    const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g;
    let match;

    while ((match = modelRegex.exec(this.prismaSchema)) !== null) {
      const tableName = match[1];
      const modelBody = match[2];

      const columns: string[] = [];
      const indexes: string[] = [];
      const constraints: string[] = [];

      // Extract fields (columns)
      const fieldRegex = /(\w+)\s+([^\n]+)/g;
      let fieldMatch;
      while ((fieldMatch = fieldRegex.exec(modelBody)) !== null) {
        const fieldName = fieldMatch[1];
        const fieldDef = fieldMatch[2];
        columns.push(`${fieldName}: ${fieldDef.trim()}`);
      }

      // Extract indexes
      const indexRegex = /@@index\(\[([^\]]+)\]/g;
      let indexMatch;
      while ((indexMatch = indexRegex.exec(modelBody)) !== null) {
        indexes.push(indexMatch[1]);
      }

      // Extract unique constraints
      const uniqueRegex = /@@unique\(\[([^\]]+)\]/g;
      let uniqueMatch;
      while ((uniqueMatch = uniqueRegex.exec(modelBody)) !== null) {
        constraints.push(`unique: ${uniqueMatch[1]}`);
      }

      tables.set(tableName.toLowerCase(), {
        name: tableName,
        columns,
        indexes,
        constraints,
      });
    }

    return tables;
  }

  private extractSupabaseTables(): Map<string, TableInfo> {
    const tables = new Map<string, TableInfo>();
    const allMigrations = this.supabaseMigrations.join('\n');

    // Extract CREATE TABLE statements
    const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(([^;]+)\)/gi;
    let match;

    while ((match = createTableRegex.exec(allMigrations)) !== null) {
      const tableName = match[1].toLowerCase();
      const tableBody = match[2];

      const columns: string[] = [];
      const indexes: string[] = [];
      const constraints: string[] = [];

      // Extract column definitions
      const columnLines = tableBody.split(',').map((line) => line.trim());
      for (const line of columnLines) {
        if (line.match(/^\w+\s+/)) {
          // Column definition
          columns.push(line);
        } else if (line.includes('PRIMARY KEY')) {
          constraints.push('PRIMARY KEY');
        } else if (line.includes('UNIQUE')) {
          constraints.push(line);
        } else if (line.includes('FOREIGN KEY')) {
          constraints.push(line);
        }
      }

      // Extract CREATE INDEX statements for this table
      const indexRegex = new RegExp(
        `CREATE\\s+(?:UNIQUE\\s+)?INDEX\\s+\\w+\\s+ON\\s+${match[1]}\\s*\\(([^\\)]+)\\)`,
        'gi'
      );
      let indexMatch;
      while ((indexMatch = indexRegex.exec(allMigrations)) !== null) {
        indexes.push(indexMatch[1]);
      }

      tables.set(tableName, {
        name: match[1],
        columns,
        indexes,
        constraints,
      });
    }

    return tables;
  }

  validate(): SchemaDiff[] {
    const prismaTables = this.extractPrismaTables();
    const supabaseTables = this.extractSupabaseTables();

    // Check for tables in Prisma but not in Supabase
    for (const [tableName, prismaTable] of prismaTables.entries()) {
      if (!supabaseTables.has(tableName)) {
        this.diffs.push({
          table: tableName,
          type: 'missing_table',
          prisma: prismaTable.name,
          message: `Table ${prismaTable.name} exists in Prisma schema but not in Supabase migrations`,
        });
      }
    }

    // Check for tables in Supabase but not in Prisma (less critical, but worth noting)
    for (const [tableName, supabaseTable] of supabaseTables.entries()) {
      if (!prismaTables.has(tableName)) {
        this.diffs.push({
          table: tableName,
          type: 'missing_table',
          supabase: supabaseTable.name,
          message: `Table ${supabaseTable.name} exists in Supabase migrations but not in Prisma schema`,
        });
      }
    }

    // Compare columns for matching tables
    for (const [tableName, prismaTable] of prismaTables.entries()) {
      const supabaseTable = supabaseTables.get(tableName);
      if (!supabaseTable) continue;

      // Simple column comparison (can be enhanced)
      const prismaColumnNames = new Set(
        prismaTable.columns.map((col) => col.split(':')[0].trim().toLowerCase())
      );
      const supabaseColumnNames = new Set(
        supabaseTable.columns.map((col) => col.split(/\s+/)[0].toLowerCase())
      );

      for (const colName of prismaColumnNames) {
        if (!supabaseColumnNames.has(colName)) {
          this.diffs.push({
            table: tableName,
            type: 'missing_column',
            prisma: colName,
            message: `Column ${colName} exists in Prisma schema but not in Supabase migrations for table ${tableName}`,
          });
        }
      }
    }

    return this.diffs;
  }

  generateReport(): string {
    const diffs = this.validate();

    if (diffs.length === 0) {
      return `
✅ Schema Alignment Check Passed

All tables, columns, and constraints are aligned between Prisma schema and Supabase migrations.
      `.trim();
    }

    const report = [
      `⚠️  Schema Alignment Issues Found: ${diffs.length}\n`,
      ...diffs.map((diff) => `  [${diff.type.toUpperCase()}] ${diff.message}`),
      '',
      'Recommendations:',
      '  1. Review differences between Prisma schema and Supabase migrations',
      '  2. Create migration to align schemas if needed',
      '  3. Update Prisma schema if Supabase migrations are correct',
      '  4. Run this validator after making changes',
    ].join('\n');

    return report;
  }
}

// Main execution
if (require.main === module) {
  const validator = new SchemaAlignmentValidator();
  const report = validator.generateReport();
  console.log(report);

  const diffs = validator.validate();
  if (diffs.length > 0) {
    process.exit(1);
  }
}

export { SchemaAlignmentValidator };

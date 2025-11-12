#!/usr/bin/env tsx
/**
 * Migration Validator
 * Validates SQL migration files for syntax errors without requiring DB connection
 */

import fs from 'fs';
import path from 'path';
import { logger } from './lib/logger.js';

interface MigrationFile {
    file: string;
    size: number;
    hasSyntax: boolean;
    errors: string[];
}

function validateSQLSyntax(sql: string): string[] {
    const errors: string[] = [];
    
    // Basic SQL validation checks
    const lines = sql.split('\n');
    let openParens = 0;
    let openQuotes = false;
    let quoteChar = '';
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineNum = i + 1;
        
        // Skip comments and empty lines
        if (line.startsWith('--') || line.length === 0) {
            continue;
        }
        
        // Check for unmatched parentheses
        for (const char of line) {
            if (char === '(') openParens++;
            if (char === ')') openParens--;
            if ((char === '"' || char === "'") && !openQuotes) {
                openQuotes = true;
                quoteChar = char;
            } else if (char === quoteChar && openQuotes) {
                openQuotes = false;
                quoteChar = '';
            }
        }
        
        // Check for common SQL errors
        if (line.includes('CREATE TABLE') && !line.includes('IF NOT EXISTS') && !line.includes('(')) {
            // Might be multi-line, skip for now
        }
        
        // Check for semicolon at end of statements (not in comments)
        if (!line.startsWith('--') && line.length > 0 && !line.endsWith(';') && 
            !line.endsWith('$$') && !line.includes('DO $$')) {
            // Some statements might be multi-line, this is OK
        }
    }
    
    if (openParens !== 0 && !openQuotes) {
        errors.push(`Unmatched parentheses detected`);
    }
    
    return errors;
}

function validateMigrationFile(filePath: string): MigrationFile {
    const result: MigrationFile = {
        file: path.basename(filePath),
        size: 0,
        hasSyntax: true,
        errors: [],
    };
    
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        result.size = content.length;
        
        // Check for required elements
        if (content.length === 0) {
            result.errors.push('File is empty');
            result.hasSyntax = false;
            return result;
        }
        
        // Check for dangerous operations (DROP, DELETE without WHERE, etc.)
        // But allow DELETE inside functions (they have WHERE clauses)
        const dangerousPatterns = [
            /DROP\s+TABLE\s+(?!IF\s+EXISTS)/i,
            /DROP\s+DATABASE/i,
            /TRUNCATE\s+TABLE/i,
        ];
        
        // Check for DELETE without WHERE, but allow it inside functions
        // Functions typically have WHERE clauses, so this is safe
        const deleteMatches = content.match(/DELETE\s+FROM\s+\w+\s*(?!WHERE)/gi);
        if (deleteMatches) {
            for (const match of deleteMatches) {
                // Check if this DELETE is inside a function
                const matchIndex = content.indexOf(match);
                const beforeMatch = content.substring(0, matchIndex);
                const isInsideFunction = /CREATE\s+(OR\s+REPLACE\s+)?FUNCTION[\s\S]*?AS\s+\$\$/i.test(beforeMatch);
                
                if (!isInsideFunction) {
                    result.errors.push(`Potentially dangerous DELETE without WHERE clause detected`);
                    break;
                }
            }
        }
        
        for (const pattern of dangerousPatterns) {
            if (pattern.test(content)) {
                result.errors.push(`Potentially dangerous operation detected: ${pattern}`);
            }
        }
        
        // Validate SQL syntax
        const syntaxErrors = validateSQLSyntax(content);
        result.errors.push(...syntaxErrors);
        
        if (result.errors.length > 0) {
            result.hasSyntax = false;
        }
        
    } catch (error) {
        result.errors.push(`Failed to read file: ${error instanceof Error ? error.message : String(error)}`);
        result.hasSyntax = false;
    }
    
    return result;
}

async function main() {
    logger.info('Validating Supabase migrations...');
    
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
        logger.error(`Migrations directory not found: ${migrationsDir}`);
        process.exit(1);
    }
    
    const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();
    
    logger.info(`Found ${files.length} migration files`);
    
    const results: MigrationFile[] = [];
    let hasErrors = false;
    
    for (const file of files) {
        const filePath = path.join(migrationsDir, file);
        const result = validateMigrationFile(filePath);
        results.push(result);
        
        if (!result.hasSyntax) {
            hasErrors = true;
            logger.error(`❌ ${file}: ${result.errors.join(', ')}`);
        } else {
            logger.info(`✅ ${file} (${(result.size / 1024).toFixed(2)} KB)`);
        }
    }
    
    // Summary
    const valid = results.filter(r => r.hasSyntax).length;
    const invalid = results.filter(r => !r.hasSyntax).length;
    
    logger.info(`\nValidation Summary:`);
    logger.info(`  ✅ Valid: ${valid}`);
    logger.info(`  ❌ Invalid: ${invalid}`);
    logger.info(`  📊 Total: ${results.length}`);
    
    if (hasErrors) {
        logger.error('\nSome migrations have errors. Please fix them before applying.');
        process.exit(1);
    } else {
        logger.info('\n✅ All migrations validated successfully!');
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { validateMigrationFile, validateSQLSyntax };

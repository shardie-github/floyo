#!/usr/bin/env tsx
/**
 * Environment Variable Doctor
 * 
 * Scans codebase for environment variable usage and compares against .env.example
 * Detects:
 * - Environment variables used but not documented
 * - Environment variables documented but never used
 * - Inconsistent naming (casing, spelling)
 * - Missing required variables
 * 
 * Usage:
 *   tsx scripts/env-doctor.ts
 * 
 * Exit codes:
 *   0 - All checks passed
 *   1 - Issues found
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

interface EnvVarUsage {
  name: string;
  files: string[];
  lineNumbers: number[];
}

interface EnvVarDefinition {
  name: string;
  required: boolean;
  category: string;
  description?: string;
}

interface DoctorResult {
  used: Map<string, EnvVarUsage>;
  defined: Map<string, EnvVarDefinition>;
  issues: string[];
}

// Patterns to find env var usage
const ENV_PATTERNS = [
  // process.env.VAR_NAME
  /process\.env\.([A-Z_][A-Z0-9_]*)/g,
  // os.getenv('VAR_NAME')
  /os\.getenv\(['"]([A-Z_][A-Z0-9_]*)['"]\)/g,
  // os.environ.get('VAR_NAME')
  /os\.environ\.get\(['"]([A-Z_][A-Z0-9_]*)['"]\)/g,
  // ${{ secrets.VAR_NAME }}
  /\$\{\{\s*secrets\.([A-Z_][A-Z0-9_]*)\s*\}\}/g,
  // ${VAR_NAME}
  /\$\{([A-Z_][A-Z0-9_]*)\}/g,
  // $VAR_NAME
  /\$([A-Z_][A-Z0-9_]*)/g,
];

// Files to scan
const SCAN_PATTERNS = [
  '**/*.ts',
  '**/*.tsx',
  '**/*.js',
  '**/*.jsx',
  '**/*.py',
  '**/*.yml',
  '**/*.yaml',
  '**/*.sh',
  '**/*.json',
];

// Files to ignore
const IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/.next/**',
  '**/__pycache__/**',
  '**/.git/**',
  '**/coverage/**',
];

// Required env vars (must be in .env.example)
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

// Known false positives (env vars that appear in code but aren't actually used)
const FALSE_POSITIVES = [
  'NODE_ENV', // Common, handled by framework
  'PATH', // System variable
  'HOME', // System variable
  'USER', // System variable
];

function parseEnvExample(filePath: string): Map<string, EnvVarDefinition> {
  const envMap = new Map<string, EnvVarDefinition>();
  
  if (!existsSync(filePath)) {
    console.warn(`⚠️  .env.example not found at ${filePath}`);
    return envMap;
  }
  
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  let currentCategory = 'Other';
  let lineNumber = 0;
  
  for (const line of lines) {
    lineNumber++;
    const trimmed = line.trim();
    
    // Category header
    if (trimmed.startsWith('# ===') && trimmed.includes('===')) {
      const match = trimmed.match(/#\s*===+\s*(.+?)\s*===+/);
      if (match) {
        currentCategory = match[1].trim();
      }
      continue;
    }
    
    // Comment line
    if (trimmed.startsWith('#') || trimmed === '') {
      continue;
    }
    
    // Environment variable definition
    const envMatch = trimmed.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (envMatch) {
      const name = envMatch[1];
      const value = envMatch[2];
      const required = !value.includes('optional') && 
                       !value.includes('Optional') &&
                       value.trim() !== '' &&
                       !value.includes('||');
      
      // Extract description from previous comment lines
      let description = '';
      let descLine = lineNumber - 1;
      while (descLine > 0 && lines[descLine - 1].trim().startsWith('#')) {
        const comment = lines[descLine - 1].trim().replace(/^#+\s*/, '');
        if (comment && !comment.includes('===')) {
          description = comment + (description ? ' ' + description : '');
        }
        descLine--;
      }
      
      envMap.set(name, {
        name,
        required,
        category: currentCategory,
        description: description || undefined,
      });
    }
  }
  
  return envMap;
}

function shouldIgnoreFile(filePath: string): boolean {
  return IGNORE_PATTERNS.some(pattern => {
    const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
    return regex.test(filePath);
  });
}

function getAllFiles(dir: string, fileList: string[] = []): string[] {
  try {
    const files = readdirSync(dir);
    for (const file of files) {
      const filePath = join(dir, file);
      if (shouldIgnoreFile(filePath)) continue;
      
      try {
        const stat = statSync(filePath);
        if (stat.isDirectory()) {
          getAllFiles(filePath, fileList);
        } else {
          const ext = extname(file);
          if (['.ts', '.tsx', '.js', '.jsx', '.py', '.yml', '.yaml', '.sh', '.json'].includes(ext)) {
            fileList.push(filePath);
          }
        }
      } catch {
        // Skip files we can't access
      }
    }
  } catch {
    // Skip directories we can't access
  }
  return fileList;
}

function scanCodebase(): Map<string, EnvVarUsage> {
  const usageMap = new Map<string, EnvVarUsage>();
  
  console.log('🔍 Scanning codebase for environment variable usage...\n');
  
  const files = getAllFiles(process.cwd());
  
  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      
      for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        const line = lines[lineNum];
        
        for (const pattern of ENV_PATTERNS) {
          let match;
          while ((match = pattern.exec(line)) !== null) {
            const varName = match[1];
            
            // Skip false positives
            if (FALSE_POSITIVES.includes(varName)) {
              continue;
            }
            
            if (!usageMap.has(varName)) {
              usageMap.set(varName, {
                name: varName,
                files: [],
                lineNumbers: [],
              });
            }
            
            const usage = usageMap.get(varName)!;
            if (!usage.files.includes(file)) {
              usage.files.push(file);
            }
            usage.lineNumbers.push(lineNum + 1);
          }
        }
      }
    } catch (error) {
      // Skip files that can't be read (binary, etc.)
      continue;
    }
  }
  
  return usageMap;
}

function checkDrift(
  used: Map<string, EnvVarUsage>,
  defined: Map<string, EnvVarDefinition>
): string[] {
  const issues: string[] = [];
  
  // Check for used but not defined
  for (const [name, usage] of used.entries()) {
    if (!defined.has(name)) {
      issues.push(
        `⚠️  Used but not in .env.example: ${name}\n` +
        `   Found in: ${usage.files.slice(0, 3).join(', ')}${usage.files.length > 3 ? '...' : ''}`
      );
    }
  }
  
  // Check for defined but not used
  for (const [name, def] of defined.entries()) {
    if (!used.has(name) && !name.startsWith('NEXT_PUBLIC_')) {
      // NEXT_PUBLIC_ vars might be used in build time only
      issues.push(
        `ℹ️  Defined in .env.example but not found in codebase: ${name}\n` +
        `   Category: ${def.category}`
      );
    }
  }
  
  // Check for required vars missing
  for (const required of REQUIRED_ENV_VARS) {
    if (!defined.has(required)) {
      issues.push(`❌ Required env var missing from .env.example: ${required}`);
    }
  }
  
  // Check for inconsistent casing
  const lowerToUpper = new Map<string, string[]>();
  for (const name of used.keys()) {
    const lower = name.toLowerCase();
    if (!lowerToUpper.has(lower)) {
      lowerToUpper.set(lower, []);
    }
    lowerToUpper.get(lower)!.push(name);
  }
  
  for (const [lower, variants] of lowerToUpper.entries()) {
    if (variants.length > 1) {
      issues.push(
        `⚠️  Inconsistent casing detected: ${variants.join(', ')}\n` +
        `   Use consistent casing: ${variants[0]}`
      );
    }
  }
  
  return issues;
}

function main() {
  console.log('🏥 Environment Variable Doctor\n');
  console.log('=' .repeat(50) + '\n');
  
  const envExamplePath = join(process.cwd(), '.env.example');
  const defined = parseEnvExample(envExamplePath);
  const used = scanCodebase();
  
  console.log(`📋 Found ${defined.size} env vars in .env.example`);
  console.log(`🔍 Found ${used.size} env vars used in codebase\n`);
  
  const issues = checkDrift(used, defined);
  
  if (issues.length === 0) {
    console.log('✅ All checks passed!\n');
    console.log('No environment variable drift detected.');
    return 0;
  }
  
  console.log(`\n⚠️  Found ${issues.length} issue(s):\n`);
  console.log('=' .repeat(50) + '\n');
  
  for (const issue of issues) {
    console.log(issue);
    console.log('');
  }
  
  console.log('=' .repeat(50) + '\n');
  console.log('💡 Recommendations:');
  console.log('1. Add missing env vars to .env.example');
  console.log('2. Remove unused env vars from .env.example (or mark as optional)');
  console.log('3. Use consistent casing for env var names');
  console.log('4. Document all env vars with comments\n');
  
  return 1;
}

// Run doctor
const exitCode = main();
process.exit(exitCode);

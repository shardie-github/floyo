#!/usr/bin/env tsx
/**
 * Secrets Audit Script
 * Scans codebase for potential secrets and sensitive data
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const SECRET_PATTERNS = [
  /password\s*[:=]\s*['"]([^'"]+)['"]/gi,
  /api[_-]?key\s*[:=]\s*['"]([^'"]+)['"]/gi,
  /secret\s*[:=]\s*['"]([^'"]+)['"]/gi,
  /token\s*[:=]\s*['"]([^'"]+)['"]/gi,
  /bearer\s+([a-zA-Z0-9_-]{20,})/gi,
  /sk_live_[a-zA-Z0-9]{24,}/gi,
  /pk_live_[a-zA-Z0-9]{24,}/gi,
  /AIza[0-9A-Za-z_-]{35}/gi,
  /ghp_[a-zA-Z0-9]{36}/gi,
  /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/gi,
];

const IGNORE_PATHS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '*.bak.*',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
];

const IGNORE_FILES = ['.env.example', '.env.ci.example'];

interface Finding {
  file: string;
  line: number;
  match: string;
  pattern: string;
}

const findings: Finding[] = [];

function shouldIgnore(path: string): boolean {
  return IGNORE_PATHS.some((ignore) => path.includes(ignore));
}

function scanFile(filePath: string): void {
  if (IGNORE_FILES.some((f) => filePath.endsWith(f))) return;

  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      SECRET_PATTERNS.forEach((pattern) => {
        const matches = [...line.matchAll(pattern)];
        matches.forEach((match) => {
          // Skip if it's clearly a placeholder or example
          if (
            match[0].includes('example') ||
            match[0].includes('placeholder') ||
            match[0].includes('your-') ||
            match[0].includes('xxx') ||
            match[0].includes('REPLACE')
          ) {
            return;
          }

          findings.push({
            file: filePath,
            line: index + 1,
            match: match[0].substring(0, 50),
            pattern: pattern.source,
          });
        });
      });
    });
  } catch (e) {
    // Skip files we can't read
  }
}

function scanDirectory(dir: string): void {
  try {
    const entries = readdirSync(dir);

    entries.forEach((entry) => {
      const fullPath = join(dir, entry);

      if (shouldIgnore(fullPath)) return;

      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (
        stat.isFile() &&
        (fullPath.endsWith('.ts') ||
          fullPath.endsWith('.tsx') ||
          fullPath.endsWith('.js') ||
          fullPath.endsWith('.jsx') ||
          fullPath.endsWith('.json') ||
          fullPath.endsWith('.env'))
      ) {
        scanFile(fullPath);
      }
    });
  } catch (e) {
    // Skip directories we can't read
  }
}

function generateReport() {
  console.log('Scanning codebase for secrets...\n');
  scanDirectory(process.cwd());

  if (findings.length === 0) {
    console.log('✅ No secrets found in codebase\n');
    return;
  }

  console.log(`⚠️  Found ${findings.length} potential secret(s):\n`);

  findings.forEach((finding) => {
    console.log(`File: ${finding.file}:${finding.line}`);
    console.log(`Match: ${finding.match}...`);
    console.log(`Pattern: ${finding.pattern}\n`);
  });

  console.log('\nRecommendations:');
  console.log('1. Move secrets to environment variables');
  console.log('2. Add to .gitignore if needed');
  console.log('3. Use secrets management service (Vercel, AWS Secrets Manager)');
  console.log('4. Rotate any exposed secrets\n');

  process.exit(1);
}

generateReport();

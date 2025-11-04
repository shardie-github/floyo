/**
 * Privacy CI Lint Checks
 * Verify code doesn't violate privacy requirements
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const DISALLOWED_LOG_KEYS = [
  'password',
  'token',
  'secret',
  'api_key',
  'credit_card',
  'ssn',
  'social_security',
];

const DISALLOWED_PATTERNS = [
  /console\.log\(.*password/i,
  /console\.log\(.*token/i,
  /console\.log\(.*secret/i,
  /logger\.(info|debug|error)\(.*password/i,
  /logger\.(info|debug|error)\(.*token/i,
];

function scanFile(filePath: string): string[] {
  const content = readFileSync(filePath, 'utf-8');
  const errors: string[] = [];

  // Check for disallowed log keys
  for (const key of DISALLOWED_LOG_KEYS) {
    const regex = new RegExp(`['"]${key}['"]`, 'i');
    if (regex.test(content)) {
      // Allow if it's in redaction/blocklist context
      if (!content.includes('redact') && !content.includes('blocklist') && !content.includes('sensitive')) {
        errors.push(`Found disallowed key "${key}" in ${filePath}`);
      }
    }
  }

  // Check for disallowed logging patterns
  for (const pattern of DISALLOWED_PATTERNS) {
    if (pattern.test(content)) {
      errors.push(`Found disallowed logging pattern in ${filePath}`);
    }
  }

  // Check for missing RLS on privacy tables
  if (filePath.includes('migration') && filePath.includes('privacy')) {
    if (!content.includes('ENABLE ROW LEVEL SECURITY') || !content.includes('RLS')) {
      errors.push(`Missing RLS enablement in migration ${filePath}`);
    }
  }

  // Check for service_role bypass on telemetry tables
  if (content.includes('telemetry_events') && content.includes('service_role')) {
    if (!content.includes('NO service_role bypass') && !content.includes('CRITICAL')) {
      errors.push(`Potential service_role bypass in ${filePath}`);
    }
  }

  return errors;
}

function scanDirectory(dirPath: string): string[] {
  const errors: string[] = [];
  const files = readdirSync(dirPath, { withFileTypes: true });

  for (const file of files) {
    const fullPath = join(dirPath, file.name);

    if (file.isDirectory()) {
      if (!file.name.includes('node_modules') && !file.name.includes('.git')) {
        errors.push(...scanDirectory(fullPath));
      }
    } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx') || file.name.endsWith('.js')) {
      errors.push(...scanFile(fullPath));
    }
  }

  return errors;
}

// Main execution
const projectRoot = process.cwd();
const errors: string[] = [];

// Scan frontend API routes
errors.push(...scanDirectory(join(projectRoot, 'frontend', 'app', 'api', 'privacy')));

// Scan backend
errors.push(...scanDirectory(join(projectRoot, 'backend')));

// Scan migrations
errors.push(...scanDirectory(join(projectRoot, 'supabase', 'migrations')));

if (errors.length > 0) {
  console.error('❌ Privacy lint checks failed:\n');
  errors.forEach((error) => console.error(`  - ${error}`));
  process.exit(1);
} else {
  console.log('✅ Privacy lint checks passed');
}

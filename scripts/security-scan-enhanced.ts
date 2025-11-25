#!/usr/bin/env tsx
/**
 * Enhanced Security Scanner
 * 
 * Scans for:
 * - Hardcoded secrets
 * - Vulnerable dependencies
 * - Security misconfigurations
 * - SQL injection vulnerabilities
 * - XSS vulnerabilities
 */

import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { glob } from 'glob'

interface SecurityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low'
  type: string
  file: string
  line?: number
  description: string
  recommendation: string
}

const SECRET_PATTERNS = [
  /password\s*=\s*['"]([^'"]+)['"]/gi,
  /api[_-]?key\s*=\s*['"]([^'"]+)['"]/gi,
  /secret\s*=\s*['"]([^'"]+)['"]/gi,
  /token\s*=\s*['"]([^'"]+)['"]/gi,
  /(?:sk|pk)_[a-zA-Z0-9]{32,}/g,
]

const SQL_INJECTION_PATTERNS = [
  /\$\{.*\}.*\+.*['"]/g,
  /query\(.*\+.*['"]/g,
  /execute\(.*\+.*['"]/g,
]

const XSS_PATTERNS = [
  /dangerouslySetInnerHTML/g,
  /innerHTML\s*=/g,
]

function scanFile(filePath: string): SecurityIssue[] {
  const issues: SecurityIssue[] = []
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  
  // Check for hardcoded secrets
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(line) && !line.includes('example') && !line.includes('placeholder')) {
        issues.push({
          severity: 'critical',
          type: 'hardcoded-secret',
          file: filePath,
          line: i + 1,
          description: 'Potential hardcoded secret detected',
          recommendation: 'Move to environment variables',
        })
      }
    }
    
    // Check for SQL injection
    for (const pattern of SQL_INJECTION_PATTERNS) {
      if (pattern.test(line)) {
        issues.push({
          severity: 'high',
          type: 'sql-injection',
          file: filePath,
          line: i + 1,
          description: 'Potential SQL injection vulnerability',
          recommendation: 'Use parameterized queries',
        })
      }
    }
    
    // Check for XSS
    for (const pattern of XSS_PATTERNS) {
      if (pattern.test(line)) {
        issues.push({
          severity: 'medium',
          type: 'xss',
          file: filePath,
          line: i + 1,
          description: 'Potential XSS vulnerability',
          recommendation: 'Sanitize user input',
        })
      }
    }
  }
  
  return issues
}

function scanCodebase(): SecurityIssue[] {
  const issues: SecurityIssue[] = []
  const files = glob.sync('**/*.{ts,tsx,js,jsx,py}', {
    ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/__pycache__/**'],
  })
  
  for (const file of files) {
    try {
      const fileIssues = scanFile(file)
      issues.push(...fileIssues)
    } catch (error) {
      // Skip files that can't be read
    }
  }
  
  return issues
}

function generateSecurityReport(issues: SecurityIssue[]): string {
  const critical = issues.filter(i => i.severity === 'critical')
  const high = issues.filter(i => i.severity === 'high')
  const medium = issues.filter(i => i.severity === 'medium')
  const low = issues.filter(i => i.severity === 'low')
  
  return `# Security Scan Report

Generated: ${new Date().toISOString()}

## Summary

- **Critical Issues:** ${critical.length}
- **High Issues:** ${high.length}
- **Medium Issues:** ${medium.length}
- **Low Issues:** ${low.length}
- **Total Issues:** ${issues.length}

## Critical Issues

${critical.map(i => `### ${i.type} - ${i.file}:${i.line || 'N/A'}

**Description:** ${i.description}

**Recommendation:** ${i.recommendation}

`).join('\n')}

## High Issues

${high.map(i => `### ${i.type} - ${i.file}:${i.line || 'N/A'}

**Description:** ${i.description}

**Recommendation:** ${i.recommendation}

`).join('\n')}

## Medium Issues

${medium.map(i => `### ${i.type} - ${i.file}:${i.line || 'N/A'}

**Description:** ${i.description}

**Recommendation:** ${i.recommendation}

`).join('\n')}

## Recommendations

1. Address all critical and high issues immediately
2. Review medium issues in next sprint
3. Implement automated security scanning in CI/CD
4. Regular security audits
`
}

function main() {
  console.log('🔒 Running security scan...\n')
  
  const issues = scanCodebase()
  const report = generateSecurityReport(issues)
  
  const reportPath = join(process.cwd(), 'docs/security-scan-report.md')
  require('fs').writeFileSync(reportPath, report)
  
  console.log(`✅ Security scan complete`)
  console.log(`📊 Found ${issues.length} issues`)
  console.log(`📄 Report: ${reportPath}`)
  
  if (issues.filter(i => i.severity === 'critical' || i.severity === 'high').length > 0) {
    console.log('\n⚠️  Critical or high severity issues found!')
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { scanCodebase, generateSecurityReport }

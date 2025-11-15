/**
 * API Endpoint Audit Script
 * 
 * Audits frontend API calls vs backend endpoints to identify missing implementations.
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { glob } from 'glob'

interface Endpoint {
  path: string
  method: string
  file: string
  line?: number
}

interface AuditResult {
  frontendEndpoints: Endpoint[]
  backendEndpoints: Endpoint[]
  missing: Endpoint[]
  extra: Endpoint[]
  matched: Endpoint[]
}

/**
 * Extract API endpoints from frontend code
 */
function extractFrontendEndpoints(): Endpoint[] {
  const endpoints: Endpoint[] = []
  const apiDir = join(process.cwd(), 'frontend/app/api')
  
  // Find all route.ts files
  const routeFiles = glob.sync('**/route.ts', { cwd: apiDir })
  
  for (const file of routeFiles) {
    const fullPath = join(apiDir, file)
    const content = readFileSync(fullPath, 'utf-8')
    
    // Extract HTTP methods
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    for (const method of methods) {
      const regex = new RegExp(`export\\s+(async\\s+)?function\\s+${method}`, 'gi')
      if (regex.test(content)) {
        // Extract path from file structure
        const pathParts = file.split('/').filter(p => p !== 'route.ts')
        const path = `/api/${pathParts.join('/')}`
        
        endpoints.push({
          path,
          method: method.toUpperCase(),
          file: fullPath,
        })
      }
    }
  }
  
  // Also check for fetch calls in components
  const componentFiles = glob.sync('**/*.{ts,tsx}', { 
    cwd: join(process.cwd(), 'frontend'),
    ignore: ['**/node_modules/**', '**/.next/**', '**/app/api/**']
  })
  
  for (const file of componentFiles) {
    const fullPath = join(process.cwd(), 'frontend', file)
    const content = readFileSync(fullPath, 'utf-8')
    
    // Match fetch('/api/...') or fetch("/api/...")
    const fetchRegex = /fetch\(['"]([^'"]+)['"]/g
    let match
    while ((match = fetchRegex.exec(content)) !== null) {
      const url = match[1]
      if (url.startsWith('/api/')) {
        // Extract method from context
        const methodMatch = content.substring(Math.max(0, match.index - 50), match.index).match(/method:\s*['"](GET|POST|PUT|DELETE|PATCH)['"]/i)
        const method = methodMatch ? methodMatch[1].toUpperCase() : 'GET'
        
        endpoints.push({
          path: url.split('?')[0], // Remove query params
          method,
          file: fullPath,
        })
      }
    }
  }
  
  return endpoints
}

/**
 * Extract API endpoints from backend code
 */
function extractBackendEndpoints(): Endpoint[] {
  const endpoints: Endpoint[] = []
  const backendDir = join(process.cwd(), 'backend')
  
  // Check main.py
  const mainPy = join(backendDir, 'main.py')
  if (statSync(mainPy).isFile()) {
    const content = readFileSync(mainPy, 'utf-8')
    
    // Match @app.get, @app.post, etc.
    const routeRegex = /@app\.(get|post|put|delete|patch)\s*\(['"]([^'"]+)['"]/gi
    let match
    while ((match = routeRegex.exec(content)) !== null) {
      endpoints.push({
        path: match[2],
        method: match[1].toUpperCase(),
        file: mainPy,
      })
    }
    
    // Match router.get, router.post, etc.
    const routerRegex = /@router\.(get|post|put|delete|patch)\s*\(['"]([^'"]+)['"]/gi
    while ((match = routerRegex.exec(content)) !== null) {
      endpoints.push({
        path: match[2],
        method: match[1].toUpperCase(),
        file: mainPy,
      })
    }
  }
  
  // Check other Python files
  const pyFiles = glob.sync('**/*.py', { cwd: backendDir })
  for (const file of pyFiles) {
    if (file === 'main.py') continue
    
    const fullPath = join(backendDir, file)
    const content = readFileSync(fullPath, 'utf-8')
    
    const routeRegex = /@(app|router)\.(get|post|put|delete|patch)\s*\(['"]([^'"]+)['"]/gi
    let match
    while ((match = routeRegex.exec(content)) !== null) {
      endpoints.push({
        path: match[3],
        method: match[2].toUpperCase(),
        file: fullPath,
      })
    }
  }
  
  return endpoints
}

/**
 * Normalize path for comparison
 */
function normalizePath(path: string): string {
  // Remove trailing slashes
  path = path.replace(/\/$/, '')
  // Normalize parameter formats
  path = path.replace(/\[([^\]]+)\]/g, ':$1')
  return path
}

/**
 * Audit endpoints
 */
function auditEndpoints(): AuditResult {
  const frontendEndpoints = extractFrontendEndpoints()
  const backendEndpoints = extractBackendEndpoints()
  
  // Normalize paths
  const normalizedFrontend = frontendEndpoints.map(e => ({
    ...e,
    normalized: normalizePath(e.path),
  }))
  
  const normalizedBackend = backendEndpoints.map(e => ({
    ...e,
    normalized: normalizePath(e.path),
  }))
  
  // Find missing endpoints (in frontend but not in backend)
  const missing: Endpoint[] = []
  const matched: Endpoint[] = []
  
  for (const fe of normalizedFrontend) {
    const match = normalizedBackend.find(
      be => be.normalized === fe.normalized && be.method === fe.method
    )
    
    if (!match) {
      missing.push(fe)
    } else {
      matched.push(fe)
    }
  }
  
  // Find extra endpoints (in backend but not in frontend)
  const extra: Endpoint[] = []
  for (const be of normalizedBackend) {
    const match = normalizedFrontend.find(
      fe => fe.normalized === be.normalized && fe.method === be.method
    )
    
    if (!match) {
      extra.push(be)
    }
  }
  
  return {
    frontendEndpoints,
    backendEndpoints,
    missing,
    extra,
    matched,
  }
}

/**
 * Generate report
 */
function generateReport(result: AuditResult): string {
  let report = '# API Endpoint Audit Report\n\n'
  report += `Generated: ${new Date().toISOString()}\n\n`
  
  report += `## Summary\n\n`
  report += `- Frontend Endpoints: ${result.frontendEndpoints.length}\n`
  report += `- Backend Endpoints: ${result.backendEndpoints.length}\n`
  report += `- Matched: ${result.matched.length}\n`
  report += `- Missing in Backend: ${result.missing.length}\n`
  report += `- Extra in Backend: ${result.extra.length}\n\n`
  
  if (result.missing.length > 0) {
    report += `## Missing Endpoints (Frontend → Backend)\n\n`
    report += `These endpoints are called from the frontend but not implemented in the backend:\n\n`
    
    for (const endpoint of result.missing) {
      report += `### ${endpoint.method} ${endpoint.path}\n`
      report += `- File: ${endpoint.file}\n\n`
    }
  }
  
  if (result.extra.length > 0) {
    report += `## Extra Endpoints (Backend → Frontend)\n\n`
    report += `These endpoints exist in the backend but are not used by the frontend:\n\n`
    
    for (const endpoint of result.extra) {
      report += `### ${endpoint.method} ${endpoint.path}\n`
      report += `- File: ${endpoint.file}\n\n`
    }
  }
  
  return report
}

// Run audit
if (require.main === module) {
  try {
    const result = auditEndpoints()
    const report = generateReport(result)
    
    console.log(report)
    
    // Write to file
    const reportPath = join(process.cwd(), 'reports', 'api-audit.md')
    require('fs').writeFileSync(reportPath, report)
    console.log(`\n✅ Report written to ${reportPath}`)
    
    // Exit with error code if there are missing endpoints
    if (result.missing.length > 0) {
      console.error(`\n⚠️  Found ${result.missing.length} missing endpoints`)
      process.exit(1)
    }
  } catch (error) {
    console.error('Error during audit:', error)
    process.exit(1)
  }
}

export { auditEndpoints, generateReport }

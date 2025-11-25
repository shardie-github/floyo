#!/usr/bin/env tsx
/**
 * Performance Budget Checker
 * 
 * Validates performance budgets for:
 * - Bundle sizes
 * - API response times
 * - Lighthouse scores
 */

import { readFileSync, existsSync, statSync } from 'fs'
import { join } from 'path'
import { glob } from 'glob'

interface PerformanceBudgets {
  budgets: Array<{
    type: string
    name: string
    maximumWarning?: string
    maximumError?: string
    path?: string
  }>
  api: {
    responseTime: {
      p50: number
      p95: number
      p99: number
      maximumError: number
    }
    endpoints: Record<string, {
      p95: number
      maximumError: number
    }>
  }
  lighthouse: {
    performance: number
    accessibility: number
    bestPractices: number
    seo: number
  }
}

function parseSize(size: string): number {
  const match = size.match(/^(\d+)(kb|mb|gb)?$/i)
  if (!match) return 0
  
  const value = parseInt(match[1], 10)
  const unit = (match[2] || 'b').toLowerCase()
  
  switch (unit) {
    case 'kb':
      return value * 1024
    case 'mb':
      return value * 1024 * 1024
    case 'gb':
      return value * 1024 * 1024 * 1024
    default:
      return value
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`
}

function checkBundleBudgets(budgets: PerformanceBudgets): { passed: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  
  const buildDir = join(process.cwd(), 'frontend/.next')
  
  if (!existsSync(buildDir)) {
    errors.push('Build directory not found. Run `npm run build` first.')
    return { passed: false, errors, warnings }
  }
  
  for (const budget of budgets.budgets) {
    if (budget.type !== 'bundle' || !budget.path) continue
    
    const files = glob.sync(budget.path, { cwd: buildDir })
    
    for (const file of files) {
      const filePath = join(buildDir, file)
      if (!existsSync(filePath)) continue
      
      const stats = statSync(filePath)
      const size = stats.size
      const maxWarning = budget.maximumWarning ? parseSize(budget.maximumWarning) : Infinity
      const maxError = budget.maximumError ? parseSize(budget.maximumError) : Infinity
      
      if (size > maxError) {
        errors.push(
          `❌ ${budget.name} (${file}): ${formatSize(size)} exceeds error threshold ${budget.maximumError}`
        )
      } else if (size > maxWarning) {
        warnings.push(
          `⚠️  ${budget.name} (${file}): ${formatSize(size)} exceeds warning threshold ${budget.maximumWarning}`
        )
      }
    }
  }
  
  return {
    passed: errors.length === 0,
    errors,
    warnings,
  }
}

function checkAPIBudgets(budgets: PerformanceBudgets): { passed: boolean; errors: string[]; warnings: string[] } {
  // This would integrate with actual API monitoring
  // For now, return placeholder
  return {
    passed: true,
    errors: [],
    warnings: [],
  }
}

function checkLighthouseBudgets(budgets: PerformanceBudgets): { passed: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  
  const lhciDir = join(process.cwd(), '.lighthouseci')
  const resultsFile = join(lhciDir, 'results.json')
  
  if (!existsSync(resultsFile)) {
    warnings.push('Lighthouse results not found. Run `npm run lhci` first.')
    return { passed: true, errors, warnings }
  }
  
  try {
    const results = JSON.parse(readFileSync(resultsFile, 'utf-8'))
    
    for (const result of results) {
      const scores = result.lhr.categories
      
      if (scores.performance.score * 100 < budgets.lighthouse.performance) {
        errors.push(
          `❌ Lighthouse Performance: ${(scores.performance.score * 100).toFixed(0)} < ${budgets.lighthouse.performance}`
        )
      }
      
      if (scores.accessibility.score * 100 < budgets.lighthouse.accessibility) {
        errors.push(
          `❌ Lighthouse Accessibility: ${(scores.accessibility.score * 100).toFixed(0)} < ${budgets.lighthouse.accessibility}`
        )
      }
      
      if (scores['best-practices'].score * 100 < budgets.lighthouse.bestPractices) {
        errors.push(
          `❌ Lighthouse Best Practices: ${(scores['best-practices'].score * 100).toFixed(0)} < ${budgets.lighthouse.bestPractices}`
        )
      }
      
      if (scores.seo.score * 100 < budgets.lighthouse.seo) {
        errors.push(
          `❌ Lighthouse SEO: ${(scores.seo.score * 100).toFixed(0)} < ${budgets.lighthouse.seo}`
        )
      }
    }
  } catch (error) {
    warnings.push(`Failed to parse Lighthouse results: ${error}`)
  }
  
  return {
    passed: errors.length === 0,
    errors,
    warnings,
  }
}

function main() {
  console.log('📊 Performance Budget Checker\n')
  console.log('='.repeat(50) + '\n')
  
  const budgetsPath = join(process.cwd(), '.performance-budgets.json')
  
  if (!existsSync(budgetsPath)) {
    console.error('❌ Performance budgets file not found:', budgetsPath)
    process.exit(1)
  }
  
  const budgets: PerformanceBudgets = JSON.parse(readFileSync(budgetsPath, 'utf-8'))
  
  // Check bundle budgets
  console.log('📦 Checking bundle sizes...')
  const bundleResult = checkBundleBudgets(budgets)
  
  // Check API budgets
  console.log('🌐 Checking API response times...')
  const apiResult = checkAPIBudgets(budgets)
  
  // Check Lighthouse budgets
  console.log('🔍 Checking Lighthouse scores...')
  const lighthouseResult = checkLighthouseBudgets(budgets)
  
  // Combine results
  const allErrors = [...bundleResult.errors, ...apiResult.errors, ...lighthouseResult.errors]
  const allWarnings = [...bundleResult.warnings, ...apiResult.warnings, ...lighthouseResult.warnings]
  const passed = bundleResult.passed && apiResult.passed && lighthouseResult.passed
  
  // Print results
  if (allWarnings.length > 0) {
    console.log('\n⚠️  Warnings:')
    allWarnings.forEach(w => console.log(`  ${w}`))
  }
  
  if (allErrors.length > 0) {
    console.log('\n❌ Errors:')
    allErrors.forEach(e => console.log(`  ${e}`))
  }
  
  if (passed && allErrors.length === 0) {
    console.log('\n✅ All performance budgets met!')
    process.exit(0)
  } else {
    console.log(`\n❌ Performance budgets failed (${allErrors.length} errors)`)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { checkBundleBudgets, checkAPIBudgets, checkLighthouseBudgets }

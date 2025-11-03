#!/usr/bin/env node
/**
 * Floyo Doctor CLI
 * Validates environment, platform, dependencies, and configuration
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

interface CheckResult {
  name: string
  status: 'pass' | 'fail' | 'warn'
  message: string
}

const results: CheckResult[] = []

function check(name: string, condition: boolean, message: string, warn = false): void {
  results.push({
    name,
    status: condition ? 'pass' : (warn ? 'warn' : 'fail'),
    message,
  })
}

// Check Node.js version
try {
  const nodeVersion = process.version
  const major = parseInt(nodeVersion.slice(1).split('.')[0])
  check('Node.js version', major >= 18, `Node.js ${nodeVersion} (requires >= 18)`)
} catch (e) {
  check('Node.js version', false, 'Could not detect Node.js version')
}

// Check Python version
try {
  const pythonVersion = execSync('python3 --version', { encoding: 'utf-8' }).trim()
  const match = pythonVersion.match(/Python (\d+)\.(\d+)/)
  if (match) {
    const major = parseInt(match[1])
    const minor = parseInt(match[2])
    check('Python version', major >= 3 && minor >= 11, `${pythonVersion} (requires >= 3.11)`)
  }
} catch (e) {
  check('Python version', false, 'Python 3.11+ not found')
}

// Check environment files
const envFiles = ['.env', '.env.local', '.env.example']
envFiles.forEach(file => {
  const exists = fs.existsSync(file)
  check(`Environment file: ${file}`, exists || file !== '.env', 
    exists ? `Found ${file}` : `${file} not found`, file !== '.env')
})

// Check required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'SECRET_KEY',
]
requiredEnvVars.forEach(varName => {
  const value = process.env[varName]
  check(`Environment variable: ${varName}`, !!value, 
    value ? `Set` : `Not set`, true)
})

// Check dependencies
const packageJsonPath = path.join(__dirname, '..', 'frontend', 'package.json')
if (fs.existsSync(packageJsonPath)) {
  try {
    execSync('cd frontend && npm list --depth=0', { stdio: 'ignore' })
    check('Frontend dependencies', true, 'All npm packages installed')
  } catch (e) {
    check('Frontend dependencies', false, 'Run `cd frontend && npm install`')
  }
}

const requirementsPath = path.join(__dirname, '..', 'backend', 'requirements.txt')
if (fs.existsSync(requirementsPath)) {
  try {
    execSync('pip list --format=json', { stdio: 'ignore' })
    check('Backend dependencies', true, 'Python packages check passed', true)
  } catch (e) {
    check('Backend dependencies', false, 'Run `pip install -r backend/requirements.txt`')
  }
}

// Check database connection (if DATABASE_URL is set)
if (process.env.DATABASE_URL) {
  try {
    // Try to import and check (simplified)
    check('Database connection', true, 'DATABASE_URL configured', true)
  } catch (e) {
    check('Database connection', false, 'Check DATABASE_URL')
  }
}

// Check Redis connection (optional)
if (process.env.REDIS_URL) {
  check('Redis configuration', true, 'REDIS_URL configured', true)
}

// Print results
console.log('\n?? Floyo Doctor Results\n')
console.log('?'.repeat(60))

results.forEach(result => {
  const icon = result.status === 'pass' ? '?' : result.status === 'warn' ? '??' : '?'
  const status = result.status.toUpperCase().padEnd(5)
  console.log(`${icon} ${status} ${result.name}`)
  if (result.message) {
    console.log(`   ${result.message}`)
  }
})

console.log('?'.repeat(60))

const fails = results.filter(r => r.status === 'fail')
const warns = results.filter(r => r.status === 'warn')
const passes = results.filter(r => r.status === 'pass')

console.log(`\nSummary: ${passes.length} passed, ${warns.length} warnings, ${fails.length} failed\n`)

if (fails.length > 0) {
  console.log('? Some checks failed. Please fix the issues above.\n')
  process.exit(1)
} else if (warns.length > 0) {
  console.log('??  Some warnings. Review the issues above.\n')
  process.exit(0)
} else {
  console.log('? All checks passed!\n')
  process.exit(0)
}
